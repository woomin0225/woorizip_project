package org.team4p.woorizip.auth.token.refresh.repository;

import org.team4p.woorizip.auth.token.refresh.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    Optional<RefreshTokenEntity> findByUserId(String userId);
    Optional<RefreshTokenEntity> findByUserIdAndTokenValue(String userId, String tokenValue);
    void deleteByUserId(String userId);
}
