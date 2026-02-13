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

    private String contract_no; // String (UUID)

    @NotBlank(message = "사용자 번호는 필수입니다.")
    private String user_no;

    @NotBlank(message = "방 번호는 필수입니다.")
    private String room_no;

    @NotNull(message = "입주 날짜는 필수입니다.")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date move_in_date;

    @NotNull(message = "계약 기간은 필수입니다.")
    private int term_months;

    private String contract_status;
    
    private String contract_url;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Timestamp payment_date;

    /**
     * DTO -> Entity 변환
     */
    public ContractEntity toEntity() {
        return ContractEntity.builder()
                .contractNo(contract_no)
                .userNo(user_no)
                .roomNo(room_no)
                .moveInDate(move_in_date)
                .termMonths(term_months)
                .contractStatus(contract_status)
                .contractUrl(contract_url)
                .paymentDate(payment_date)
                .build();
    }

    /**
     * Entity -> DTO 변환
     */
    public static ContractDto fromEntity(ContractEntity entity) {
        if (entity == null) return null;

        return ContractDto.builder()
                .contract_no(entity.getContractNo())
                .user_no(entity.getUserNo())
                .room_no(entity.getRoomNo())
                .move_in_date(entity.getMoveInDate())
                .term_months(entity.getTermMonths())
                .contract_status(entity.getContractStatus())
                .contract_url(entity.getContractUrl())
                .payment_date(entity.getPaymentDate())
                .build();
    }
}