package org.team4p.woorizip.board.post.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;

public interface PostRepository extends JpaRepository<PostEntity, Integer> {
	
	//고정글 전용
	List<PostEntity> findByBoardTypeNoAndPostPinnedYnTrueOrderByPostNoDesc(String boardTypeNo);
	
	//게시글 최신 조회수 기준 정렬
	List<PostEntity> findTop5ByBoardTypeNoOrderByPostViewCountDesc(String boardTypeNo);
	List<PostEntity> findTop5ByBoardTypeNoAndPostVisibleYnTrueOrderByPostViewCountDesc(String boardTypeNo);

	// 게시판 유형별 목록 조회
	Page<PostEntity> findByBoardTypeNoOrderByPostNoDesc(
		    String boardTypeNo,
		    Pageable pageable
		);
	Page<PostEntity> findByBoardTypeNoAndPostVisibleYnTrueOrderByPostNoDesc(
		    String boardTypeNo,
		    Pageable pageable
		);

	// 게시판 유형별 최신 게시글 1개
	PostEntity findTopByBoardTypeNoOrderByPostNoDesc(String boardTypeNo);

	// 게시판 유형별 최신 게시글 3개
	List<PostEntity> findTop3ByBoardTypeNoOrderByPostCreatedAtDesc(String boardTypeNo);

	// 조회수 증가
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Transactional
	@Query("""
			UPDATE PostEntity p
			SET p.postViewCount = p.postViewCount + 1
			WHERE p.postNo = :postNo
			""")
	int incrementViewCount(@Param("postNo") int postNo);

	// 검색 - 제목
	int countByBoardTypeNoAndPostTitleContainingIgnoreCase(String boardTypeNo, String keyword);
	int countByBoardTypeNoAndPostTitleContainingIgnoreCaseAndPostVisibleYnTrue(String boardTypeNo, String keyword);

	Page<PostEntity> findByBoardTypeNoAndPostTitleContainingIgnoreCaseOrderByPostNoDesc(String boardTypeNo,
			String keyword, Pageable pageable);
	Page<PostEntity> findByBoardTypeNoAndPostTitleContainingIgnoreCaseAndPostVisibleYnTrueOrderByPostNoDesc(
			String boardTypeNo,
			String keyword,
			Pageable pageable
	);

	// 검색 - 내용
	int countByBoardTypeNoAndPostContentContainingIgnoreCase(String boardTypeNo, String keyword);
	int countByBoardTypeNoAndPostContentContainingIgnoreCaseAndPostVisibleYnTrue(String boardTypeNo, String keyword);

	Page<PostEntity> findByBoardTypeNoAndPostContentContainingIgnoreCaseOrderByPostNoDesc(String boardTypeNo,
			String keyword, Pageable pageable);
	Page<PostEntity> findByBoardTypeNoAndPostContentContainingIgnoreCaseAndPostVisibleYnTrueOrderByPostNoDesc(
			String boardTypeNo,
			String keyword,
			Pageable pageable
	);

	// 검색 - 날짜
	int countByBoardTypeNoAndPostCreatedAtBetween(String boardTypeNo, LocalDateTime begin, LocalDateTime end);
	int countByBoardTypeNoAndPostVisibleYnTrueAndPostCreatedAtBetween(
			String boardTypeNo,
			LocalDateTime begin,
			LocalDateTime end
	);

	Page<PostEntity> findByBoardTypeNoAndPostCreatedAtBetweenOrderByPostNoDesc(String boardTypeNo, LocalDateTime begin,
			LocalDateTime end, Pageable pageable);
	Page<PostEntity> findByBoardTypeNoAndPostVisibleYnTrueAndPostCreatedAtBetweenOrderByPostNoDesc(
			String boardTypeNo,
			LocalDateTime begin,
			LocalDateTime end,
			Pageable pageable
	);
}
