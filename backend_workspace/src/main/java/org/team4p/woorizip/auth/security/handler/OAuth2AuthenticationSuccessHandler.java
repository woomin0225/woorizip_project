package org.team4p.woorizip.auth.security.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.team4p.woorizip.auth.token.jwt.JwtTokenProvider;
import org.team4p.woorizip.user.model.dto.UserDto;
import org.team4p.woorizip.user.model.service.UserService;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserService userService; 
    @Value("${app.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        String emailId = "";
        
        if (attributes.containsKey("kakao_account")) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            
            if (kakaoAccount != null && kakaoAccount.containsKey("email") && kakaoAccount.get("email") != null) {
                emailId = (String) kakaoAccount.get("email");
            } else {
                Object kakaoId = attributes.get("id");
                emailId = "kakao_" + kakaoId + "@social.user";
            }
            
        } else {
            emailId = (String) attributes.get("email");
        }

        log.info("핸들러: DB에서 회원 조회 시작. emailId = {}", emailId);

        UserDto param = UserDto.builder().emailId(emailId).build();
        UserDto user = userService.selectUser(param);

        if (user == null) {
            log.error("OAuth2 유저 정보를 DB에서 찾을 수 없습니다: {}", emailId);
            getRedirectStrategy().sendRedirect(request, response, frontendBaseUrl + "/login?error=notfound");
            return;
        }

        log.info("OAuth2 로그인 최종 완료 JWT 토큰을 발급합니다.");

        String accessToken = tokenProvider.createAccessToken(user.getUserNo(), user.getEmailId(), user.getRole(), user.getName());

        String targetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl + "/oauth2/redirect")
                .queryParam("token", accessToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
