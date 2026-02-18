package org.team4p.woorizip.user.jpa.repository;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository
        extends JpaRepository<UserEntity, String>, UserRepositoryCustom {
}
