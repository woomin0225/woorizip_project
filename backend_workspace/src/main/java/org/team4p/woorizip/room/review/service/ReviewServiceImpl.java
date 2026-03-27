package org.team4p.woorizip.room.review.service;

import java.time.ZoneId;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageRepository;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomEmbeddingRepository;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.review.dto.ReviewDto;
import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;
import org.team4p.woorizip.room.review.jpa.repository.ReviewRepository;
import org.team4p.woorizip.room.review.jpa.repository.ReviewSummaryRepository;
import org.team4p.woorizip.room.service.RoomAiService;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
	private final ReviewRepository reviewRepository;
	private final RoomRepository roomRepository;
	private final UserRepository userRepository;
	private final RoomImageRepository riRepository;
	private final ReviewSummaryRepository reviewSummaryRepository;
	private final RoomEmbeddingRepository roomEmbeddingRepository;
	private final RoomAiService roomAiService;

	private static final ZoneId KST = ZoneId.of("Asia/Seoul");

	@Override
	public Page<ReviewDto> selectRoomReviews(String roomNo, Pageable pageable) {
		// 방 상세 리뷰 조회
		Page<ReviewEntity> pageEntity = reviewRepository.findByRoomNoOrderByReviewCreatedAtDesc(roomNo, pageable);
		return pageEntity.map(entity -> entity.toDto());
	}

	@Override
	@Transactional
	public ReviewDto insertRoomReview(ReviewDto reviewDto, String currentUser) {
		// 방 리뷰 등록

		// 방이 DB에 있는지 검사
		if(!roomRepository.existsById(reviewDto.getRoomNo())) {
			throw new NotFoundException("리뷰를 등록하려는 방이 존재하지 않습니다.");
		}

		// userNo 조립
		String userNo = userRepository.findUserNoByEmailId(currentUser);
		reviewDto.setUserNo(userNo);

		String roomNo = reviewDto.getRoomNo();

		// +AI: 리뷰 요약상태, 임베딩 상태를 PENDING으로 갱신
		markReviewAndEmbeddingPending(roomNo);
		// +AI: 최종 요약도 다시 생성하도록 커밋 이후 비동기 시작
		triggerFinalSummaryRefreshAfterCommit(roomNo);

		// DB에 저장
		return reviewRepository.save(reviewDto.toEntity()).toDto();
	}

	@Override
	@Transactional
	public void deleteRoomReview(int reviewNo, String currentUser) {
		// 방 리뷰 삭제

		// 리뷰가 DB에 있는지 검사
		Optional<ReviewEntity> reviewRow = reviewRepository.findById(reviewNo);
		if(!reviewRow.isPresent()) {
			throw new NotFoundException("해당 리뷰가 존재하지 않습니다.");
		}

		// 리뷰 소유권 검사
		ReviewEntity reviewEntity = reviewRow.get();
		if(!reviewEntity.getUserNo().equals(userRepository.findUserNoByEmailId(currentUser))) {
			throw new ForbiddenException("해당 리뷰의 삭제 권한이 없습니다.");
		}

		// 삭제 후에는 조회할 수 없으므로 roomNo를 먼저 확보
		String roomNo = reviewEntity.getRoomNo();
		reviewRepository.deleteById(reviewNo);

		// +AI: 리뷰 삭제에 따라 리뷰 요약/임베딩/최종 요약을 다시 생성
		markReviewAndEmbeddingPending(roomNo);
		triggerFinalSummaryRefreshAfterCommit(roomNo);
	}

	@Override
	@Transactional
	public ReviewDto updateRoomReview(ReviewDto reviewDto, String currentUser) {
		// 방 리뷰 수정

		// 리뷰가 DB에 있는지 검사
		Optional<ReviewEntity> row = reviewRepository.findById(reviewDto.getReviewNo());
		if(!row.isPresent()) {
			throw new NotFoundException("해당 리뷰가 존재하지 않습니다.");
		}
		ReviewEntity entity = row.get();

		// 리뷰 소유권 검사
		String userNo = entity.getUserNo();
		if(!userNo.equals(userRepository.findUserNoByEmailId(currentUser))) {
			throw new ForbiddenException("해당 리뷰의 수정 권한이 없습니다.");
		}

		entity.setRating(reviewDto.getRating());
		entity.setReviewContent(reviewDto.getReviewContent());

		String roomNo = entity.getRoomNo();

		// +AI: 리뷰 수정에 따라 리뷰 요약/임베딩/최종 요약을 다시 생성
		markReviewAndEmbeddingPending(roomNo);
		triggerFinalSummaryRefreshAfterCommit(roomNo);

		return entity.toDto();
	}

	private void markReviewAndEmbeddingPending(String roomNo) {
		// 리뷰 요약 상태를 다시 PENDING으로 등록
		reviewSummaryRepository.save(ReviewSummaryEntity.builder()
				.roomNo(roomNo)
				.summaryStatus("PENDING")
				.reviewCount(0)
				.retryCount(0)
				.build());

		// 임베딩도 최신 리뷰 기준으로 다시 생성하도록 PENDING 처리
		RoomEntity room = roomRepository.findById(roomNo).get();
		roomEmbeddingRepository.save(RoomEmbeddingEntity.builder()
				.roomNo(room.getRoomNo())
				.embeddingStatus("PENDING")
				.retryCount(0)
				.build());
	}

	private void triggerFinalSummaryRefreshAfterCommit(String roomNo) {
		// 트랜잭션이 없으면 즉시 실행
		if(!TransactionSynchronizationManager.isSynchronizationActive()) {
			roomAiService.requestSummarizedRoom(roomNo);
			roomAiService.startSummarizedRoomAsync(roomNo);
			return;
		}

		// 리뷰 변경 내용이 커밋된 뒤 최종 요약을 다시 요청/생성
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				roomAiService.requestSummarizedRoom(roomNo);
				roomAiService.startSummarizedRoomAsync(roomNo);
			}
		});
	}
}
