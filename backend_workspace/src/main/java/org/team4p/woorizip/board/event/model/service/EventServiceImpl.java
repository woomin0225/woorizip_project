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
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;
import org.team4p.woorizip.board.file.jpa.repository.FileRepository;
import org.team4p.woorizip.board.file.model.dto.FileDto;
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;
import org.team4p.woorizip.board.post.jpa.repository.PostRepository;
import org.team4p.woorizip.board.post.model.dto.PostDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

	private final PostRepository postRepository;
	private final FileRepository fileRepository;

	// 공지사항 타입 고정
	private static final String BOARD_TYPE_NO = "E1";

	// ================Page -> List 변환 공통 메소드==============
	private ArrayList<PostDto> toList(Page<PostEntity> page) {
		ArrayList<PostDto> list = new ArrayList<>();
		for (PostEntity entity : page) {
			PostDto dto = PostDto.fromEntity(entity);
			dto.setFiles(getFiles(entity.getPostNo()));
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
			list.add(dto);
		}
		return list;
	}

	@Override
	public int selectListCount() {
		return (int) postRepository.countByBoardTypeNoAndPostTitleContainingIgnoreCase(BOARD_TYPE_NO, "");
	}

	@Override
	public ArrayList<PostDto> selectList(Pageable pageable) {
		return toList(postRepository.findByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO, pageable));
	}

	@Override
	public PostDto selectEvent(int postNo) {
		return postRepository.findById(postNo)
				.filter(entity -> BOARD_TYPE_NO.equals(entity.getBoardTypeNo()))
				.map(entity -> {
					PostDto dto = PostDto.fromEntity(entity);
					dto.setFiles(getFiles(entity.getPostNo()));
					return dto;
				})
				.orElse(null);
	}

	@Override
	public PostDto selectLast() {
		PostEntity entity = postRepository.findTopByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO);

		if (entity == null)
			return null;

		PostDto dto = PostDto.fromEntity(entity);
		dto.setFiles(getFiles(entity.getPostNo()));
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
	public int insertEvent(PostDto postDto) {
		try {
			postDto.setBoardTypeNo(BOARD_TYPE_NO);
			postDto.setPostNo(null);

			PostEntity saved = postRepository.save(postDto.toEntity());

			if (saved.getPostNo() == null)
				return 0;

			// 파일 저장
			if (postDto.getFiles() != null) {
				for (FileDto fileDto : postDto.getFiles()) {
					fileDto.setPostNo(saved.getPostNo());
					fileRepository.save(fileDto.toEntity());
				}
			}

			return 1;
		} catch (Exception e) {
			log.error("insertEvent error : {}", e.getMessage());
			return 0;
		}

	}

	//========================수정======================
	@Override
	@Transactional
	public int updateEvent(PostDto postDto, List<Integer> deleteFileNo) {
		
		if(postDto.getPostNo() == null || 
				!postRepository.existsById(postDto.getPostNo())) {
			return 0;
		}
		
		postDto.setBoardTypeNo(BOARD_TYPE_NO);
		postRepository.save(postDto.toEntity());
		
		//선택 삭제 파일 제거
		if(deleteFileNo != null && !deleteFileNo.isEmpty()) {
			for(Integer fileNo : deleteFileNo) {
				fileRepository.deleteById(fileNo);
			}
		}
		
		//새 파일 추가 
		if(postDto.getFiles() != null) {
			for(FileDto fileDto : postDto.getFiles()) {
				fileDto.setPostNo(postDto.getPostNo());
				fileRepository.save(fileDto.toEntity());
			}
		}
		
		return 1;
	}

	//========================삭	제======================
	@Override
	@Transactional
	public int deleteEvent(int postNo) {
		try {
			fileRepository.deleteByPostNo(postNo);
			postRepository.deleteById(postNo);
			return 1;
		} catch (Exception e) {
			log.error("deleteNotice error: {}", e.getMessage());
			return 0;
		}
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
