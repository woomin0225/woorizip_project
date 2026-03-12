package org.team4p.woorizip.ai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.ai.dto.OrchestrateCommandRequest;
import org.team4p.woorizip.ai.dto.OrchestrateCommandResponse;
import org.team4p.woorizip.ai.service.OrchestrateService;
import org.team4p.woorizip.common.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orchestrate")
public class OrchestrateController {

    private final OrchestrateService orchestrateService;

    @PostMapping("/command")
    public ResponseEntity<ApiResponse<OrchestrateCommandResponse>> command(
            @Valid @RequestBody OrchestrateCommandRequest request
    ) {
        OrchestrateCommandResponse response = orchestrateService.execute(request);
        return ResponseEntity.ok(ApiResponse.ok("Orchestrate 명령 실행 성공", response));
    }
}
