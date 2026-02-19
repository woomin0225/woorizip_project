package org.team4p.woorizip.board.comment.controller;

import java.util.ArrayList;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.team4p.woorizip.board.comment.model.dto.CommentDto;
import org.team4p.woorizip.board.comment.model.service.CommentService;
import org.team4p.woorizip.common.api.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qna")
public class CommentController {

	private final CommentService commentService;
	
	//게시글 댓글 목록 ==========================
	@GetMapping("/{postNo}/comments")
	public ResponseEntity<ApiResponse<ArrayList<CommentDto>>> list(
			@PathVariable Integer postNo,
			Pageable pageable) {
		
		ArrayList<CommentDto> list = 
				commentService.selectCommentList(postNo, pageable);
		
		return ResponseEntity.ok(
				ApiResponse.ok("댓글 목록 조회 성공", list));
	}
	
	//댓글 등록 (lev = 1) ==========================
	@PostMapping("/{postNo}/comments")
	public ResponseEntity<ApiResponse<Void>> create(
			@PathVariable Integer postNo, 
			@RequestBody CommentDto dto) {

		dto.setPostNo(postNo);
		dto.setParentCommentNo(null);

		commentService.insertComment(dto);

		return ResponseEntity.status(201)
				.body(ApiResponse.ok("댓글 등록 성공", null));
	}
	
	//대댓글 등록 ==========================
	@PostMapping("/{postNo}/comments/{parentCommentNo}")
	public ResponseEntity<ApiResponse<Void>> rcommentInsertMethod(
			@PathVariable Integer postNo,
			@PathVariable Integer parentCommentNo,
			@RequestBody CommentDto dto) {
		
		dto.setPostNo(postNo);
		dto.setParentCommentNo(parentCommentNo);
		
		commentService.insertComment(dto);

		return ResponseEntity.status(201)
				.body(ApiResponse.ok("대댓글 등록 성공", null));
	}
	
	//댓글 수정 ==========================
	@PutMapping("/comments/{commentNo}")
	public ResponseEntity<ApiResponse<Void>> update(
			@PathVariable Integer commentNo, 
			@RequestBody CommentDto dto) {

		dto.setCommentNo(commentNo);
		
		commentService.updateComment(dto);
		
		return ResponseEntity.ok(ApiResponse.ok("댓글 수정 성공", null));
	}
	
	//댓글 삭제 ==========================
	@DeleteMapping("/comments/{commentNo}")
	public ResponseEntity<ApiResponse<Void>> delete(
			@PathVariable Integer commentNo) {

		commentService.deleteComment(commentNo);
		
		return ResponseEntity.ok(ApiResponse.ok("댓글 삭제 성공", null));
	}
}