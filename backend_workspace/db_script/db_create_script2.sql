DROP TABLE IF EXISTS tb_room_view_hourly;
DROP TABLE IF EXISTS tb_house_view_hourly;

CREATE TABLE tb_room_view_hourly (
  room_no VARCHAR(36) NOT NULL,
  hour_start DATETIME NOT NULL,          -- 예: 2026-03-01 14:00:00 (정각)
  view_count BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (room_no, hour_start),
  INDEX idx_room_hour (hour_start, room_no)
) ENGINE=InnoDB;

CREATE TABLE tb_house_view_hourly (
  house_no VARCHAR(36) NOT NULL,
  hour_start DATETIME NOT NULL,
  view_count BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (house_no, hour_start),
  INDEX idx_house_hour (hour_start, house_no)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `tb_room_review_summary`;

CREATE TABLE tb_room_review_summary (
	room_no CHAR(36) PRIMARY KEY COMMENT '방번호',
    summary_status ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED') COMMENT '요약처리상태: 새 리뷰 등록되면 PENDING으로 변경됨',
    review_count bigint COMMENT '요약에 사용한 리뷰 수',
    updated_at TIMESTAMP COMMENT '최근 요약 수행 일시',
    review_summary TEXT COMMENT '요약 문구(결과)',
    last_error_message TEXT COMMENT '요약 수행중 에러메세지(가장 마지막)',
    retry_count int COMMENT '재시도 횟수(최대3회)',
    CONSTRAINT FK_REVIEW_SUMMARY_ROOM_NO FOREIGN KEY (room_no) REFERENCES `tb_rooms` (room_no)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);