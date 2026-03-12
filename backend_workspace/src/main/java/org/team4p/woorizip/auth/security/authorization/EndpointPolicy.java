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
            "/api/houses/**",
            "/api/rooms/**",
            "/api/*/*/popular",
            
            "/api/facilities/*", "/api/facilities/detail/*",
            
    };

    public static final String[] PUBLIC_POST = {
    		"/api/user/signup",
            "/api/user/check-id",
            "/api/user/find-id",
            "/api/user/password/send-code",
            "/api/user/password/verify-code",
            "/api/user/find-password",
            "/api/orchestrate/command",
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
    		"/api/houses/owner"
    	};
    // 건물, 방 (ESTATE): LESSOR (POST, PUT, PATCH, DELETE)
    public static final String[] ESTATE_LESSOR = {
    		"/api/houses", "/api/houses/*",
    		"/api/rooms", "/api/rooms/*", "/api/rooms/*/availability"
    	};
    // 건물, 방 (ESTATE): USER (POST, PUT, DELETE)
    public static final String[] ESTATE_USER = {
    		"/api/rooms/*/reviews", "/api/rooms/*/reviews/*",
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
    public static final String[] FACILITY_ADMIN_ONLY = {"/api/facilities/categories", "/api/facilities/categories/*"};	//POST, PATCH
    public static final String[] FACILITY_LOGIN = {"/api/facilities", "/api/facilities/*"};	//POST, PATCH
    public static final String[] FACILITY_LOGIN_GET = {"/api/facilities/categories"};

    // 공용시설 예약
    public static final String RESERVATION_ALL = "/api/reservations/**";
}
