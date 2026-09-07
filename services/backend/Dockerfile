# syntax=docker/dockerfile:1
FROM rust:1.90-slim-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --no-create-home azable

COPY --from=builder /app/target/release/azable-backend /usr/local/bin/azable-backend
COPY --from=builder /app/migrations ./migrations

USER azable
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/azable-backend"]
