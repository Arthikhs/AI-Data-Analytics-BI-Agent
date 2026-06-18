package com.biagent.analytics.controller;

import com.biagent.analytics.dto.KpiResponse;
import com.biagent.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AnalyticsService analyticsService;

    /** GET /api/dashboard/kpis */
    @GetMapping("/kpis")
    public ResponseEntity<KpiResponse> getKpis(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(analyticsService.getDashboardKpis(dateFrom, dateTo, region, category));
    }

    /** GET /api/dashboard/revenue-trend */
    @GetMapping("/revenue-trend")
    public ResponseEntity<List<Map<String, Object>>> getRevenueTrend(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(analyticsService.getRevenueByMonth(dateFrom, dateTo, region));
    }

    /** GET /api/dashboard/top-products */
    @GetMapping("/top-products")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopProducts(dateFrom, dateTo, limit));
    }

    /** GET /api/dashboard/top-customers */
    @GetMapping("/top-customers")
    public ResponseEntity<List<Map<String, Object>>> getTopCustomers(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopCustomers(dateFrom, dateTo, limit));
    }

    /** GET /api/dashboard/revenue-by-region */
    @GetMapping("/revenue-by-region")
    public ResponseEntity<List<Map<String, Object>>> getRevenueByRegion(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        return ResponseEntity.ok(analyticsService.getRevenueByRegion(dateFrom, dateTo));
    }

    /** GET /api/dashboard/revenue-by-category */
    @GetMapping("/revenue-by-category")
    public ResponseEntity<List<Map<String, Object>>> getRevenueByCategory(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        return ResponseEntity.ok(analyticsService.getRevenueByCategory(dateFrom, dateTo));
    }
}
