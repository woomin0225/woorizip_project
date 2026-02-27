package org.team4p.woorizip.contract.model.service;

import java.util.ArrayList;
import java.sql.Timestamp;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.repository.ContractRepository;
import org.team4p.woorizip.contract.model.dto.ContractDto;
import org.team4p.woorizip.contract.model.dto.request.ContractElectronicCreateRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractPaymentRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractSignatureVerifyRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractServiceImpl implements ContractService {

    private static final Set<String> ACTIVE_CONTRACT_STATUSES =
            Set.of("APPLIED", "APPROVED", "PAID", "ACTIVE", "AMENDMENT_REQUESTED");

    private final ContractRepository contractRepository;

    @Override
    public ContractDto selectContract(String contractNo) {
        ContractEntity entity = contractRepository.findByContractNo(contractNo);
        return entity != null ? ContractDto.fromEntity(entity) : null;
    }

    @Override
    public PageResponse<ContractDto> selectListContract(String userNo, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Page<ContractEntity> resultPage = contractRepository.findByUserNoOrderByMoveInDateDesc(userNo, pageable);

        List<ContractDto> content = toList(resultPage.getContent());
        return new PageResponse<>(
                content,
                safePage,
                safeSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
    }

    @Override
    @Transactional
    public ContractDto insertContract(ContractDto contractDto) {
        contractDto.setStatus("APPLIED");
        ContractEntity entity = contractDto.toEntity();

        boolean alreadyReserved = contractRepository.existsByRoomNoAndMoveInDateAndStatusIn(
                entity.getRoomNo(),
                entity.getMoveInDate(),
                ACTIVE_CONTRACT_STATUSES
        );
        if (alreadyReserved) {
            throw new IllegalStateException("이미 신청된 입주 날짜입니다.");
        }

        try {
            ContractEntity saved = contractRepository.save(entity);
            return ContractDto.fromEntity(saved);
        } catch (DataIntegrityViolationException e) {
            log.warn("입주 신청 중복 차단: roomNo={}, moveInDate={}", entity.getRoomNo(), entity.getMoveInDate());
            throw new IllegalStateException("이미 신청된 입주 날짜입니다.");
        } catch (Exception e) {
            log.error("계약 등록 중 오류 발생: {}", e.getMessage());
            throw new IllegalStateException("입주 신청 처리 중 오류가 발생했습니다.");
        }
    }

    @Override
    @Transactional
    public int requestAmendment(String originalNo, ContractDto amendmentDto) {
        if (contractRepository.existsByParentContractNoAndStatus(originalNo, "AMENDMENT_REQUESTED")) {
            return -1;
        }

        ContractEntity entity = amendmentDto.toEntity();
        entity.setParentContractNo(originalNo);
        entity.setStatus("AMENDMENT_REQUESTED");
        entity.setContractNo(null);

        contractRepository.save(entity);
        return 1;
    }

    @Override
    @Transactional
    public int decideAmendment(String amendmentNo, boolean approved, String reason) {
        ContractEntity amendment = contractRepository.findById(amendmentNo)
                .orElseThrow(() -> new RuntimeException("데이터를 찾을 수 없습니다."));

        ContractEntity original = contractRepository.findById(amendment.getParentContractNo())
                .orElseThrow(() -> new RuntimeException("연결된 원본 계약서를 찾을 수 없습니다."));

        if (approved) {
            original.updateFromAmendment(amendment);
            original.setStatus("APPROVED");
            amendment.setStatus("APPROVED");
        } else {
            amendment.setStatus("REJECTED");
            amendment.setRejectionReason(reason);
        }

        return 1;
    }

    @Override
    @Transactional
    public int cancelContract(String contractNo, String reason) {
        ContractEntity target = contractRepository.findById(contractNo).orElse(null);
        if (target == null) {
            return 0;
        }
        target.setStatus("REJECTED");
        target.setRejectionReason(reason);
        return 1;
    }

    @Override
    @Transactional
    public ContractDto createElectronicContract(String contractNo, ContractElectronicCreateRequest request) {
        ContractEntity target = contractRepository.findById(contractNo)
                .orElseThrow(() -> new IllegalArgumentException("계약 정보를 찾을 수 없습니다."));

        if (target.getContractUrl() == null || target.getContractUrl().isBlank()) {
            target.setContractUrl("https://sandbox.eformsign.com/mock/contracts/" + contractNo);
        }
        if ("APPLIED".equalsIgnoreCase(target.getStatus())) {
            target.setStatus("APPROVED");
        }
        return ContractDto.fromEntity(target);
    }

    @Override
    @Transactional
    public ContractDto verifyElectronicSignature(String contractNo, ContractSignatureVerifyRequest request) {
        ContractEntity target = contractRepository.findById(contractNo)
                .orElseThrow(() -> new IllegalArgumentException("계약 정보를 찾을 수 없습니다."));

        String signerName = request != null ? request.getSignerName() : null;
        if (signerName == null || signerName.trim().isEmpty()) {
            throw new IllegalArgumentException("전자서명자 이름은 필수입니다.");
        }

        if ("APPLIED".equalsIgnoreCase(target.getStatus())) {
            target.setStatus("APPROVED");
        }
        return ContractDto.fromEntity(target);
    }

    @Override
    @Transactional
    public ContractDto requestContractPayment(String contractNo, ContractPaymentRequest request) {
        ContractEntity target = contractRepository.findById(contractNo)
                .orElseThrow(() -> new IllegalArgumentException("계약 정보를 찾을 수 없습니다."));

        Long amount = request != null ? request.getAmount() : null;
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("결제 금액은 1원 이상이어야 합니다.");
        }

        target.setStatus("PAID");
        target.setPaymentDate(new Timestamp(System.currentTimeMillis()));
        return ContractDto.fromEntity(target);
    }

    private List<ContractDto> toList(List<ContractEntity> list) {
        List<ContractDto> dtos = new ArrayList<>();
        if (list != null) {
            for (ContractEntity entity : list) {
                dtos.add(ContractDto.fromEntity(entity));
            }
        }
        return dtos;
    }
}
