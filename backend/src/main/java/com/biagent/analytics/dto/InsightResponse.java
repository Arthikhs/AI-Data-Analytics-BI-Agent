package com.biagent.analytics.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class InsightResponse {
    private String summary;
    private List<String> keyFindings;
    private List<String> growthDrivers;
    private List<String> risks;
    private List<String> opportunities;
    private List<String> recommendations;
}
