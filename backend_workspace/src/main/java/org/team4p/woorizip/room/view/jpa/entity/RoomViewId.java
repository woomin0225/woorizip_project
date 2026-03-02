package org.team4p.woorizip.room.view.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class RoomViewId {
	@Column(name="room_no", length=36, nullable=false)
	private String roomNo;
	@Column(name="hour_start", nullable=false)
	private LocalDateTime hourStart;
}
