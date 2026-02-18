package org.team4p.woorizip.tour.jpa.entity;

import java.util.Date;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_tours")
public class TourEntity {

    @Id
    @Column(name = "tour_no", length = 36)
    private String tourNo;

    @Column(name = "user_no", nullable = false, length = 36)
    private String userNo;

    @Column(name = "room_no", nullable = false, length = 36)
    private String roomNo;

    @Temporal(TemporalType.DATE)
    @Column(name = "visit_date", nullable = false)
    private Date visitDate;

    @Column(name = "visit_time", nullable = false)
    private String visitTime;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "tour_status", nullable = false, length = 20)
    private String tourStatus;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "tour_canceled_at")
    private Date tourCanceledAt;

    @Column(name = "canceled_reason", columnDefinition = "TEXT")
    private String canceledReason;

    @PrePersist
    public void prePersist() {
        // 1. 기본 설정 (PK)
        if (this.tourNo == null) {
            this.tourNo = java.util.UUID.randomUUID().toString();
        }
        
        // 2. 기본 상태값 설정 (요청 시 기본값을 'PENDING'으로 가정)
        if (this.tourStatus == null) {
            this.tourStatus = "PENDING";
        }
    }
}