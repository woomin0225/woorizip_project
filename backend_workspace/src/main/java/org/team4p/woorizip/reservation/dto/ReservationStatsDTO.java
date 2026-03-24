package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.team4p.woorizip.reservation.enums.ReservationStatus;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationStatsDTO {
	private String reservationNo;
	private String facilityNo;
	private String userName;
	private LocalDate reservationDate;
	private LocalTime reservationStartTime;
	private LocalTime reservationEndTime;
	private LocalDateTime reservationCreatedAt;
	private LocalDateTime reservationUpdatedAt;
	private LocalDateTime reservationCanceledAt;
	private ReservationStatus reservationStatus;
	
	public static ReservationStatsDTO from(ReservationEntity entity) {
	    return ReservationStatsDTO.builder()
	            .reservationNo(entity.getReservationNo())
	            .facilityNo(entity.getFacility().getFacilityNo())
	            .userName(entity.getUser().getName())
	            .reservationDate(entity.getReservationDate())
	            .reservationStartTime(entity.getReservationStartTime())
	            .reservationEndTime(entity.getReservationEndTime())
	            .reservationCreatedAt(entity.getReservationCreatedAt())
	            .reservationUpdatedAt(entity.getReservationUpdatedAt())
	            .reservationCanceledAt(entity.getReservationCanceledAt())
	            .reservationStatus(entity.getReservationStatus())
	            .build();
	    }

}
