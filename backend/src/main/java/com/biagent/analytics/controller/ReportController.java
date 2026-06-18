package com.biagent.analytics.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateReport(@RequestBody Map<String, Object> body) {
        byte[] pdf = webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/reports/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(byte[].class)
                .block();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=\"report.pdf\"")
                .body(pdf);
    }
}
