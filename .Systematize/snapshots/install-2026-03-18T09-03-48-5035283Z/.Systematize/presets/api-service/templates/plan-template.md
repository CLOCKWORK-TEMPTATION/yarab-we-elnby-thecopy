<!-- Preset: api-service — extends core plan-template with microservices considerations -->

## Service Architecture

### Service Boundaries

| Service | Responsibility | Protocol | Dependencies |
|---------|---------------|----------|-------------|
| [SERVICE] | [RESPONSIBILITY] | REST/gRPC/Event | [DEPS] |

### Data Flow

| Source | Destination | Method | Frequency | Volume |
|--------|------------|--------|-----------|--------|
| [SOURCE] | [DEST] | Sync/Async/Event | [FREQ] | [VOLUME] |

### Resilience Patterns

| Pattern | Where Applied | Configuration |
|---------|--------------|--------------|
| Circuit Breaker | [SERVICE] | [CONFIG] |
| Retry | [SERVICE] | [CONFIG] |
| Timeout | [SERVICE] | [CONFIG] |
| Bulkhead | [SERVICE] | [CONFIG] |

## Changelog

- 2026-03-17: Initial preset template for api-service projects
