package org.team4p.woorizip.room.jpa.entity;

<<<<<<< Updated upstream
import java.time.LocalDateTime;

import org.team4p.woorizip.room.dto.RoomDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@Table(name="tb_rooms")
@Entity
=======
import jakarta.persistence.*;
import lombok.*;

//@Entity
@Table(name = "tb_rooms") // 실제 테이블 이름
@Getter
@Setter
@NoArgsConstructor
>>>>>>> Stashed changes
public class RoomEntity {
	@Id
	@Column(name="room_no")
	@GeneratedValue(strategy=GenerationType.UUID)
	private String roomNo;
	
	@Column(name="room_name")
	private String roomName;

<<<<<<< Updated upstream
	@Column(name="house_no")
	private String houseNo;
	
	@Column(name="user_no")
	private String userNo;
	
	@Column(name="room_created_at")
	private LocalDateTime roomCreatedAt;
	
	@Column(name="room_updated_at")
	private LocalDateTime roomUpdatedAt;
	
	@Column(name="room_deposit")
	private Integer roomDeposit;
	
	@Column(name="room_monthly")
	private Integer roomMonthly;
	
	@Column(name="room_method")
	private String roomMethod;
	
	@Column(name="room_area")
	private Double roomArea;
	
	@Column(name="room_facing")
	private String roomFacing;
	
	@Column(name="room_available_date")
	private LocalDateTime roomAvailableDate;
	
	@Column(name="room_abstract")
	private String roomAbstract;
	
	@Column(name="room_room_count")
	private Integer roomRoomCount;
	
	@Column(name="room_bath_count")
	private Integer roomBathCount;
	
	@Column(name="room_empty_yn")
	private Boolean roomEmptyYn;
	
	@Column(name="room_status")
	private String roomStatus;
	
	@Column(name="room_options")
	private String roomOptions;
	
	@Column(name="room_image_count")
	private Integer roomImageCount;
	
	@Column(name="deleted")
	private Boolean deleted;
	
	@Column(name="deleted_at")
	private LocalDateTime deletedAt;
	
	@PrePersist
	public void prePersist() {
		if (roomNo == null)
			roomNo = java.util.UUID.randomUUID().toString();
		
		if (roomCreatedAt == null)
			roomCreatedAt = LocalDateTime.now();
	}
	
	@PreUpdate
	public void preUpdated() {
		if (roomUpdatedAt == null)
			roomUpdatedAt = LocalDateTime.now();
	}
	
	public RoomDto toDto() {
		return RoomDto.builder()
						.roomNo(roomNo)
						.roomName(roomName)
						.houseNo(houseNo)
						.userNo(userNo)
						.roomCreatedAt(roomCreatedAt)
						.roomUpdatedAt(roomUpdatedAt)
						.roomDeposit(roomDeposit)
						.roomMonthly(roomMonthly)
						.roomMethod(roomMethod)
						.roomArea(roomArea)
						.roomFacing(roomFacing)
						.roomAvailableDate(roomAvailableDate)
						.roomAbstract(roomAbstract)
						.roomRoomCount(roomRoomCount)
						.roomBathCount(roomBathCount)
						.roomEmptyYn(roomEmptyYn)
						.roomStatus(roomStatus)
						.roomOptions(roomOptions)
						.roomImageCount(roomImageCount)
						.deleted(deleted)
						.deletedAt(deletedAt)
						.build();
	}
}
=======
    @Id  // <--- 이 어노테이션이 반드시 있어야 합니다!
    @GeneratedValue(strategy = GenerationType.IDENTITY) // DB에서 번호를 자동 생성해주는 옵션
    private Long roomNo; // 방 번호와 같은 식별자 필드

    // ... 나머지 필드들 (roomTitle, roomDesc 등)
}
>>>>>>> Stashed changes
