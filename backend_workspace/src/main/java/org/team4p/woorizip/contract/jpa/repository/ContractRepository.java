package org.team4p.woorizip.contract.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;

public interface ContractRepository 
        extends JpaRepository<ContractEntity, String>, ContractRepositoryCustom {
    // JpaRepository의 기본 CRUD와 Custom 인터페이스의 QueryDSL 기능을 모두 상속받음
}