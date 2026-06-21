package com.biagent.analytics.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Validates SQL queries to ensure only safe SELECT operations are allowed.
 * Blocks all DML/DDL operations to protect data integrity.
 */
@Service
public class QueryValidatorService {

    private static final List<String> BLOCKED_KEYWORDS = List.of(
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
            "CREATE", "REPLACE", "MERGE", "EXEC", "EXECUTE",
            "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "--", "/*", "*/"
    );

    private static final Pattern MULTI_STATEMENT = Pattern.compile(";.+", Pattern.DOTALL);

    public void validate(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new IllegalArgumentException("SQL query cannot be empty");
        }

        String normalized = sql.trim().toUpperCase(Locale.ROOT);

        // Must start with SELECT
        if (!normalized.startsWith("SELECT")) {
            throw new SecurityException("Only SELECT queries are permitted");
        }

        // Block dangerous keywords
        for (String keyword : BLOCKED_KEYWORDS) {
            if (normalized.contains(keyword)) {
                throw new SecurityException("Blocked keyword detected: " + keyword);
            }
        }

        // Block multi-statement execution
        if (MULTI_STATEMENT.matcher(normalized).find()) {
            throw new SecurityException("Multi-statement queries are not allowed");
        }
    }
}
