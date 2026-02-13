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
        var user = Optional.ofNullable(userRepository.findByEmailId(emailId))
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + emailId));

        // Principal 생성 시 userNo(UUID)를 함께 넘겨줍니다.
        return new CustomUserPrincipal(
                user.getUserNo(), // 추가된 부분!
                user.getEmailId(),
                user.getPassword(),
                "N".equals(user.getDeletedYn()),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}