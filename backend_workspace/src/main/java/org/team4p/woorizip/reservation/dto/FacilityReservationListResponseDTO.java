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
@AllArgsConstructor
@NoArgsConstructor
public class FacilityReservationListResponseDTO {
	private String rsvnNo;
	private String facilityNo;
	private String facilityName;
	private String name;
	private String phone;
	private LocalDate rsvnDate;
	private LocalTime rsvnStartTime;
	private LocalTime rsvnEndTime;
	private ReservationStatus rsvnStatus;
}
