package org.team4p.woorizip.contract.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractSignatureVerifyRequest {

    private String signerName;

    private String agreedAt;
}
