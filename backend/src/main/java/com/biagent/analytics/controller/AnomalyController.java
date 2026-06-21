package com.biagent.analytics.controller;

import com.biagent.analytics.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/anomaly")
@RequiredArgsConstructor
public class AnomalyController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    @GetMapping
    public ResponseEntity<Map> detectAnomalies() {
        URI uri;
        try {
            uri = new URI(aiServiceUrl + "/anomaly");
            if (!uri.getScheme().equals("http") && !uri.getScheme().equals("https")) {
                throw new IllegalArgumentException("Invalid URI scheme");
            }
        } catch (URISyntaxException e) {
            log.error("Invalid AI service URL: {}", aiServiceUrl, e);
            return ResponseEntity.internalServerError().build();
        }
        Map result = webClientBuilder.build()
                .get()
                .uri(uri)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        return ResponseEntity.ok(result);
    }
}
