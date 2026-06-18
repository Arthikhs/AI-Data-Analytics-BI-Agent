package com.biagent.analytics.service;

import com.biagent.analytics.dto.KpiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    @Cacheable(value = "kpis", key = "#dateFrom + '-' + #dateTo + '-' + #region + '-' + #category")
    public KpiResponse getDashboardKpis(String dateFrom, String dateTo, String region, String category) {
        log.debug("Computing KPIs: from={} to={} region={} category={}", dateFrom, dateTo, region, category);

        return KpiResponse.builder()
                .totalRevenue(getTotalRevenue(dateFrom, dateTo, region, category))
                .totalOrders(getTotalOrders(dateFrom, dateTo, region))
                .avgOrderValue(getAvgOrderValue(dateFrom, dateTo, region))
                .grossProfit(getGrossProfit(dateFrom, dateTo, region, category))
                .revenueGrowthPct(getRevenueGrowthPct(dateFrom, dateTo, region))
                .totalCustomers(getTotalCustomers())
                .newCustomers(getNewCustomers(dateFrom, dateTo))
                .churnRate(0.04) // placeholder — replace with real churn logic
                .customerLifetimeValue(getClv())
                .revenueByMonth(getRevenueByMonth(dateFrom, dateTo, region))
                .topProducts(getTopProducts(dateFrom, dateTo, 10))
                .topCustomers(getTopCustomers(dateFrom, dateTo, 10))
                .revenueByRegion(getRevenueByRegion(dateFrom, dateTo))
                .revenueByCategory(getRevenueByCategory(dateFrom, dateTo))
                .build();
    }

    private double getTotalRevenue(String from, String to, String region, String category) {
        String sql = """
            SELECT COALESCE(SUM(o.total_amount), 0)
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p ON p.product_id = oi.product_id
            JOIN categories c ON c.category_id = p.category_id
            WHERE o.status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR o.order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR o.order_date <= CAST(? AS DATE))
              AND (? IS NULL OR o.region = ?)
              AND (? IS NULL OR c.category_name = ?)
            """;
        Double result = jdbcTemplate.queryForObject(sql, Double.class,
                from, from, to, to, region, region, category, category);
        return result != null ? result : 0.0;
    }

    private double getTotalOrders(String from, String to, String region) {
        String sql = """
            SELECT COUNT(*) FROM orders
            WHERE status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR order_date <= CAST(? AS DATE))
              AND (? IS NULL OR region = ?)
            """;
        Long count = jdbcTemplate.queryForObject(sql, Long.class, from, from, to, to, region, region);
        return count != null ? count : 0;
    }

    private double getAvgOrderValue(String from, String to, String region) {
        String sql = """
            SELECT COALESCE(AVG(total_amount), 0) FROM orders
            WHERE status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR order_date <= CAST(? AS DATE))
              AND (? IS NULL OR region = ?)
            """;
        Double result = jdbcTemplate.queryForObject(sql, Double.class, from, from, to, to, region, region);
        return result != null ? result : 0.0;
    }

    private double getGrossProfit(String from, String to, String region, String category) {
        String sql = """
            SELECT COALESCE(SUM(oi.quantity * (p.price - p.cost)), 0)
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p ON p.product_id = oi.product_id
            JOIN categories c ON c.category_id = p.category_id
            WHERE o.status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR o.order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR o.order_date <= CAST(? AS DATE))
              AND (? IS NULL OR o.region = ?)
              AND (? IS NULL OR c.category_name = ?)
            """;
        Double result = jdbcTemplate.queryForObject(sql, Double.class,
                from, from, to, to, region, region, category, category);
        return result != null ? result : 0.0;
    }

    private double getRevenueGrowthPct(String from, String to, String region) {
        // Compare current period vs previous same-length period
        String currentSql = """
            SELECT COALESCE(SUM(total_amount), 0) FROM orders
            WHERE status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR order_date <= CAST(? AS DATE))
              AND (? IS NULL OR region = ?)
            """;
        Double current = jdbcTemplate.queryForObject(currentSql, Double.class, from, from, to, to, region, region);
        if (current == null || current == 0) return 0.0;

        String prevSql = """
            SELECT COALESCE(SUM(total_amount), 0) FROM orders
            WHERE status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR order_date >= (CAST(? AS DATE) - INTERVAL '1 year'))
              AND (CAST(? AS DATE) IS NULL OR order_date <= (CAST(? AS DATE) - INTERVAL '1 year'))
              AND (? IS NULL OR region = ?)
            """;
        Double prev = jdbcTemplate.queryForObject(prevSql, Double.class, from, from, to, to, region, region);
        if (prev == null || prev == 0) return 100.0;
        return ((current - prev) / prev) * 100;
    }

    private double getTotalCustomers() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM customers", Long.class);
        return count != null ? count : 0;
    }

    private double getNewCustomers(String from, String to) {
        String sql = "SELECT COUNT(*) FROM customers WHERE (CAST(? AS DATE) IS NULL OR acquired_at >= CAST(? AS DATE)) AND (CAST(? AS DATE) IS NULL OR acquired_at <= CAST(? AS DATE))";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, from, from, to, to);
        return count != null ? count : 0;
    }

    private double getClv() {
        String sql = """
            SELECT COALESCE(AVG(customer_total), 0) FROM (
                SELECT customer_id, SUM(total_amount) AS customer_total
                FROM orders WHERE status = 'completed'
                GROUP BY customer_id
            ) t
            """;
        Double result = jdbcTemplate.queryForObject(sql, Double.class);
        return result != null ? result : 0.0;
    }

    public List<Map<String, Object>> getRevenueByMonth(String from, String to, String region) {
        String sql = """
            SELECT TO_CHAR(order_date, 'YYYY-MM') AS month,
                   SUM(total_amount) AS revenue,
                   COUNT(*) AS orders
            FROM orders
            WHERE status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR order_date <= CAST(? AS DATE))
              AND (? IS NULL OR region = ?)
            GROUP BY month ORDER BY month
            """;
        return jdbcTemplate.queryForList(sql, from, from, to, to, region, region);
    }

    public List<Map<String, Object>> getTopProducts(String from, String to, int limit) {
        String sql = """
            SELECT p.product_name,
                   SUM(oi.quantity) AS units_sold,
                   SUM(oi.amount) AS revenue
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id
            JOIN products p ON p.product_id = oi.product_id
            WHERE o.status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR o.order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR o.order_date <= CAST(? AS DATE))
            GROUP BY p.product_name
            ORDER BY revenue DESC
            LIMIT ?
            """;
        return jdbcTemplate.queryForList(sql, from, from, to, to, limit);
    }

    public List<Map<String, Object>> getTopCustomers(String from, String to, int limit) {
        String sql = """
            SELECT c.first_name || ' ' || c.last_name AS customer_name,
                   c.segment,
                   c.region,
                   COUNT(o.order_id) AS total_orders,
                   SUM(o.total_amount) AS total_revenue
            FROM orders o
            JOIN customers c ON c.customer_id = o.customer_id
            WHERE o.status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR o.order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR o.order_date <= CAST(? AS DATE))
            GROUP BY c.customer_id, c.first_name, c.last_name, c.segment, c.region
            ORDER BY total_revenue DESC
            LIMIT ?
            """;
        return jdbcTemplate.queryForList(sql, from, from, to, to, limit);
    }

    public List<Map<String, Object>> getRevenueByRegion(String from, String to) {
        String sql = """
            SELECT region,
                   SUM(total_amount) AS revenue,
                   COUNT(*) AS orders
            FROM orders
            WHERE status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR order_date <= CAST(? AS DATE))
            GROUP BY region ORDER BY revenue DESC
            """;
        return jdbcTemplate.queryForList(sql, from, from, to, to);
    }

    public List<Map<String, Object>> getRevenueByCategory(String from, String to) {
        String sql = """
            SELECT c.category_name,
                   SUM(oi.amount) AS revenue,
                   SUM(oi.quantity) AS units_sold
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id
            JOIN products p ON p.product_id = oi.product_id
            JOIN categories c ON c.category_id = p.category_id
            WHERE o.status = 'completed'
              AND (CAST(? AS DATE) IS NULL OR o.order_date >= CAST(? AS DATE))
              AND (CAST(? AS DATE) IS NULL OR o.order_date <= CAST(? AS DATE))
            GROUP BY c.category_name ORDER BY revenue DESC
            """;
        return jdbcTemplate.queryForList(sql, from, from, to, to);
    }
}
