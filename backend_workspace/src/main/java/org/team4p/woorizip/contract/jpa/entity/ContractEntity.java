package org.team4p.woorizip.contract.jpa.entity;

import java.util.Date;
import java.sql.Timestamp;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_contracts") // 기술서에 따른 테이블명
public class ContractEntity {

    @Id
    @Column(name = "contract_no", length = 36)
    private String contractNo;

    @Column(name = "user_no", nullable = false, length = 36)
    private String userNo;

    @Column(name = "room_no", nullable = false, length = 36)
    private String roomNo;

    @Temporal(TemporalType.DATE)
    @Column(name = "move_in_date", nullable = false)
    private Date moveInDate;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(name = "contract_status", nullable = false, length = 20)
    private String contractStatus;

    @Column(name = "contract_url", length = 500)
    private String contractUrl;

    @Column(name = "payment_date")
    private Timestamp paymentDate;

    @PrePersist
    public void prePersist() {
        // 1. PK 자동 생성 (UUID)
        if (this.contractNo == null) {
            this.contractNo = java.util.UUID.randomUUID().toString();
        }
        
        // 2. 기본 상태값 설정
        if (this.contractStatus == null) {
            this.contractStatus = "PENDING"; // 신청 대기 상태 등 기본값
        }
    }
}