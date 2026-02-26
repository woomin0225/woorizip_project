package org.team4p.woorizip.contract.jpa.repository;

import java.util.Collection;
import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;

public interface ContractRepository extends JpaRepository<ContractEntity, String>, ContractRepositoryCustom {
    // 吏꾪뻾 以묒씤(AMENDMENT_REQUESTED) ?섏젙 ?붿껌???덈뒗吏 ?뺤씤
    boolean existsByParentContractNoAndStatus(String parentContractNo, String status);
    Page<ContractEntity> findByUserNoOrderByMoveInDateDesc(String userNo, Pageable pageable);
    boolean existsByRoomNoAndMoveInDateAndStatusIn(
            String roomNo,
            Date moveInDate,
            Collection<String> statuses
    );
}
