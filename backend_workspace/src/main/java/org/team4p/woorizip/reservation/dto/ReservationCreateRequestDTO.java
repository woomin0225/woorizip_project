package org.team4p.woorizip.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.common.validator.TextOnly;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ReservationCreateRequestDTO {
	
	@NotBlank(message="예약자 성함을 입력해주세요.")
	@Size(max=20, message = "예약자 성함은 20자 이내여야 합니다.")
	@TextOnly
	private String reservationName;
	
	@NotBlank(message="예약자 전화번호를 입력해주세요.")
	@Size(max=15, message = "예약자 전화번호는 15자 이내여야 합니다.")
	@NumericOnly
	private String reservationPhone;
	
	@NotNull(message="이용하실 날짜를 선택해주세요.")
	private LocalDate reservationDate;
	
	@NotNull(message="이용 시작 시간을 선택해주세요.")
	private LocalTime reservationStartTime;
	
	@NotNull(message="이용 종료 시간을 선택해주세요.")
	private LocalTime reservationEndTime;
}
