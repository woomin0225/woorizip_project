package org.team4p.woorizip.ai.dto;

import java.util.Map;

public record OrchestrateCommandResponse(
        String schemaVersion,
        String reply,
        String intent,
        Map<String, Object> slots,
        Map<String, Object> action,
        Map<String, Object> result,
        String errorCode,
        boolean requiresConfirm,
        String sessionId,
        String clientRequestId,
        Map<String, Object> raw
) {
}
