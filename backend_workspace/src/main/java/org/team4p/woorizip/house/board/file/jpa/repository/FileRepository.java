package org.team4p.woorizip.board.file.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Integer> {

	//특정 게시글의 파일 전체 조회
	List<FileEntity> findByPostNo(Integer postNo);
	
	//특정 게시글의 파일 전체 삭제 (게시글 삭제 시 사용)
	void deleteByPostNo(Integer postNo);
}
