use serde::Deserialize;
use serde_json::{json, Value};

use crate::error::{ApiError, ApiResult};

/// Minimal Soroban JSON-RPC client covering just the methods this service
/// needs (`getEvents`, `getLatestLedger`, `getHealth`). Hand-rolled over
/// `reqwest` rather than pulling in the official `stellar-rpc-client` crate,
/// which tracks the `stellar-cli` release cadence and pulls in a much
/// heavier dependency tree than a 3-method client needs.
pub struct SorobanRpcClient {
    http: reqwest::Client,
    url: String,
}

#[derive(Debug, Deserialize)]
struct JsonRpcResponse<T> {
    result: Option<T>,
    error: Option<JsonRpcError>,
}

#[derive(Debug, Deserialize)]
struct JsonRpcError {
    code: i64,
    message: String,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(dead_code)] // event_type/paging_token document the RPC shape; not all fields are consumed yet
pub struct RpcEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub ledger: u32,
    #[serde(rename = "ledgerClosedAt")]
    pub ledger_closed_at: Option<String>,
    #[serde(rename = "contractId")]
    pub contract_id: String,
    pub id: String,
    #[serde(rename = "pagingToken")]
    pub paging_token: Option<String>,
    pub topic: Vec<String>,
    pub value: EventValue,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    #[serde(rename = "inSuccessfulContractCall")]
    pub in_successful_contract_call: Option<bool>,
}

/// The RPC's event `value` field has changed shape across protocol
/// versions (a bare base64 string in some releases, `{"xdr": "..."}` in
/// others) — accept both rather than pinning to one.
#[derive(Debug, Deserialize, Clone)]
#[serde(untagged)]
pub enum EventValue {
    Xdr { xdr: String },
    Plain(String),
}

impl EventValue {
    pub fn as_b64(&self) -> &str {
        match self {
            EventValue::Xdr { xdr } => xdr,
            EventValue::Plain(s) => s,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetEventsResult {
    pub events: Vec<RpcEvent>,
    #[serde(rename = "latestLedger")]
    pub latest_ledger: u32,
    pub cursor: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetHealthResult {
    pub status: String,
}

impl SorobanRpcClient {
    pub fn new(http: reqwest::Client, url: String) -> Self {
        Self { http, url }
    }

    async fn call<T: for<'de> Deserialize<'de>>(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> ApiResult<T> {
        let body = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params,
        });

        let resp: JsonRpcResponse<T> = self
            .http
            .post(&self.url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ApiError::Internal(format!("rpc request failed: {e}")))?
            .json()
            .await
            .map_err(|e| ApiError::Internal(format!("rpc response decode failed: {e}")))?;

        if let Some(err) = resp.error {
            return Err(ApiError::Internal(format!(
                "rpc error {}: {}",
                err.code, err.message
            )));
        }
        resp.result
            .ok_or_else(|| ApiError::Internal("rpc response missing result".to_string()))
    }

    pub async fn get_health(&self) -> ApiResult<GetHealthResult> {
        self.call("getHealth", json!({})).await
    }

    pub async fn get_latest_ledger_seq(&self) -> ApiResult<u32> {
        #[derive(Deserialize)]
        struct R {
            sequence: u32,
        }
        let r: R = self.call("getLatestLedger", json!({})).await?;
        Ok(r.sequence)
    }

    /// Poll events for `contract_ids` starting at `start_ledger` (used when
    /// there is no saved cursor yet) or resuming from `cursor`.
    pub async fn get_events(
        &self,
        contract_ids: &[String],
        start_ledger: Option<u32>,
        cursor: Option<&str>,
        limit: u32,
    ) -> ApiResult<GetEventsResult> {
        let mut pagination = serde_json::Map::new();
        pagination.insert("limit".to_string(), json!(limit));
        if let Some(cursor) = cursor {
            pagination.insert("cursor".to_string(), json!(cursor));
        }

        let mut params = serde_json::Map::new();
        params.insert(
            "filters".to_string(),
            json!([{ "type": "contract", "contractIds": contract_ids }]),
        );
        params.insert("pagination".to_string(), Value::Object(pagination));
        if cursor.is_none() {
            if let Some(start_ledger) = start_ledger {
                params.insert("startLedger".to_string(), json!(start_ledger));
            }
        }

        self.call("getEvents", Value::Object(params)).await
    }
}
