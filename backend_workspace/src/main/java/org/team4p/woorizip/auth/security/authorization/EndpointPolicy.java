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
//            "/houses/marker",
//            "/houses/*/rooms",
//            "/houses/*",
//            "/houses/*/images",
//            "/houses/*/search",
            "/rooms/**",
//            "/rooms/search",
//            "/rooms/*",
//            "/rooms/*/images",
//            "/rooms/*/reviews",
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
    public static final String[] QNA_WRITE = { "/api/qna/**" };

    // 댓글/대댓글: USER/ADMIN
    public static final String[] REPLY_WRITE = {
            "/api/boards/*/replies/**",
            "/api/replies/**"
    };

    // 회원: 내정보 USER/ADMIN, 목록/검색 ADMIN
    public static final String[] USER_ME = { "/api/user/*" };
    public static final String[] USER_ADMIN_LIST = { "/api/user", "/api/user/search" };
    public static final String[] USER_ADMIN_PATCH = { "/api/user/*/login-ok" };
    
    // 건물, 방 (ESTATE): LESSOR (GET) - PUBLIC_GET의 /houses/*와 충돌 주의 => 먼저 설정하기
    public static final String[] ESTATE_LESSOR_GET = {
    		"/houses/owner"
    	};
    // 건물, 방 (ESTATE): LESSOR (POST, PUT, PATCH, DELETE)
    public static final String[] ESTATE_LESSOR = {
    		"/houses", "/houses/**",
    		"/rooms", "/rooms/**",
//    		"/houses", "/rooms",	//POST
//    		"/houses/*", "/rooms/*",	//PUT
//    		"/rooms/*/availability",	//PATCH
//    		"/houses/*", "/rooms/*"	//DELETE
    	};
    // 건물, 방 (ESTATE): USER (POST, PUT, DELETE)
    public static final String[] ESTATE_USER = {
    		"/rooms/*/reviews", "/rooms/*/reviews/*",
//    		"/rooms/*/reviews",	//POST
//    		"/rooms/*/reviews/*",	//PUT
//    		"/rooms/*/reviews/*"	//DELETE
    	};
    
}
