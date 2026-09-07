use std::sync::Arc;

use sqlx::postgres::PgPool;

use crate::config::AppConfig;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub http: reqwest::Client,
    pub config: Arc<AppConfig>,
}
