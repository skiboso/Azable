mod auth;
mod campaigns;
mod health;
mod streams;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::{cors::CorsLayer, timeout::TimeoutLayer, trace::TraceLayer};

use crate::state::AppState;
use std::time::Duration;

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .route("/auth/challenge", post(auth::challenge))
        .route("/auth/verify", post(auth::verify))
        .route("/me", get(auth::me))
        .route("/streams", get(streams::list_streams))
        .route("/campaigns", get(campaigns::list_campaigns))
        .route("/campaigns/{id}", get(campaigns::get_campaign))
        .layer(TraceLayer::new_for_http())
        .layer(TimeoutLayer::with_status_code(
            axum::http::StatusCode::GATEWAY_TIMEOUT,
            Duration::from_secs(30),
        ))
        .layer(CorsLayer::permissive())
        .with_state(state)
}
