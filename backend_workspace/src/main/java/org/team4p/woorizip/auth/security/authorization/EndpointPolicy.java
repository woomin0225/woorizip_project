package org.team4p.woorizip.auth.security.authorization;

public final class EndpointPolicy {
    private EndpointPolicy() {}

    // 공개
    public static final String[] PUBLIC_GET = {
            "/api/notice/**",
            	"/api/information/**",
            	"/api/event/**",
            "/api/boards/**"
    };

    public static final String[] PUBLIC_POST = {
            "/api/user",
            "/api/user/check-id"
    };

    // 공지사항, 정책・정보, 이벤트 : ADMIN만 (POST/PUT/DELETE)
    public static final String[] ADMIN_WRITE= {
    		"/api/notice/**",
    		"/api/information/**",
    		"/api/event/**"};

    // 게시글: USER/ADMIN (POST/PUT/DELETE)
    public static final String[] BOARD_WRITE = { "/api/boards/**" };

    // 댓글/대댓글: USER/ADMIN
    public static final String[] REPLY_WRITE = {
            "/api/boards/*/replies/**",
            "/api/replies/**"
    };

    // 회원: 내정보 USER/ADMIN, 목록/검색 ADMIN
    public static final String[] USER_ME = { "/api/user/*" };
    public static final String[] USER_ADMIN_LIST = { "/api/user", "/api/user/search" };
    public static final String[] USER_ADMIN_PATCH = { "/api/user/*/login-ok" };
}
