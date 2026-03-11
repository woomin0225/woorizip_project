package org.team4p.woorizip.board.comment.controller;

import java.util.ArrayList;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.team4p.woorizip.board.comment.model.dto.CommentDto;
import org.team4p.woorizip.board.comment.model.service.CommentService;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qna")
public class CommentController {

	private final CommentService commentService;
	private final UserRepository userRepository;
	
	//게시글 댓글 목록 ==========================
	@GetMapping("/{postNo}/comments")
	public ResponseEntity<ApiResponse<ArrayList<CommentDto>>> list(
			@PathVariable("postNo") Integer postNo,
			Pageable pageable) {
		
		ArrayList<CommentDto> list = 
				commentService.selectCommentList(postNo, pageable);
		
		return ResponseEntity.ok(
				ApiResponse.ok("댓글 목록 조회 성공", list));
	}
	
	//댓글 등록 (lev = 1) ==========================
	@PostMapping("/{postNo}/comments")
	public ResponseEntity<ApiResponse<Void>> create(
			@PathVariable("postNo") Integer postNo, 
			@RequestBody CommentDto dto,
			Authentication authentication) {
		
		String email = authentication.getName();
		
		UserEntity user = userRepository.findByEmailId(email);

		if (user == null) {
		    throw new NotFoundException("존재하지 않는 사용자 입니다.");
		}

		dto.setPostNo(postNo);
		dto.setParentCommentNo(null);
		dto.setUserNo(user.getUserNo());

		commentService.insertComment(dto);

		return ResponseEntity.status(201)
				.body(ApiResponse.ok("댓글 등록 성공", null));
	}
	
	//대댓글 등록 ==========================
	@PostMapping("/{postNo}/comments/{parentCommentNo}")
	public ResponseEntity<ApiResponse<Void>> rcommentInsertMethod(
			@PathVariable("postNo") Integer postNo,
			@PathVariable("parentCommentNo") Integer parentCommentNo,
			@RequestBody CommentDto dto,
			Authentication authentication) {
		
		String email = authentication.getName();

		UserEntity user = userRepository.findByEmailId(email);

		if (user == null) {
			throw new NotFoundException("존재하지 않는 사용자 입니다.");
		}
		
		dto.setPostNo(postNo);
		dto.setParentCommentNo(parentCommentNo);
		dto.setUserNo(user.getUserNo());
		
		commentService.insertComment(dto);

		return ResponseEntity.status(201)
				.body(ApiResponse.ok("대댓글 등록 성공", null));
	}
	
	//댓글 수정 ==========================
	@PutMapping("/comments/{commentNo}")
	public ResponseEntity<ApiResponse<Void>> update(
			@PathVariable("commentNo") Integer commentNo, 
			@RequestBody CommentDto dto,
			Authentication authentication) {

		dto.setCommentNo(commentNo);
		
		String email = authentication.getName();
		UserEntity user = userRepository.findByEmailId(email);
		if (user == null) {
		    throw new NotFoundException("존재하지 않는 사용자 입니다.");
		}
		
		String loginUserNo = user.getUserNo();
		
		commentService.updateComment(dto, loginUserNo);
		
		return ResponseEntity.ok(ApiResponse.ok("댓글 수정 성공", null));
	}
	
	//댓글 삭제 ==========================
	@DeleteMapping("/comments/{commentNo}")
	public ResponseEntity<ApiResponse<Void>> delete(
			@PathVariable("commentNo") Integer commentNo,
			Authentication authentication) {
		
		String email = authentication.getName();
		
		UserEntity user = userRepository.findByEmailId(email);
		if (user == null) {
		    throw new NotFoundException("존재하지 않는 사용자 입니다.");
		}
		
		String loginUserNo = user.getUserNo();

		commentService.deleteComment(commentNo, loginUserNo);
		
		return ResponseEntity.ok(ApiResponse.ok("댓글 삭제 성공", null));
	}
}