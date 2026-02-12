package org.team4p.woorizip.board.qna.model.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.board.comment.jpa.entity.CommentEntity;
import org.team4p.woorizip.board.comment.jpa.repository.CommentRepository;
import org.team4p.woorizip.board.comment.model.dto.CommentDto;
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;
import org.team4p.woorizip.board.file.jpa.repository.FileRepository;
import org.team4p.woorizip.board.file.model.dto.FileDto;
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;
import org.team4p.woorizip.board.post.jpa.repository.PostRepository;
import org.team4p.woorizip.board.post.model.dto.PostDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class QnaServiceImpl implements QnaService {
	
	private final PostRepository postRepository;
	private final FileRepository fileRepository;
	private final CommentRepository commentRepository;
	
	private static final String BOARD_TYPE_NO = "Q1";
	
	// 공통 변환
	private ArrayList<PostDto> toList(Page<PostEntity> page) {
		ArrayList<PostDto> list = new ArrayList<>();
		for(PostEntity entity : page.getContent()) {
			list.add(PostDto.fromEntity(entity));
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
	
	//======================조회======================
	@Override
	public ArrayList<PostDto> selectTop3() {
		List<PostEntity> entities = 
				postRepository.findTop3ByBoardTypeNoOrderByPostCreatedAtDesc(BOARD_TYPE_NO);
		
		ArrayList<PostDto> list = new ArrayList<>();
		for(PostEntity entity : entities) {
			PostDto dto = PostDto.fromEntity(entity);
			dto.setFiles(getFiles(entity.getPostNo()));
			list.add(dto);
		}
		
		return list;
	}
	
	@Override
	public int selectListCount() {
		return (int) postRepository
				.countByBoardTypeNoAndPostTitleContainingIgnoreCase(BOARD_TYPE_NO, "");
	}
	
	@Override
	public ArrayList<PostDto> selectList(Pageable pageable) {
		return toList(
				postRepository.findByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO, pageable));
	}
	
	@Override
	public PostDto selectQna(int postNo) {
		
		PostEntity entity = postRepository.findById(postNo)
				.filter(e -> BOARD_TYPE_NO.equals(e.getBoardTypeNo()))
				.orElse(null);
		
		if(entity == null) return null;
		
		PostDto dto = PostDto.fromEntity(entity);
		dto.setFiles(getFiles(entity.getPostNo()));
		
		//댓글 전체 조회 
		List<CommentEntity> commentEntities = 
				commentRepository.findCommentList(postNo);
		
		List<CommentDto> flatList = new ArrayList<>(); 
		
		for(CommentEntity ce : commentEntities) {
			flatList.add(CommentDto.fromEntity(ce));
		}
		
		dto.setComments(buildCommentTree(flatList));
		
		return dto;
	}
	
	@Override
	public PostDto selectLast() {
		PostEntity entity = 
				postRepository.findTopByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO);
		
		if(entity == null)
			return null;
		
		PostDto dto = PostDto.fromEntity(entity);
		dto.setFiles(getFiles(entity.getPostNo()));
		return dto;
	}
	
	//조회수 증가 
	@Override
	@Transactional
	public void updateAddReadCount(int postNo) {
		postRepository.incrementViewCount(postNo);
	}
	
	//======================DML======================
	@Override
	@Transactional
	public int insertQna(PostDto postDto) {
		try {
			postDto.setBoardTypeNo(BOARD_TYPE_NO);
			postDto.setPostNo(null);
			
			PostEntity saved = postRepository.save(postDto.toEntity());
			
			if(saved.getPostNo() == null)
				return 0;
			
			if(postDto.getFiles() != null) {
				for(FileDto fileDto : postDto.getFiles()) {
					fileDto.setPostNo(saved.getPostNo());
					fileRepository.save(fileDto.toEntity());
				}
			}
			
			return 1;
		} catch (Exception e) {
			log.error("insertQna error : {}", e.getMessage());
			return 0;
		}
	}
	
	@Override
	@Transactional
	public int updateQna(PostDto postDto, List<Integer> deleteFileNo) {
		
		if(postDto.getPostNo() == null || !postRepository.existsById(postDto.getPostNo())) {
			return 0;
		}
		
		postDto.setBoardTypeNo(BOARD_TYPE_NO);
		postRepository.save(postDto.toEntity());
		
		if(deleteFileNo != null && !deleteFileNo.isEmpty()) {
			for(Integer fileNo : deleteFileNo) {
				fileRepository.deleteById(fileNo);
			}
		}
		
		if(postDto.getFiles() != null) {
			for(FileDto fileDto : postDto.getFiles()) {
				fileDto.setPostNo(postDto.getPostNo());
				fileRepository.save(fileDto.toEntity());
			}
		}
		
		return 1;
	}
	
	@Override
	@Transactional
	public int deleteQna(int postNo) {
		try {
			fileRepository.deleteByPostNo(postNo);
			postRepository.deleteById(postNo);
			return 1;
		} catch (Exception e) {
			log.error("deleteQna error : {}", e.getMessage());
			return 0;
		}
	}
	
	//======================검색======================
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
				.countByBoardTypeNoAndPostCreatedAtBetween(
						BOARD_TYPE_NO, start, finish);
	}
	
	@Override
	public ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable) {
		return toList(
				postRepository.findByBoardTypeNoAndPostTitleContainingIgnoreCaseOrderByPostNoDesc(
						BOARD_TYPE_NO, keyword, pageable));
	}
	
	@Override
	public ArrayList<PostDto> selectSearchContent(String keyword, Pageable pageable) {
		return toList(
				postRepository.findByBoardTypeNoAndPostContentContainingIgnoreCaseOrderByPostNoDesc(
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
	
	//댓글 트리 변환 메소드 ===================================
	private List<CommentDto> buildCommentTree(List<CommentDto> flatList) {
		Map<Integer, CommentDto> map = new LinkedHashMap<>();
		List<CommentDto> roots = new ArrayList<>();
		
		for(CommentDto dto : flatList) {
			dto.setChildren(new ArrayList<>());
			map.put(dto.getCommentNo(), dto);
		}
		
		for(CommentDto dto : flatList) {
			if(dto.getParentCommentNo() == null) {
				roots.add(dto);
			} else {
				CommentDto parent = map.get(dto.getParentCommentNo());
				if(parent != null) {
					parent.getChildren().add(dto);
				}
			}
		}
		
		return roots;
	}
}