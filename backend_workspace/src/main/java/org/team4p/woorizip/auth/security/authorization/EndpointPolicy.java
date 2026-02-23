package org.team4p.woorizip.auth.security.authorization;

public final class EndpointPolicy {
    private EndpointPolicy() {}

    // 공개
    public static final String[] PUBLIC_GET = {
            "/api/notice/**",
        	"/api/information/**",
        	"/api/event/**",
        	"/api/qna/**",
            "/api/boards/**"
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
    public static final String[] USER_ADMIN_LIST = { 
            "/api/user/list", 
            "/api/user/search" 
    };
    
    // 위시리스트, 계약, 투어
    public static final String[] WISHLIST_USER = { "/api/wishlist/**" };
    public static final String[] CONTRACT_USER = { "/api/contract/**" };
    public static final String[] TOUR_USER = { "/api/tour/**" };

}
