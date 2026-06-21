package com.biagent.analytics;

import com.biagent.analytics.service.QueryValidatorService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AnalyticsApplicationTests {

    @Test
    void contextLoads() {
    }

    // ─── QueryValidatorService unit tests ────────────────────────────────────

    private final QueryValidatorService validator = new QueryValidatorService();

    @Test
    void validSelectQueryPasses() {
        assertDoesNotThrow(() -> validator.validate("SELECT * FROM orders"));
    }

    @Test
    void selectWithJoinPasses() {
        assertDoesNotThrow(() ->
            validator.validate("SELECT o.order_id, c.first_name FROM orders o JOIN customers c ON c.customer_id = o.customer_id"));
    }

    @Test
    void insertThrowsSecurityException() {
        assertThrows(SecurityException.class, () ->
            validator.validate("INSERT INTO orders VALUES (1, 2, 3)"));
    }

    @Test
    void updateThrowsSecurityException() {
        assertThrows(SecurityException.class, () ->
            validator.validate("UPDATE orders SET status = 'cancelled' WHERE order_id = 1"));
    }

    @Test
    void deleteThrowsSecurityException() {
        assertThrows(SecurityException.class, () ->
            validator.validate("DELETE FROM orders WHERE order_id = 1"));
    }

    @Test
    void dropThrowsSecurityException() {
        assertThrows(SecurityException.class, () ->
            validator.validate("DROP TABLE orders"));
    }

    @Test
    void multiStatementThrowsSecurityException() {
        assertThrows(SecurityException.class, () ->
            validator.validate("SELECT 1; DROP TABLE orders"));
    }

    @Test
    void sqlInjectionCommentThrowsSecurityException() {
        assertThrows(SecurityException.class, () ->
            validator.validate("SELECT * FROM orders -- injected comment"));
    }

    @Test
    void emptyQueryThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
            validator.validate(""));
    }

    @Test
    void nullQueryThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
            validator.validate(null));
    }
}
