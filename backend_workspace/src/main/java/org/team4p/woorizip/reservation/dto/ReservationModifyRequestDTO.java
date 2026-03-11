package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.reservation.enums.ReservationStatus;

import jakarta.validation.constraints.Size;
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
	
	@Size(max=20, message = "예약자 성함은 20자 이내여야 합니다.")
	@TextOnly
	private String reservationName;
	
	@Size(max=15, message = "예약자 전화번호는 15자 이내여야 합니다.")
	@NumericOnly
	private String reservationPhone;
	
	private LocalDate reservationDate;
	
	private LocalTime reservationStartTime;
	
	private LocalTime reservationEndTime;
	
	private ReservationStatus reservationStatus;
}
