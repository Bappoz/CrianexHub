# ── Build ────────────────────────────────────────────────────────────────────
FROM rust:1-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

# ── Runtime (imagem mínima) ───────────────────────────────────────────────────
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/crianex-notify /usr/local/bin/crianex-notify
EXPOSE 3100
ENV NOTIFY_PORT=3100
CMD ["crianex-notify"]
