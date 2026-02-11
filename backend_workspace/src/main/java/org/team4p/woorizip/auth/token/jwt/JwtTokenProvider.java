package org.team4p.woorizip.auth.token.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties props) {
        this.props = props;        
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(String userId, String role) {
        return createToken(userId, role, JwtClaims.ACCESS, props.accessExp());
    }

    public String createRefreshToken(String userId, String role) {
        return createToken(userId, role, JwtClaims.REFRESH, props.refreshExp());
    }

    private String createToken(String userId, String role, String type, long expMs) {
        long now = System.currentTimeMillis();
        
        return Jwts.builder()
                .subject(userId)
                .claim(JwtClaims.ROLE, role)
                .claim(JwtClaims.TYPE, type)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expMs))
                .signWith(key)
                .compact();
    }

    
    public Jws<Claims> parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
    }

    public boolean validate(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isExpired(String token) {
        try {
            return parse(token).getPayload().getExpiration().before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    public String getUserId(String token) {
        return parse(token).getPayload().getSubject();
    }

    public String getRole(String token) {
        return parse(token).getPayload().get(JwtClaims.ROLE, String.class);
    }

    public String getType(String token) {
        return parse(token).getPayload().get(JwtClaims.TYPE, String.class);
    }
}
