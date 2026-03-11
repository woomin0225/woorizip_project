-- 기존 운영 DB에 투어/입주 중복 신청 방지 반영용 패치
-- 실행 전, 같은 슬롯(방/날짜/시간)에 활성 상태 데이터 중복이 없는지 먼저 확인하세요.

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
