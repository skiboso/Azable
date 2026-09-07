use std::env;

/// Runtime configuration, loaded from environment variables (see
/// `.env.example` for the full list and defaults). Kept as plain
/// `std::env::var` parsing rather than a crate like `envy`, matching the
/// manual-parsing convention already used elsewhere in this repo
/// (`apps/web/src/lib/env.ts`, `scripts/*.ts`).
#[derive(Debug, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub bind_addr: String,
    pub soroban_rpc_url: String,
    pub network_passphrase: String,
    pub contract_ids: Vec<String>,
    pub jwt_secret: String,
    pub jwt_ttl_seconds: i64,
    pub poll_interval_seconds: u64,
    pub ledger_lookback: u32,
    pub max_events_per_poll: u32,
    pub indexer_id: String,
    pub auth_challenge_ttl_seconds: i64,
}

fn env_or(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

fn env_parse<T: std::str::FromStr>(key: &str, default: T) -> T {
    env::var(key)
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

impl AppConfig {
    /// Load config from the process environment. `main.rs` calls
    /// `dotenvy::dotenv()` before this so a local `.env` file is honored too.
    pub fn from_env() -> Result<Self, String> {
        let database_url =
            env::var("DATABASE_URL").map_err(|_| "DATABASE_URL is required".to_string())?;
        let jwt_secret =
            env::var("JWT_SECRET").map_err(|_| "JWT_SECRET is required".to_string())?;

        let contract_ids = env::var("CONTRACT_IDS")
            .unwrap_or_default()
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
            .collect();

        // Render (and some Railway configurations) assign a port at deploy
        // time via $PORT and expect the app to bind to it, rather than a
        // fixed address — an explicit BIND_ADDR always wins if set, since
        // that's the more specific setting, but otherwise prefer $PORT over
        // the 0.0.0.0:8080 default so this boots correctly on either
        // platform with no per-service port wiring.
        let bind_addr = env::var("BIND_ADDR").unwrap_or_else(|_| match env::var("PORT") {
            Ok(port) => format!("0.0.0.0:{port}"),
            Err(_) => "0.0.0.0:8080".to_string(),
        });

        Ok(Self {
            database_url,
            bind_addr,
            soroban_rpc_url: env_or("SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org"),
            network_passphrase: env_or("NETWORK_PASSPHRASE", "Test SDF Network ; September 2015"),
            contract_ids,
            jwt_secret,
            jwt_ttl_seconds: env_parse("JWT_TTL_SECONDS", 3600),
            poll_interval_seconds: env_parse("POLL_INTERVAL_SECONDS", 5),
            ledger_lookback: env_parse("LEDGER_LOOKBACK", 1000),
            max_events_per_poll: env_parse("MAX_EVENTS_PER_POLL", 200),
            indexer_id: env_or("INDEXER_ID", "azable-backend"),
            auth_challenge_ttl_seconds: env_parse("AUTH_CHALLENGE_TTL_SECONDS", 300),
        })
    }
}
