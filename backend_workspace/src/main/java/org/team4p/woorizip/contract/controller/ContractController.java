package org.team4p.woorizip.contract.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.contract.model.dto.ContractDto;
import org.team4p.woorizip.contract.model.dto.request.ContractDecideRequest;
import org.team4p.woorizip.contract.model.service.ContractService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/contract")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    /**
     * 계약 조회
     * GET /contract/{contractNo}
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
     * 계약 목록 조회
     * GET /contract/{userNo}
     */
    @GetMapping("/user/{userNo}")
    public ResponseEntity<ApiResponse<List<ContractDto>>> selectListContract(@PathVariable("userNo") String userNo) {
        List<ContractDto> list = contractService.selectListContract(userNo);
        return ResponseEntity.ok(ApiResponse.ok("계약 목록 조회 성공", list));
    }

    /**
     * 입주 신청
     * POST /contract/insert/{roomNo}
     */
    @PostMapping("/insert/{roomNo}")
    public ResponseEntity<ApiResponse<Void>> insertContract(
            @PathVariable("roomNo") String roomNo, // String 타입으로 일치
            @RequestBody @Valid ContractDto contractDto) {
        
        // 경로 변수로 받은 roomNo를 DTO에 세팅 (DTO 필드명이 Snake Case이므로)
        contractDto.setRoomNo(roomNo); 
        
        // 서비스 메서드 호출 (인자를 하나만 전달)
        int result = contractService.insertContract(contractDto);
        
        return result > 0 ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("입주 신청 성공", null))
                          : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 계약 수정 요청 (임차인용)
     * POST /api/contract/amendment/request/{originalContractNo}
     */
    @PostMapping("/amendment/request/{originalContractNo}")
    public ResponseEntity<ApiResponse<Void>> requestAmendment(
            @PathVariable("originalContractNo") String originalNo,
            @RequestBody @Valid ContractDto amendmentDto) {
        
        // 원본 번호를 바탕으로 새로운 수정 요청 로우 생성
        int result = contractService.requestAmendment(originalNo, amendmentDto);
        
        if (result == -1) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail("이미 진행 중인 수정 요청이 존재합니다.", null));
        }
        
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("수정 요청이 완료되었습니다.", null))
                          : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    /**
     * 계약 수정 승인/거절 결정 (임대인용)
     * POST /api/contract/amendment/decide/{amendmentNo}
     */
    @PostMapping("/amendment/decide/{amendmentNo}")
    public ResponseEntity<ApiResponse<Void>> decideAmendment(
            @PathVariable("amendmentNo") String amendmentNo,
            @RequestBody ContractDecideRequest decideRequest) {
        
        int result = contractService.decideAmendment(
            amendmentNo, 
            decideRequest.isApproved(), 
            decideRequest.getReason()
        );
        
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("처리가 완료되었습니다.", null))
                          : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
}
