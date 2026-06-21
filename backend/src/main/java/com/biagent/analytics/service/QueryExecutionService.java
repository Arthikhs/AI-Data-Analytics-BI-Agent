package com.biagent.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueryExecutionService {

    private final JdbcTemplate jdbcTemplate;
    private final QueryValidatorService validatorService;
    private final WebClient.Builder webClientBuilder;

    @Value("${query.max-rows:10000}")
    private int maxRows;

    @Value("${query.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    public List<Map<String, Object>> executeQuery(String sql, int requestedLimit) {
        return executeQuery(sql, requestedLimit, null);
    }

    /**
     * Execute query with optional RLS enforcement based on user role.
     * If role is provided, the SQL is filtered through the RLS service before execution.
     */
    public List<Map<String, Object>> executeQuery(String sql, int requestedLimit, String role) {
        validatorService.validate(sql);

        String filteredSql = (role != null && !role.isBlank()) ? applyRls(sql, role) : sql;
        int limit = Math.min(requestedLimit, maxRows);
        String safeSql = appendLimit(filteredSql, limit);

        log.debug("Executing SQL [role={}]: {}", role, safeSql);
        jdbcTemplate.setQueryTimeout(timeoutSeconds);
        return jdbcTemplate.queryForList(safeSql);
    }

    /**
     * Calls the AI service RLS endpoint to inject region filters into the SQL.
     */
    @SuppressWarnings("unchecked")
    private String applyRls(String sql, String role) {
        try {
            Map<String, Object> result = webClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + "/enterprise/rls/apply")
                    .bodyValue(Map.of("sql", sql, "role", role))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            if (result != null && result.containsKey("sql")) {
                return (String) result.get("sql");
            }
        } catch (Exception e) {
            log.warn("RLS filter unavailable, proceeding without row-level filter: {}", e.getMessage());
        }
        return sql;
    }

    private String appendLimit(String sql, int limit) {
        String upper = sql.trim().toUpperCase(Locale.ROOT);
        if (!upper.contains("LIMIT")) {
            return sql.trim() + " LIMIT " + limit;
        }
        return sql;
    }
}
