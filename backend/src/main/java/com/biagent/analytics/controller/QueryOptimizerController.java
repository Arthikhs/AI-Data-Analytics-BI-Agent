package com.biagent.analytics.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/optimizer")
@RequiredArgsConstructor
public class QueryOptimizerController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    @Value("${ai-service.timeout}")
    private long timeoutMs;

    @PostMapping
    public ResponseEntity<Object> optimize(@RequestBody Map<String, String> body) {
        String sql = body.get("sql");
        if (sql == null || sql.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sql is required"));
        }
        log.debug("Optimizing query: {}", sql.substring(0, Math.min(sql.length(), 80)));
        try {
            Object result = webClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + "/optimize-query")
                    .bodyValue(Map.of("sql", sql))
                    .retrieve()
                    .bodyToMono(Object.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Query optimizer error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Optimizer service unavailable: " + e.getMessage()));
        }
    }
}
