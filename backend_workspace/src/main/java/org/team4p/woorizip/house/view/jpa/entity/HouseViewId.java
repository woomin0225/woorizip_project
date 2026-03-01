package org.team4p.woorizip.house.view.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class HouseViewId {
	@Column(name="house_no", length=36, nullable=false)
	private String houseNo;
	@Column(name="hour_start", nullable=false)
	private LocalDateTime hourStart;
}
