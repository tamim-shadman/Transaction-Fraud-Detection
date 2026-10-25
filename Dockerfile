# ==============================================================================
# Transaction Fraud Detection Analytics Platform — Multi-Stage Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Frontend Build Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /build/app

# Install dependencies using lockfile for deterministic builds
COPY app/package.json app/package-lock.json ./
RUN npm ci

# Copy frontend source and static assets
COPY app/ ./
# Build production bundle into app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: Hardened Python Production Runtime
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

# Avoid buffering and bytecode generation in container
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=4173 \
    LOG_LEVEL=INFO

WORKDIR /app

# Install minimal OS dependencies if needed, clean apt cache
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Install minimal production python dependencies
COPY requirements-prod.txt ./
RUN pip install --no-cache-dir -r requirements-prod.txt

# Create unprivileged application user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy application directories
COPY tables/ /app/tables/
COPY figures/ /app/figures/
COPY logs/ /app/logs/
COPY scripts/ /app/scripts/
COPY analytics/ /app/analytics/
COPY app/public/ /app/app/public/
COPY fraud_eda_colab(1).ipynb /app/

# Copy built frontend from builder stage
COPY --from=builder /build/app/dist /app/app/dist

# Create runtime directories and set ownership to unprivileged user
RUN mkdir -p /app/backups /app/app/public/data/snapshots /app/logs && \
    chown -R appuser:appgroup /app

# Switch to non-root execution
USER appuser

# Expose web application port
EXPOSE 4173

# Health check using python health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python scripts/health_check.py --type liveness || exit 1

# Start the hardened production operational server
CMD ["python", "scripts/server.py"]
