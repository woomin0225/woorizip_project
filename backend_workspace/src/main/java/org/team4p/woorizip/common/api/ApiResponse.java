package org.team4p.woorizip.common.api;

import java.time.LocalDateTime;

/*
 * record 란? (Java 16+)
 * => 이 클래스는 데이터만 담는다. 라고 컴파일러에게 선언하는 문법임
 * 
 * => 선언한 필드는 자동 private final 이 됨
 * => 생성자, getter, equals(), hashCode(), toString() 자동 생성됨
 * => 선언된 필드는 불변임 (immutable) : 스래드에 안전
 * => REST API 응답 DTO 에 최적, 코드가 짧음
 * 
 * => 필드 변경 불가, 상속 불가, JPA Entity 로 부적합
 * => setter나 상속이 필요하면 class 로 변경해야 함, JPA Entity 는 class 로 작성해야 함
 */

//공통 응답 DTO (응답 포맷 표준화) : 성공/실패/메시지/데이터를 항상 같은 형태로 반환하도록 하기 위함
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        LocalDateTime timestamp
) {
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now());
    }
    public static <T> ApiResponse<T> fail(String message, T data) {
        return new ApiResponse<>(false, message, data, LocalDateTime.now());
    }
}


