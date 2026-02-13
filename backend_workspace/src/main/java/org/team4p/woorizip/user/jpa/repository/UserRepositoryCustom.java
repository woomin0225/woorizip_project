package org.team4p.woorizip.user.jpa.repository;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.user.model.dto.UserDto;

import java.util.List;

public interface UserRepositoryCustom {
    // 단건 조회
    UserEntity findByEmailId(String email_id);

    // [수정] 통합 검색 결과 개수 조회
    long countSearchList(UserDto userdto);

    // [수정] 통합 검색 결과 목록 조회
    List<UserEntity> findBySearchList(UserDto userdto, Pageable pageable);
}