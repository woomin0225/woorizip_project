package org.team4p.woorizip.auth.config;

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
import org.team4p.woorizip.auth.security.authorization.EndpointPolicy;
import org.team4p.woorizip.auth.security.filter.JwtAuthenticationFilter;
import org.team4p.woorizip.auth.security.filter.JwtExceptionFilter;
import org.team4p.woorizip.auth.security.handler.CustomLogoutSuccessHandler;
import org.team4p.woorizip.auth.security.handler.OAuth2AuthenticationSuccessHandler;
import org.team4p.woorizip.auth.security.handler.RestAccessDeniedHandler;
import org.team4p.woorizip.auth.security.handler.RestAuthenticationEntryPoint;
import org.team4p.woorizip.auth.service.CustomOAuth2UserService;
import org.team4p.woorizip.auth.token.jwt.JwtProperties;
import org.team4p.woorizip.auth.token.jwt.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {

	 private final CustomOAuth2UserService customOAuth2UserService;
	 private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
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

    	http.cors(org.springframework.security.config.Customizer.withDefaults());
    	
        http.csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.disable())
            )

            .oauth2Login(oauth2 -> oauth2
                    .authorizationEndpoint(endpoint -> endpoint.baseUri("/oauth2/authorization"))
                    .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                    .successHandler(oAuth2AuthenticationSuccessHandler)
                )
            
            .authorizeHttpRequests(auth -> auth
                // React static + SPA entry (절대 "/**" permitAll 금지)
                .requestMatchers(HttpMethod.GET,
                        "/", "/index.html",
                        "/favicon.ico", "/manifest.json", "/robots.txt",
                        "/assets/**", "/static/**",
                        "/*.js", "/*.css", "/*.map",
                        "/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg", "/*.webp", "/*.ico"
                ).permitAll()
                .requestMatchers("/upload/**").permitAll()
                .requestMatchers("/contract-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // auth endpoints
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/user/find-id",
                    "/api/user/password/send-code",
                    "/api/user/password/verify-code",
                    "/api/user/find-password"
                ).permitAll()

                .requestMatchers(HttpMethod.POST, EndpointPolicy.PUBLIC_POST).permitAll()
                
                // house, room
                .requestMatchers(HttpMethod.GET, EndpointPolicy.ESTATE_LESSOR_GET).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.POST, EndpointPolicy.ESTATE_LESSOR).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.ESTATE_LESSOR).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.ESTATE_LESSOR).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.ESTATE_LESSOR).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.POST, EndpointPolicy.ESTATE_USER).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.ESTATE_USER).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.ESTATE_USER).hasAnyRole("USER", "ADMIN")
                
                // facility, reservation
                .requestMatchers(HttpMethod.POST, EndpointPolicy.FACILITY_ADMIN_ONLY).hasAnyRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.FACILITY_ADMIN_ONLY).hasAnyRole("ADMIN")
                .requestMatchers(HttpMethod.POST, EndpointPolicy.FACILITY_LOGIN).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.FACILITY_LOGIN).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.GET, EndpointPolicy.FACILITY_LOGIN_GET).hasAnyRole("USER", "ADMIN")

                .requestMatchers(HttpMethod.GET, EndpointPolicy.ADMIN_EVENT_GET).hasRole("ADMIN")
                
                // PUBLIC GET
                .requestMatchers(HttpMethod.GET, EndpointPolicy.PUBLIC_GET).permitAll()
                
                .requestMatchers(HttpMethod.PATCH, "/api/notice/*/view").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/api/information/*/view").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/api/event/*/view").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/api/qna/*/view").permitAll()
                
				// qna write: USER or ADMIN
				.requestMatchers(HttpMethod.POST, EndpointPolicy.QNA_WRITE).hasAnyRole("USER", "ADMIN")
				.requestMatchers(HttpMethod.PUT, EndpointPolicy.QNA_WRITE).hasAnyRole("USER", "ADMIN")
				.requestMatchers(HttpMethod.DELETE, EndpointPolicy.QNA_WRITE).hasAnyRole("USER", "ADMIN")
				.requestMatchers(HttpMethod.PATCH, EndpointPolicy.QNA_WRITE).hasAnyRole("USER", "ADMIN")

                // admin write: notice, information, event only
                .requestMatchers(HttpMethod.POST, EndpointPolicy.ADMIN_WRITE).hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.ADMIN_WRITE).hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.ADMIN_WRITE).hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, EndpointPolicy.ADMIN_WRITE).hasRole("ADMIN")

                // replies write: USER or ADMIN
                .requestMatchers(HttpMethod.POST, EndpointPolicy.REPLY_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.REPLY_WRITE).hasAnyRole("USER","ADMIN")
                .requestMatchers(HttpMethod.DELETE, EndpointPolicy.REPLY_WRITE).hasAnyRole("USER","ADMIN")

                // user list/search: ADMIN only
                .requestMatchers(HttpMethod.GET, EndpointPolicy.USER_ADMIN_LIST).hasRole("ADMIN")
                
                // user 조회, 수정
                .requestMatchers(HttpMethod.GET, EndpointPolicy.USER_ME).hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, EndpointPolicy.USER_ME).hasAnyRole("USER", "ADMIN")
                
                // 서비스 주요 기능 (위시리스트, 계약, 투어)
                .requestMatchers(EndpointPolicy.WISHLIST_USER).hasAnyRole("USER", "ADMIN")
                .requestMatchers(EndpointPolicy.CONTRACT_USER).hasAnyRole("USER", "ADMIN")
                .requestMatchers(EndpointPolicy.TOUR_USER).hasAnyRole("USER", "ADMIN")

                .requestMatchers(EndpointPolicy.RESERVATION_ALL).hasAnyRole("USER", "ADMIN")

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
