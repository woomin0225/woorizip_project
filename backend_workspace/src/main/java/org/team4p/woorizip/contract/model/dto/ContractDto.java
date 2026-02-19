package org.team4p.woorizip.contract.model.dto;

import java.util.Date;
import java.sql.Timestamp;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ContractDto
 * - ContractEntity(tb_contracts)와 필드 및 데이터 타입 동기화
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractDto {

    private String contractNo; // String (UUID)

    @NotBlank(message = "사용자 번호는 필수입니다.")
    private String userNo;

    @NotBlank(message = "방 번호는 필수입니다.")
    private String roomNo;

    @NotNull(message = "입주 날짜는 필수입니다.")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date move_in_date;

    @NotNull(message = "계약 기간은 필수입니다.")
    private int term_months;

    private String status;
    
    private String contractUrl;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp payment_date;

    /**
     * DTO -> Entity 변환
     */
    public ContractEntity toEntity() {
        return ContractEntity.builder()
                .contractNo(contractNo)
                .userNo(userNo)
                .roomNo(roomNo)
                .moveInDate(move_in_date)
                .termMonths(term_months)
                .status(status)
                .contractUrl(contractUrl)
                .paymentDate(payment_date)
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
                .move_in_date(entity.getMoveInDate())
                .term_months(entity.getTermMonths())
                .status(entity.getStatus())
                .contractUrl(entity.getContractUrl())
                .payment_date(entity.getPaymentDate())
                .build();
    }
}