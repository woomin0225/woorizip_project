package org.team4p.woorizip.board.comment.model.service;

import java.util.ArrayList;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.board.comment.jpa.entity.CommentEntity;
import org.team4p.woorizip.board.comment.jpa.repository.CommentRepository;
import org.team4p.woorizip.board.comment.model.dto.CommentDto;
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;
import org.team4p.woorizip.board.post.jpa.repository.PostRepository;

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
		
		PostEntity post = postRepository.findById(postNo).orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));
		
		if(!BOARD_TYPE_NO.equals(post.getBoardTypeNo())) {
			throw new IllegalArgumentException("Q&A 게시글에만 댓글 작성이 가능합니다.");
		}
	}

	//댓글 갯수 ==================================
	@Override
	public int selectCommentCount(Integer postNo) {
		
		validateQnaPost(postNo);
		
		return commentRepository.countByPostNo(postNo);
	}
	
	//댓글 목록 조회 (페이징) ==================================
	@Override
	public ArrayList<CommentDto> selectCommentList(Integer postNo, Pageable pageable) {
		
		validateQnaPost(postNo);
		
		Page<CommentEntity> page = commentRepository.findCommentList(postNo, pageable);
		
		ArrayList<CommentDto> list = new ArrayList<>();
		
		for(CommentEntity entity : page.getContent()) {
			list.add(CommentDto.fromEntity(entity));
		}
		
		return list;
	}
	
	//단건 조회 ==================================
	@Override
	public CommentDto selectComment(Integer commentNo) {
		
		return commentRepository.findById(commentNo)
				.map(CommentDto::fromEntity)
				.orElse(null);
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
				.orElseThrow(() -> new IllegalArgumentException("부모 댓글이 존재하지 않습니다."));

		if (!parent.getPostNo().equals(dto.getPostNo())) {
			throw new IllegalArgumentException("잘못된 부모 댓글입니다.");
		}

		if (parent.getCommentLev() != 1) {
			throw new IllegalArgumentException("대댓글은 1단계 댓글에만 작성할 수 있습니다.");
		}

		// 대댓글
		dto.setCommentLev(2);

		// 같은 그룹의 기존 대댓글 seq 밀기 (최신을 위로)
		commentRepository.shiftCommentSeq(dto.getPostNo(), dto.getParentCommentNo(), 2, 1);

		dto.setCommentSeq(1);
		commentRepository.save(dto.toEntity());

		return 1;
	}
	
	//댓글 수정 ==================================
	@Override
	@Transactional
	public int updateComment(CommentDto dto) {
		
		CommentEntity origin = commentRepository.findById(dto.getCommentNo())
				.orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다."));
		
		origin.setCommentContent(dto.getCommentContent());
		commentRepository.save(origin);
		
		return 1;
	}
	
	//댓글 삭제 ==================================
	@Override
	@Transactional
	public int deleteComment(Integer commentNo) {
		
		if (!commentRepository.existsById(commentNo)) {
	        return 0;
	    }
		
		commentRepository.deleteById(commentNo);
		
		return 1;
	}
}