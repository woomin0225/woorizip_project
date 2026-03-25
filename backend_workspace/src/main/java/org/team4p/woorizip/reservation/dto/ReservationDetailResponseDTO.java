package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.team4p.woorizip.facility.dto.FacilityImageDTO;
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
public class ReservationDetailResponseDTO {
	private String reservationNo;
	private String facilityNo;
	private String reservationName;
	private String reservationPhone;
	private LocalDate reservationDate;
	private LocalTime reservationStartTime;
	private LocalTime reservationEndTime;
	private ReservationStatus reservationStatus;
	
	public static ReservationDetailResponseDTO from(ReservationEntity entity) {
	    return ReservationDetailResponseDTO.builder()
	            .reservationNo(entity.getReservationNo())
	            .facilityNo(entity.getFacility().getFacilityNo())
	            .reservationName(entity.getReservationName())
	            .reservationPhone(entity.getReservationPhone())
	            .reservationDate(entity.getReservationDate())
	            .reservationStartTime(entity.getReservationStartTime())
	            .reservationEndTime(entity.getReservationEndTime())
	            .reservationStatus(entity.getReservationStatus())
	            .build();
	}
}
