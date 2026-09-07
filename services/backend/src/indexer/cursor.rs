use sqlx::PgPool;

pub struct Cursor {
    pub last_ledger: i64,
    pub last_paging_token: Option<String>,
}

pub async fn load(pool: &PgPool, indexer_id: &str) -> Result<Option<Cursor>, sqlx::Error> {
    let row = sqlx::query_as::<_, (i64, Option<String>)>(
        "SELECT last_ledger, last_paging_token FROM indexer_cursors WHERE indexer_id = $1",
    )
    .bind(indexer_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|(last_ledger, last_paging_token)| Cursor {
        last_ledger,
        last_paging_token,
    }))
}

pub async fn save(
    pool: &PgPool,
    indexer_id: &str,
    last_ledger: i64,
    last_paging_token: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO indexer_cursors (indexer_id, last_ledger, last_paging_token, updated_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (indexer_id) DO UPDATE
        SET last_ledger = EXCLUDED.last_ledger,
            last_paging_token = EXCLUDED.last_paging_token,
            updated_at = now()
        "#,
    )
    .bind(indexer_id)
    .bind(last_ledger)
    .bind(last_paging_token)
    .execute(pool)
    .await?;
    Ok(())
}
