package org.team4p.woorizip.contract.model.dto;

import java.sql.Timestamp;
import java.util.Date;

import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractDto {

    private String contractNo;

    private String userNo;

    private String roomNo;

    @NotNull(message = "입주 날짜는 필수입니다.")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date moveInDate;

    @NotNull(message = "계약 기간은 필수입니다.")
    private int termMonths;

    private String status;
    
    private String contractUrl;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp paymentDate;

    private String rejectionReason;

    private RoomRepository roomRepository;
    /**
     * DTO -> Entity 변환
     */
    public ContractEntity toEntity() {
        return ContractEntity.builder()
                .contractNo(contractNo)
                .userNo(userNo)
                .roomNo(roomNo)
                .moveInDate(moveInDate)
                .termMonths(termMonths)
                .status(status)
                .contractUrl(contractUrl)
                .paymentDate(paymentDate)
                .rejectionReason(rejectionReason)
                .build();
    }

    /**
     * Entity -> DTO 변환
     */
    public static ContractDto fromEntity(ContractEntity entity) {
        if (entity == null) return null;

        return ContractDto.builder()
                .contractNo(entity.getContractNo())
                .userNo(entity.getUserNo())
                .roomNo(entity.getRoomNo())
                .moveInDate(entity.getMoveInDate())
                .termMonths(entity.getTermMonths())
                .status(entity.getStatus())
                .contractUrl(entity.getContractUrl())
                .paymentDate(entity.getPaymentDate())
                .rejectionReason(entity.getRejectionReason())
                .build();
    }
}
