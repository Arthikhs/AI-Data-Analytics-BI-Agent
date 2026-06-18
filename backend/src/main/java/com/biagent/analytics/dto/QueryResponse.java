package com.biagent.analytics.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class QueryResponse {
    private String sessionId;
    private String question;
    private String generatedSql;
    private List<Map<String, Object>> data;
    private int rowCount;
    private long executionTimeMs;
    private String chartType;      // suggested chart type
    private String error;
    private boolean success;
}
