package org.team4p.woorizip.common.api;

import java.time.LocalDate;
import java.util.Locale;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * React가 검색 조건을 유지한 채로 페이징 요청을 계속 보낼 수 있도록 필요한 파라미터만 모아둔 Request DTO
 */
public record SearchRequest(
        // 검색 종류 
        String type,        // "title" | "content" | "date" | "age" | "enrollDate" | "writer" (확장 가능)

        // 검색 조건들 
        String keyword,     // 제목/내용/작성자 등 키워드 
        String begin,       // "yyyy-MM-dd" (date 검색 시작) 
        String end,         // "yyyy-MM-dd" (date 검색 끝)  
        Integer age,        // 회원쪽 연령대 검색용(확장 필드) 

        // 페이징/정렬 (React가 유지해야 검색결과 페이징이 안정적)
        Integer page,       // 1-base
        Integer size,
        String sort,		  // "noticeNo" | "boardNum" | "userId"
        String direct       // "ASC" | "DESC"
) {

    public SearchRequest {
        if (type != null) type = type.trim().toLowerCase(Locale.ROOT);

        if (keyword != null) keyword = keyword.trim();
        if (begin != null) begin = begin.trim();
        if (end != null) end = end.trim();

        if (page == null || page < 1) page = 1;
        if (size == null || size < 1) size = 10;

        if (sort == null || sort.isBlank()) sort = sort.trim();
        if (direct == null || direct.isBlank()) direct = "DESC";

        // age가 null이면 0으로 강제하지 말고 그대로 null 유지 
    }

    /** Pageable로 변환 (목록/검색 공통으로 사용 가능) */
    public Pageable toPageable() {
        Sort.Direction direction = "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page - 1, size, direction, sort);
    }

    /** date 검색에서 begin/end를 LocalDate로 쓰고 싶을 때 */
    public LocalDate beginDateOrNull() {
        return (begin == null || begin.isBlank()) ? null : LocalDate.parse(begin);
    }

    public LocalDate endDateOrNull() {
        return (end == null || end.isBlank()) ? null : LocalDate.parse(end);
    }

    /** 검색 조건이 유효하게 들어왔는지(React에서 버튼 enable/disable에도 사용 가능) */
    public boolean hasSearchCondition() {
        if (type == null || type.isBlank()) return false;

        return switch (type) {
            case "title", "content", "writer" -> keyword != null && !keyword.isBlank();
            case "date" -> begin != null && !begin.isBlank() && end != null && !end.isBlank();            
            case "age" -> age != null && age > 0;
            default -> true; // 타입만 정해지고 조건은 서버에서 처리하고 싶다면 true
        };
    }
}
