package org.team4p.woorizip.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

// OS 변경 시 properties만 수정하면 됨. 경로 규칙이 한 곳에 모임. React 연동 API에서도 일관성 유지

@ConfigurationProperties(prefix = "app")  // 이 클래스는 properties 와 연결된다는 어노테이션임, (prefix = "app") == app.* 의미함
public record UploadProperties(
        String uploadDir   // app.upload-dir 프로퍼티 값으로 매핑됨. uploadDir == C:/upload_files (base 경로)
) {

    /** 공지사항 업로드 경로 */
    public Path noticeDir() {
        return Path.of(uploadDir, "notice");  // C:/upload_files/notice
    }

    /** qna 업로드 경로 */
    public Path qnaDir() {
        return Path.of(uploadDir, "qna");  // C:/upload_files/qna
    }

    /** 회원 사진 업로드 경로 */
    public Path photoDir() {
        return Path.of(uploadDir, "photo");  // C:/upload_files/photo
    }
    
    /** 건물 사진 업로드 경로 */
    public Path houseImageDir() {
    		return Path.of(uploadDir, "houseImage");
    }
}
