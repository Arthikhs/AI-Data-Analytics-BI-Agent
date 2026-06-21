package com.biagent.analytics.controller;

import com.biagent.analytics.dto.QueryRequest;
import com.biagent.analytics.dto.QueryResponse;
import com.biagent.analytics.service.AiServiceClient;
import com.biagent.analytics.service.QueryExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/query")
@RequiredArgsConstructor
public class QueryController {

    private final AiServiceClient aiServiceClient;
    private final QueryExecutionService queryExecutionService;

    /**
     * POST /api/query/generate
     * Generates SQL from natural language question (no execution)
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateSql(@Valid @RequestBody QueryRequest request) {
        String sessionId = ensureSession(request.getSessionId());
        String sql = aiServiceClient.generateSql(request.getQuestion(), request.getDataset(), sessionId);
        return ResponseEntity.ok(Map.of("sql", sql, "session_id", sessionId));
    }

    /**
     * POST /api/query/run
     * Generates SQL + executes it + suggests chart type
     */
    @PostMapping("/run")
    public ResponseEntity<QueryResponse> runQuery(@Valid @RequestBody QueryRequest request) {
        String sessionId = ensureSession(request.getSessionId());
        long start = System.currentTimeMillis();

        try {
            String sql = aiServiceClient.generateSql(request.getQuestion(), request.getDataset(), sessionId);
            List<Map<String, Object>> data = queryExecutionService.executeQuery(sql, request.getMaxRows());
            String chartType = aiServiceClient.suggestChartType(request.getQuestion(), data);

            return ResponseEntity.ok(QueryResponse.builder()
                    .sessionId(sessionId)
                    .question(request.getQuestion())
                    .generatedSql(sql)
                    .data(data)
                    .rowCount(data.size())
                    .executionTimeMs(System.currentTimeMillis() - start)
                    .chartType(chartType)
                    .success(true)
                    .build());

        } catch (SecurityException e) {
            log.warn("Query blocked by validator: {}", e.getMessage());
            return ResponseEntity.badRequest().body(QueryResponse.builder()
                    .success(false).error("Query not allowed: " + e.getMessage()).build());
        } catch (Exception e) {
            log.error("Query execution failed", e);
            return ResponseEntity.internalServerError().body(QueryResponse.builder()
                    .success(false).error("Query execution failed: " + e.getMessage()).build());
        }
    }

    /**
     * POST /api/query/execute
     * Executes a provided SQL directly (for power users)
     */
    @PostMapping("/execute")
    public ResponseEntity<QueryResponse> executeDirectSql(@RequestBody Map<String, Object> body) {
        String sql = (String) body.get("sql");
        int maxRows = body.containsKey("max_rows") ? (int) body.get("max_rows") : 1000;
        long start = System.currentTimeMillis();

        try {
            List<Map<String, Object>> data = queryExecutionService.executeQuery(sql, maxRows);
            return ResponseEntity.ok(QueryResponse.builder()
                    .generatedSql(sql)
                    .data(data)
                    .rowCount(data.size())
                    .executionTimeMs(System.currentTimeMillis() - start)
                    .success(true)
                    .build());
        } catch (SecurityException e) {
            log.warn("Direct SQL execution blocked: {}", e.getMessage());
            return ResponseEntity.badRequest().body(QueryResponse.builder()
                    .success(false).error(e.getMessage()).build());
        } catch (Exception e) {
            log.error("Direct SQL execution failed", e);
            return ResponseEntity.internalServerError().body(QueryResponse.builder()
                    .success(false).error("Execution failed: " + e.getMessage()).build());
        }
    }

    private String ensureSession(String sessionId) {
        return (sessionId != null && !sessionId.isBlank()) ? sessionId : UUID.randomUUID().toString();
    }
}
