package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
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
public class ReservationCreateRequestDTO {
	
	private String facilityNo;
	
	private String userNo;
	
	@NotBlank(message="reservationName needed")
	private String reservationName;
	
	@NotBlank(message="reservationPhone needed")
	private String reservationPhone;
	
	@NotBlank(message="reservationDate needed")
	private LocalDate reservationDate;
	
	@NotBlank(message="reservationStartTime needed")
	private LocalTime reservationStartTime;
	
	@NotBlank(message="reservationEndTime needed")
	private LocalTime reservationEndTime;
}
