package com.biagent.analytics.controller;

import com.biagent.analytics.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@RestController
@RequestMapping("/api/anomaly")
@RequiredArgsConstructor
public class AnomalyController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    @GetMapping
    public ResponseEntity<Map> detectAnomalies() {
        Map result = webClientBuilder.build()
                .get()
                .uri(aiServiceUrl + "/anomaly")
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        return ResponseEntity.ok(result);
    }
}
