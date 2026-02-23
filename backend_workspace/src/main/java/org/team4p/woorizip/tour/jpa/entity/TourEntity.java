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

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "canceled_at")
    private Date canceledAt;

    @Column(name = "canceled_reason", columnDefinition = "TEXT")
    private String canceledReason;

    @PrePersist
    public void prePersist() {
        if (this.tourNo == null) {
            this.tourNo = java.util.UUID.randomUUID().toString();
        }
        
        if (this.status == null) {
            this.status = "PENDING";
        }
    }
}