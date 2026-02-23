package org.team4p.woorizip.auth.security.authorization;

public final class EndpointPolicy {
    private EndpointPolicy() {}

    // 공개
    public static final String[] PUBLIC_GET = {
            "/api/notice/**",
            	"/api/information/**",
            	"/api/event/**",
            	"/api/qna/**",
            "/api/boards/**",
            
            // PUBLIC_GET: house, room
            "/houses/**",
            "/rooms/**",
    };

    public static final String[] PUBLIC_POST = {
    		"/api/user/signup",
            "/api/user/check-id",
            "/auth/login"
    };

    // 공지사항, 정책・정보, 이벤트 : ADMIN만 (POST/PUT/DELETE)
    public static final String[] ADMIN_WRITE= {
    		"/api/notice/**",
    		"/api/information/**",
    		"/api/event/**"};

    // 게시글: USER/ADMIN (POST/PUT/DELETE)
    public static final String[] QNA_WRITE = { "/api/qna/**" };

    // 댓글/대댓글: USER/ADMIN
    public static final String[] REPLY_WRITE = {
            "/api/boards/*/replies/**",
            "/api/replies/**"
    };

    // 회원 조회
    public static final String[] USER_ME = { "/api/user/*" };
    
    // 건물, 방 (ESTATE): LESSOR (GET) - PUBLIC_GET의 /houses/*와 충돌 주의 => 먼저 설정하기
    public static final String[] ESTATE_LESSOR_GET = {
    		"/houses/owner"
    	};
    // 건물, 방 (ESTATE): LESSOR (POST, PUT, PATCH, DELETE)
    public static final String[] ESTATE_LESSOR = {
    		"/houses", "/houses/*",
    		"/rooms", "/rooms/*", "/rooms/*/availability"
    	};
    // 건물, 방 (ESTATE): USER (POST, PUT, DELETE)
    public static final String[] ESTATE_USER = {
    		"/rooms/*/reviews", "/rooms/*/reviews/*",
    	};
    
    public static final String[] USER_ADMIN_LIST = { 
            "/api/user/list", 
            "/api/user/search" 
    };
    
    // 위시리스트, 계약, 투어
    public static final String[] WISHLIST_USER = { "/api/wishlist/**" };
    public static final String[] CONTRACT_USER = { "/api/contract/**" };
    public static final String[] TOUR_USER = { "/api/tour/**" };

    // 공용시설
    public static final String ADMIN_FACILITY_CATEGORY = "/api/facilities/categories/**";
    public static final String FACILITY_ALL = "/api/facilities/**";

    // 공용시설 예약
    public static final String RESERVATION_ALL = "/api/reservations/**";
    public static final String FACILITY_RESERVATION_ALL = "/api/facilities/*/reservations/**";
}
