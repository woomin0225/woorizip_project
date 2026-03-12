package org.team4p.woorizip.room.image.analyze.jpa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.image.analyze.jpa.entity.RoomImageAnalysisEntity;

public interface RoomImageAnalysisRepository extends JpaRepository<RoomImageAnalysisEntity, Long>{

	// 방 이미지 번호로 해당 이미지의 AI 분석 결과 1건 조회
	Optional<RoomImageAnalysisEntity> findByRoomImageNo(Integer roomImageNo);
	
	// 방 이미지 번호 기준으로 AI 분석 결과가 이미 저장되어 있는지 확인
	boolean existsByRoomImageNo(Integer roomImageNo);
}
