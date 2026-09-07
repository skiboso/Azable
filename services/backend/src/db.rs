use sqlx::postgres::{PgPool, PgPoolOptions};

pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}

/// Runs every migration in `migrations/` that hasn't been applied yet.
/// This is what actually creates the base `campaigns` table (see
/// `migrations/0001_create_campaigns.sql`) on a fresh database.
pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}
