package org.team4p.woorizip.board.information.model.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.board.post.model.dto.PostDto;

public interface InformationService {

	  //기본 조회 
	  ArrayList<PostDto> selectTop3();
	  int selectListCount();
	  ArrayList<PostDto> selectList(Pageable pageable);
	  PostDto selectInformation(int postNo);
	  PostDto selectLast();

	  //조회수
	  void updateAddReadCount(int postNo);

	  //DML
	  int insertInformation(PostDto post);
	  int updateInformation(PostDto post, List<Integer> deleteFileNo);
	  int deleteInformation(int postNo);

	  //검색 
	  int selectSearchTitleCount(String keyword);
	  int selectSearchContentCount(String keyword);
	  int selectSearchDateCount(LocalDate begin, LocalDate end); 

	  ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable);
	  ArrayList<PostDto> selectSearchContent(String keyword, Pageable pageable);
	  ArrayList<PostDto> selectSearchDate(LocalDate begin, LocalDate end, Pageable pageable);

}
