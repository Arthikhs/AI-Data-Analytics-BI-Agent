package com.biagent.analytics.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class KpiResponse {
    private double totalRevenue;
    private double totalOrders;
    private double avgOrderValue;
    private double grossProfit;
    private double revenueGrowthPct;
    private double totalCustomers;
    private double newCustomers;
    private double churnRate;
    private double customerLifetimeValue;
    private List<Map<String, Object>> revenueByMonth;
    private List<Map<String, Object>> topProducts;
    private List<Map<String, Object>> topCustomers;
    private List<Map<String, Object>> revenueByRegion;
    private List<Map<String, Object>> revenueByCategory;
}
