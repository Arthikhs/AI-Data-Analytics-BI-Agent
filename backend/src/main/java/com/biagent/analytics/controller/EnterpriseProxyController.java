package com.biagent.analytics.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/enterprise")
@RequiredArgsConstructor
public class EnterpriseProxyController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceUrl;

    /** Proxy GET requests: /api/enterprise/** → AI service /enterprise/** */
    @GetMapping("/**")
    public ResponseEntity<Object> proxyGet(HttpServletRequest request) {
        return proxy(HttpMethod.GET, request, null);
    }

    /** Proxy POST requests */
    @PostMapping("/**")
    public ResponseEntity<Object> proxyPost(HttpServletRequest request,
                                            @RequestBody(required = false) Object body) {
        return proxy(HttpMethod.POST, request, body);
    }

    /** Proxy PUT requests */
    @PutMapping("/**")
    public ResponseEntity<Object> proxyPut(HttpServletRequest request,
                                           @RequestBody(required = false) Object body) {
        return proxy(HttpMethod.PUT, request, body);
    }

    /** Proxy DELETE requests */
    @DeleteMapping("/**")
    public ResponseEntity<Object> proxyDelete(HttpServletRequest request) {
        return proxy(HttpMethod.DELETE, request, null);
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<Object> proxy(HttpMethod method, HttpServletRequest request, Object body) {
        // Strip /api prefix → keep /enterprise/...
        String path = request.getRequestURI().replaceFirst("/api", "");
        String queryString = request.getQueryString();

        String targetUrl = aiServiceUrl + path + (queryString != null ? "?" + queryString : "");
        log.debug("Enterprise proxy {} → {}", method, targetUrl);

        try {
            var spec = webClientBuilder.build()
                    .method(method)
                    .uri(targetUrl);

            WebClient.RequestBodySpec bodySpec = (WebClient.RequestBodySpec) spec;
            WebClient.ResponseSpec responseSpec;

            if (body != null) {
                responseSpec = bodySpec
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve();
            } else {
                responseSpec = bodySpec.retrieve();
            }

            Object result = responseSpec.bodyToMono(Object.class).block();
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Enterprise proxy error for {} {}: {}", method, targetUrl, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Enterprise service unavailable: " + e.getMessage()));
        }
    }
}
