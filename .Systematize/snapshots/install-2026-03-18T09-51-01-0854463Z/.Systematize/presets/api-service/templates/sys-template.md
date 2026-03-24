<!-- Preset: api-service — extends core sys-template with API-specific NFRs -->

## API Service Requirements

### SLA Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | [99.9%/99.95%/99.99%] | Monthly |
| Latency (p50) | [X]ms | Per endpoint |
| Latency (p95) | [X]ms | Per endpoint |
| Latency (p99) | [X]ms | Per endpoint |
| Throughput | [X] req/s | Peak load |
| Error Rate | <[X]% | Rolling 5min |

### API Contract

| Aspect | Specification |
|--------|--------------|
| Protocol | REST / GraphQL / gRPC |
| Documentation | OpenAPI 3.x / GraphQL Schema |
| Versioning | [STRATEGY] |
| Rate Limiting | [X] req/min per client |
| Pagination | Cursor / Offset / Keyset |
| Error Format | RFC 7807 / Custom |

## Changelog

- 2026-03-17: Initial preset template for api-service projects
