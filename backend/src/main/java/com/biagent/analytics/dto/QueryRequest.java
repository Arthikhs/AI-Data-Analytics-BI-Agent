package com.biagent.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QueryRequest {
    @NotBlank(message = "Question is required")
    private String question;

    private String sessionId;
    private String dataset = "ecommerce"; // ecommerce | banking | logistics | retail
    private Integer maxRows = 1000;
}
