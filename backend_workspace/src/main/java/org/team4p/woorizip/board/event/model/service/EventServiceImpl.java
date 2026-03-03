package org.team4p.woorizip.board.event.model.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.board.bannerimage.jpa.repository.BannerImageRepository;
import org.team4p.woorizip.board.bannerimage.model.dto.BannerImageDto;
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;
import org.team4p.woorizip.board.file.jpa.repository.FileRepository;
import org.team4p.woorizip.board.file.model.dto.FileDto;
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;
import org.team4p.woorizip.board.post.jpa.repository.PostRepository;
import org.team4p.woorizip.board.post.model.dto.PostDto;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

	private final PostRepository postRepository;
	private final FileRepository fileRepository;
	private final BannerImageRepository bannerImageRepository;
	private final UserRepository userRepository;

	// 이벤트 타입 고정
	private static final String BOARD_TYPE_NO = "E1";

	// ================Page -> List 변환 공통 메소드==============
	private ArrayList<PostDto> toList(Page<PostEntity> page) {
	    ArrayList<PostDto> list = new ArrayList<>();

	    for (PostEntity entity : page) {
	        PostDto dto = PostDto.fromEntity(entity);
	        UserEntity user = userRepository.findById(entity.getUserNo()).orElse(null);
	        
	        if(user == null || "Y".equals(user.getDeletedYn())) {
	        		dto.setUserNo("알 수 없는 사용자");
	        }

	        // 일반 첨부파일
	        dto.setFiles(getFiles(entity.getPostNo()));

	        // 배너 이미지 추가
	        bannerImageRepository.findByPostNo(entity.getPostNo())
	                .ifPresent(banner ->
	                        dto.setBannerImage(
	                                BannerImageDto.fromEntity(banner)
	                        ));

	        list.add(dto);
	    }

	    return list;
	}

	private List<FileDto> getFiles(Integer postNo) {
		List<FileEntity> files = fileRepository.findByPostNo(postNo);
		List<FileDto> list = new ArrayList<>();
		for (FileEntity file : files) {
			list.add(FileDto.fromEntity(file));
		}
		return list;
	}

	// =========================기본 조회================================
	@Override
	public ArrayList<PostDto> selectTop3() {
		List<PostEntity> entities = 
				postRepository.findTop3ByBoardTypeNoOrderByPostCreatedAtDesc(BOARD_TYPE_NO);

		ArrayList<PostDto> list = new ArrayList<>();
		
		for (PostEntity entity : entities) {
			PostDto dto = PostDto.fromEntity(entity);
			dto.setFiles(getFiles(entity.getPostNo()));
			
			bannerImageRepository.findByPostNo(entity.getPostNo())
				.ifPresent(banner -> 
						dto.setBannerImage(
								BannerImageDto.fromEntity(banner)
						));
			
			list.add(dto);
		}
		return list;
	}

	@Override
	public int selectListCount() {
		return (int) postRepository
				.countByBoardTypeNoAndPostTitleContainingIgnoreCase(BOARD_TYPE_NO, "");
	}

	//목록 조회 ====================
	@Override
	public ArrayList<PostDto> selectList(Pageable pageable) {
	    return toList(
	        postRepository.findByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO, pageable)
	    );
	}

	@Override
	public PostDto selectEvent(int postNo) {
		return postRepository.findById(postNo)
				.filter(entity -> BOARD_TYPE_NO.equals(entity.getBoardTypeNo()))
				.map(entity -> {
					PostDto dto = PostDto.fromEntity(entity);
					UserEntity user = userRepository.findById(entity.getUserNo()).orElse(null);
			        
			        if(user == null || "Y".equals(user.getDeletedYn())) {
			        		dto.setUserNo("알 수 없는 사용자");
			        }
			        
					dto.setFiles(getFiles(entity.getPostNo()));
					
					bannerImageRepository.findByPostNo(postNo)
						.ifPresent(banner ->
								dto.setBannerImage(
										BannerImageDto.fromEntity(banner)
											));
					
					return dto;
				})
				.orElseThrow(() -> 
						new NotFoundException("해당 이벤트 게시글이 없습니다."));
	}

	@Override
	public PostDto selectLast() {
		PostEntity entity = postRepository.findTopByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO);

		if (entity == null)
			throw new NotFoundException("해당 이벤트 게시글이 없습니다.");

		PostDto dto = PostDto.fromEntity(entity);
		dto.setFiles(getFiles(entity.getPostNo()));
		
		bannerImageRepository.findByPostNo(entity.getPostNo())
		.ifPresent(banner ->
				dto.setBannerImage(
						BannerImageDto.fromEntity(banner)
							));
		
		return dto;
	}

	// ===========================조회수============================
	@Override
	@Transactional
	public void updateAddReadCount(int postNo) {
		postRepository.incrementViewCount(postNo);
	}

	//DML
	//========================등록======================
	@Override
	@Transactional
	public int insertEvent(PostDto postDto, BannerImageDto bannerDto) {

		// 배너 필수 체크
		if (bannerDto == null) {
			throw new IllegalStateException("배너 이미지는 필수입니다.");
		}

		postDto.setBoardTypeNo(BOARD_TYPE_NO);
		postDto.setPostNo(null);

		// 이벤트 게시글 저장
		PostEntity saved = postRepository.save(postDto.toEntity());
		boolean hasFiles = postDto.getFiles() != null && !postDto.getFiles().isEmpty();

		if (saved.getPostNo() == null)
			throw new IllegalStateException("이벤트 게시글 등록에 실패했습니다.");

		Integer postNo = saved.getPostNo();

		// 일반 첨부 파일 저장
		if(hasFiles) {
			for(FileDto fileDto : postDto.getFiles()) {
				fileDto.setPostNo(saved.getPostNo());
				fileRepository.save(fileDto.toEntity());
			}
			
			saved.setPostFilesYn(true);
		}

		// 배너 이미지 저장
		bannerDto.setPostNo(postNo);
		bannerImageRepository.save(bannerDto.toEntity());

		return 1;
	}

	//========================수정======================
	@Override
	@Transactional
	public int updateEvent(PostDto postDto, List<Integer> deleteFileNo, BannerImageDto bannerDto) {

		PostEntity entity = postRepository.findById(postDto.getPostNo())
	            .orElseThrow(() -> new NotFoundException("수정할 이벤트 게시글이 없습니다."));
		
		entity.setPostTitle(postDto.getPostTitle());
	    entity.setPostContent(postDto.getPostContent());
	    entity.setUserNo(postDto.getUserNo());

		// 기존 파일 삭제
		if (deleteFileNo != null && !deleteFileNo.isEmpty()) {
			for (Integer fileNo : deleteFileNo) {
				fileRepository.deleteById(fileNo);
			}
		}

		// 새 파일 추가
		boolean hasNewFiles = postDto.getFiles() != null && !postDto.getFiles().isEmpty();
		
		if (hasNewFiles) {
	        for (FileDto fileDto : postDto.getFiles()) {
	            fileDto.setPostNo(entity.getPostNo());
	            fileRepository.save(fileDto.toEntity());
	        }
	    }

		// 기존 배너 이미지 존재 여부 확인
		if (bannerDto != null) {
			
			bannerImageRepository.findByPostNo(entity.getPostNo())
				.ifPresentOrElse(existingBanner -> {
					//기존 배너 업데이트 
					existingBanner.setOriginalFileName(bannerDto.getOriginalFileName());
		            existingBanner.setUpdatedFileName(bannerDto.getUpdatedFileName());

		            bannerImageRepository.save(existingBanner);
				}, () -> {
					//배너 없으면 insert
					bannerDto.setPostNo(entity.getPostNo());
		            bannerImageRepository.save(bannerDto.toEntity());
				});
		}
		
		boolean hasFiles = !fileRepository.findByPostNo(entity.getPostNo()).isEmpty();
		entity.setPostFilesYn(hasFiles);

		return 1;
	}

	//========================삭	제======================
	@Override
	@Transactional
	public int deleteEvent(int postNo) {
		
		if(!postRepository.existsById(postNo)) {
			throw new NotFoundException("삭제할 이벤트 게시글이 없습니다.");
		}
		
		fileRepository.deleteByPostNo(postNo);
		bannerImageRepository.findByPostNo(postNo)
			.ifPresent(bannerImageRepository::delete);
		
		postRepository.deleteById(postNo);
		
		return 1;
	}

	// ===============검색====================
	@Override
	public int selectSearchTitleCount(String keyword) {
		return postRepository
				.countByBoardTypeNoAndPostTitleContainingIgnoreCase(BOARD_TYPE_NO, keyword);
	}

	@Override
	public int selectSearchContentCount(String keyword) {
		return postRepository
				.countByBoardTypeNoAndPostContentContainingIgnoreCase(BOARD_TYPE_NO, keyword);
	}

	@Override
	public int selectSearchDateCount(LocalDate begin, LocalDate end) {

		LocalDateTime start = begin.atStartOfDay();
		LocalDateTime finish = end.atTime(LocalTime.MAX);

		return postRepository
				.countByBoardTypeNoAndPostCreatedAtBetween(BOARD_TYPE_NO, start, finish);
	}

	@Override
	public ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable) {
		return toList(
				postRepository
					.findByBoardTypeNoAndPostTitleContainingIgnoreCaseOrderByPostNoDesc(
							BOARD_TYPE_NO, keyword, pageable));
	}

	@Override
	public ArrayList<PostDto> selectSearchContent(String keyword, Pageable pageable) {
		return toList(
				postRepository
					.findByBoardTypeNoAndPostContentContainingIgnoreCaseOrderByPostNoDesc(
							BOARD_TYPE_NO, keyword, pageable));
	}

	@Override
	public ArrayList<PostDto> selectSearchDate(LocalDate begin, LocalDate end, Pageable pageable) {

		LocalDateTime start = begin.atStartOfDay();
		LocalDateTime finish = end.atTime(LocalTime.MAX);

		return toList(
				postRepository
					.findByBoardTypeNoAndPostCreatedAtBetweenOrderByPostNoDesc(
							BOARD_TYPE_NO, start, finish, pageable));
	}

}
