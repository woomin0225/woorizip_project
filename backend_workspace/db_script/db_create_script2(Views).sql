DROP TABLE IF EXISTS tb_room_view_daily;
DROP TABLE IF EXISTS tb_house_view_daily;

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

