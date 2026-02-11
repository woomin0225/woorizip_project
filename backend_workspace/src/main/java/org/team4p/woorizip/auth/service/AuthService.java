package org.team4p.woorizip.auth.service;

import lombok.RequiredArgsConstructor;
import org.team4p.woorizip.auth.dto.request.LoginRequest;
import org.team4p.woorizip.auth.dto.response.TokenResponse;
import org.team4p.woorizip.auth.token.jwt.JwtProperties;
import org.team4p.woorizip.auth.token.jwt.JwtTokenProvider;
import org.team4p.woorizip.auth.token.refresh.service.RefreshTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;

    public TokenResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.userId(), req.userPwd())
        );

        String userId = auth.getName();
        String role = auth.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("ROLE_USER");

        String access = jwtTokenProvider.createAccessToken(userId, role);
        String refresh = jwtTokenProvider.createRefreshToken(userId, role);

        LocalDateTime now = LocalDateTime.now();
        refreshTokenService.upsert(userId, refresh, now, now.plusDays(1)); // refresh 1일

        return new TokenResponse(access, refresh, jwtProperties.accessExp(), jwtProperties.refreshExp());
    }

    public TokenResponse refresh(String refreshToken, boolean extendLogin) {
        if (!jwtTokenProvider.validate(refreshToken) || jwtTokenProvider.isExpired(refreshToken)) {
            throw new RuntimeException("refresh expired");
        }

        String userId = jwtTokenProvider.getUserId(refreshToken);
        String role = jwtTokenProvider.getRole(refreshToken);

        if (!refreshTokenService.matches(userId, refreshToken)) {
            throw new RuntimeException("refresh not matched");
        }

        String newAccess = jwtTokenProvider.createAccessToken(userId, role);

        String newRefresh = null;
        if (extendLogin) {
            newRefresh = jwtTokenProvider.createRefreshToken(userId, role);
            LocalDateTime now = LocalDateTime.now();
            refreshTokenService.upsert(userId, newRefresh, now, now.plusDays(1));
        }

        return new TokenResponse(newAccess, newRefresh, jwtProperties.accessExp(), jwtProperties.refreshExp());
    }

    public void logout(String accessToken) {
        if (accessToken == null || !accessToken.startsWith("Bearer ")) return;

        String token = accessToken.substring("Bearer ".length()).trim();
        if (!jwtTokenProvider.validate(token)) return;

        String userId = jwtTokenProvider.getUserId(token);
        refreshTokenService.deleteByUserId(userId);
    }
}
