mod auth;
mod config;
mod db;
mod error;
mod indexer;
mod routes;
mod state;

use std::sync::Arc;

use config::AppConfig;
use state::AppState;

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = AppConfig::from_env().unwrap_or_else(|err| {
        eprintln!("configuration error: {err}");
        std::process::exit(1);
    });

    let db = db::connect(&config.database_url)
        .await
        .expect("failed to connect to database");

    db::run_migrations(&db)
        .await
        .expect("failed to run database migrations");

    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .expect("failed to build http client");

    let bind_addr = config.bind_addr.clone();
    let state = AppState {
        db,
        http,
        config: Arc::new(config),
    };

    indexer::spawn(state.clone());

    let app = routes::build_router(state);

    tracing::info!(%bind_addr, "starting azable-backend");
    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .expect("failed to bind listener");
    axum::serve(listener, app).await.expect("server error");
}
