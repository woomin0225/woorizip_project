package org.team4p.woorizip.room.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;

public interface RoomEmbeddingRepository extends JpaRepository<RoomEmbeddingEntity, String> {
	List<RoomEmbeddingEntity> findAllByEmbeddingStatus(String status);
}
