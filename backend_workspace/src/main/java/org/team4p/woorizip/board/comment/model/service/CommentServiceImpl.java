package org.team4p.woorizip.board.comment.model.service;

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
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;
import org.team4p.woorizip.board.post.jpa.repository.PostRepository;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {
	
	private final CommentRepository commentRepository;
	private final PostRepository postRepository;
	
	private static final String BOARD_TYPE_NO = "Q1";
	
	private void validateQnaPost(Integer postNo) {
		
		PostEntity post = postRepository.findById(postNo).orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));
		
		if(!BOARD_TYPE_NO.equals(post.getBoardTypeNo())) {
			throw new ForbiddenException("Q&A 게시글에만 댓글 작성이 가능합니다.");
		}
	}
	
	private List<CommentDto> buildTree(Integer parentNo, Map<Integer, List<CommentDto>> childrenMap) {
		
		List<CommentDto> children = childrenMap.get(parentNo);
		
		if(children == null) {
			return new ArrayList<>();
		}
		
		for(CommentDto child : children) {
			child.setChildren(buildTree(child.getCommentNo(), childrenMap));
		}
		
		return children;
	}

	//댓글 갯수 ==================================
	@Override
	public int selectCommentCount(Integer postNo) {
		
		validateQnaPost(postNo);
		
		return commentRepository.countByPostNo(postNo);
	}
	
	//댓글 목록 조회 (페이징, 트리 로직 변) ==================================
	@Override
	public ArrayList<CommentDto> selectCommentList(Integer postNo, Pageable pageable) {
		
		validateQnaPost(postNo);
		
		Page<CommentEntity> page = commentRepository.findCommentList(postNo, pageable);
		
		List<CommentDto> flatList = page.getContent()
				.stream()
				.map(CommentDto::fromEntity)
				.toList();
		
		//parent 기준으로 그룹핑
		Map<Integer, List<CommentDto>> childrenMap = new LinkedHashMap<>();
		
		for(CommentDto dto : flatList) {
			Integer parentNo = dto.getParentCommentNo();
			childrenMap
				.computeIfAbsent(parentNo, k -> new ArrayList<>())
				.add(dto);
		}
		
		//루트부터 재귀 생성
		return new ArrayList<>(buildTree(null, childrenMap));
	}
	
	//단건 조회 ==================================
	@Override
	public CommentDto selectComment(Integer commentNo) {
		
		return commentRepository.findById(commentNo)
				.map(CommentDto::fromEntity)
				.orElseThrow(() -> new NotFoundException("댓글이 존재하지 않습니다."));
	}
	
	//댓글 등록 ==================================
	@Override
	@Transactional
	public int insertComment(CommentDto dto) {

		validateQnaPost(dto.getPostNo());

		// 댓글
		if (dto.getParentCommentNo() == null) {
			dto.setCommentLev(1);
			dto.setCommentSeq(1);

			commentRepository.save(dto.toEntity());
			return 1;
		}

		CommentEntity parent = commentRepository.findById(dto.getParentCommentNo())
				.orElseThrow(() -> new NotFoundException("부모 댓글이 존재하지 않습니다."));

		if (!parent.getPostNo().equals(dto.getPostNo())) {
			throw new ForbiddenException("잘못된 부모 댓글입니다.");
		}

		int nextLev = parent.getCommentLev() + 1;
		dto.setCommentLev(nextLev);

		// 같은 그룹의 기존 대댓글 seq 밀기 (최신을 위로)
		Integer lastSeq = commentRepository.findLastCommentSeq(
				dto.getPostNo(), 
				dto.getParentCommentNo(), 
				nextLev
		);
		
		dto.setCommentSeq(lastSeq + 1);
		commentRepository.save(dto.toEntity());

		return 1;
	}
	
	//댓글 수정 ==================================
	@Override
	@Transactional
	public int updateComment(CommentDto dto, String loginUserNo) {
		
		CommentEntity origin = commentRepository.findById(dto.getCommentNo())
				.orElseThrow(() -> new NotFoundException("수정할 댓글이 존재하지 않습니다."));
		
		if(!origin.getUserNo().equals(loginUserNo)) {
			throw new ForbiddenException("본인 댓글만 수정 가능합니다.");
		}
		
		origin.setCommentContent(dto.getCommentContent());
		commentRepository.save(origin);
		
		return 1;
	}
	
	//댓글 삭제 ==================================
	@Override
	@Transactional
	public int deleteComment(Integer commentNo, String loginUserNo) {
		
		CommentEntity origin = commentRepository.findById(commentNo)
				.orElseThrow(() -> new NotFoundException("삭제할 댓글이 존재하지 않습니다."));
		
		if(!origin.getUserNo().equals(loginUserNo)) {
			throw new ForbiddenException("본인 댓글만 삭제 가능합니다.");
		}
		
		commentRepository.deleteById(commentNo);
		
		return 1;
	}
}