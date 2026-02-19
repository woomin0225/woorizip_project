package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
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
@AllArgsConstructor
@NoArgsConstructor
public class ReservationListResponseDTO {

	private String reservationNo;
	private String facilityNo;
	private String facilityName;
	private LocalDate reservationDate;
	private LocalTime reservationStartTime;
	private LocalTime reservationEndTime;
	private ReservationStatus reservationStatus;

	public static ReservationListResponseDTO from(ReservationEntity entity) {
	    return ReservationListResponseDTO
	    		.builder()
	    		.reservationNo(entity.getReservationNo())
	    		.facilityNo(entity.getFacilityNo().getFacilityNo())
	    		.facilityName(entity.getFacilityNo().getFacilityName())
	    		.reservationDate(entity.getReservationDate())
	    		.reservationStartTime(entity.getReservationStartTime())
	    		.reservationEndTime(entity.getReservationEndTime())
	    		.reservationStatus(entity.getReservationStatus())
	    		.build();
	}
}