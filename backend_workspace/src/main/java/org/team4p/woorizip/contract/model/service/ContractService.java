package org.team4p.woorizip.contract.model.service;

import java.util.List;
import org.team4p.woorizip.contract.model.dto.ContractDto;

public interface ContractService {

    /**
     * 계약 상세 조회
     */
    ContractDto selectContract(String contractNo);

    /**
     * 특정 사용자의 계약 목록 조회
     */
    List<ContractDto> selectListContract(String userNo);

    /**
     * 계약 등록 (입주 신청)
     */
    int insertContract(ContractDto contractDto);

    /**
     * 계약 정보 수정
     */
    
    int requestAmendment(String originalNo, ContractDto amendmentDto);
    
    int decideAmendment(String amendmentNo, boolean approved, String reason);
    
}