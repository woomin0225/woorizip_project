package org.team4p.woorizip.auth.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.team4p.woorizip.auth.dto.response.ErrorResponse;
import org.team4p.woorizip.auth.exception.AuthException;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtExceptionFilter extends OncePerRequestFilter {

    private final ObjectMapper om = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (AuthException e) {
            response.setStatus(e.getStatus().value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            om.writeValue(response.getWriter(),
                    ErrorResponse.of(e.getCode(), e.getMessage(), request.getRequestURI())
            );
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            om.writeValue(response.getWriter(),
                    ErrorResponse.of("AUTH_ERROR", "인증 처리 중 오류가 발생했습니다.", request.getRequestURI())
            );
        }
    }
}
