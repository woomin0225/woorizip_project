package org.team4p.woorizip.user.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.user.model.dto.UserDto;
import org.team4p.woorizip.user.model.dto.request.PasswordResetCodeSendRequest;
import org.team4p.woorizip.user.model.dto.request.PasswordResetCodeVerifyRequest;
import org.team4p.woorizip.user.model.dto.request.PasswordResetRequest;
import org.team4p.woorizip.user.model.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 아이디 중복 체크
     * POST /user/check-email
     */
    @PostMapping("/check-id")
    public ResponseEntity<ApiResponse<String>> checkEmail(@RequestParam("email_id") String emailId) {
        int result = userService.selectCheckEmailId(emailId);
        return ResponseEntity.ok(ApiResponse.ok("아이디 중복 체크 결과", (result == 0) ? "ok" : "dup"));
    }
    
    /**
     * 아이디 찾기
     * POST /api/user/find-id
     */
    @PostMapping("/find-id")
    public ResponseEntity<ApiResponse<String>> findId(@RequestBody UserDto userDto) {
        String emailId = userService.selectFindId(userDto);
        if (emailId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(ApiResponse.fail("일치하는 회원 정보가 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("아이디 찾기 성공", emailId));
    }

    /**
     * 비밀번호 재설정 인증번호 발송
     * POST /api/user/password/send-code
     */
    @PostMapping("/password/send-code")
    public ResponseEntity<ApiResponse<Void>> sendPasswordResetCode(
            @RequestBody @Valid PasswordResetCodeSendRequest request
    ) {
        userService.sendPasswordResetCode(request.getName(), request.getPhone());
        return ResponseEntity.ok(ApiResponse.ok("인증번호가 발송되었습니다.", null));
    }

    /**
     * 비밀번호 재설정 인증번호 검증
     * POST /api/user/password/verify-code
     */
    @PostMapping("/password/verify-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyPasswordResetCode(
            @RequestBody @Valid PasswordResetCodeVerifyRequest request
    ) {
        String verificationToken = userService.verifyPasswordResetCode(
                request.getName(),
                request.getPhone(),
                request.getCode()
        );

        return ResponseEntity.ok(
                ApiResponse.ok("휴대폰 본인인증이 완료되었습니다.", Map.of("verificationToken", verificationToken))
        );
    }

    /**
     * 비밀번호 재설정
     * POST /api/user/find-password
     */
    @PostMapping("/find-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody @Valid PasswordResetRequest request
    ) {
        userService.resetPasswordByPhoneVerification(
                request.getName(),
                request.getPhone(),
                request.getVerificationToken(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(ApiResponse.ok("비밀번호가 변경되었습니다.", null));
    }

    /**
     * 회원 정보 조회
     * GET /user/{email_id}
     */
    @GetMapping("/{email_id}")
    public ResponseEntity<ApiResponse<UserDto>> selectUser(@PathVariable("email_id") String emailId) {
        UserDto params = UserDto.builder().emailId(emailId).build();
        
        UserDto user = userService.selectUser(params);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(ApiResponse.fail("회원을 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("회원 정보 조회 성공", user));
    }

    /**
     * 회원 정보 조회(회원번호)
     * GET /api/user/no/{user_no}
     */
    @GetMapping("/no/{user_no}")
    public ResponseEntity<ApiResponse<UserDto>> selectUserByUserNo(@PathVariable("user_no") String userNo) {
        UserDto user = userService.selectUserByUserNo(userNo);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body(ApiResponse.fail("회원을 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("회원 정보 조회 성공", user));
    }

    /**
     * 회원 가입
     * POST /user/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> insertUser(@RequestBody @Valid UserDto userDto) {
        int result = userService.insertUser(userDto);
        return result > 0 ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("회원 가입 성공", null))
                          : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 회원 정보 수정
     * PUT /user/{email}
     */
    @PutMapping("/{email}")
    public ResponseEntity<ApiResponse<Void>> updateUser(
            @PathVariable("email") String email,
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody UserDto userDto) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body(ApiResponse.fail("인증 정보가 없습니다.", null));
        }

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));
        if (!isAdmin && !email.equals(principal.getEmailId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                 .body(ApiResponse.fail("본인 정보만 수정할 수 있습니다.", null));
        }

        userDto.setEmailId(email);
        int result = userService.updateUser(userDto);
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("회원 정보 수정 성공", null))
                          : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    /**
     * 회원 탈퇴 (soft delete)
     * PATCH /user/{email}/withdraw
     */
    @PatchMapping("/{email}/withdraw")
    public ResponseEntity<ApiResponse<Void>> withdrawUser(
            @PathVariable("email") String email,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body(ApiResponse.fail("인증 정보가 없습니다.", null));
        }

        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));
        if (!isAdmin && !email.equals(principal.getEmailId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                 .body(ApiResponse.fail("본인 계정만 탈퇴할 수 있습니다.", null));
        }

        int result = userService.withdrawUser(email);
        if (result > 0) {
            return ResponseEntity.ok(ApiResponse.ok("회원 탈퇴 처리 성공", null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                             .body(ApiResponse.fail("회원을 찾을 수 없습니다.", null));
    }

    /**
     * 내 회원 탈퇴 (soft delete)
     * PATCH /user/withdraw
     */
    @PatchMapping("/withdraw")
    public ResponseEntity<ApiResponse<Void>> withdrawMe(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body(ApiResponse.fail("인증 정보가 없습니다.", null));
        }

        int result = userService.withdrawUser(principal.getEmailId());
        if (result > 0) {
            return ResponseEntity.ok(ApiResponse.ok("회원 탈퇴 처리 성공", null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                             .body(ApiResponse.fail("회원을 찾을 수 없습니다.", null));
    }

    /**
     * 회원 목록 조회
     * GET /user/list?page=1&size=10&sort=createdAt&direct=DESC
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<UserDto>>> selectListUser(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "createdAt") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        Sort.Direction direction = Sort.Direction.fromString(direct);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(direction, sort));
        
        List<UserDto> list = userService.selectList(pageable);
        return ResponseEntity.ok(ApiResponse.ok("회원 목록 조회 성공", list));
    }

    /**
     * 회원 검색
     * GET /user/search
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDto>>> selectSearchUser(
            @ModelAttribute UserDto userDto,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<UserDto> list = userService.selectSearchList(userDto, pageable);
        return ResponseEntity.ok(ApiResponse.ok("회원 검색 결과 조회 성공", list));
    }
}
