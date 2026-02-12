package org.team4p.woorizip.board.comment.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.board.comment.jpa.entity.CommentEntity;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Integer> {
	
	//댓글 갯수 =================================
	int countByPostNo(Integer postNo);
	
	//게시글별 댓글 목록 (페이징) -> 정렬: 부모 → 레벨 → 순번 =================================
	@Query("""
			SELECT c FROM CommentEntity c
			WHERE c.postNo = :postNo
			ORDER BY
				COALESCE(c.parentCommentNo, c.commentNo) ASC,
				c.commentLev ASC,
				c.commentSeq ASC
			""")
	Page<CommentEntity> findCommentList(
			@Param("postNo") Integer postNo,
			Pageable pageable);
	
	//게시글별 댓글 전체 목록 =================================
	@Query("""
			SELECT c FROM CommentEntity c
			WHERE c.postNo = :postNo
			ORDER BY
				COALESCE(c.parentCommentNo, c.commentNo) ASC,
				c.commentLev ASC,
				c.commentSeq ASC
			""")
	List<CommentEntity> findCommentList(@Param("postNo") Integer postNo);
	
	//같은 그룹 내 마지막 seq 조회 =================================
	@Query("""
			SELECT COALESCE(MAX(c.commentSeq), 0)
			FROM CommentEntity c
			WHERE c.postNo = :postNo
				AND c.parentCommentNo = :parentCommentNo
				AND c.commentLev = :commentLev
			""")
	Integer findLastCommentSeq(@Param("postNo") Integer postNo, 
			@Param("parentCommentNo") Integer parentCommentNo,
			@Param("commentLev") Integer commentLev);
	
	//대댓글 삽입 시 seq 밀기 =================================
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Transactional
	@Query("""
			UPDATE CommentEntity c
			SET c.commentSeq = c.	commentSeq + 1
			WHERE c.postNo = :postNo
				AND c.parentCommentNo = :parentCommentNo
				AND c.commentLev = :commentLev
				AND c.commentSeq >= :fromSeq
			""")
	int shiftCommentSeq(@Param("postNo") Integer postNo, 
			@Param("parentCommentNo") Integer parentCommentNo,
			@Param("commentLev") Integer commentLev, 
			@Param("fromSeq") Integer fromSeq);
	
	//부모 댓글 삭제 (대댓글 포함) =================================
	int deleteByParentCommentNo(Integer parentCommentNo);
	
	//게시글 삭제 시 댓글 전체 삭제 =================================
	int deleteByPostNo(Integer postNo);
}
