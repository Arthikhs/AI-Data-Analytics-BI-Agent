package com.biagent.analytics.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.*;

class QueryValidatorServiceTest {

    private QueryValidatorService validator;

    @BeforeEach
    void setUp() {
        validator = new QueryValidatorService();
    }

    @Test
    void validSelectQuery_passes() {
        assertThatNoException().isThrownBy(() ->
            validator.validate("SELECT * FROM orders WHERE status='completed'"));
    }

    @Test
    void validSelectWithJoin_passes() {
        assertThatNoException().isThrownBy(() ->
            validator.validate(
                "SELECT c.first_name, SUM(o.total_amount) AS revenue " +
                "FROM orders o JOIN customers c ON c.customer_id = o.customer_id " +
                "GROUP BY c.first_name ORDER BY revenue DESC LIMIT 10"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "INSERT INTO orders VALUES (1,2,3)",
        "UPDATE orders SET status='cancelled'",
        "DELETE FROM orders",
        "DROP TABLE orders",
        "ALTER TABLE orders ADD COLUMN x INT",
        "TRUNCATE orders",
        "CREATE TABLE hack (id INT)",
        "EXEC sp_helpdb"
    })
    void blockedKeywords_throwsSecurityException(String sql) {
        assertThatThrownBy(() -> validator.validate(sql))
            .isInstanceOf(SecurityException.class);
    }

    @Test
    void commentBypass_blocked() {
        assertThatThrownBy(() ->
            validator.validate("SELECT * FROM orders -- DROP TABLE orders"))
            .isInstanceOf(SecurityException.class);
    }

    @Test
    void multiStatementInjection_blocked() {
        assertThatThrownBy(() ->
            validator.validate("SELECT * FROM orders; DROP TABLE orders"))
            .isInstanceOf(SecurityException.class);
    }

    @Test
    void nullQuery_throwsIllegalArgument() {
        assertThatThrownBy(() -> validator.validate(null))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void blankQuery_throwsIllegalArgument() {
        assertThatThrownBy(() -> validator.validate("   "))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
