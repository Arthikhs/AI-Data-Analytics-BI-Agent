package com.biagent.analytics.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    @GetMapping("/**")
    public ResponseEntity<Object> proxyGet(HttpServletRequest request) {
        String path = request.getRequestURI().replaceFirst("/api", "");
        String query = request.getQueryString();
        String url = aiServiceUrl + path + (query != null ? "?" + query : "");
        log.debug("Agent proxy GET → {}", url);
        try {
            Object result = webClientBuilder.build()
                    .get().uri(url).retrieve()
                    .bodyToMono(Object.class).block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Agent proxy error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Agent service unavailable: " + e.getMessage()));
        }
    }

    @PostMapping("/**")
    public ResponseEntity<Object> proxyPost(HttpServletRequest request,
                                             @RequestBody(required = false) Object body) {
        String path = request.getRequestURI().replaceFirst("/api", "");
        String url = aiServiceUrl + path;
        log.debug("Agent proxy POST → {}", url);
        try {
            Object result = webClientBuilder.build()
                    .post().uri(url)
                    .bodyValue(body != null ? body : Map.of())
                    .retrieve()
                    .bodyToMono(Object.class).block();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Agent proxy error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Agent service unavailable: " + e.getMessage()));
        }
    }
}
