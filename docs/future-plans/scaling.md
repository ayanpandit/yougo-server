# Future Scaling Plans

The backend is currently designed to be modular and secure, running efficiently on a single instance or containerized environment. As traffic grows, the following scaling phases are planned:

## Phase 1: Distributed Caching & Rate Limiting
- **Redis Integration**: Replace the current in-memory rate limiter with a distributed Redis store.
- **Session Revocation**: Utilize Redis to store a blacklist of revoked JWTs if instant session termination is required across devices.

## Phase 2: Horizontal Scaling
- **Statelessness**: The API is entirely stateless (using JWTs). It can be seamlessly scaled horizontally across multiple containers (e.g., via Kubernetes or AWS ECS).
- **Load Balancing**: Place an AWS ALB or Nginx load balancer in front of the API containers.

## Phase 3: Database Optimization
- **Read Replicas**: Configure PostgreSQL read replicas for read-heavy operations (e.g., fetching user profiles or trip plans).
- **Connection Pooling**: Integrate PgBouncer or Prisma Accelerate to handle a massive influx of concurrent database connections from multiple API instances.

## Phase 4: Administrative Tooling
- **Audit Logs Dashboard**: Expose the `AuditLog` table to an internal admin panel to monitor suspicious activities.
- **Moderation Tools**: Implement logic utilizing the `lockedUntil` fields to allow human administrators to manually freeze or review accounts.
