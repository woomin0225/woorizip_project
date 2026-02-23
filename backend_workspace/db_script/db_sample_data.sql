-- db_sample_data.sql
-- ==========================================================


-- 1. 회원 (임대인 1명, 임차인 2명)
INSERT INTO `tb_users` (`user_no`, `email_id`, `password`, `name`, `phone`, `gender`, `birth_date`, `type`, `role`, `deleted_yn`) 
VALUES 
('lessor1', 'lessor@test.com', 'pass1234', '김임대', '010-1111-1111', 'M', '1980-01-01', 'LESSOR', 'USER', 'N'),
('user1', 'user1@test.com', 'pass1234', '박일번', '010-2222-2222', 'F', '1995-05-05', 'USER', 'USER', 'N'),
('user2', 'user2@test.com', 'pass1234', '이이번', '010-3333-3333', 'M', '1998-08-08', 'USER', 'USER', 'N');

-- 2. 건물 2개
INSERT INTO `tb_houses` (`house_no`, `house_name`, `user_no`, `house_zip`, `house_address`, `house_address_detail`, `house_completion_year`, `house_floors`, `house_households`, `house_elevator_yn`, `house_pet_yn`, `house_female_limit`, `house_parking_max`, `house_abstract`, `house_image_count`) 
VALUES 
('house1', '우리집오피스텔', 'lessor1', '06000', '서울 강남구 역삼동', '101번지', 2020, 5, 20, 1, 0, 0, 10, '역세권 깔끔한 오피스텔입니다.', 5),
('house2', '너네집빌라', 'lessor1', '06001', '서울 서초구 방배동', '202번지', 2015, 4, 8, 0, 1, 0, 4, '반려동물 환영하는 조용한 빌라', 3);

-- 3. 방
INSERT INTO `tb_rooms` (`room_no`, `room_name`, `house_no`, `user_no`, `room_deposit`, `room_monthly`, `room_method`, `room_area`, `room_facing`, `room_available_date`, `room_abstract`, `room_room_count`, `room_bath_count`, `room_empty_yn`, `room_status`, `room_image_count`) 
VALUES 
('room1', '101호', 'house1', 'lessor1', 10000000, 500000, '월세', 30.5, '남향', '2026-03-01', '채광 좋은 남향 방', 1, 1, 1, 'ACTIVE', 3),
('room2', '102호', 'house1', 'lessor1', 15000000, 600000, '월세', 35.0, '동향', '2026-03-15', '넓은 원룸', 1, 1, 1, 'ACTIVE', 2),
('room3', '201호', 'house2', 'lessor1', 50000000, 0, '전세', 45.0, '남향', '2026-04-01', '전세 귀한 매물', 2, 1, 1, 'ACTIVE', 4);

-- 4. 찜 (위시리스트)
INSERT INTO `tb_wishlists` (`wish_no`, `user_no`, `house_no`, `room_no`) 
VALUES 
('wish1', 'user1', 'house1', 'room1'),
('wish2', 'user1', 'house2', 'room3');

-- 5. 투어 신청
INSERT INTO `tb_tours` (`tour_no`, `room_no`, `user_no`, `visit_date`, `visit_time`, `status`, `message`) 
VALUES 
('tour1', 'room1', 'user1', '2026-03-05', '14:00:00', 'PENDING', '방 구조를 직접 보고 싶습니다.'),
('tour2', 'room3', 'user2', '2026-03-06', '11:00:00', 'APPROVED', '대출 가능한지 서류 챙겨갈게요.');

-- 6. 계약 정보
INSERT INTO `tb_contracts` (`contract_no`, `room_no`, `user_no`, `move_in_date`, `term_months`, `status`) 
VALUES 
('cont1', 'room1', 'user1', '2026-03-10', 12, 'ACTIVE'),
('cont2', 'room3', 'user2', '2026-04-10', 24, 'APPLIED');

-- 7. 건물 사진 (tb_houses_images)
INSERT INTO `tb_houses_images` (`house_no`, `house_original_image_name`, `house_stored_image_name`) 
VALUES 
('house1', 'officetel_front.jpg', 'uuid-house1-img1.jpg'),
('house1', 'officetel_lobby.jpg', 'uuid-house1-img2.jpg'),
('house2', 'villa_main.jpg', 'uuid-house2-img1.jpg');

-- 8. 방 사진 (tb_rooms_images)
INSERT INTO `tb_rooms_images` (`room_no`, `room_original_image_name`, `room_stored_image_name`) 
VALUES 
('room1', 'room101_main.jpg', 'uuid-room1-img1.jpg'),
('room3', 'room201_main.jpg', 'uuid-room3-img1.jpg');

-- 9. 리뷰 (tb_reviews)
INSERT INTO `tb_reviews` (`review_no`, `room_no`, `user_no`, `rating`, `review_content`) 
VALUES 
(1, 'room1', 'user1', 5, '방이 정말 깨끗하고 채광이 좋습니다. 관리도 잘 되고 있어요.');

-- 10. 게시판 유형 (tb_board_type)
INSERT INTO `tb_board_type` (`board_type_no`, `board_type_name`) 
VALUES 
('N1', '공지사항'),
('Q1', 'Q&A'),
('E1', '이벤트'),
('I1', '정책・정보');

-- 11. 게시글 (tb_posts)
INSERT INTO `tb_posts` (`post_no`, `board_type_no`, `user_no`, `post_title`, `post_content`, `post_comment_yn`, `post_files_yn`) 
VALUES 
(1, 'N1', 'lessor1', '우리집오피스텔 주차장 공사 안내', '3월 15일부터 17일까지 주차장 바닥 공사를 진행합니다.', 0, 1),
(2, 'Q1', 'user1', '계약 연장 관련 문의', '계약 연장을 하고 싶은데 절차가 어떻게 되나요?', 1, 0),
(3, 'E1', 'lessor1', '봄맞이 신규 입주 이벤트', '3월 신규 계약자 첫 달 월세 10% 할인!', 0, 0);

-- 12. 댓글 (tb_comments)
INSERT INTO `tb_comments` (`comment_no`, `post_no`, `user_no`, `comment_content`) 
VALUES 
(1, 2, 'lessor1', '안녕하세요, 마이페이지의 계약 상세에서 연장 신청 버튼을 눌러주시면 됩니다.');

-- 13. 첨부파일 (tb_files)
INSERT INTO `tb_files` (`file_no`, `post_no`, `original_file_name`, `updated_file_name`) 
VALUES 
(1, 1, '공사안내문.pdf', 'uuid-file-1.pdf');

-- 14. 배너 이미지 (tb_banner_images)
INSERT INTO `tb_banner_images` (`banner_image_no`, `post_no`, `original_file_name`, `updated_file_name`) 
VALUES 
(1, 3, 'spring_event.png', 'uuid-banner-1.png');

-- 15. 부대시설 카테고리 (tb_fm_category)
INSERT INTO `tb_fm_category` (`facility_code`, `facility_type`, `facility_options`) 
VALUES 
(1, '라운지', '{"wifi": true, "coffee": true}'),
(2, '세탁실', '{"washer": 2, "dryer": 1}'),
(3, '운동시설', '{"treadmill": 3, "weights": true}');

-- 16. 부대시설 목록 (tb_fm_list)
INSERT INTO `tb_fm_list` (`facility_no`, `house_no`, `facility_code`, `facility_name`, `facility_location`, `facility_open_time`, `facility_close_time`, `facility_rsvn_required_yn`) 
VALUES 
('fac1', 'house1', 3, '입주민 전용 헬스장', 1, '06:00:00', '23:00:00', 0),
('fac2', 'house1', 1, '공용 스터디 라운지', 2, '00:00:00', '23:59:59', 1);

-- 17. 부대시설 사진 (tb_fm_images)
INSERT INTO `tb_fm_images` (`facility_image_no`, `facility_no`, `facility_original_image_name`, `facility_stored_image_name`) 
VALUES 
(1, 'fac1', 'gym_main.jpg', 'uuid-fac1-img1.jpg');

-- 18. 부대시설 예약 (tb_fm_rsvn)
INSERT INTO `tb_fm_rsvn` (`rsvn_no`, `facility_no`, `user_no`, `rsvn_name`, `rsvn_phone`, `rsvn_date`, `rsvn_start_time`, `rsvn_end_time`, `rsvn_status`) 
VALUES 
('rsvn1', 'fac2', 'user1', '박일번', '010-2222-2222', '2026-03-20', '19:00:00', '21:00:00', 'APPROVED');