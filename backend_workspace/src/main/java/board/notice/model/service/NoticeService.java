package board.notice.model.service;

import java.time.LocalDate;
import java.util.ArrayList;

import org.springframework.data.domain.Pageable;

import board.post.model.dto.PostDto;

public interface NoticeService {

  //기본 조회 
  ArrayList<PostDto> selectTop3();
  int selectListCount();
  ArrayList<PostDto> selectList(Pageable pageable);
  PostDto selectNotice(int postNo);
  PostDto selectLast();

  //조회수
  void updateAddReadCount(int postNo);

  //DML
  int insertNotice(PostDto post);
  int updateNotice(PostDto post);
  int deleteNotice(int postNo);

  //검색 
  int selectSearchTitleCount(String keyword);
  int selectSearchContentCount(String keyword);
  int selectSearchDateCount(LocalDate begin, LocalDate end); 

  ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable);
  ArrayList<PostDto> selectSearchContent(String keyword, Pageable pageable);
  ArrayList<PostDto> selectSearchDate(LocalDate begin, LocalDate end, Pageable pageable);
}
