package org.team4p.woorizip.auth.security.service;

import lombok.RequiredArgsConstructor;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.user.jpa.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String emailId) throws UsernameNotFoundException {

        // findByEmailId의 반환 타입이 Optional이 아닐 경우를 대비해 Optional.ofNullable로 감쌈.
        var user = Optional.ofNullable(userRepository.findByEmailId(emailId))
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + emailId));

        String password = user.getPassword(); 

        boolean enabled = "N".equals(user.getDeletedYn());

        // UserEntity의 권한 필드명은 'role'이며 기본값은 'USER' 또는 'ADMIN'.
        // Security 관례에 따라 "ROLE_" 접두사를 붙여줌.
        String roleName = user.getRole(); // USER 또는 ADMIN
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        return new CustomUserPrincipal(
                user.getEmailId(), // Principal의 username으로 emailId 사용
                password,
                enabled,
                List.of(new SimpleGrantedAuthority(roleName))
        );
    }
}