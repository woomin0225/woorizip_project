package org.team4p.woorizip.room.image.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;

public interface RoomImageRepository extends JpaRepository<RoomImageEntity, Integer>, RoomImageRepositoryCustom {

}
