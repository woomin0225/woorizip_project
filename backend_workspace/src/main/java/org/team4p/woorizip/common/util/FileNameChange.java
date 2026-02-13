package org.team4p.woorizip.common.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 파일명 변경 유틸 클래스
 * - 원본 확장자 유지
 * - 날짜 / UUID / 날짜+UUID 전략 제공
 */
public final class FileNameChange {

    private FileNameChange() {
        // util class
    }

    /**
     * 파일명 변경 전략
     */
    public enum RenameStrategy {
        DATETIME,          // yyyyMMddHHmmss
        UUID,              // uuid
        DATETIME_UUID      // yyyyMMddHHmmss_uuid
    }

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * DATETIME 형식으로 파일명 변경 (기본 전략)
     */
    public static String change(String originalFilename) {
        return change(originalFilename, RenameStrategy.DATETIME);
    }

    /**
     * 파일명 변경 전략 선택형 메소드
     */
    public static String change(String originalFilename, RenameStrategy strategy) {

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("원본 파일명이 없습니다.");
        }

        // 확장자 추출
        String extension = extractExtension(originalFilename);

        String renamed;
        switch (strategy) {
            case UUID -> renamed = UUID.randomUUID().toString();
            case DATETIME_UUID -> renamed = now() + "_" + UUID.randomUUID();
            case DATETIME -> renamed = now();
            default -> throw new IllegalStateException("지원하지 않는 파일명 전략입니다.");
        }

        return renamed + extension;
    }

    /**
     * yyyyMMddHHmmss
     */
    private static String now() {
        return LocalDateTime.now().format(DATE_FORMAT);
    }

    /**
     * 확장자 추출 (.jpg 포함)
     */
    private static String extractExtension(String filename) {
        int idx = filename.lastIndexOf(".");
        return (idx > -1) ? filename.substring(idx) : "";
    }
}
