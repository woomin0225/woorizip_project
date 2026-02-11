package org.team4p.woorizip.common.api;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

/*
 * @RestControllerAdvice 는
 * Spring이 관리하는 모든 @RestController에서 발생한 예외를 중앙에서 자동으로 가로채 처리하는 전역 예외 처리기입니다 
 * 
 * 작동 흐름 : 
	[ React 요청 ]
	      ↓
	[ RestController 메소드 ]
	      ↓
	   예외 발생!
	      ↓
	[ DispatcherServlet ]
	      ↓
	[ GlobalExceptionHandler 검색 ]
	      ↓
	[ @ExceptionHandler 매칭 ]
	      ↓
	[ JSON 응답 반환 ]

 * 적용 대상 : 
 *  @RestController
 *  @Controller + @ResponseBody
 *  @RequestMapping 기반 REST API
 */

//React에서 에러 메시지 일관되게 처리하기 위해 전역 예외처리 별도 작성
@RestControllerAdvice  // Spring이 관리하는 모든 @RestController에서 발생한 예외를 중앙에서 자동으로 가로채 처리하는 전역 예외 처리기임
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ApiResponse.fail("Validation 실패", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleAny(Exception e) {
        return ResponseEntity.status(500).body(ApiResponse.fail("서버 오류", e.getMessage()));
    }
}
