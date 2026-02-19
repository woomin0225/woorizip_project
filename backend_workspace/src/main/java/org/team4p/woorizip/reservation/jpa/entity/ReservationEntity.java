package org.team4p.woorizip.reservation.jpa.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.hibernate.annotations.CreationTimestamp;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;
import org.team4p.woorizip.reservation.enums.ReservationStatus;
import org.team4p.woorizip.user.jpa.entity.UserEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_fm_rsvn")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReservationEntity {
	@Id
	@Column(name = "rsvn_no")
	private String reservationNo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "facility_no")
	private FacilityEntity facility;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_no")
	private UserEntity userNo;

	@Column(name = "rsvn_name")
	private String reservationName;

	@Column(name = "rsvn_phone")
	private String reservationPhone;

	@Column(name = "rsvn_date")
	private LocalDate reservationDate;
	
	@Column(name = "rsvn_start_time")
	private LocalTime reservationStartTime;
	
	@Column(name = "rsvn_end_time")
	private LocalTime reservationEndTime;

	@Column(name = "rsvn_status")
	@Enumerated(EnumType.STRING)
	private ReservationStatus reservationStatus;

	@Column(name = "rsvn_created_at")
	@CreationTimestamp
	private LocalDateTime reservationCreatedAt;
	
	@Column(name = "rsvn_updated_at")
	private LocalDateTime reservationUpdatedAt;
	
	@Column(name = "rsvn_canceled_at")
	private LocalDateTime reservationCanceledAt;
	
	public void updateReservation(ReservationModifyRequestDTO dto) {
		 if (dto.getReservationName() != null && !dto.getReservationName().isBlank()) this.reservationName = dto.getReservationName();
		 if (dto.getReservationPhone() != null && !dto.getReservationPhone().isBlank()) this.reservationPhone = dto.getReservationPhone();
		 if (dto.getReservationDate() != null) this.reservationDate = dto.getReservationDate() ;
		 if (dto.getReservationStartTime() != null) this.reservationStartTime = dto.getReservationStartTime();
		 if (dto.getReservationEndTime() != null) this.reservationEndTime = dto.getReservationEndTime();
		 if (dto.getReservationStatus() != null) {
			 this.reservationStatus = dto.getReservationStatus();
			 if (this.reservationStatus == ReservationStatus.CANCELED) this.reservationCanceledAt = LocalDateTime.now();
			 else this.reservationCanceledAt = null;
		 	}
		 this.reservationUpdatedAt = LocalDateTime.now();
	}
}
