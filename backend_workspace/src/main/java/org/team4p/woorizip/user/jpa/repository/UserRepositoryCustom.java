package org.team4p.woorizip.user.jpa.repository;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.domain.Pageable;
import java.util.Date;
import java.util.List;

public interface UserRepositoryCustom {
    UserEntity findByEmailId(String emailId); // userId 대신 emailId 사용

    int updateDeletedYn(String userNo, int deletedYn); // 탈퇴 처리 (loginOk 대신 deletedYn)

    // 관리자용 검색 관련 (기술서 컬럼 기준)
    long countSearchEmailId(String keyword);
    long countSearchName(String keyword);
    long countSearchType(String type); // USER 또는 LESSOR
    long countSearchCreatedAt(Date begin, Date end);

    List<UserEntity> findBySearchEmailId(String keyword, Pageable pageable);
    List<UserEntity> findBySearchName(String keyword, Pageable pageable);
    List<UserEntity> findBySearchType(String type, Pageable pageable);
    List<UserEntity> findBySearchCreatedAt(Date begin, Date end, Pageable pageable);
}