package org.team4p.woorizip.auth.config;

import org.team4p.woorizip.auth.security.authorization.EndpointPolicy;
import org.team4p.woorizip.auth.security.filter.JwtAuthenticationFilter;
import org.team4p.woorizip.auth.security.filter.JwtExceptionFilter;
import org.team4p.woorizip.auth.security.handler.CustomLogoutSuccessHandler;
import org.team4p.woorizip.auth.security.handler.RestAccessDeniedHandler;
import org.team4p.woorizip.auth.security.handler.RestAuthenticationEntryPoint;
import org.team4p.woorizip.auth.token.jwt.JwtProperties;
import org.team4p.woorizip.auth.token.jwt.JwtTokenProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }


    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService); 
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

	
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtTokenProvider jwt) throws Exception {

        http.csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            .authorizeHttpRequests(auth -> auth
                // React static + SPA entry (절대 "/**" permitAll 금지)
                .requestMatchers(HttpMethod.GET,
                        "/", "/index.html",
                        "/favicon.ico", "/manifest.json", "/robots.txt",
                        "/assets/**", "/static/**",
                        "/*.js", "/*.css", "/*.map",
                        "/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg", "/*.webp", "/*.ico"
                ).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // auth endpoints
                .requestMatchers("/auth/**").permitAll()

                // PUBLIC GET
                .requestMatchers(HttpMethod.GET, EndpointPolicy.PUBLIC_GET).permitAll()

                // signup/check-id
                .requestMatchers(HttpMethod.POST, EndpointPolicy.PUBLIC_POST).permitAll()

                // notices write: ADMIN only
                .requestMatchers(HttpMethod.POST, EndpointPolicy.NOTICE_ADMIN).hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.NOTICE_ADMIN).hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.NOTICE_ADMIN).hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.NOTICE_ADMIN).hasRole("ADMIN")

                // boards write: USER or ADMIN
                .requestMatchers(HttpMethod.POST, EndpointPolicy.BOARD_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.BOARD_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.BOARD_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.BOARD_WRITE).hasAnyRole("USER","ADMIN")

                // replies write: USER or ADMIN
                .requestMatchers(HttpMethod.POST, EndpointPolicy.REPLY_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.REPLY_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.REPLY_WRITE).hasAnyRole("USER","ADMIN")

                // members me: USER or ADMIN
                .requestMatchers(HttpMethod.GET, EndpointPolicy.MEMBER_ME).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.MEMBER_ME).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.MEMBER_ME).hasAnyRole("USER","ADMIN")

                // members list/search: ADMIN only
                .requestMatchers(HttpMethod.GET, EndpointPolicy.MEMBER_ADMIN_LIST).hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, EndpointPolicy.MEMBER_ADMIN_PATCH).hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.MEMBER_ADMIN_PATCH).hasRole("ADMIN")

                .anyRequest().authenticated()
            )            
            
            // 401/403 JSON 처리
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new RestAuthenticationEntryPoint())
                .accessDeniedHandler(new RestAccessDeniedHandler())
            )

            // 필터 순서: ExceptionFilter → AuthenticationFilter → UsernamePasswordAuthenticationFilter
            .addFilterBefore(new JwtExceptionFilter(), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new JwtAuthenticationFilter(jwt), UsernamePasswordAuthenticationFilter.class)

            // /auth/logout은 컨트롤러 방식으로 처리해도 되고,
            //    Spring Security logout으로 처리해도 됨 (둘 중 하나만 선택!)
            .logout(logout -> logout
                .logoutUrl("/auth/logout")
                .logoutSuccessHandler(new CustomLogoutSuccessHandler())       
            );
        return http.build();
    }
}
