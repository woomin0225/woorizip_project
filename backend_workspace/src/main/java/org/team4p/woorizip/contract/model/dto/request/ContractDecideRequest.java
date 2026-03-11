package org.team4p.woorizip.contract.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDecideRequest {

    /**
     * 승인 여부
     */
    private boolean approved;

    /**
     * 반려 사유 (반려 시 필수 입력)
     */
    private String reason;
}