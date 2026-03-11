package org.team4p.woorizip.contract.model.service;

import java.util.List;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.contract.model.dto.ContractDto;
import org.team4p.woorizip.contract.model.dto.request.ContractElectronicCreateRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractPaymentRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractSignatureVerifyRequest;

public interface ContractService {

    /**
     * 계약 상세 조회
     */
    ContractDto selectContract(String contractNo);

    /**
     * 특정 사용자의 계약 목록 조회
     */
    PageResponse<ContractDto> selectListContract(String userNo, int page, int size);

    /**
     * 임대인(방 소유자) 기준 계약 목록 조회
     */
    PageResponse<ContractDto> selectListContractByOwner(String ownerUserNo, int page, int size);

    /**
     * 계약 등록 (입주 신청)
     */
    ContractDto insertContract(ContractDto contractDto);

    /**
     * 계약 정보 수정
     */
    
    int requestAmendment(String originalNo, ContractDto amendmentDto);
    
    int decideAmendment(String amendmentNo, boolean approved, String reason);

    int cancelContract(String contractNo, String reason);

    ContractDto createElectronicContract(String contractNo, ContractElectronicCreateRequest request);

    ContractDto verifyElectronicSignature(String contractNo, ContractSignatureVerifyRequest request);

    ContractDto requestContractPayment(String contractNo, ContractPaymentRequest request);

    int updateStatus(String contractNo, String status, String reason);
    
}
