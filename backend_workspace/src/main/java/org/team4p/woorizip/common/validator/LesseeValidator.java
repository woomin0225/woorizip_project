package org.team4p.woorizip.common.validator;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.repository.ContractRepository;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LesseeValidator {

	private final RoomRepository roomRepository;
	private final ContractRepository contractRepository;

	public String validLessee(String userNo) {

		Calendar todayCal = Calendar.getInstance();
		todayCal.set(Calendar.HOUR_OF_DAY, 0);
		todayCal.set(Calendar.MINUTE, 0);
		todayCal.set(Calendar.SECOND, 0);
		todayCal.set(Calendar.MILLISECOND, 0);
		Date today = todayCal.getTime();

		ContractEntity validContract = null;

		// 해당 사용자의 유효한 임대차 계약 확인
		List<ContractEntity> contracts = contractRepository.findByUserNo(userNo);

		for (int i = 0; i < contracts.size(); i++) {
			ContractEntity c = contracts.get(i);

			Date moveInDate = c.getMoveInDate();
			int termMonths = c.getTermMonths();

			if (moveInDate == null)
				continue;

			Calendar endCal = Calendar.getInstance();
			endCal.setTime(moveInDate);
			endCal.set(Calendar.HOUR_OF_DAY, 0);
			endCal.set(Calendar.MINUTE, 0);
			endCal.set(Calendar.SECOND, 0);
			endCal.set(Calendar.MILLISECOND, 0);

			endCal.add(Calendar.MONTH, termMonths);
			Date moveOutDate = endCal.getTime();

			if (!today.before(moveInDate) && !today.after(moveOutDate)) {
				validContract = c;
				break;
			}
		}

		if (validContract == null) {
			throw new NotFoundException("유효한 계약 정보를 찾을 수 없습니다.");
		}

		// 실존하는 방인지 확인
		RoomEntity room = roomRepository.findById(validContract.getRoomNo())
				.orElseThrow(() -> new NotFoundException("방 정보를 찾을 수 없습니다."));

		String houseNo = room.getHouseNo();

		return houseNo;
	}

}
