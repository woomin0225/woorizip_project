package org.team4p.woorizip.auth.security.filter;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.team4p.woorizip.auth.exception.AuthException;
import org.team4p.woorizip.auth.exception.TokenExpiredException;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.auth.token.jwt.JwtClaims;
import org.team4p.woorizip.auth.token.jwt.JwtTokenProvider;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;

    public JwtAuthenticationFilter(JwtTokenProvider jwt) {
        this.jwt = jwt;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        // 정적/공개 리소스는 JWT 검사 제외
        if (uri.startsWith("/upload/") || uri.startsWith("/contract-docs/")) return true;

        if (HttpMethod.OPTIONS.matches(method)) return true;

        if (HttpMethod.GET.matches(method)) {
            if (uri.equals("/") || uri.equals("/index.html")) return true;
            if (uri.startsWith("/assets/") || uri.startsWith("/static/")) return true;
            if (uri.equals("/favicon.ico") || uri.equals("/manifest.json") || uri.equals("/robots.txt")) return true;
            if (uri.matches(".*\\.(js|css|map|png|jpg|jpeg|gif|svg|webp|ico)$")) return true;
        }

        if (uri.startsWith("/auth/")) return true;
        if (HttpMethod.GET.matches(method) && (
                uri.startsWith("/api/notice") || 
                uri.startsWith("/api/information") || 
                uri.startsWith("/api/event") || 
                uri.startsWith("/api/qna") ||
                uri.startsWith("/api/boards")
        )) {
            return true;
        }

        if (HttpMethod.POST.matches(method) && (
                uri.equals("/api/user/signup") || 
                uri.equals("/api/user/check-id") ||
                uri.equals("/api/user/find-id") ||
                uri.equals("/api/user/password/send-code") ||
                uri.equals("/api/user/password/verify-code") ||
                uri.equals("/api/user/find-password") ||
                uri.equals("/api/rooms/rag/room") ||
                uri.equals("/api/rooms/rag/room/explanation")
        )) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
    	
    	String uri = request.getRequestURI();

    	if (uri.startsWith("/upload/") || uri.startsWith("/contract-docs/")) {
    	    chain.doFilter(request, response);
    	    return;
    	}

        String auth = request.getHeader("Authorization");
        if (auth == null || auth.isBlank() || !auth.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring("Bearer ".length()).trim();

        if (!jwt.validate(token)) {
            throw AuthException.unauthorized("INVALID_TOKEN", "유효하지 않은 토큰입니다.");
        }
        if (jwt.isExpired(token)) {
            throw new TokenExpiredException("TOKEN_EXPIRED", "AccessToken이 만료되었습니다.");
        }

        if (!JwtClaims.ACCESS.equals(jwt.getType(token))) {
            throw AuthException.unauthorized("TOKEN_TYPE_INVALID", "AccessToken이 아닙니다.");
        }

        String userId = jwt.getEmailId(token);
        String role = jwt.getRole(token);
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }
        String userNo = jwt.getUserNo(token);
        String name = jwt.getName(token);
        CustomUserPrincipal principal = new CustomUserPrincipal(
                userNo,
                userId,
                name,
                "",        // password (이미 인증되었으므로 빈 값)
                true,
                List.of(new SimpleGrantedAuthority(role))
        );

        var authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        // 인가 단계에서 사용할 인증 주체 등록
        SecurityContextHolder.getContext().setAuthentication(authentication);

        chain.doFilter(request, response);
    }
}
