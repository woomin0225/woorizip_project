package org.team4p.woorizip.ai.service;

import org.team4p.woorizip.ai.dto.OrchestrateCommandRequest;
import org.team4p.woorizip.ai.dto.OrchestrateCommandResponse;

public interface OrchestrateService {
    OrchestrateCommandResponse execute(OrchestrateCommandRequest request, String authorization);
}
