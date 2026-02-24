-- db_sample_data.sql
-- ==========================================================


-- 1. 회원 (임대인 1명, 임차인 2명)
INSERT INTO `tb_users` (`user_no`, `email_id`, `password`, `name`, `phone`, `gender`, `birth_date`, `type`, `role`, `deleted_yn`) 
VALUES 
('lessor1', 'lessor@test.com', '$2a$10$Dfm3jPYmx2TvooIJ7zTZruXc3f1z/kOh8SCBZdVgikF90E2bBc/Yi', '김임대', '010-1111-1111', 'M', '1980-01-01', 'LESSOR', 'USER', 'N'),
('user1', 'user1@test.com', '$2a$10$cuSDGuEpLkxydGri9qhQcuWym4C8sEWca4j6ZglG7QmIgI.KHuNs.', '박일번', '010-2222-2222', 'F', '1995-05-05', 'USER', 'USER', 'N'),
('user2', 'user2@test.com', '$2a$10$GVeykywuFavxmd8HHN.y7OznrDGyHuWiD/y2Uav3vuLgQjMgvKh4W', '이이번', '010-3333-3333', 'M', '1998-08-08', 'USER', 'USER', 'N');

-- 2. 건물 2개 (모두 '김임대' 소유)
INSERT INTO `tb_houses`
(`house_no`, `house_name`, `user_no`, `house_zip`, `house_address`, `house_address_detail`,
 `house_completion_year`, `house_floors`, `house_house_holds`, `house_elevator_yn`, `house_pet_yn`,
 `house_female_limit`, `house_parking_max`, `house_abstract`, `house_image_count`,
 `house_lat`, `house_lng`, `deleted`, `deleted_at`) 
VALUES 
('house1', '우리집오피스텔', 'lessor1', '06236', '서울특별시 강남구 테헤란로 142', '101호', 2020, 5, 20, 1, 0, 0, 10, '역세권 깔끔한 오피스텔입니다.', 5, 37.49990000, 127.03330000, 0, NULL),
('house2', '너네집빌라',     'lessor1', '06570', '서울특별시 서초구 방배로 173',       '202호', 2015, 4,  8, 0, 1, 0,  4, '반려동물 환영하는 조용한 빌라',     3, 37.49390000, 126.99250000, 0, NULL),
('house3',  '강서네스트03',     'lessor1', '07801', '서울특별시 강서구 공항대로 247',     '2~10층', 2018, 10, 72, 1, 1, 0, 12, '강서권 코리빙. 공용 라운지/주방/세탁존.', 4, 37.55890000, 126.83270000, 0, NULL),
('house4',  '홍대스테이04',     'lessor1', '04044', '서울특별시 마포구 양화로 130',       '2~6층',  2013,  6, 28, 0, 0, 0,  2, '홍대 생활권, 합리형 원룸/투룸 구성.',     3, 37.55630000, 126.92300000, 0, NULL),
('house5',  '종로어반05',       'lessor1', '03161', '서울특별시 종로구 종로 120',          'B1~8층', 2011,  8, 55, 1, 0, 0,  4, '도심 직주근접, 관리 우수.',               2, 37.57020000, 126.98720000, 0, NULL),
('house6',  '용산리버06',       'lessor1', '04320', '서울특별시 용산구 한강대로 95',       '4~12층', 2019, 12, 80, 1, 1, 0, 10, '용산/한강 접근성, 커뮤니티형.',           5, 37.55470000, 126.97230000, 0, NULL),
('house7',  '강동메트로07',     'lessor1', '05355', '서울특별시 강동구 천호대로 1000',     '1~7층',  2014,  7, 36, 1, 0, 0,  6, '역세권 실속형 코리빙.',                   3, 37.54390000, 127.12590000, 0, NULL),
('house8',  '노원그린08',       'lessor1', '01699', '서울특별시 노원구 동일로 1414',       '1~6층',  2009,  6, 24, 0, 1, 0,  3, '조용한 주거지, 반려동물 가능.',            2, 37.65430000, 127.06090000, 0, NULL),
('house9',  '관악메이트09',     'lessor1', '08790', '서울특별시 관악구 남부순환로 1790',   '2~5층',  2012,  5, 18, 0, 0, 1,  1, '여성전용 운영, 스터디존 특화.',           3, 37.47900000, 126.95230000, 0, NULL),
('house10', '성수커먼10',       'lessor1', '04785', '서울특별시 성동구 아차산로 113',      '3~9층',  2017,  9, 45, 1, 1, 0,  6, '성수 상권 인접, 공용라운지/세탁존.',      4, 37.54820000, 127.05520000, 0, NULL);

-- 3. 방
INSERT INTO `tb_rooms`
(`room_no`, `room_name`, `house_no`, `user_no`,
 `room_deposit`, `room_monthly`, `room_method`, `room_area`, `room_facing`, `room_available_date`,
 `room_abstract`, `room_room_count`, `room_bath_count`, `room_empty_yn`, `room_status`,
 `room_options`, `room_image_count`, `deleted`, `deleted_at`) 
VALUES 
-- house1
('room1', '101호', 'house1', 'lessor1', 10000000, 500000, 'M', 30.50, '남향', '2026-03-01', '채광 좋은 남향 방', 1, 1, 1, 'ACTIVE', '에어컨,냉장고,세탁기', 3, 0, NULL),
('room2', '102호', 'house1', 'lessor1', 15000000, 600000, 'M', 35.00, '동향', '2026-03-15', '넓은 원룸',          1, 1, 1, 'ACTIVE', '침대,책상,옷장,WiFi',   2, 0, NULL),
-- house2
('room3', '201호', 'house2', 'lessor1', 50000000, NULL,   'L', 45.00, '남향', '2026-04-01', '전세 귀한 매물',      2, 1, 1, 'ACTIVE', '',                    4, 0, NULL),
-- house3
('room4',  '301호', 'house3', 'lessor1', 10000000,  650000, 'M', 22.50, '남향',   '2026-03-03', '강서 네스트, 채광 좋은 남향 원룸', 1, 1, 1, 'ACTIVE', '에어컨,냉장고,세탁기', 3, 0, NULL),
('room5',  '502호', 'house3', 'lessor1', 20000000,  850000, 'M', 28.00, '동향',   '2026-03-10', '강서 네스트, 동향 1.5룸',          1, 1, 1, 'ACTIVE', '침대,책상,옷장,WiFi',   4, 0, NULL),
('room6',  '703호', 'house3', 'lessor1', 180000000, NULL,   'L', 35.00, '남서향', '2026-04-01', '강서 네스트, 전세 매물',           2, 1, 1, 'ACTIVE', '',                    5, 0, NULL),
-- house4
('room7',  '201호', 'house4', 'lessor1',  8000000,  550000, 'M', 19.50, '북향',   '2026-03-05', '홍대 스테이, 실속형 원룸',         1, 1, 1, 'ACTIVE', '에어컨,세탁기',         2, 0, NULL),
('room8',  '302호', 'house4', 'lessor1', 12000000,  620000, 'M', 23.00, '남동향', '2026-03-20', '홍대 스테이, 남동향 채광',         1, 1, 1, 'ACTIVE', '냉장고,전자레인지',     3, 0, NULL),
('room9',  '401호', 'house4', 'lessor1', 15000000,  700000, 'M', 26.50, '서향',   '2026-04-10', '홍대 스테이, 투룸형',              2, 1, 0, 'ACTIVE', '침대,옷장,WiFi',        4, 0, NULL),
-- house5
('room10', '203호', 'house5', 'lessor1', 10000000,  600000, 'M', 20.00, '동향',   '2026-03-08', '종로 어반, 도심 직주근접',         1, 1, 1, 'ACTIVE', '에어컨,냉장고',         2, 0, NULL),
('room11', '505호', 'house5', 'lessor1', 30000000,  900000, 'M', 30.00, '남향',   '2026-03-25', '종로 어반, 남향 1.5룸',            1, 1, 1, 'ACTIVE', '침대,책상,옷장',         4, 0, NULL),
('room12', '801호', 'house5', 'lessor1', 220000000, NULL,   'L', 38.00, '남동향', '2026-04-15', '종로 어반, 전세 매물',             2, 1, 1, 'ACTIVE', '',                    5, 0, NULL),
-- house6
('room13', '402호', 'house6', 'lessor1', 15000000,  800000, 'M', 24.00, '북서향', '2026-03-12', '용산 리버, 북서향 전망',           1, 1, 1, 'ACTIVE', '에어컨,세탁기,WiFi',     3, 0, NULL),
('room14', '706호', 'house6', 'lessor1', 25000000, 1000000, 'M', 32.00, '남향',   '2026-03-30', '용산 리버, 남향 투룸',             2, 1, 1, 'ACTIVE', '풀옵션(에어컨/냉장고/세탁기/침대)', 5, 0, NULL),
('room15', '1002호','house6', 'lessor1', 260000000, NULL,   'L', 42.00, '남서향', '2026-04-20', '용산 리버, 전세 희소',             2, 2, 0, 'ACTIVE', '',                    6, 0, NULL),
-- house7
('room16', '101호', 'house7', 'lessor1',  7000000,  520000, 'M', 18.00, '북향',   '2026-03-02', '강동 메트로, 역세권 원룸',         1, 1, 1, 'ACTIVE', '에어컨',               1, 0, NULL),
('room17', '303호', 'house7', 'lessor1', 12000000,  650000, 'M', 23.50, '동향',   '2026-03-18', '강동 메트로, 동향 채광',           1, 1, 1, 'ACTIVE', '냉장고,세탁기',         3, 0, NULL),
('room18', '605호', 'house7', 'lessor1', 18000000,  750000, 'M', 27.00, '남동향', '2026-04-05', '강동 메트로, 1.5룸',               1, 1, 0, 'ACTIVE', '침대,책상,WiFi',         4, 0, NULL),
-- house8
('room19', '102호', 'house8', 'lessor1',  6000000,  450000, 'M', 17.50, '서향',   '2026-03-06', '노원 그린, 반려동물 가능',         1, 1, 1, 'ACTIVE', '세탁기',               2, 0, NULL),
('room20', '204호', 'house8', 'lessor1',  9000000,  520000, 'M', 20.00, '북동향', '2026-03-22', '노원 그린, 통풍 좋음',            1, 1, 1, 'ACTIVE', '냉장고,전자레인지',     2, 0, NULL),
('room21', '501호', 'house8', 'lessor1', 14000000,  600000, 'M', 24.00, '남향',   '2026-04-08', '노원 그린, 남향 채광',             1, 1, 0, 'ACTIVE', '에어컨,옷장',           3, 0, NULL),
-- house9
('room22', '201호', 'house9', 'lessor1',  8000000,  500000, 'M', 18.50, '북향',   '2026-03-04', '관악 메이트, 여성전용 원룸',       1, 1, 1, 'ACTIVE', 'WiFi',                2, 0, NULL),
('room23', '302호', 'house9', 'lessor1', 12000000,  580000, 'M', 21.50, '남동향', '2026-03-21', '관악 메이트, 스터디존 이용',       1, 1, 1, 'ACTIVE', '에어컨,책상',           3, 0, NULL),
('room24', '501호', 'house9', 'lessor1', 15000000,  650000, 'M', 25.00, '남향',   '2026-04-07', '관악 메이트, 남향 1.5룸',          1, 1, 0, 'ACTIVE', '침대,옷장',            4, 0, NULL),
-- house10
('room25', '301호', 'house10','lessor1', 10000000,  650000, 'M', 22.50, '남향',   '2026-03-03', '성수 커먼, 남향 원룸',             1, 1, 1, 'ACTIVE', '에어컨,세탁기',         3, 0, NULL),
('room26', '502호', 'house10','lessor1', 20000000,  850000, 'M', 28.00, '동향',   '2026-03-10', '성수 커먼, 동향 1.5룸',            1, 1, 1, 'ACTIVE', '침대,책상,WiFi',         4, 0, NULL),
('room27', '703호', 'house10','lessor1', 180000000, NULL,   'L', 35.00, '남서향', '2026-04-01', '성수 커먼, 전세 매물',             2, 1, 1, 'ACTIVE', '',                    5, 0, NULL);

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
(2, '세탁실', '{"washer": true, "dryer": true}'),
(3, '운동시설', '{"treadmill": true, "weights": true}');

-- 16. 부대시설 목록 (tb_fm_list)
INSERT INTO `tb_fm_list` (`facility_no`, `house_no`, `facility_code`, `facility_name`, `facility_option_info`, `facility_location`, `facility_open_time`, `facility_close_time`, `facility_rsvn_required_yn`) 
VALUES 
('fac1', 'house1', 3, '입주민 전용 헬스장', '{"treadmill": true, "weights": true}', 1, '06:00:00', '23:00:00', 0),
('fac2', 'house1', 1, '공용 스터디 라운지', '{"wifi": true, "coffee": true}', 2, '00:00:00', '23:59:59', 1);

-- 17. 부대시설 사진 (tb_fm_images)
INSERT INTO `tb_fm_images` (`facility_image_no`, `facility_no`, `facility_original_image_name`, `facility_stored_image_name`) 
VALUES 
(1, 'fac1', 'gym_main.jpg', 'uuid-fac1-img1.jpg');

-- 18. 부대시설 예약 (tb_fm_rsvn)
INSERT INTO `tb_fm_rsvn` (`rsvn_no`, `facility_no`, `user_no`, `rsvn_name`, `rsvn_phone`, `rsvn_date`, `rsvn_start_time`, `rsvn_end_time`, `rsvn_status`) 
VALUES 
('rsvn1', 'fac2', 'user1', '박일번', '010-2222-2222', '2026-03-20', '19:00:00', '21:00:00', 'APPROVED');