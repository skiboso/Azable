use axum::{extract::State, http::StatusCode, Json};
use serde_json::json;

use crate::indexer::soroban_rpc::SorobanRpcClient;
use crate::state::AppState;

pub async fn health(State(state): State<AppState>) -> (StatusCode, Json<serde_json::Value>) {
    let db_ok = sqlx::query("SELECT 1").execute(&state.db).await.is_ok();

    let rpc = SorobanRpcClient::new(state.http.clone(), state.config.soroban_rpc_url.clone());
    let rpc_ok = matches!(rpc.get_health().await, Ok(h) if h.status == "healthy");

    let status = if db_ok && rpc_ok {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        status,
        Json(json!({
            "status": if status == StatusCode::OK { "ok" } else { "degraded" },
            "db": if db_ok { "ok" } else { "error" },
            "rpc": if rpc_ok { "ok" } else { "error" },
        })),
    )
}
