package org.team4p.woorizip.contract.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractElectronicCreateRequest {

    private String roomNo;

    private String moveInDate;

    private Integer termMonths;

    private String memo;
}
