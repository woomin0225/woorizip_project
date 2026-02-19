package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import org.team4p.woorizip.reservation.enums.ReservationStatus;

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
public class ReservationModifyRequestDTO {
	private String reservationName;
	private String reservationPhone;
	private LocalDate reservationDate;
	private LocalTime reservationStartTime;
	private LocalTime reservationEndTime;
	private ReservationStatus reservationStatus;
}
