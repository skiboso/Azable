use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;

use super::decode::event_type_from_topics;
use super::soroban_rpc::RpcEvent;

pub struct DecodedEvent {
    pub rpc_event_id: String,
    pub contract_id: String,
    pub ledger: i64,
    pub ledger_closed_at: Option<DateTime<Utc>>,
    pub tx_hash: String,
    pub event_type: Option<String>,
    pub topics: Value,
    pub data: Value,
    pub in_successful_contract_call: bool,
}

impl DecodedEvent {
    pub fn from_rpc(event: &RpcEvent, topics: Value, data: Value) -> Self {
        let event_type = event_type_from_topics(&topics);
        Self {
            rpc_event_id: event.id.clone(),
            contract_id: event.contract_id.clone(),
            ledger: event.ledger as i64,
            ledger_closed_at: event
                .ledger_closed_at
                .as_deref()
                .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.with_timezone(&Utc)),
            tx_hash: event.tx_hash.clone().unwrap_or_default(),
            event_type,
            topics,
            data,
            in_successful_contract_call: event.in_successful_contract_call.unwrap_or(true),
        }
    }
}

/// Upserts every decoded event, skipping ones we've already indexed
/// (the RPC's own event id is unique per event, so a re-poll across an
/// overlapping ledger range never creates a duplicate row).
pub async fn insert_events(pool: &PgPool, events: &[DecodedEvent]) -> Result<u64, sqlx::Error> {
    let mut inserted = 0u64;
    let mut tx = pool.begin().await?;
    for event in events {
        let result = sqlx::query(
            r#"
            INSERT INTO stream_events (
                rpc_event_id, contract_id, ledger, ledger_closed_at, tx_hash,
                event_type, topics, data, in_successful_contract_call
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (rpc_event_id) DO NOTHING
            "#,
        )
        .bind(&event.rpc_event_id)
        .bind(&event.contract_id)
        .bind(event.ledger)
        .bind(event.ledger_closed_at)
        .bind(&event.tx_hash)
        .bind(&event.event_type)
        .bind(&event.topics)
        .bind(&event.data)
        .bind(event.in_successful_contract_call)
        .execute(&mut *tx)
        .await?;
        inserted += result.rows_affected();
    }
    tx.commit().await?;
    Ok(inserted)
}
