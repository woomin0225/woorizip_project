package org.team4p.woorizip.room.review.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.review.dto.ReviewDto;
import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;
import org.team4p.woorizip.room.review.jpa.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
	private final ReviewRepository reviewRepository;
	private final RoomRepository roomRepository;
	
	@Override
	public Page<ReviewDto> selectRoomReviews(String roomNo, Pageable pageable) {
		// 방 상세 리뷰 조회
		Page<ReviewEntity> pageEntity = reviewRepository.findByRoomNo(roomNo, pageable);
		return pageEntity.map(entity->entity.toDto());
	}

	@Override
	@Transactional
	public ReviewDto insertRoomReview(ReviewDto reviewDto) {
		// 방 리뷰 등록
		
		// 방이 DB에 있는지 검사
		if(roomRepository.existsById(reviewDto.getRoomNo())) throw new NotFoundException("리뷰를 등록하려는 방이 존재하지 않습니다.");
		// DB에 저장
		return reviewRepository.save(reviewDto.toEntity()).toDto();
	}

}
