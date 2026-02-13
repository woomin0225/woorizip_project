package org.team4p.woorizip.contract.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.contract.model.dto.ContractDto;
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
     * GET /contract/{contract_no}
     */
    @GetMapping("/{contract_no}")
    public ResponseEntity<ApiResponse<ContractDto>> selectContract(@PathVariable("contract_no") String contractNo) {
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
     * POST /contract/insert/{room_no}
     */
    @PostMapping("/insert/{room_no}")
    public ResponseEntity<ApiResponse<Void>> insertContract(
            @PathVariable("room_no") String roomNo, // String 타입으로 일치
            @RequestBody @Valid ContractDto contractDto) {
        
        // 경로 변수로 받은 room_no를 DTO에 세팅 (DTO 필드명이 Snake Case이므로)
        contractDto.setRoom_no(roomNo); 
        
        // 서비스 메서드 호출 (인자를 하나만 전달)
        int result = contractService.insertContract(contractDto);
        
        return result > 0 ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("입주 신청 성공", null))
                          : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 계약 수정
     * POST /contract/update/{room_no}
     */
    @PostMapping("/update/{room_no}")
    public ResponseEntity<ApiResponse<Void>> updateContract(
            @PathVariable("room_no") String roomNo,
            @RequestBody ContractDto contractDto) {
        
        // 경로 변수로 받은 room_no를 DTO에 세팅하여 서비스로 전달
        contractDto.setRoom_no(roomNo);
        
        // 서비스 메서드 호출 (인자 타입을 ContractDto 하나로 일치시킴)
        int result = contractService.updateContract(contractDto);
        
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("계약 수정 성공", null))
                          : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}