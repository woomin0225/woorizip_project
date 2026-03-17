-- ==========================================================
-- db_ai_image_analyze.sql
-- 방 이미지 AI 분석 결과 저장 테이블
-- 이미지 업로드 후 FastAPI(Qwen / PaddleOCR / GroundingDINO) 분석 결과를
-- 이미지 단위로 저장하기 위한 테이블
-- 1개 방 이미지(room_image_no) 당 1개의 분석 결과만 저장하도록 UNIQUE 제약 적용
-- 나중에 요약 생성, 검색용 데이터 활용, 재분석 결과 관리에 사용
-- ==========================================================

CREATE TABLE `tb_rooms_image_analysis` (
  `analysis_no` BIGINT NOT NULL AUTO_INCREMENT COMMENT '방 이미지 분석 번호',
  `room_no` CHAR(36) NOT NULL COMMENT '방번호',
  `room_image_no` BIGINT NOT NULL COMMENT '방사진번호',
  `summary` TEXT COMMENT 'AI 요약문',
  `caption` TEXT COMMENT '이미지 캡션 원문',
  `ocr_text` TEXT COMMENT 'OCR 추출 원문',
  `normalized_options` VARCHAR(255) COMMENT '정규화된 옵션 목록(콤마 구분)',
  `raw_json` LONGTEXT COMMENT 'FastAPI 분석 결과 원본 JSON',
  `analysis_created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '분석 생성일시',
  `analysis_updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '분석 수정일시',
  PRIMARY KEY (`analysis_no`)
);

ALTER TABLE `tb_rooms_image_analysis`
  ADD CONSTRAINT `fk_tb_rooms_image_analysis_room_no`
    FOREIGN KEY (`room_no`) REFERENCES `tb_rooms` (`room_no`) ON DELETE CASCADE;

ALTER TABLE `tb_rooms_image_analysis`
  ADD CONSTRAINT `fk_tb_rooms_image_analysis_room_image_no`
    FOREIGN KEY (`room_image_no`) REFERENCES `tb_rooms_images` (`room_image_no`) ON DELETE CASCADE;
    
-- 이미지 1장당 분석 1건으로 설정
ALTER TABLE `tb_rooms_image_analysis`
  ADD UNIQUE KEY `uk_tb_rooms_image_analysis_room_image_no` (`room_image_no`);