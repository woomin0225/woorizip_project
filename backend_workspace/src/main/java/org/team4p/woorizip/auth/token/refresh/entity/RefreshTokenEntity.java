package org.team4p.woorizip.auth.token.refresh.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_refresh_tokens")
public class RefreshTokenEntity {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    @Column(name = "USERID", length = 50, nullable = false)
    private String userId;

    @Column(name = "token_value", length = 512, nullable = false, unique = true)
    private String tokenValue;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean revoked;
}
