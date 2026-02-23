-- db_sample_data.sql
-- ==========================================================
-- db_sample_data.sql
-- ==========================================================


-- 1. 회원 (임대인 1명, 임차인 2명)
INSERT INTO `tb_users` (`user_no`, `email_id`, `password`, `name`, `phone`, `gender`, `birth_date`, `type`, `role`, `deleted_yn`) 
VALUES 
('lessor1', 'lessor@test.com', 'pass1234!', '김임대', '010-1111-1111', 'M', '1980-01-01', 'LESSOR', 'USER', 'N'),
('user1', 'user1@test.com', 'pass1234!', '박일번', '010-2222-2222', 'F', '1995-05-05', 'USER', 'USER', 'N'),
('user2', 'user2@test.com', 'pass1234!', '이이번', '010-3333-3333', 'M', '1998-08-08', 'USER', 'USER', 'N');

-- 2. 건물 2개 (모두 '김임대' 소유)
INSERT INTO `tb_houses` (`house_no`, `house_name`, `user_no`, `house_zip`, `house_address`, `house_address_detail`, `house_completion_year`, `house_floors`, `house_households`, `house_elevator_yn`, `house_pet_yn`, `house_female_limit`, `house_parking_max`, `house_abstract`, `house_image_count`) 
VALUES 
('house1', '우리집오피스텔', 'lessor1', '06000', '서울 강남구 역삼동', '101번지', 2020, 5, 20, 1, 0, 0, 10, '역세권 깔끔한 오피스텔입니다.', 5),
('house2', '너네집빌라', 'lessor1', '06001', '서울 서초구 방배동', '202번지', 2015, 4, 8, 0, 1, 0, 4, '반려동물 환영하는 조용한 빌라', 3);

-- 3. 방 3개 (오피스텔에 2개, 빌라에 1개)
INSERT INTO `tb_rooms` (`room_no`, `room_name`, `house_no`, `user_no`, `room_deposit`, `room_monthly`, `room_method`, `room_area`, `room_facing`, `room_available_date`, `room_abstract`, `room_room_count`, `room_bath_count`, `room_empty_yn`, `room_status`, `room_image_count`) 
VALUES 
('room1', '101호', 'house1', 'lessor1', 10000000, 500000, '월세', 30.5, '남향', '2026-03-01', '채광 좋은 남향 방', 1, 1, 1, 'ACTIVE', 3),
('room2', '102호', 'house1', 'lessor1', 15000000, 600000, '월세', 35.0, '동향', '2026-03-15', '넓은 원룸', 1, 1, 1, 'ACTIVE', 2),
('room3', '201호', 'house2', 'lessor1', 50000000, 0, '전세', 45.0, '남향', '2026-04-01', '전세 귀한 매물', 2, 1, 1, 'ACTIVE', 4);

-- 4. 찜 (위시리스트)
INSERT INTO `tb_wishlists` (`wish_no`, `user_no`, `house_no`, `room_no`) 
VALUES 
('wish1', 'user1', 'house1', 'room1'), -- 박일번이 101호 찜
('wish2', 'user1', 'house2', 'room3'); -- 박일번이 201호 찜

-- 5. 투어 신청
INSERT INTO `tb_tours` (`tour_no`, `room_no`, `user_no`, `visit_date`, `visit_time`, `status`, `message`) 
VALUES 
('tour1', 'room1', 'user1', '2026-03-05', '14:00:00', 'PENDING', '방 구조를 직접 보고 싶습니다.'),
('tour2', 'room3', 'user2', '2026-03-06', '11:00:00', 'APPROVED', '대출 가능한지 서류 챙겨갈게요.');

-- 6. 계약 정보
INSERT INTO `tb_contracts` (`contract_no`, `room_no`, `user_no`, `move_in_date`, `term_months`, `status`) 
VALUES 
('cont1', 'room1', 'user1', '2026-03-10', 12, 'ACTIVE'), -- 박일번 101호 계약 완료 (ACTIVE)
('cont2', 'room3', 'user2', '2026-04-10', 24, 'APPLIED'); -- 이이번 201호 입주 신청 상태