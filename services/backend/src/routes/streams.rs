use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};

use crate::error::ApiResult;
use crate::state::AppState;

/// Shape matches `StreamRecord` in
/// `apps/web/src/graphql/analytics.service.ts` exactly, so this endpoint
/// can become that file's `DefaultStreamDataSource.getStreams()` backing
/// data source with a plain `fetch` + JSON decode.
///
/// Known v1 limitation: most of this repo's contract events (see
/// `indexer/decode.rs`) don't carry sender/recipient/asset in their raw
/// event data — e.g. `payment-stream`'s `StreamDepositEvent` is just
/// `{stream_id, amount}`. Those fields are populated on a best-effort basis
/// from whatever keys a given contract's event happens to use, and fall
/// back to empty strings otherwise. Full enrichment (joining against
/// contract storage reads, or richer per-contract decoders) is a
/// documented fast-follow, not v1.
#[derive(Serialize)]
pub struct StreamRecord {
    pub id: String,
    pub sender: String,
    pub recipient: String,
    pub asset: String,
    pub symbol: Option<String>,
    #[serde(rename = "totalAmount")]
    pub total_amount: String,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    pub region: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "usdEquivalent")]
    pub usd_equivalent: Option<String>,
}

#[derive(Deserialize)]
pub struct StreamsQuery {
    pub contract: Option<String>,
    pub event_type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

fn status_from_event_type(event_type: Option<&str>) -> String {
    match event_type.unwrap_or_default() {
        t if t.eq_ignore_ascii_case("StreamCancelled")
            || t.eq_ignore_ascii_case("stream_cancelled") =>
        {
            "Canceled"
        }
        t if t.eq_ignore_ascii_case("StreamPaused") => "Paused",
        t if t.eq_ignore_ascii_case("StreamClaimed")
            || t.eq_ignore_ascii_case("stream_claimed") =>
        {
            "Completed"
        }
        _ => "Active",
    }
    .to_string()
}

pub async fn list_streams(
    State(state): State<AppState>,
    Query(q): Query<StreamsQuery>,
) -> ApiResult<Json<Vec<StreamRecord>>> {
    let limit = q.limit.unwrap_or(100).clamp(1, 500);
    let offset = q.offset.unwrap_or(0).max(0);

    let rows = sqlx::query_as::<_, (String, String, Option<String>, serde_json::Value, i64)>(
        r#"
        SELECT
          rpc_event_id,
          contract_id,
          event_type,
          data,
          extract(epoch from coalesce(ledger_closed_at, indexed_at))::bigint as created_at
        FROM stream_events
        WHERE ($1::text IS NULL OR contract_id = $1)
          AND ($2::text IS NULL OR event_type = $2)
        ORDER BY ledger DESC
        LIMIT $3 OFFSET $4
        "#,
    )
    .bind(&q.contract)
    .bind(&q.event_type)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let records = rows
        .into_iter()
        .map(|(id, _contract_id, event_type, data, created_at)| {
            let get = |keys: &[&str]| -> Option<String> {
                keys.iter()
                    .find_map(|k| data.get(k).and_then(|v| v.as_str()).map(str::to_string))
            };
            StreamRecord {
                id,
                sender: get(&["sender", "from", "creator", "verifier"]).unwrap_or_default(),
                recipient: get(&["recipient", "to", "beneficiary"]).unwrap_or_default(),
                asset: get(&["asset", "token", "from_token", "to_token"]).unwrap_or_default(),
                symbol: None,
                total_amount: get(&["amount", "total_amount", "totalAmount"])
                    .unwrap_or_else(|| "0".to_string()),
                status: status_from_event_type(event_type.as_deref()),
                created_at,
                region: None,
                category: None,
                usd_equivalent: None,
            }
        })
        .collect();

    Ok(Json(records))
}
