package org.team4p.woorizip.common.api;

import java.util.List;

/*
 * record 란? (Java 16+)
 * => 이 클래스는 데이터만 담는다. 라고 컴파일러에게 선언하는 문법임
 * 
 * => 선언한 필드는 자동 private final 이 됨
 * => 생성자, getter, equals(), hashCode(), toString() 자동 생성됨
 * => 선언된 필드는 불변임 (immutable) : 스래드에 안전
 * => REST API 응답 DTO 에 최적, 코드가 짧음. Jackson(JSON)과 궁합 좋음
 * 
 * => 필드 변경 불가, 상속 불가, JPA Entity 로 부적합
 * => setter나 상속이 필요하면 class 로 변경해야 함, JPA Entity 는 class 로 작성해야 함
 */

// 페이징 응답 DTO (페이징 포맷 표준화)
public record PageResponse<T>(
        List<T> content,
        int page,          	// 1-base
        int size,				// 한 페이지에 출력할 목록 갯수
        long totalElements,		// 총 목록 수
        int totalPages			// ceil(totalElements / size) 로 계산한 총 페이지 수	
) {}
