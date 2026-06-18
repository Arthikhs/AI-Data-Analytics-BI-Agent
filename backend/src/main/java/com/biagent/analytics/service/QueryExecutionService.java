package com.biagent.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueryExecutionService {

    private final JdbcTemplate jdbcTemplate;
    private final QueryValidatorService validatorService;

    @Value("${query.max-rows:10000}")
    private int maxRows;

    @Value("${query.timeout-seconds:30}")
    private int timeoutSeconds;

    public List<Map<String, Object>> executeQuery(String sql, int requestedLimit) {
        validatorService.validate(sql);

        int limit = Math.min(requestedLimit, maxRows);
        String safeSql = appendLimit(sql, limit);

        log.debug("Executing SQL: {}", safeSql);

        jdbcTemplate.setQueryTimeout(timeoutSeconds);
        return jdbcTemplate.queryForList(safeSql);
    }

    /**
     * Appends LIMIT clause if not already present
     */
    private String appendLimit(String sql, int limit) {
        String upper = sql.trim().toUpperCase();
        if (!upper.contains("LIMIT")) {
            return sql.trim() + " LIMIT " + limit;
        }
        return sql;
    }
}
