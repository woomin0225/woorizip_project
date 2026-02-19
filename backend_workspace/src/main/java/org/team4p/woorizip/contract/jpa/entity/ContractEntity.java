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
    @Column(name = "contract_no", length = 36) // DB 스키마와 일치 (snake_case)
    private String contractNo;

    @Column(name = "user_no", nullable = false, length = 36)
    private String userNo;

    @Column(name = "room_no", nullable = false, length = 36)
    private String roomNo;

    @Column(name = "move_in_date", nullable = false)
    private Date moveInDate;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "contract_url", length = 500)
    private String contractUrl;

    @Column(name = "payment_date")
    private Timestamp paymentDate;

    // --- 추가된 필드 ---
    @Column(name = "parent_contract_no", length = 36)
    private String parentContractNo;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @PrePersist
    public void prePersist() {
        if (this.contractNo == null) {
            this.contractNo = java.util.UUID.randomUUID().toString();
        }
        if (this.status == null) {
            this.status = "APPLIED"; // 스키마의 ENUM 첫 번째 값인 APPLIED로 맞춤
        }
    }

    // --- 데이터 병합을 위한 편의 메서드 ---
    public void updateFromAmendment(ContractEntity amendment) {
        this.moveInDate = amendment.getMoveInDate();
        this.termMonths = amendment.getTermMonths();
        this.contractUrl = amendment.getContractUrl();
    }

}