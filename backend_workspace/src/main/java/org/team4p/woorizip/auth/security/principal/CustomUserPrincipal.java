package org.team4p.woorizip.auth.security.principal;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

@SuppressWarnings("serial")
@Getter
public class CustomUserPrincipal implements UserDetails {

	private final String userNo;
    private final String emailId;
    private final String password;
    private final boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserPrincipal(String userNo,
    						   String emailId,
                               String password,
                               boolean enabled,
                               Collection<? extends GrantedAuthority> authorities) {
    	this.userNo = userNo;
        this.emailId = emailId;
        this.password = password;
        this.enabled = enabled;
        this.authorities = authorities;
    }

    @Override 
    public Collection<? extends GrantedAuthority> getAuthorities() { 
        return authorities; 
    }

    @Override 
    public String getPassword() { 
        return password; 
    }

    /**
     * 시큐리티가 사용자의 고유 식별자(아이디)를 가져올 때 사용.
     * emailId를 반환.
     */
    @Override 
    public String getUsername() { 
        return emailId; 
    }

    // 아래 계정 상태 관련 메서드들은 우선 true로 설정하여 로그인을 허용.
    // 만약 나중에 '계정 잠금'이나 '비밀번호 만료' 기능을 넣으려면 이 부분을 수정해야 함.

    @Override 
    public boolean isAccountNonExpired() { 
        return true; 
    }

    @Override 
    public boolean isAccountNonLocked() { 
        return true; 
    }

    @Override 
    public boolean isCredentialsNonExpired() { 
        return true; 
    }

    @Override 
    public boolean isEnabled() { 
        return enabled; 
    }
}