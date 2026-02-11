package org.team4p.woorizip.auth.controller;

import lombok.RequiredArgsConstructor;
import org.team4p.woorizip.auth.dto.request.LoginRequest;
import org.team4p.woorizip.auth.dto.request.RefreshRequest;
import org.team4p.woorizip.auth.dto.response.TokenResponse;
import org.team4p.woorizip.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @RequestHeader("RefreshToken") String refreshToken,
            @RequestBody(required = false) RefreshRequest req
    ) {
        boolean extend = (req != null && req.extendLogin());
        return ResponseEntity.ok(authService.refresh(stripBearer(refreshToken), extend));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String accessToken) {
        authService.logout(accessToken);
        return ResponseEntity.ok().body(java.util.Map.of("message", "logout ok"));

    }

    private String stripBearer(String header) {
        if (header == null) return null;
        return header.startsWith("Bearer ") ? header.substring("Bearer ".length()).trim() : header.trim();
    }
}
