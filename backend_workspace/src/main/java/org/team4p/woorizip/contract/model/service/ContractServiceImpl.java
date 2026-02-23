package org.team4p.woorizip.contract.model.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.repository.ContractRepository;
import org.team4p.woorizip.contract.model.dto.ContractDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;

    @Override
    public ContractDto selectContract(String contractNo) {
        ContractEntity entity = contractRepository.findByContractNo(contractNo);
        return entity != null ? ContractDto.fromEntity(entity) : null;
    }

    @Override
    public List<ContractDto> selectListContract(String userNo) {
        List<ContractEntity> list = contractRepository.findByUserNo(userNo);
        return toList(list);
    }

    @Override
    @Transactional
    public int insertContract(ContractDto contractDto) {
    	contractDto.setStatus("APPLIED");
        try {
            ContractEntity entity = contractDto.toEntity();
            return contractRepository.save(entity) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("계약 등록 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * 사용자 계약 수정 요청
     */
    @Override
    @Transactional
    public int requestAmendment(String originalNo, ContractDto amendmentDto) {
        if (contractRepository.existsByParentContractNoAndStatus(originalNo, "AMENDMENT_REQUESTED")) {
            return -1;
        }

        ContractEntity entity = amendmentDto.toEntity();
        entity.setParentContractNo(originalNo);
        entity.setStatus("AMENDMENT_REQUESTED");
        entity.setContractNo(null);
        
        contractRepository.save(entity);

        return 1;
    }

    /**
     * 임대인의 승인/거절
     */
    @Override
    @Transactional
    public int decideAmendment(String amendmentNo, boolean approved, String reason) {
        ContractEntity amendment = contractRepository.findById(amendmentNo)
                .orElseThrow(() -> new RuntimeException("데이터를 찾을 수 없습니다."));

        ContractEntity original = contractRepository.findById(amendment.getParentContractNo())
                .orElseThrow(() -> new RuntimeException("연결된 원본 계약서를 찾을 수 없습니다."));

        if (approved) {
            original.updateFromAmendment(amendment);
            original.setStatus("APPROVED");
            amendment.setStatus("APPROVED");
        } else {
            amendment.setStatus("REJECTED");
            amendment.setRejectionReason(reason);
        }
        
        return 1;
    }

    /**
     * Entity 리스트를 DTO 리스트로 변환
     */
    private List<ContractDto> toList(List<ContractEntity> list) {
        List<ContractDto> dtos = new ArrayList<>();
        if (list != null) {
            for (ContractEntity entity : list) {
                dtos.add(ContractDto.fromEntity(entity));
            }
        }
        return dtos;
    }
}