package com.biagent.analytics.controller;

import com.biagent.analytics.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final AiServiceClient aiServiceClient;

    /** POST /api/forecast */
    @PostMapping
    public ResponseEntity<Map<String, Object>> forecast(@RequestBody Map<String, Object> body) {
        String metric = (String) body.getOrDefault("metric", "revenue");
        String dataset = (String) body.getOrDefault("dataset", "ecommerce");
        int periods = (int) body.getOrDefault("periods", 30);
        return ResponseEntity.ok(aiServiceClient.forecast(metric, dataset, periods));
    }
}
