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
        // RepositoryCustom의 findByContractNo 사용
        ContractEntity entity = contractRepository.findByContractNo(contractNo);
        return entity != null ? ContractDto.fromEntity(entity) : null;
    }

    @Override
    public List<ContractDto> selectListContract(String userNo) {
        // RepositoryCustom의 findByUserNo 사용
        List<ContractEntity> list = contractRepository.findByUserNo(userNo);
        return toList(list);
    }

    @Override
    @Transactional
    public int insertContract(ContractDto contractDto) {
        try {
            // DTO를 엔티티로 변환하여 저장
            ContractEntity entity = contractDto.toEntity();
            return contractRepository.save(entity) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("계약 등록 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    @Transactional
    public int updateContract(ContractDto contractDto) {
        try {
            // save는 PK(contractNo)가 존재하면 업데이트를 수행함
            ContractEntity entity = contractDto.toEntity();
            return contractRepository.save(entity) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("계약 수정 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Entity 리스트를 DTO 리스트로 변환하는 공통 로직
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