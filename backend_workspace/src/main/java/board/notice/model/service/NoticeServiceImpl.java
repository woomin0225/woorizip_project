package board.notice.model.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import board.post.jpa.entity.PostEntity;
import board.post.jpa.repository.PostRepository;
import board.post.model.dto.PostDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

  private final PostRepository postRepository;

  //공지사항 타입 고정 
  private static final String BOARD_TYPE_NO = "N1";

  //Page -> List 변환 공통 메소드
  private ArrayList<PostDto> toList(Page<PostEntity> page) {
    ArrayList<PostDto> list = new ArrayList<>();
    for(PostEntity entity : page) {
      list.add(PostDto.fromEntity(entity));
    }
    return list;
  }

  //=========================기본 조회================================
  @Override
  public ArrayList<PostDto> selectTop3() {
    List<PostEntity> entities = postRepository.findTop3ByBoardTypeNoOrderByPostCreatedAtDesc(BOARD_TYPE_NO);

    ArrayList<PostDto> list = new ArrayList<>();
    for(PostEntity entity : entities) {
      list.add(PostDto.fromEntity(entity));
    }
    return list;
  }

  @Override
  public int selectListCount() {
    return (int) postRepository.countByBoardTypeNoAndPostTitleContainingIgnoreCase(BOARD_TYPE_NO, "");
  }

  @Override
  public ArrayList<PostDto> selectList(Pageable pageable) {
    return toList(
      postRepository.findByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO, pageable)
    );
  }

  @Override
  public PostDto selectNotice(int postNo) {
    return postRepository.findById(postNo)
      .filter(entity -> BOARD_TYPE_NO.equals(entity.getBoardTypeNo()))
      .map(PostDto::fromEntity)
      .orElse(null);
  }

  @Override
  public PostDto selectLast() {
    PostEntity entity = 
      postRepository.findTopByBoardTypeNoOrderByPostNoDesc(BOARD_TYPE_NO);
    return PostDto.fromEntity(entity);
  }

  //===========================조회수============================
  @Override
  @Transactional
  public void updateAddReadCount(int postNo) {
    postRepository.incrementViewCount(postNo);
  }

  //DML
  @Override
  @Transactional
  public int insertNotice(PostDto postDto) {
    try {
      postDto.setBoardTypeNo(BOARD_TYPE_NO);
      postDto.setPostNo(null);

      PostEntity saved = postRepository.save(postDto.toEntity());
      return (saved.getPostNo() != null) ? 1 : 0;
    } catch (Exception e) {
        log.error("insertNotice error : {} ", e.getMessage());
        return 0;
    }
  }

  @Override
  @Transactional
  public int updateNotice(PostDto postDto) {
    if(postDto.getPostNo() == null || 
      !postRepository.existsById(postDto.getPostNo())) {
      return 0;
    }

    postDto.setBoardTypeNo(BOARD_TYPE_NO);

    PostEntity saved = postRepository.save(postDto.toEntity());
    return (saved != null) ? 1 : 0;
  }

  @Override
  @Transactional
  public int deleteNotice(int postNo) {
    try {
      postRepository.deleteById(postNo);
      return 1;
    } catch (Exception e) {
        log.error("deleteNotice error: {}", e.getMessage());
        return 0;
    }
  }

  //===============검색====================
  @Override
  public int selectSearchTitleCount(String keyword) {
    return postRepository.countByBoardTypeNoAndPostTitleContainingIgnoreCase(BOARD_TYPE_NO, keyword);
  }

  @Override
  public int selectSearchContentCount(String keyword) {
    return postRepository.countByBoardTypeNoAndPostContentContainingIgnoreCase(BOARD_TYPE_NO, keyword);
  }

  @Override
  public int selectSearchDateCount(LocalDate begin, LocalDate end) {

    LocalDateTime start = begin.atStartOfDay();
    LocalDateTime finish = end.atTime(LocalTime.MAX)

    return postRepository.countByBoardTypeNoAndPostCreatedAtBetween(BOARD_TYPE_NO, start, finish);
  }

  @Override
  public ArrayList<PostDto> selectSearchTitle(String keyword, Pageable pageable) {
    return toList(
            postRepository.findByBoardTypeNoAndPostTitleContainingIgnoreCaseOrderByPostNoDesc(
              BOARD_TYPE_NO, keyword, pageable));
  }
}
