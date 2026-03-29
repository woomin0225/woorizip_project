package org.team4p.woorizip.room.image.analyze.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.team4p.woorizip.room.image.analyze.jpa.entity.RoomImageAnalysisEntity;

public interface RoomImageAnalysisRepository extends JpaRepository<RoomImageAnalysisEntity, Long>{

	// 방 이미지 번호로 해당 이미지의 AI 분석 결과 1건 조회
	Optional<RoomImageAnalysisEntity> findByRoomImageNo(Integer roomImageNo);
	
	// 방 이미지 번호 기준으로 AI 분석 결과가 이미 저장되어 있는지 확인
	boolean existsByRoomImageNo(Integer roomImageNo);
	
	// 방 이미지 번호로 분석 결과 삭제 
	@Query(value="""	  
			DELETE FROM `tb_rooms_image_analysis`
			WHERE room_image_no = :roomImageNo
			""", nativeQuery=true)
	void deleteByRoomImageNo(@Param("roomImageNo") int roomImageNo);
	
	//
	@Query(value="""
			SELECT ria.caption
			FROM tb_rooms_image_analysis AS ria
			WHERE ria.room_no = :roomNo
			ORDER BY ria.analysis_created_at DESC
			""", nativeQuery=true)
	List<String> findAllImageCaptionsByRoomNo(@Param("roomNo") String roomNo);	// AI 서버로 요약 요청 보내기 위해 해당 방의 사진분석 전체 조회
}
