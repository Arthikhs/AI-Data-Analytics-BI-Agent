package com.biagent.analytics.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private static final String SECRET =
        "bi-agent-secret-key-minimum-256-bits-long-change-in-production";
    private static final long EXPIRATION = 86400000L;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpiration", EXPIRATION);
    }

    private UserDetails user(String username) {
        return User.withUsername(username).password("pass").authorities(List.of()).build();
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = jwtTokenProvider.generateToken(user("admin"));
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void extractUsername_returnsCorrectUsername() {
        UserDetails userDetails = user("analyst");
        String token = jwtTokenProvider.generateToken(userDetails);
        assertThat(jwtTokenProvider.extractUsername(token)).isEqualTo("analyst");
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        UserDetails userDetails = user("viewer");
        String token = jwtTokenProvider.generateToken(userDetails);
        assertThat(jwtTokenProvider.validateToken(token, userDetails)).isTrue();
    }

    @Test
    void validateToken_wrongUser_returnsFalse() {
        String token = jwtTokenProvider.generateToken(user("admin"));
        assertThat(jwtTokenProvider.validateToken(token, user("analyst"))).isFalse();
    }

    @Test
    void validateToken_tamperedToken_returnsFalse() {
        String token = jwtTokenProvider.generateToken(user("admin"));
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThat(jwtTokenProvider.validateToken(tampered, user("admin"))).isFalse();
    }
}
