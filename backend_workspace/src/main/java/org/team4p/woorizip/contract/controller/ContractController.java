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

@Slf4j
@RestController
@RequestMapping("/api/contract")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> selectContract(@PathVariable("contractNo") String contractNo) {
        ContractDto contract = contractService.selectContract(contractNo);
        if (contract == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("계약 정보를 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("계약 조회 성공", contract));
    }

    @GetMapping("/user/me")
    public ResponseEntity<ApiResponse<PageResponse<ContractDto>>> selectListContract(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<ContractDto> body = contractService.selectListContract(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("내 계약 목록 조회 성공", body));
    }

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

    @PostMapping("/amendment/request/{originalContractNo}")
    public ResponseEntity<ApiResponse<Void>> requestAmendment(
            @PathVariable("originalContractNo") String originalNo,
            @RequestBody ContractDto amendmentDto) {
        int result = contractService.requestAmendment(originalNo, amendmentDto);
        if (result == -1) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail("이미 진행 중인 수정 요청이 존재합니다.", null));
        }
        return result > 0
                ? ResponseEntity.ok(ApiResponse.ok("수정 요청이 완료되었습니다.", null))
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    @PostMapping("/amendment/decide/{amendmentNo}")
    public ResponseEntity<ApiResponse<Void>> decideAmendment(
            @PathVariable("amendmentNo") String amendmentNo,
            @RequestBody ContractDecideRequest decideRequest) {
        int result = contractService.decideAmendment(amendmentNo, decideRequest.isApproved(), decideRequest.getReason());
        return result > 0
                ? ResponseEntity.ok(ApiResponse.ok("처리가 완료되었습니다.", null))
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

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

    @PostMapping("/e-contract/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> createElectronicContract(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) ContractElectronicCreateRequest request) {
        try {
            ContractDto updated = contractService.createElectronicContract(contractNo, request);
            return ResponseEntity.ok(ApiResponse.ok("전자계약서 생성 완료(개발모드)", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    @PostMapping("/signature/verify/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> verifyElectronicSignature(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) ContractSignatureVerifyRequest request) {
        try {
            ContractDto updated = contractService.verifyElectronicSignature(contractNo, request);
            return ResponseEntity.ok(ApiResponse.ok("전자서명 검증 완료(개발모드)", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    @PostMapping("/payment/{contractNo}")
    public ResponseEntity<ApiResponse<ContractDto>> requestContractPayment(
            @PathVariable("contractNo") String contractNo,
            @RequestBody(required = false) ContractPaymentRequest request) {
        try {
            ContractDto updated = contractService.requestContractPayment(contractNo, request);
            return ResponseEntity.ok(ApiResponse.ok("결제 승인 완료(개발모드)", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(e.getMessage(), null));
        }
    }
}
