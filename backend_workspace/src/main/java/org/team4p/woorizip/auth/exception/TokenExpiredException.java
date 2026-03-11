package org.team4p.woorizip.auth.exception;

import org.springframework.http.HttpStatus;

@SuppressWarnings("serial")
public class TokenExpiredException extends AuthException {

    public TokenExpiredException(String code, String message) {
        super(HttpStatus.UNAUTHORIZED, code, message);
    }

    public static TokenExpiredException accessExpired() {
        return new TokenExpiredException("TOKEN_EXPIRED", "AccessToken이 만료되었습니다.");
    }

    public static TokenExpiredException refreshExpired() {
        return new TokenExpiredException("REFRESH_EXPIRED", "RefreshToken이 만료되었습니다.");
    }
}
