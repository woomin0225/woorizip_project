package org.team4p.woorizip.board.event.model.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.board.bannerimage.model.dto.BannerImageDto;
import org.team4p.woorizip.board.post.model.dto.PostDto;

public interface EventService {

	  //기본 조회 
	  ArrayList<PostDto> selectTop5();
	  int selectListCount();
	  ArrayList<PostDto> selectList(Pageable pageable);
	  int selectVisibleListCount();
	  ArrayList<PostDto> selectVisibleList(Pageable pageable);
	  PostDto selectEvent(int postNo);
	  PostDto selectVisibleEvent(int postNo);
	  PostDto selectLast();

	  //조회수
	  void updateAddReadCount(int postNo);
	  boolean toggleVisibility(int postNo);

	  //DML
	  int insertEvent(PostDto post, BannerImageDto bannerDto);
	  int updateEvent(PostDto post, List<Integer> deleteFileNo, BannerImageDto bannerDto);
	  int deleteEvent(int postNo);

	  //검색 
	  int selectSearchTitleCount(String keyword);
	  int selectSearchContentCount(String keyword);
	  int selectSearchDateCount(LocalDate begin, LocalDate end); 
	  int selectVisibleSearchTitleCount(String keyword);
	  int selectVisibleSearchContentCount(String keyword);
	  int selectVisibleSearchDateCount(LocalDate begin, LocalDate end); 

	  ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable);
	  ArrayList<PostDto> selectSearchContent(String keyword, Pageable pageable);
	  ArrayList<PostDto> selectSearchDate(LocalDate begin, LocalDate end, Pageable pageable);
	  ArrayList<PostDto> selectVisibleSearchTitle(String keyword, Pageable pageable);
	  ArrayList<PostDto> selectVisibleSearchContent(String keyword, Pageable pageable);
	  ArrayList<PostDto> selectVisibleSearchDate(LocalDate begin, LocalDate end, Pageable pageable);

}
