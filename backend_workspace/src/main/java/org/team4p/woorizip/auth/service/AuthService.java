package org.team4p.woorizip.auth.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.auth.dto.request.LoginRequest;
import org.team4p.woorizip.auth.dto.response.TokenResponse;
import org.team4p.woorizip.auth.exception.AuthException;
import org.team4p.woorizip.auth.token.jwt.JwtProperties;
import org.team4p.woorizip.auth.token.jwt.JwtTokenProvider;
import org.team4p.woorizip.auth.token.refresh.service.RefreshTokenService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;

    public TokenResponse login(LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.emailId(), req.password())
            );

            org.team4p.woorizip.auth.security.principal.CustomUserPrincipal principal = 
                    (org.team4p.woorizip.auth.security.principal.CustomUserPrincipal) auth.getPrincipal();

            String userNo = principal.getUserNo();
            String emailId = principal.getEmailId();
            String name = principal.getName();
            
            String role = auth.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority())
                    .orElse("ROLE_USER");

            String access = jwtTokenProvider.createAccessToken(userNo, emailId, role, name);
            String refresh = jwtTokenProvider.createRefreshToken(userNo, emailId, role, name);

            // 로그인 시 refresh 토큰 DB 상태 갱신
            LocalDateTime now = LocalDateTime.now();
            refreshTokenService.upsert(emailId, refresh, now, now.plusDays(1));

            return new TokenResponse(access, refresh, jwtProperties.accessExp(), jwtProperties.refreshExp());
        } catch (AuthenticationException e) {
            throw AuthException.unauthorized("LOGIN_FAILED", "아이디 또는 비밀번호가 일치하지 않습니다.");
        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("SYSTEM_ERROR");
        }
    }

    public TokenResponse refresh(String refreshToken, boolean extendLogin) {
        try {
            if (!jwtTokenProvider.validate(refreshToken) || jwtTokenProvider.isExpired(refreshToken)) {
                throw new RuntimeException("TOKEN_EXPIRED");
            }

            String userNo = jwtTokenProvider.getUserNo(refreshToken);
            String emailId = jwtTokenProvider.getEmailId(refreshToken);
            String role = jwtTokenProvider.getRole(refreshToken);
            String name = jwtTokenProvider.getName(refreshToken);

            if (!refreshTokenService.matches(emailId, refreshToken)) {
                throw new RuntimeException("TOKEN_NOT_MATCHED");
            }

            String newAccess = jwtTokenProvider.createAccessToken(userNo, emailId, role, name);

            String newRefresh = null;
            if (extendLogin) {
                // 로그인 연장 요청 시 refresh 토큰 재발급
                newRefresh = jwtTokenProvider.createRefreshToken(userNo, emailId, role, name);
                LocalDateTime now = LocalDateTime.now();
                refreshTokenService.upsert(emailId, newRefresh, now, now.plusDays(1));
            }

            return new TokenResponse(newAccess, newRefresh, jwtProperties.accessExp(), jwtProperties.refreshExp());
        } catch (Exception e) {
            throw new RuntimeException("REFRESH_ERROR");
        }
    }

    public void logout(String accessToken) {
        try {
            if (accessToken == null || !accessToken.startsWith("Bearer ")) return;

            String token = accessToken.substring("Bearer ".length()).trim();
            if (!jwtTokenProvider.validate(token)) return;

            String emailId = jwtTokenProvider.getEmailId(token);
            refreshTokenService.deleteByUserId(emailId);
        } catch (Exception e) {
            return;
        }
    }
}
