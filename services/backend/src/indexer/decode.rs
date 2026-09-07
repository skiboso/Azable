use base64::Engine;
use serde_json::{json, Value};
use stellar_xdr::{ReadXdr, ScVal};

/// Decode a base64-encoded XDR `ScVal` into a JSON value.
///
/// The 13 Soroban contracts in this repo emit events in two incompatible
/// shapes: some use the typed `#[contractevent]` macro, others call
/// `env.events().publish(("Topic",), raw_tuple)` directly (see the
/// per-contract event survey in the plan this service was built from).
/// Writing a bespoke decoder per contract would be several times the code
/// of the rest of this service, so v1 deliberately normalizes *every*
/// event the same way: topics and the value both go through this one
/// recursive converter and land in `stream_events.topics`/`.data` as JSONB.
/// Callers needing a typed shape (e.g. `routes::streams`) pull specific
/// fields back out with Postgres `->>` extraction. Per-contract typed
/// tables are a documented fast-follow, not v1.
pub fn decode_scval_b64(b64: &str) -> Value {
    let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(b64) else {
        return json!({ "raw": b64 });
    };
    match ScVal::from_xdr(bytes, stellar_xdr::Limits::none()) {
        Ok(val) => scval_to_json(&val),
        Err(_) => json!({ "raw": b64 }),
    }
}

pub fn scval_to_json(val: &ScVal) -> Value {
    match val {
        ScVal::Bool(b) => json!(b),
        ScVal::Void => Value::Null,
        ScVal::Error(e) => json!({ "error": format!("{e:?}") }),
        ScVal::U32(v) => json!(v),
        ScVal::I32(v) => json!(v),
        ScVal::U64(v) => json!(v.to_string()),
        ScVal::I64(v) => json!(v.to_string()),
        ScVal::Timepoint(v) => json!(v.0.to_string()),
        ScVal::Duration(v) => json!(v.0.to_string()),
        ScVal::U128(v) => json!(((v.hi as u128) << 64 | v.lo as u128).to_string()),
        ScVal::I128(v) => {
            let unsigned = ((v.hi as u128) << 64) | v.lo as u128;
            json!((unsigned as i128).to_string())
        }
        ScVal::U256(v) => json!(format!("{v:?}")),
        ScVal::I256(v) => json!(format!("{v:?}")),
        ScVal::Bytes(b) => json!(hex::encode(b.as_slice())),
        ScVal::String(s) => json!(s.to_string()),
        ScVal::Symbol(s) => json!(s.to_string()),
        ScVal::Vec(Some(items)) => Value::Array(items.iter().map(scval_to_json).collect()),
        ScVal::Vec(None) => Value::Array(vec![]),
        ScVal::Map(Some(entries)) => {
            let mut obj = serde_json::Map::new();
            for entry in entries.iter() {
                let key = match scval_to_json(&entry.key) {
                    Value::String(s) => s,
                    other => other.to_string(),
                };
                obj.insert(key, scval_to_json(&entry.val));
            }
            Value::Object(obj)
        }
        ScVal::Map(None) => Value::Object(serde_json::Map::new()),
        ScVal::Address(addr) => json!(format!("{addr:?}")),
        other => json!({ "unhandled": format!("{other:?}") }),
    }
}

/// The first topic in a Soroban event is conventionally the event's name
/// (a Symbol), used across this repo's contracts as e.g. "StreamDeposit",
/// "CampaignCreated", "badge_minted". Used to populate `stream_events.event_type`.
pub fn event_type_from_topics(topics_json: &Value) -> Option<String> {
    topics_json
        .as_array()?
        .first()?
        .as_str()
        .map(str::to_string)
}
