package org.team4p.woorizip.common.controller;

import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ConditionalOnProperty(name = "app.spa.forward-enabled", havingValue = "false", matchIfMissing = true)
public class ApiEntryController {

    @GetMapping({"/", "/index.html"})
    public ResponseEntity<Map<String, String>> indexFallback() {
        return ResponseEntity.ok(Map.of(
                "message", "Backend API is running. Frontend static bundle is not deployed on this server.",
                "hint", "Enable app.spa.forward-enabled=true only when classpath:/static/index.html exists."
        ));
    }
}