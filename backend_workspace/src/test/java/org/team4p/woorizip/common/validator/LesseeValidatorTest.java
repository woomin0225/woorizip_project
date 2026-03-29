package org.team4p.woorizip.common.validator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.repository.ContractRepository;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class LesseeValidatorTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ContractRepository contractRepository;

    private LesseeValidator lesseeValidator;

    @BeforeEach
    void setUp() {
        lesseeValidator = new LesseeValidator(roomRepository, contractRepository);
    }

    @Test
    void validLesseeRequiresCurrentApprovedContract() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        ContractEntity pendingContract = contract("ROOM-1", today.minusDays(2), 1, "APPLIED");
        when(contractRepository.findByUserNo("USER-1")).thenReturn(List.of(pendingContract));

        assertThrows(NotFoundException.class, () -> lesseeValidator.validLessee("USER-1"));
    }

    @Test
    void validFacilityAccessLesseeAllowsUpcomingApprovedContract() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        ContractEntity approvedUpcoming = contract("ROOM-2", today.plusDays(7), 12, "APPROVED");
        when(contractRepository.findByUserNo("USER-2")).thenReturn(List.of(approvedUpcoming));
        when(roomRepository.findById("ROOM-2")).thenReturn(Optional.of(room("ROOM-2", "HOUSE-2")));

        String houseNo = lesseeValidator.validFacilityAccessLessee("USER-2");

        assertEquals("HOUSE-2", houseNo);
    }

    @Test
    void validFacilityAccessLesseePrefersCurrentContractOverFutureOne() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        ContractEntity approvedUpcoming = contract("ROOM-FUTURE", today.plusDays(14), 12, "APPROVED");
        ContractEntity activeCurrent = contract("ROOM-CURRENT", today.minusMonths(1), 3, "ACTIVE");
        when(contractRepository.findByUserNo(anyString()))
                .thenReturn(List.of(approvedUpcoming, activeCurrent));
        when(roomRepository.findById("ROOM-CURRENT"))
                .thenReturn(Optional.of(room("ROOM-CURRENT", "HOUSE-CURRENT")));

        String houseNo = lesseeValidator.validFacilityAccessLessee("USER-3");

        assertEquals("HOUSE-CURRENT", houseNo);
    }

    private ContractEntity contract(String roomNo, LocalDate moveInDate, int termMonths, String status) {
        return ContractEntity.builder()
                .contractNo("CONTRACT-" + roomNo)
                .roomNo(roomNo)
                .userNo("USER")
                .moveInDate(Date.from(moveInDate.atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant()))
                .termMonths(termMonths)
                .status(status)
                .build();
    }

    private RoomEntity room(String roomNo, String houseNo) {
        return RoomEntity.builder()
                .roomNo(roomNo)
                .houseNo(houseNo)
                .build();
    }
}
