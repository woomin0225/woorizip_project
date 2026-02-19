package org.team4p.woorizip.board.qna.model.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.board.post.model.dto.PostDto;

public interface QnaService {

	//===============조회=============
	ArrayList<PostDto> selectTop3();
	int selectListCount();
	ArrayList<PostDto> selectList(Pageable pageable);
	PostDto selectQna(int postNo);
	PostDto selectLast();
	
	//조회수 증가 
	void updateAddReadCount(int postNo);
	
	//===============DML=============
	int insertQna(PostDto postDto);
	int updateQna(PostDto postDto, List<Integer> deleteFileNo);
	int deleteQna(int postNo);
	
	//===============검색=============
	int selectSearchTitleCount(String keyword);
	int selectSearchContentCount(String keyword);
	int selectSearchDateCount(LocalDate begin, LocalDate end);
	
	ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable);
	ArrayList<PostDto> selectSearchContent(String keyword, Pageable pageable);
	ArrayList<PostDto> selectSearchDate(LocalDate begin, LocalDate end, Pageable pageable);
}
