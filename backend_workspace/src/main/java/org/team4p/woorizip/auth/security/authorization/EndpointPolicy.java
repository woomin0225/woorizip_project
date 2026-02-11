package org.team4p.woorizip.auth.security.authorization;

public final class EndpointPolicy {
    private EndpointPolicy() {}

    // 공개
    public static final String[] PUBLIC_GET = {
            "/api/notices/**",
            "/api/boards/**"
    };

    public static final String[] PUBLIC_POST = {
            "/api/members",
            "/api/members/check-id"
    };

    // 공지: ADMIN만 (POST/PUT/DELETE)
    public static final String[] NOTICE_ADMIN = { "/api/notices/**" };

    // 게시글: USER/ADMIN (POST/PUT/DELETE)
    public static final String[] BOARD_WRITE = { "/api/boards/**" };

    // 댓글/대댓글: USER/ADMIN
    public static final String[] REPLY_WRITE = {
            "/api/boards/*/replies/**",
            "/api/replies/**"
    };

    // 회원: 내정보 USER/ADMIN, 목록/검색 ADMIN
    public static final String[] MEMBER_ME = { "/api/members/*", "/api/members/*/photo" };
    public static final String[] MEMBER_ADMIN_LIST = { "/api/members", "/api/members/search" };
    public static final String[] MEMBER_ADMIN_PATCH = { "/api/members/*/login-ok" };
}
