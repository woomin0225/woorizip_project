<<<<<<< Updated upstream
package org.team4p.woorizip.room.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;

public interface RoomRepository extends JpaRepository<RoomEntity, String>, RoomRepositoryCustom {
	List<RoomEntity> findAllByHouseNo(String houseNo);
	String findUserNoById(String roomNo);
}
=======
//package org.team4p.woorizip.room.jpa.repository;
//
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.team4p.woorizip.room.jpa.entity.RoomEntity;
//
//public interface RoomRepository extends JpaRepository<RoomEntity, String>{
//
//}
>>>>>>> Stashed changes
