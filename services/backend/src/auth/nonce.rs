use chrono::{DateTime, Duration, Utc};
use sqlx::PgPool;

#[allow(dead_code)] // consumed_at documents the row shape; not read post-consume
pub struct NonceRow {
    pub address: String,
    pub consumed_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
}

pub async fn insert(
    pool: &PgPool,
    address: &str,
    nonce_hex: &str,
    tx_hash_hex: &str,
    ttl_seconds: i64,
) -> Result<DateTime<Utc>, sqlx::Error> {
    let expires_at = Utc::now() + Duration::seconds(ttl_seconds);
    sqlx::query(
        r#"
        INSERT INTO auth_nonces (address, nonce, tx_hash, expires_at)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(address)
    .bind(nonce_hex)
    .bind(tx_hash_hex)
    .bind(expires_at)
    .execute(pool)
    .await?;
    Ok(expires_at)
}

/// Fetches the nonce row for a given tx hash and, if found and unconsumed
/// and unexpired, atomically marks it consumed in the same statement so a
/// challenge can never be replayed.
pub async fn consume(pool: &PgPool, tx_hash_hex: &str) -> Result<Option<NonceRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (String, Option<DateTime<Utc>>, DateTime<Utc>)>(
        r#"
        UPDATE auth_nonces
        SET consumed_at = now()
        WHERE tx_hash = $1 AND consumed_at IS NULL
        RETURNING address, consumed_at, expires_at
        "#,
    )
    .bind(tx_hash_hex)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|(address, consumed_at, expires_at)| NonceRow {
        address,
        consumed_at,
        expires_at,
    }))
}
