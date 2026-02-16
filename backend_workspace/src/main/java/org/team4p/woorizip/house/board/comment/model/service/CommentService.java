package org.team4p.woorizip.board.comment.model.service;

import java.util.ArrayList;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.board.comment.model.dto.CommentDto;

public interface CommentService {

	//조회 ============================
	int selectCommentCount(Integer postNo);
	ArrayList<CommentDto> selectCommentList(Integer postNo, Pageable pageable);
	CommentDto selectComment(Integer commentNo);
	
	//DML ============================
	int insertComment(CommentDto commentDto);
	int updateComment(CommentDto commentDto);
	int deleteComment(Integer commentNo);
}
