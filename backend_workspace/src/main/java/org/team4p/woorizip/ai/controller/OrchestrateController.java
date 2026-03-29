package org.team4p.woorizip.ai.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestHeader;
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
@RequestMapping({"/api/agent", "/api/orchestrate"})
public class OrchestrateController {

    private final OrchestrateService orchestrateService;

    @PostMapping(value = "/command", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
    public ResponseEntity<ApiResponse<OrchestrateCommandResponse>> command(
            @Valid @RequestBody OrchestrateCommandRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        OrchestrateCommandResponse response = orchestrateService.execute(request, authorization);
        return ResponseEntity.ok(ApiResponse.ok("Agent command executed", response));
    }
}
