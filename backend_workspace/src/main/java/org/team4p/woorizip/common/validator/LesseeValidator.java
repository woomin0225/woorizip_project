package org.team4p.woorizip.common.validator;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Set;

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

	private static final Set<String> ACCESSIBLE_CONTRACT_STATUSES =
			Set.of("APPROVED", "PAID", "ACTIVE");

	private final RoomRepository roomRepository;
	private final ContractRepository contractRepository;

	public String validLessee(String userNo) {
		Date today = getToday();
		List<ContractEntity> contracts = contractRepository.findByUserNo(userNo);
		ContractEntity validContract = findCurrentAccessibleContract(contracts, today);

		if (validContract == null) {
			throw new NotFoundException("유효한 계약 정보를 찾을 수 없습니다.");
		}

		return resolveHouseNo(validContract);
	}

	public String validFacilityAccessLessee(String userNo) {
		Date today = getToday();
		List<ContractEntity> contracts = contractRepository.findByUserNo(userNo);

		ContractEntity currentContract = findCurrentAccessibleContract(contracts, today);
		if (currentContract != null) {
			return resolveHouseNo(currentContract);
		}

		ContractEntity upcomingContract = findNearestUpcomingAccessibleContract(contracts, today);
		if (upcomingContract != null) {
			return resolveHouseNo(upcomingContract);
		}

		throw new NotFoundException("유효한 계약 정보를 찾을 수 없습니다.");
	}

	private Date getToday() {

		Calendar todayCal = Calendar.getInstance();
		todayCal.set(Calendar.HOUR_OF_DAY, 0);
		todayCal.set(Calendar.MINUTE, 0);
		todayCal.set(Calendar.SECOND, 0);
		todayCal.set(Calendar.MILLISECOND, 0);
		return todayCal.getTime();
	}

	private ContractEntity findCurrentAccessibleContract(List<ContractEntity> contracts, Date today) {
		if (contracts == null) {
			return null;
		}

		for (int i = 0; i < contracts.size(); i++) {
			ContractEntity c = contracts.get(i);
			if (!isAccessibleStatus(c)) {
				continue;
			}

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
				return c;
			}
		}
		return null;
	}

	private ContractEntity findNearestUpcomingAccessibleContract(List<ContractEntity> contracts, Date today) {
		if (contracts == null) {
			return null;
		}

		ContractEntity nearestContract = null;
		for (int i = 0; i < contracts.size(); i++) {
			ContractEntity c = contracts.get(i);
			if (!isAccessibleStatus(c)) {
				continue;
			}

			Date moveInDate = c.getMoveInDate();
			if (moveInDate == null || !moveInDate.after(today)) {
				continue;
			}

			if (nearestContract == null || moveInDate.before(nearestContract.getMoveInDate())) {
				nearestContract = c;
			}
		}
		return nearestContract;
	}

	private boolean isAccessibleStatus(ContractEntity contract) {
		String status = contract != null ? contract.getStatus() : null;
		return ACCESSIBLE_CONTRACT_STATUSES.contains(String.valueOf(status).toUpperCase());
	}

	private String resolveHouseNo(ContractEntity contract) {
		RoomEntity room = roomRepository.findById(contract.getRoomNo())
				.orElseThrow(() -> new NotFoundException("방 정보를 찾을 수 없습니다."));

		return room.getHouseNo();
	}

}
