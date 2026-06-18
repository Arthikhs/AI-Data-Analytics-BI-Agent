package com.biagent.analytics.controller;

import com.biagent.analytics.dto.InsightResponse;
import com.biagent.analytics.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {

    private final AiServiceClient aiServiceClient;

    /** POST /api/insights */
    @PostMapping
    public ResponseEntity<InsightResponse> generateInsights(@RequestBody Map<String, Object> body) {
        String question = (String) body.getOrDefault("question", "Analyze this data");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) body.getOrDefault("data", List.of());
        return ResponseEntity.ok(aiServiceClient.generateInsights(question, data));
    }
}
