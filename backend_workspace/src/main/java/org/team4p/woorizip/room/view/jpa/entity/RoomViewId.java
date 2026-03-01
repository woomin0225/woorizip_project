package org.team4p.woorizip.room.view.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class RoomViewId {
	@Column(name="room_no", nullable=false)
	private String roomNo;
	@Column(name="hour_start", nullable=false)
	private LocalDateTime hourStart;
}
