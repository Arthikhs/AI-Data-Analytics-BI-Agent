package com.biagent.analytics.service;

import com.biagent.analytics.dto.InsightResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    @Value("${ai-service.timeout}")
    private long timeoutMs;

    public String generateSql(String question, String dataset, String sessionId) {
        return webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/generate-sql")
                .bodyValue(Map.of(
                        "question", question,
                        "dataset", dataset,
                        "session_id", sessionId != null ? sessionId : ""
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .map(r -> (String) r.get("sql"))
                .block();
    }

    public String suggestChartType(String question, List<Map<String, Object>> data) {
        try {
            return webClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + "/suggest-chart")
                    .bodyValue(Map.of("question", question, "columns", data.isEmpty() ? List.of() : data.get(0).keySet()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .map(r -> (String) r.get("chart_type"))
                    .block();
        } catch (Exception e) {
            return "bar"; // default fallback
        }
    }

    public InsightResponse generateInsights(String question, List<Map<String, Object>> data) {
        try {
            return webClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + "/generate-insights")
                    .bodyValue(Map.of("question", question, "data", data))
                    .retrieve()
                    .bodyToMono(InsightResponse.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .block();
        } catch (Exception e) {
            log.error("Insight generation failed", e);
            return InsightResponse.builder()
                    .summary("Insight generation temporarily unavailable")
                    .keyFindings(List.of())
                    .recommendations(List.of())
                    .build();
        }
    }

    public Map<String, Object> forecast(String metric, String dataset, int periods) {
        return webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/forecast")
                .bodyValue(Map.of("metric", metric, "dataset", dataset, "periods", periods))
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .block();
    }
}
