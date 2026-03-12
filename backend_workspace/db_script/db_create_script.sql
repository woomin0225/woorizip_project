-- db_create_script.sql
-- drop 테이블로 정리 > 외래키제외 테이블 생성 > 외래키 설정

-- 설계에서 Default 항목에 다른 테이블 값 사용하는 부분은 MySQL DEFAULT로 지정할 수 없어 COMMENT에 언급해놨습니다.
-- ==========================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `tb_fm_rsvn`;
DROP TABLE IF EXISTS `tb_fm_images`;
DROP TABLE IF EXISTS `tb_fm_list`;
DROP TABLE IF EXISTS `tb_fm_category`;

DROP TABLE IF EXISTS `tb_wishlists`;
DROP TABLE IF EXISTS `tb_reviews`;
DROP TABLE IF EXISTS `tb_tours`;
DROP TABLE IF EXISTS `tb_contracts`;

DROP TABLE IF EXISTS `tb_rooms_images`;
DROP TABLE IF EXISTS `tb_rooms`;

DROP TABLE IF EXISTS `tb_houses_images`;
DROP TABLE IF EXISTS `tb_houses`;

DROP TABLE IF EXISTS `tb_files`;
DROP TABLE IF EXISTS `tb_comments`;
DROP TABLE IF EXISTS `tb_posts`;
DROP TABLE IF EXISTS `tb_board_type`;

DROP TABLE IF EXISTS `tb_banner_images`;

DROP TABLE IF EXISTS `tb_refresh_tokens`;
DROP TABLE IF EXISTS `tb_users`;

SET FOREIGN_KEY_CHECKS = 1;
-- ==================================================

CREATE TABLE `tb_users` (
  `user_no` CHAR(36) NOT NULL COMMENT '회원고유번호',
  `email_id` VARCHAR(255) NOT NULL COMMENT '이메일',
  `password` VARCHAR(255) NOT NULL COMMENT '비밀번호',
  `name` VARCHAR(20) NOT NULL COMMENT '회원이름',
  `phone` VARCHAR(15) NOT NULL COMMENT '전화번호',
  `gender` CHAR(1) NOT NULL COMMENT '성별',
  `birth_date` DATE NOT NULL COMMENT '생년월일',
  `type` ENUM('USER', 'LESSOR') NOT NULL COMMENT '임차인(일반사용자)/임대인 구분',
  `role` ENUM('USER', 'ADMIN') NOT NULL COMMENT '사용자/ 관리자 구분',
  `created_at` TIMESTAMP DEFAULT NULL COMMENT '가입일시',
  `updated_at` TIMESTAMP DEFAULT NULL COMMENT '수정일시',
  `withdraw_at` TIMESTAMP DEFAULT NULL COMMENT '탈퇴일시',
  `deleted_yn` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '탈퇴여부',
  PRIMARY KEY (`user_no`),
  UNIQUE KEY `uk_tb_users_email_id` (`email_id`)
);

CREATE TABLE tb_refresh_tokens (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    email_id VARCHAR(255) NOT NULL,
    token_value VARCHAR(512) NOT NULL,
    issued_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    INDEX (email_id)
);

CREATE TABLE `tb_contracts` (
  `contract_no` CHAR(36) NOT NULL COMMENT '계약번호',
  `room_no` CHAR(36) NOT NULL COMMENT '방번호',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호',
  `parent_contract_no` CHAR(36) NULL COMMENT '수정 전 원본 계약번호',
  `move_in_date` DATE COMMENT '입주희망일',
  `term_months` MEDIUMINT COMMENT '계약기간(개월수)',
  `status` ENUM('APPLIED', 'APPROVED', 'PAID', 'ACTIVE', 'ENDED', 'REJECTED') NOT NULL DEFAULT 'APPLIED' COMMENT '계약상태(APPLIED, APPROVED, PAID, ACTIVE, ENDED, REJECTED)',
  `contract_url` TEXT COMMENT '계약서URL',
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '결제일시',
  `rejection_reason` TEXT COMMENT '거절사유',
  PRIMARY KEY (`contract_no`)
);

CREATE TABLE `tb_tours` (
  `tour_no` CHAR(36) NOT NULL COMMENT '투어번호',
  `room_no` CHAR(36) NOT NULL COMMENT '방번호',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호',
  `visit_date` DATE NOT NULL COMMENT '희망방문일',
  `visit_time` TIME NOT NULL COMMENT '희망방문시간',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '투어신청상태',
  `message` TEXT COMMENT '신청메시지',
  `canceled_reason` TEXT COMMENT '투어취소사유',
  `canceled_at` TIMESTAMP DEFAULT NULL COMMENT '투어 취소 시간',
  PRIMARY KEY (`tour_no`)
);

CREATE TABLE `tb_reviews` (
  `review_no` BIGINT NOT NULL AUTO_INCREMENT COMMENT '리뷰번호',
  `room_no` CHAR(36) NOT NULL COMMENT '방번호',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호(리뷰작성자)',
  `rating` INT NOT NULL COMMENT '별점(1~5)',
  `review_content` TEXT COMMENT '내용',
  `review_created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  PRIMARY KEY (`review_no`)
);

CREATE TABLE `tb_wishlists` (
  `wish_no` CHAR(36) NOT NULL COMMENT '찜번호',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호',
  `room_no` CHAR(36) NOT NULL COMMENT '방번호',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  PRIMARY KEY (`wish_no`)
);

CREATE TABLE `tb_board_type` (
  `board_type_no` CHAR(36) NOT NULL COMMENT '공지사항, Q&A, 이벤트, 정책・정보 (N1, Q1, E1, I1)',
  `board_type_name` VARCHAR(30) NOT NULL COMMENT '공지사항, Q&A, 이벤트, 정책・정보',
  PRIMARY KEY (`board_type_no`),
  UNIQUE KEY `uk_tb_board_type_board_type_name` (`board_type_name`)
);

CREATE TABLE `tb_posts` (
  `post_no` INT NOT NULL AUTO_INCREMENT COMMENT '게시글번호',
  `board_type_no` CHAR(36) NOT NULL COMMENT '게시판유형번호',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호',
  `post_title` VARCHAR(255) NOT NULL COMMENT '제목',
  `post_content` TEXT NOT NULL COMMENT '내용',
  `post_view_count` INT NOT NULL DEFAULT 0 COMMENT '조회수',
  `post_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  `post_updated_at` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `post_comment_yn` BOOLEAN NOT NULL DEFAULT 0 COMMENT '댓글유무',
  `post_files_yn` BOOLEAN NOT NULL DEFAULT 0 COMMENT '첨부파일유무',
  PRIMARY KEY (`post_no`)
);

CREATE TABLE `tb_comments` (
  `comment_no` INT NOT NULL AUTO_INCREMENT COMMENT '댓글번호',
  `post_no` INT NOT NULL COMMENT '게시글번호',
  `parent_comment_no` INT COMMENT '부모댓글번호',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호',
  `comment_content` TEXT NOT NULL COMMENT '댓글내용',
  `comment_lev` INT DEFAULT 1 COMMENT '댓글단계',
  `comment_seq` INT DEFAULT 1 COMMENT '댓글정렬순서',
  `comment_created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  `comment_updated_at` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`comment_no`)
);

CREATE TABLE `tb_files` (
  `file_no` INT NOT NULL AUTO_INCREMENT COMMENT '파일번호',
  `post_no` INT NOT NULL COMMENT '게시글번호',
  `original_file_name` VARCHAR(255) NOT NULL COMMENT '파일이름',
  `updated_file_name` VARCHAR(255) COMMENT '변경된파일이름',
  PRIMARY KEY (`file_no`)
);

CREATE TABLE `tb_banner_images` (
  `banner_image_no` INT NOT NULL AUTO_INCREMENT COMMENT '이미지번호',
  `post_no` INT NOT NULL UNIQUE COMMENT '게시글번호',
  `original_file_name` VARCHAR(255) NOT NULL COMMENT '파일이름',
  `updated_file_name` VARCHAR(255) NOT NULL COMMENT '변경된 파일 이름',
  `file_created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '배너등록일시',
  PRIMARY KEY (`banner_image_no`)
);

CREATE TABLE `tb_houses` (
  `house_no` CHAR(36) NOT NULL COMMENT '건물번호, UUID사용',
  `house_name` VARCHAR(20) NOT NULL COMMENT '건물명',
  `user_no` CHAR(36) NOT NULL COMMENT '임대인',
  `house_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '건물등록날짜',
  `house_updated_at` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '건물수정날짜',
  `house_zip` CHAR(5) NOT NULL COMMENT '우편번호',
  `house_address` VARCHAR(40) NOT NULL COMMENT '주소',
  `house_address_detail` VARCHAR(40) COMMENT '상세주소',
  `house_completion_year` YEAR NOT NULL COMMENT '준공년도',
  `house_floors` TINYINT NOT NULL COMMENT '층수',
  `house_house_holds` SMALLINT NOT NULL COMMENT '총세대수',
  `house_elevator_yn` BOOLEAN NOT NULL COMMENT '엘리베이터유무',
  `house_pet_yn` BOOLEAN NOT NULL COMMENT '애완동물가능여부',
  `house_female_limit` BOOLEAN NOT NULL COMMENT '여성전용',
  `house_parking_max` INT NOT NULL COMMENT '주차대수',
  `house_abstract` TEXT COMMENT '소개글',
  `house_image_count` TINYINT NOT NULL COMMENT '첨부사진갯수',
  `house_lat` DECIMAL(10, 8) COMMENT '지도API사용을 위한 위도(-90 - 90, 소수점 8자리)',
  `house_lng` DECIMAL(11, 8) COMMENT '지도API사용을 위한 경도(-180 - 180, 소수점 8자리)',
  `deleted` BOOLEAN DEFAULT 0 COMMENT '건물 삭제여부',
  `deleted_at` TIMESTAMP COMMENT '건물 삭제 일시',
  PRIMARY KEY (`house_no`),
  UNIQUE KEY `uk_tb_houses_house_name` (`house_name`)
);

CREATE TABLE `tb_houses_images` (
  `house_image_no` BIGINT NOT NULL AUTO_INCREMENT COMMENT '건물사진번호',
  `house_no` CHAR(36) NOT NULL COMMENT '건물번호',
  `house_original_image_name` VARCHAR(100) NOT NULL COMMENT '건물사진명',
  `house_stored_image_name` VARCHAR(46) NOT NULL COMMENT '건물사진저장된이름',
  PRIMARY KEY (`house_image_no`)
);

CREATE TABLE `tb_rooms` (
  `room_no` CHAR(36) NOT NULL COMMENT '방번호, UUID사용',
  `room_name` VARCHAR(20) NOT NULL COMMENT '방이름',
  `house_no` CHAR(36) NOT NULL COMMENT '건물번호, UUID사용',
  `user_no` CHAR(36) NOT NULL COMMENT '임대인',
  `room_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '방등록날짜',
  `room_updated_at` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '방수정날짜',
  `room_deposit` BIGINT NOT NULL COMMENT '보증금',
  `room_monthly` BIGINT COMMENT '세액',
  `room_method` ENUM('M', 'L') NOT NULL COMMENT '월전세구분(월세M, 전세L)',
  `room_area` DECIMAL(5, 2) NOT NULL COMMENT '면적',
  `room_facing` ENUM('북향', '동향', '남향', '서향', '북동향', '남동향', '남서향', '북서향') NOT NULL COMMENT '방 방향',
  `room_available_date` DATE NOT NULL COMMENT '입주가능일',
  `room_abstract` TEXT COMMENT '소개글',
  `room_room_count` TINYINT NOT NULL COMMENT '방개수',
  `room_bath_count` TINYINT NOT NULL COMMENT '욕실개수',
  `room_empty_yn` BOOLEAN NOT NULL COMMENT '공실여부',
  `room_status` ENUM('HIDDEN', 'ACTIVE') NOT NULL COMMENT '방 노출 상태(숨김-HIDDEN, 노출-ACTIVE)',
  `room_options` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '방 옵션들 delimiter 사용',
  `room_image_count` TINYINT NOT NULL COMMENT '첨부사진갯수',
  `deleted` BOOLEAN NOT NULL DEFAULT 0 COMMENT '방 삭제여부',
  `deleted_at` TIMESTAMP COMMENT '방 삭제 일시',
  PRIMARY KEY (`room_no`)
);

CREATE TABLE `tb_rooms_images` (
  `room_image_no` BIGINT NOT NULL AUTO_INCREMENT COMMENT '방사진번호',
  `room_no` CHAR(36) NOT NULL COMMENT '방번호',
  `room_original_image_name` VARCHAR(100) NOT NULL COMMENT '방사진이름',
  `room_stored_image_name` VARCHAR(46) NOT NULL COMMENT '방사진저장된이름',
  PRIMARY KEY (`room_image_no`)
);

CREATE TABLE `tb_fm_category` (
  `facility_code` TINYINT NOT NULL AUTO_INCREMENT COMMENT '시설코드 (1~)',
  `facility_type` VARCHAR(10) NOT NULL COMMENT '시설의 기본 이름 (''라운지'', ''세탁실'', ''시네마룸'', ''운동시'', ''정원'', ''주방'', ''거실'', ''발코니'', ''테라스'', ''화장실'' 등)',
  `facility_options` TEXT NOT NULL COMMENT '시설의 기본 세부 옵션 (JSON)',
  PRIMARY KEY (`facility_code`, `facility_type`)
);

CREATE TABLE `tb_fm_list` (
  `facility_no` CHAR(36) NOT NULL COMMENT '시설번호, UUID사용',
  `house_no` CHAR(36) NOT NULL COMMENT '건물번호, UUID사용',
  `facility_code` TINYINT NOT NULL COMMENT '시설코드 (1~)',
  `facility_name` VARCHAR(20) NOT NULL COMMENT '시설 이름 (백엔드 - Default: tb_fm_category.facility_type)',
  `facility_sequence` TINYINT COMMENT '같은 시설 카테고리 등록 순번',
  `facility_option_info` TEXT NOT NULL COMMENT '시설 세부 옵션 (백엔드 - Default: tb_fm_category.facility_options)',
  `facility_location` TINYINT NOT NULL COMMENT '시설 위치 (몇 층에 있는지)',
  `facility_created_at` TIMESTAMP NOT NULL COMMENT '등록일시',
  `facility_updated_at` TIMESTAMP COMMENT '수정일시',
  `facility_deleted_at` TIMESTAMP COMMENT '삭제일시',
  `facility_capacity` SMALLINT UNSIGNED NOT NULL COMMENT '수용인원',
  `facility_open_time` TIME NOT NULL COMMENT '운영시작시간',
  `facility_close_time` TIME NOT NULL COMMENT '운영종료시간',
  `facility_status` ENUM('AVAILABLE', 'UNAVAILABLE', 'DELETED') NOT NULL COMMENT '시설 이용 가능 여부',
  `facility_rsvn_required_yn` BOOLEAN NOT NULL COMMENT '예약 필요 여부',
  `max_rsvn_per_day` TINYINT UNSIGNED COMMENT '인당 일일 최대 예약 가능 건수',
  `facility_rsvn_unit_minutes` SMALLINT UNSIGNED COMMENT '예약 최소 단위 시간',
  `facility_max_duration_minutes` SMALLINT UNSIGNED COMMENT '최대 사용 가능 시간',
  PRIMARY KEY (`facility_no`)
);

CREATE TABLE `tb_fm_images` (
  `facility_image_no` INT NOT NULL AUTO_INCREMENT COMMENT '시설사진번호',
  `facility_no` CHAR(36) NOT NULL COMMENT '시설번호, UUID사용',
  `facility_original_image_name` VARCHAR(255) COMMENT '시설 사진 파일의 원래 이름',
  `facility_stored_image_name` VARCHAR(255) COMMENT '시설 사진 파일에 지정한 이름',
  PRIMARY KEY (`facility_image_no`)
);

CREATE TABLE `tb_fm_rsvn` (
  `rsvn_no` CHAR(36) NOT NULL COMMENT '예약번호, UUID사용',
  `facility_no` CHAR(36) NOT NULL COMMENT '시설번호, UUID사용',
  `user_no` CHAR(36) NOT NULL COMMENT '회원번호, UUID사용',
  `rsvn_name` VARCHAR(20) NOT NULL COMMENT '예약자 이름',
  `rsvn_phone` VARCHAR(15) NOT NULL COMMENT '예약자 연락처',
  `rsvn_date` DATE NOT NULL COMMENT '예약날짜',
  `rsvn_start_time` TIME NOT NULL COMMENT '시작시간',
  `rsvn_end_time` TIME NOT NULL COMMENT '종료시간',
  `rsvn_status` ENUM('APPROVED', 'CANCELED') NOT NULL COMMENT '예약상태',
  `rsvn_created_at` TIMESTAMP NOT NULL COMMENT '신청일시',
  `rsvn_updated_at` TIMESTAMP COMMENT '변경일시',
  `rsvn_canceled_at` TIMESTAMP COMMENT '취소일시',
  PRIMARY KEY (`rsvn_no`)
);

-- Foreign Key
ALTER TABLE `tb_fm_category` ADD UNIQUE KEY `uk_tb_fm_category_facility_code` (`facility_code`);
ALTER TABLE `tb_contracts` ADD CONSTRAINT `fk_tb_contracts_room_no` FOREIGN KEY (`room_no`) REFERENCES `tb_rooms` (`room_no`);
ALTER TABLE `tb_contracts` ADD CONSTRAINT `fk_tb_contracts_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
ALTER TABLE `tb_tours` ADD CONSTRAINT `fk_tb_tours_room_no` FOREIGN KEY (`room_no`) REFERENCES `tb_rooms` (`room_no`);
ALTER TABLE `tb_tours` ADD CONSTRAINT `fk_tb_tours_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
ALTER TABLE `tb_reviews` ADD CONSTRAINT `fk_tb_reviews_room_no` FOREIGN KEY (`room_no`) REFERENCES `tb_rooms` (`room_no`);
ALTER TABLE `tb_reviews` ADD CONSTRAINT `fk_tb_reviews_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
ALTER TABLE `tb_wishlists` ADD CONSTRAINT `fk_tb_wishlists_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`) ON DELETE CASCADE;
ALTER TABLE `tb_wishlists` ADD CONSTRAINT `fk_tb_wishlists_room_no` FOREIGN KEY (`room_no`) REFERENCES `tb_rooms` (`room_no`) ON DELETE CASCADE;
ALTER TABLE `tb_posts` ADD CONSTRAINT `fk_tb_posts_board_type_no` FOREIGN KEY (`board_type_no`) REFERENCES `tb_board_type` (`board_type_no`);
ALTER TABLE `tb_posts` ADD CONSTRAINT `fk_tb_posts_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
-- 오류 생기면 기존 FK키 삭제 : 
-- ALTER TABLE `tb_comments` DROP FOREIGN KEY `fk_tb_comments_post_no`;
ALTER TABLE `tb_comments` ADD CONSTRAINT `fk_tb_comments_post_no` FOREIGN KEY (`post_no`) REFERENCES `tb_posts` (`post_no`) ON DELETE CASCADE;
ALTER TABLE `tb_comments` ADD CONSTRAINT `fk_tb_comments_parent_comment_no` FOREIGN KEY (`parent_comment_no`) REFERENCES `tb_comments` (`comment_no`) ON DELETE CASCADE;
ALTER TABLE `tb_comments` ADD CONSTRAINT `fk_tb_comments_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
ALTER TABLE `tb_files` ADD CONSTRAINT `fk_tb_files_post_no` FOREIGN KEY (`post_no`) REFERENCES `tb_posts` (`post_no`) ON DELETE CASCADE;
ALTER TABLE `tb_banner_images` ADD CONSTRAINT `fk_tb_banner_images_post_no` FOREIGN KEY (`post_no`) REFERENCES `tb_posts` (`post_no`) ON DELETE CASCADE;
ALTER TABLE `tb_houses` ADD CONSTRAINT `fk_tb_houses_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
ALTER TABLE `tb_houses_images` ADD CONSTRAINT `fk_tb_houses_images_house_no` FOREIGN KEY (`house_no`) REFERENCES `tb_houses` (`house_no`) ON DELETE CASCADE;
ALTER TABLE `tb_rooms` ADD CONSTRAINT `fk_tb_rooms_house_no` FOREIGN KEY (`house_no`) REFERENCES `tb_houses` (`house_no`);
ALTER TABLE `tb_rooms` ADD CONSTRAINT `fk_tb_rooms_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);
ALTER TABLE `tb_rooms_images` ADD CONSTRAINT `fk_tb_rooms_images_room_no` FOREIGN KEY (`room_no`) REFERENCES `tb_rooms` (`room_no`) ON DELETE CASCADE;
ALTER TABLE `tb_fm_list` ADD CONSTRAINT `fk_tb_fm_list_house_no` FOREIGN KEY (`house_no`) REFERENCES `tb_houses` (`house_no`) ON DELETE CASCADE;
ALTER TABLE `tb_fm_list` ADD CONSTRAINT `fk_tb_fm_list_facility_code` FOREIGN KEY (`facility_code`) REFERENCES `tb_fm_category` (`facility_code`);
ALTER TABLE `tb_fm_images` ADD CONSTRAINT `fk_tb_fm_images_facility_no` FOREIGN KEY (`facility_no`) REFERENCES `tb_fm_list` (`facility_no`) ON DELETE CASCADE;
ALTER TABLE `tb_fm_rsvn` ADD CONSTRAINT `fk_tb_fm_rsvn_facility_no` FOREIGN KEY (`facility_no`) REFERENCES `tb_fm_list` (`facility_no`);
ALTER TABLE `tb_fm_rsvn` ADD CONSTRAINT `fk_tb_fm_rsvn_user_no` FOREIGN KEY (`user_no`) REFERENCES `tb_users` (`user_no`);

-- Tour/Contract 중복 신청 차단용 active flag + unique slot index
ALTER TABLE `tb_tours`
  ADD COLUMN `active_flag` TINYINT GENERATED ALWAYS AS (
    CASE
      WHEN `status` IN ('PENDING', 'APPROVED') THEN 1
      ELSE 0
    END
  ) STORED,
  ADD UNIQUE KEY `uk_tb_tours_room_slot_active` (`room_no`, `visit_date`, `visit_time`, `active_flag`);

ALTER TABLE `tb_contracts`
  ADD COLUMN `active_flag` TINYINT GENERATED ALWAYS AS (
    CASE
      WHEN `status` IN ('APPLIED', 'APPROVED', 'PAID', 'ACTIVE', 'AMENDMENT_REQUESTED') THEN 1
      ELSE 0
    END
  ) STORED,
  ADD UNIQUE KEY `uk_tb_contracts_room_date_active` (`room_no`, `move_in_date`, `active_flag`);

ALTER TABLE tb_posts
  ADD COLUMN post_pinned_yn TINYINT(1) DEFAULT 0;
  
  ALTER TABLE `tb_contracts`
  MODIFY COLUMN `status`
  ENUM('APPLIED', 'APPROVED', 'PAID', 'ACTIVE', 'AMENDMENT_REQUESTED', 'ENDED', 'REJECTED')
  NOT NULL
  DEFAULT 'APPLIED'
  COMMENT '계약상태(APPLIED, APPROVED, PAID, ACTIVE, AMENDMENT_REQUESTED, ENDED, REJECTED)';

-- 1) 투어: 같은 room/date/time 에서 활성 신청(PENDING, APPROVED) 1건만 허용
ALTER TABLE `tb_tours`
  ADD COLUMN `active_flag` TINYINT GENERATED ALWAYS AS (
    CASE
      WHEN `status` IN ('PENDING', 'APPROVED') THEN 1
      ELSE 0
    END
  ) STORED;

ALTER TABLE `tb_tours`
  ADD UNIQUE KEY `uk_tb_tours_room_slot_active` (`room_no`, `visit_date`, `visit_time`, `active_flag`);

-- 2) 입주: 같은 room/move_in_date 에서 활성 신청 1건만 허용
ALTER TABLE `tb_contracts`
  ADD COLUMN `active_flag` TINYINT GENERATED ALWAYS AS (
    CASE
      WHEN `status` IN ('APPLIED', 'APPROVED', 'PAID', 'ACTIVE', 'AMENDMENT_REQUESTED') THEN 1
      ELSE 0
    END
  ) STORED;

ALTER TABLE `tb_contracts`
  ADD UNIQUE KEY `uk_tb_contracts_room_date_active` (`room_no`, `move_in_date`, `active_flag`);


-- desc `tb_user`;
-- desc `tb_contracts`;
-- desc `tb_tours`;
-- desc `tb_reviews`;
-- desc `tb_wishlists`;
-- desc `tb_board_type`;
-- desc `tb_posts`;
-- desc `tb_comments`;
-- desc `tb_files`;
-- desc `tb_banner_images`;
-- desc `tb_houses`;
-- desc `tb_houses_images`;
-- desc `tb_rooms`;
-- desc `tb_rooms_images`;
-- desc `tb_fm_category`;
-- desc `tb_fm_list`;
-- desc `tb_fm_images`;
-- desc `tb_fm_rsvn`;
