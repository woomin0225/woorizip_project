package org.team4p.woorizip.contract.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.contract.model.dto.ContractDto;
import org.team4p.woorizip.contract.model.dto.request.ContractDecideRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractElectronicCreateRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractPaymentRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractSignatureVerifyRequest;
import org.team4p.woorizip.contract.model.service.ContractService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Locale;

@Slf4j
@RestController
@RequestMapping("/api/contract")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    /**
     * 계약 단건 조회
     * GET /api/contract/{contractNo}
     */
    @GetMapping("/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> selectContract(@PathVariable("contractNo") String contractNo) {
        ContractDto contract = contractService.selectContract(contractNo);
        if (contract == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("계약 정보를 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("계약 조회 성공", contract));
    }

    /**
     * 내 계약 목록 조회
     * GET /api/contract/user/me
     */
    @GetMapping("/user/me")
    public ResponseEntity<ApiResponse<PageResponse<ContractDto>>> selectListContract(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<ContractDto> body = contractService.selectListContract(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("내 계약 목록 조회 성공", body));
    }

    /**
     * 임대인 계약 목록 조회
     * GET /api/contract/list/owner
     */
    @GetMapping("/list/owner")
    public ResponseEntity<ApiResponse<PageResponse<ContractDto>>> selectOwnerListContract(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<ContractDto> body = contractService.selectListContractByOwner(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("임대인 계약 목록 조회 성공", body));
    }

    /**
     * 입주 신청 등록
     * POST /api/contract/insert/{roomNo}
     */
    @PostMapping("/insert/{roomNo}")
    public ResponseEntity<ApiResponse<ContractDto>> insertContract(
            @PathVariable("roomNo") String roomNo,
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestBody ContractDto contractDto) {

        contractDto.setRoomNo(roomNo);
        contractDto.setUserNo(userPrincipal.getUserNo());

        try {
            ContractDto created = contractService.insertContract(contractDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("입주 신청 성공", created));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    /**
     * 계약 수정 요청 등록
     * POST /api/contract/amendment/request/{originalContractNo}
     */
    @PostMapping("/amendment/request/{originalContractNo}")
    public ResponseEntity<ApiResponse<Void>> requestAmendment(
            @PathVariable("originalContractNo") String originalNo,
            @RequestBody ContractDto amendmentDto) {
        try {
            int result = contractService.requestAmendment(originalNo, amendmentDto);
            if (result == -1) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.fail("이미 진행 중인 수정 요청이 존재합니다.", null));
            }
            if (result == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("원본 계약 정보를 찾을 수 없습니다.", null));
            }
            return ResponseEntity.ok(ApiResponse.ok("수정 요청이 완료되었습니다.", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail(e.getMessage(), null));
        } catch (Exception e) {
            log.error("계약 수정 요청 처리 실패: originalNo={}", originalNo, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("수정 요청 처리 중 오류가 발생했습니다.", null));
        }
    }

    /**
     * 계약 수정 요청 승인/거절
     * POST /api/contract/amendment/decide/{amendmentNo}
     */
    @PostMapping("/amendment/decide/{amendmentNo}")
    public ResponseEntity<ApiResponse<Void>> decideAmendment(
            @PathVariable("amendmentNo") String amendmentNo,
            @RequestBody ContractDecideRequest decideRequest) {
        int result = contractService.decideAmendment(amendmentNo, decideRequest.isApproved(), decideRequest.getReason());
        return result > 0
                ? ResponseEntity.ok(ApiResponse.ok("처리가 완료되었습니다.", null))
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 계약 취소 처리
     * POST /api/contract/cancel/{contractNo}
     */
    @PostMapping("/cancel/{contractNo}")
    public ResponseEntity<ApiResponse<Void>> cancelContract(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        int result = contractService.cancelContract(contractNo, reason);
        return result > 0
                ? ResponseEntity.ok(ApiResponse.ok("계약 취소 요청이 완료되었습니다.", null))
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("계약 취소 요청 실패", null));
    }

    /**
     * 전자계약서 생성
     * POST /api/contract/e-contract/{contractNo}
     */
    @PostMapping("/e-contract/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> createElectronicContract(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) ContractElectronicCreateRequest request) {
        try {
            ContractDto updated = contractService.createElectronicContract(contractNo, request);
            return ResponseEntity.ok(ApiResponse.ok("전자계약서 생성 완료(개발모드)", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    /**
     * 전자서명 검증
     * POST /api/contract/signature/verify/{contractNo}
     */
    @PostMapping("/signature/verify/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> verifyElectronicSignature(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) ContractSignatureVerifyRequest request) {
        try {
            ContractDto updated = contractService.verifyElectronicSignature(contractNo, request);
            return ResponseEntity.ok(ApiResponse.ok("전자서명 검증 완료(개발모드)", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    /**
     * 계약 결제 요청 처리
     * POST /api/contract/payment/{contractNo}
     */
    @PostMapping("/payment/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> requestContractPayment(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) ContractPaymentRequest request) {
        try {
            ContractDto updated = contractService.requestContractPayment(contractNo, request);
            return ResponseEntity.ok(ApiResponse.ok("결제 승인 완료(개발모드)", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    /**
     * 계약 승인/거절 처리
     * POST /api/contract/decision/{contractNo}
     */
    @PostMapping("/decision/{contractNo}")
    public ResponseEntity<ApiResponse<Void>> decideContract(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String status = body != null ? body.get("status") : null;
            String currentStatus = body != null ? body.get("currentStatus") : null;
            String reason = body != null ? body.get("reason") : null;
            String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
            String normalizedCurrentStatus = currentStatus == null ? "" : currentStatus.trim().toUpperCase(Locale.ROOT);

            if (normalizedStatus.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("상태값이 없습니다.", null));
            }

            if ("AMENDMENT_REQUESTED".equals(normalizedCurrentStatus)) {
                int result = contractService.decideAmendment(
                        contractNo,
                        "APPROVED".equals(normalizedStatus),
                        "REJECTED".equals(normalizedStatus) ? reason : null
                );
                return result > 0
                        ? ResponseEntity.ok(ApiResponse.ok("수정요청 승인/거절 처리 완료", null))
                        : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("수정요청 처리 실패", null));
            }

            if (!"APPROVED".equals(normalizedStatus) && !"REJECTED".equals(normalizedStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("지원하지 않는 상태값입니다.", null));
            }

            int result = contractService.updateStatus(contractNo, normalizedStatus, reason);
            return result > 0
                    ? ResponseEntity.ok(ApiResponse.ok("입주 신청 승인/거절 처리 완료", null))
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("입주 신청 처리 실패", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("입주 신청 승인/거절 처리 중 오류", null));
        }
    }
}
