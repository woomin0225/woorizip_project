package org.team4p.woorizip.user.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.user.model.dto.UserDto;
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
    @PostMapping("/check-email")
    public ResponseEntity<ApiResponse<String>> checkEmail(@RequestParam("email_id") String emailId) {
        int result = userService.selectCheckEmailId(emailId);
        return ResponseEntity.ok(ApiResponse.ok("아이디 중복 체크 결과", (result == 0) ? "ok" : "dup"));
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
            @RequestBody UserDto userDto) {
        userDto.setEmailId(email);
        int result = userService.updateUser(userDto);
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("회원 정보 수정 성공", null))
                          : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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