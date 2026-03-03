package org.team4p.woorizip.contract.jpa.repository;

import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ContractRepositoryCustom {
	
    
    /**
     * 특정 계약 번호로 단건 조회
     */
    ContractEntity findByContractNo(String contractNo);

    /**
     * 특정 사용자의 모든 계약 목록 조회
     */
    List<ContractEntity> findByUserNo(String userNo);

    /**
     * 임대인(방 소유자) 기준 계약 목록 조회
     */
    Page<ContractEntity> findByRoomOwnerNoOrderByMoveInDateDesc(String ownerUserNo, Pageable pageable);

    /**
     * 특정 방의 계약 존재 여부 확인 (중복 입주 신청 방지용)
     */
    long countByRoomNo(String roomNo);
}
