package org.team4p.woorizip.contract.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;

public interface ContractRepository extends JpaRepository<ContractEntity, String>, ContractRepositoryCustom {
    // 진행 중인(AMENDMENT_REQUESTED) 수정 요청이 있는지 확인
    boolean existsByParentContractNoAndStatus(String parentContractNo, String status);
}