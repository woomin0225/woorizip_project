package org.team4p.woorizip.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.user.model.dto.UserDto;
import org.team4p.woorizip.user.model.service.UserService;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = "";
        String name = "";

        if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
        } else if ("kakao".equals(registrationId)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            
            if (kakaoAccount != null && kakaoAccount.containsKey("email") && kakaoAccount.get("email") != null) {
                email = (String) kakaoAccount.get("email");
            }
            
            if (email == null || email.trim().isEmpty()) {
                Object kakaoId = attributes.get("id"); 
                email = "kakao_" + kakaoId + "@social.user";
            }
            
            name = (String) profile.get("nickname");
        }

        log.info("소셜 로그인 시도: Email={}, Name={}, Provider={}", email, name, registrationId);

        UserDto existingUser = userService.selectUser(UserDto.builder().emailId(email).build());

        if (existingUser == null || "Y".equalsIgnoreCase(existingUser.getDeletedYn())) {
            UserDto newUser = UserDto.builder()
                    .emailId(email)
                    .name(name)
                    .password(UUID.randomUUID().toString()) 
                    .phone("010-0000-0000")
                    .gender("M") 
                    .birthDate(new java.util.Date()) 
                    .type("USER")
                    .role("USER")
                    .build();
            userService.insertUser(newUser);
            if (existingUser == null) {
                log.info("소셜 회원 자동 가입 완료!");
            } else {
                log.info("소셜 탈퇴 계정 복구 완료: {}", email);
            }
        }

        // 주의: nameAttributeKey를 "email"이나 "id"로 할 때 속성이 실제로 존재하는지 확인해야 함.
        // 강제로 email을 만들었으므로 attributes에 없으면 에러가 날 수 있음.
        // DefaultOAuth2User 반환 부분도 수정
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "google".equals(registrationId) ? "sub" : "id"
        );
    }
}
