mod cursor;
pub mod decode;
mod persist;
pub mod soroban_rpc;

use std::time::Duration;

use serde_json::json;

use crate::state::AppState;
use decode::decode_scval_b64;
use persist::DecodedEvent;
use soroban_rpc::SorobanRpcClient;

/// Spawns the background polling loop that replaces the old, unwired
/// `scripts/cdc-indexer.ts`. Runs for the lifetime of the process; errors
/// on a single poll are logged and retried on the next tick rather than
/// crashing the server (an RPC hiccup shouldn't take down the API).
pub fn spawn(state: AppState) {
    tokio::spawn(async move {
        if state.config.contract_ids.is_empty() {
            tracing::warn!("CONTRACT_IDS is empty; indexer will not poll for events");
            return;
        }

        let rpc = SorobanRpcClient::new(state.http.clone(), state.config.soroban_rpc_url.clone());
        let mut interval = tokio::time::interval(Duration::from_secs(
            state.config.poll_interval_seconds.max(1),
        ));

        loop {
            interval.tick().await;
            if let Err(err) = poll_once(&state, &rpc).await {
                tracing::error!(error = %err, "indexer poll cycle failed");
            }
        }
    });
}

async fn poll_once(state: &AppState, rpc: &SorobanRpcClient) -> Result<(), crate::error::ApiError> {
    let indexer_id = &state.config.indexer_id;
    let saved = cursor::load(&state.db, indexer_id).await?;

    let (start_ledger, paging_token) = match &saved {
        // Resume from the saved cursor. If we have a paging token, the RPC
        // wants that instead of startLedger; otherwise (e.g. the last poll
        // saw zero events) fall back to resuming one ledger past where we
        // left off.
        Some(c) if c.last_paging_token.is_some() => (None, c.last_paging_token.clone()),
        Some(c) => (Some((c.last_ledger + 1) as u32), None),
        None => {
            let latest = rpc.get_latest_ledger_seq().await?;
            let lookback = state.config.ledger_lookback.max(1);
            (Some(latest.saturating_sub(lookback).max(1)), None)
        }
    };

    let result = rpc
        .get_events(
            &state.config.contract_ids,
            start_ledger,
            paging_token.as_deref(),
            state.config.max_events_per_poll,
        )
        .await?;

    if result.events.is_empty() {
        cursor::save(&state.db, indexer_id, result.latest_ledger as i64, None).await?;
        return Ok(());
    }

    let decoded: Vec<DecodedEvent> = result
        .events
        .iter()
        .map(|event| {
            let topics = json!(event
                .topic
                .iter()
                .map(|t| decode_scval_b64(t))
                .collect::<Vec<_>>());
            let data = decode_scval_b64(event.value.as_b64());
            DecodedEvent::from_rpc(event, topics, data)
        })
        .collect();

    let inserted = persist::insert_events(&state.db, &decoded).await?;
    tracing::info!(
        fetched = result.events.len(),
        inserted,
        latest_ledger = result.latest_ledger,
        "indexer poll cycle complete"
    );

    let last_ledger = result
        .events
        .iter()
        .map(|e| e.ledger)
        .max()
        .unwrap_or(result.latest_ledger) as i64;
    cursor::save(&state.db, indexer_id, last_ledger, result.cursor.as_deref()).await?;

    Ok(())
}
