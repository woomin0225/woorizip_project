package org.team4p.woorizip.auth.token.refresh.service;

import lombok.RequiredArgsConstructor;
import org.team4p.woorizip.auth.token.refresh.entity.RefreshTokenEntity;
import org.team4p.woorizip.auth.token.refresh.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repo;

    @Transactional
    public RefreshTokenEntity upsert(String emailId, String tokenValue, LocalDateTime issuedAt, LocalDateTime expiresAt) {
        RefreshTokenEntity entity = repo.findByEmailId(emailId)
                .orElseGet(() -> RefreshTokenEntity.builder()
                        .id(UUID.randomUUID().toString())
                        .emailId(emailId)
                        .build());

        entity.setTokenValue(tokenValue);
        entity.setIssuedAt(issuedAt);
        entity.setExpiresAt(expiresAt);
        entity.setRevoked(false);

        return repo.save(entity);
    }

    @Transactional(readOnly = true)
    public boolean matches(String emailId, String tokenValue) {
        return repo.findByEmailIdAndTokenValue(emailId, tokenValue).isPresent();
    }

    @Transactional
    public void deleteByUserId(String userId) {
        repo.deleteByEmailId(userId);
    }
}
