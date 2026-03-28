package org.team4p.woorizip.room.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.repository.ContractRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomAvailabilityPolicyService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final Set<String> OCCUPYING_CONTRACT_STATUSES =
            Set.of("APPROVED", "PAID", "ACTIVE");

    private final ContractRepository contractRepository;

    public RoomAvailabilityPolicy evaluate(
            String roomNo,
            LocalDate fallbackAvailableDate,
            Boolean fallbackEmptyYn
    ) {
        LocalDate today = LocalDate.now(KST);
        ContractEntity activeContract = findActiveOccupancyContract(roomNo, today);
        ContractEntity upcomingContract = activeContract == null
                ? findNearestUpcomingOccupancyContract(roomNo, today)
                : null;

        if (activeContract == null && upcomingContract == null) {
            boolean isEmpty = !Boolean.FALSE.equals(fallbackEmptyYn);
            return new RoomAvailabilityPolicy(
                    isEmpty,
                    isEmpty,
                    isEmpty,
                    fallbackAvailableDate,
                    null
            );
        }

        if (activeContract != null) {
            LocalDate occupancyEndDate = calculateOccupancyEndDate(activeContract);
            LocalDate actualAvailableDate = occupancyEndDate != null ? occupancyEndDate.plusDays(1) : fallbackAvailableDate;
            LocalDate reopenDate = occupancyEndDate != null ? occupancyEndDate.minusMonths(1) : today;
            boolean canApply = occupancyEndDate == null || !today.isBefore(reopenDate);

            return new RoomAvailabilityPolicy(
                    false,
                    canApply,
                    canApply,
                    actualAvailableDate,
                    occupancyEndDate
            );
        }

        LocalDate reservedOccupancyEndDate = calculateOccupancyEndDate(upcomingContract);
        LocalDate reservedAvailableDate = reservedOccupancyEndDate != null
                ? reservedOccupancyEndDate.plusDays(1)
                : fallbackAvailableDate;

        return new RoomAvailabilityPolicy(
                false,
                false,
                false,
                reservedAvailableDate,
                reservedOccupancyEndDate
        );
    }

    public void validateContractApplication(String roomNo, LocalDate moveInDate) {
        RoomAvailabilityPolicy policy = evaluate(roomNo, moveInDate, true);
        if (!policy.canContractApply()) {
            throw new IllegalStateException("현재 거주중인 방으로 계약 신청이 아직 열리지 않았습니다.");
        }
        if (moveInDate != null && policy.actualAvailableDate() != null && moveInDate.isBefore(policy.actualAvailableDate())) {
            throw new IllegalStateException(
                    "계약 시작일은 " + policy.actualAvailableDate() + " 이후로만 신청할 수 있습니다."
            );
        }
    }

    public void validateTourApplication(String roomNo) {
        RoomAvailabilityPolicy policy = evaluate(roomNo, null, true);
        if (!policy.canTourApply()) {
            throw new IllegalStateException("현재 거주중인 방으로 투어 신청은 계약 종료 1개월 전부터 가능합니다.");
        }
    }

    public boolean hasCurrentOccupancy(String roomNo) {
        if (roomNo == null || roomNo.isBlank()) {
            return false;
        }
        return findActiveOccupancyContract(roomNo, LocalDate.now(KST)) != null;
    }

    private ContractEntity findActiveOccupancyContract(String roomNo, LocalDate today) {
        List<ContractEntity> contracts = contractRepository.findByRoomNoAndStatusInOrderByMoveInDateAsc(
                roomNo,
                OCCUPYING_CONTRACT_STATUSES
        );

        for (ContractEntity contract : contracts) {
            LocalDate moveInDate = toLocalDate(contract.getMoveInDate());
            LocalDate moveOutDate = calculateOccupancyEndDate(contract);
            if (moveInDate == null || moveOutDate == null) {
                continue;
            }
            if (!today.isBefore(moveInDate) && !today.isAfter(moveOutDate)) {
                return contract;
            }
        }
        return null;
    }

    private ContractEntity findNearestUpcomingOccupancyContract(String roomNo, LocalDate today) {
        List<ContractEntity> contracts = contractRepository.findByRoomNoAndStatusInOrderByMoveInDateAsc(
                roomNo,
                OCCUPYING_CONTRACT_STATUSES
        );

        for (ContractEntity contract : contracts) {
            LocalDate moveInDate = toLocalDate(contract.getMoveInDate());
            LocalDate moveOutDate = calculateOccupancyEndDate(contract);
            if (moveInDate == null || moveOutDate == null) {
                continue;
            }
            if (today.isBefore(moveInDate)) {
                return contract;
            }
        }
        return null;
    }

    public LocalDate calculateOccupancyEndDate(ContractEntity contract) {
        LocalDate moveInDate = toLocalDate(contract.getMoveInDate());
        if (moveInDate == null) {
            return null;
        }
        return moveInDate.plusMonths(Math.max(contract.getTermMonths(), 0));
    }

    private LocalDate toLocalDate(Date value) {
        if (value == null) {
            return null;
        }
        return value.toInstant().atZone(KST).toLocalDate();
    }

    public record RoomAvailabilityPolicy(
            boolean roomEmpty,
            boolean canTourApply,
            boolean canContractApply,
            LocalDate actualAvailableDate,
            LocalDate occupancyEndDate
    ) {}
}
