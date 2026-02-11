package org.team4p.woorizip.user.jpa.repository;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository 
        extends JpaRepository<UserEntity, String>, UserRepositoryCustom {
    // JpaRepository의 기본 메서드와 UserRepositoryCustom의 확장 메서드를 모두 사용 가능합니다.
}