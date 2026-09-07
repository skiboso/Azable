use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::auth::{challenge_tx, jwt, middleware::AuthUser, nonce};
use crate::error::{ApiError, ApiResult};
use crate::state::AppState;

#[derive(Deserialize)]
pub struct ChallengeRequest {
    pub address: String,
}

#[derive(Serialize)]
pub struct ChallengeResponse {
    pub transaction_xdr: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

/// `POST /auth/challenge` — builds an unsigned, never-submitted transaction
/// carrying a random nonce and returns it for the caller's wallet to sign
/// with the `signTransaction()` call the frontend already has.
pub async fn challenge(
    State(state): State<AppState>,
    Json(req): Json<ChallengeRequest>,
) -> ApiResult<Json<ChallengeResponse>> {
    let (envelope_b64, nonce_hex, tx_hash_hex) =
        challenge_tx::build_challenge(&req.address, &state.config.network_passphrase)?;

    let expires_at = nonce::insert(
        &state.db,
        &req.address,
        &nonce_hex,
        &tx_hash_hex,
        state.config.auth_challenge_ttl_seconds,
    )
    .await?;

    Ok(Json(ChallengeResponse {
        transaction_xdr: envelope_b64,
        expires_at,
    }))
}

#[derive(Deserialize)]
pub struct VerifyRequest {
    pub address: String,
    pub transaction_xdr: String,
}

#[derive(Serialize)]
pub struct VerifyResponse {
    pub token: String,
}

/// `POST /auth/verify` — verifies the signed challenge transaction and, on
/// success, consumes its nonce (one-time use) and issues a JWT.
pub async fn verify(
    State(state): State<AppState>,
    Json(req): Json<VerifyRequest>,
) -> ApiResult<Json<VerifyResponse>> {
    let (tx_hash_hex, _nonce_bytes) = challenge_tx::verify_signed_envelope(
        &req.transaction_xdr,
        &req.address,
        &state.config.network_passphrase,
    )?;

    let row = nonce::consume(&state.db, &tx_hash_hex)
        .await?
        .ok_or_else(|| ApiError::Unauthorized("unknown or already-used challenge".to_string()))?;

    if row.address != req.address {
        return Err(ApiError::Unauthorized(
            "challenge was issued for a different address".to_string(),
        ));
    }
    if row.expires_at < chrono::Utc::now() {
        return Err(ApiError::Unauthorized("challenge has expired".to_string()));
    }

    let token = jwt::issue(
        &req.address,
        &state.config.jwt_secret,
        state.config.jwt_ttl_seconds,
    )?;

    Ok(Json(VerifyResponse { token }))
}

#[derive(Serialize)]
pub struct MeResponse {
    pub address: String,
}

/// `GET /me` — JWT-protected; proves the auth flow end-to-end by echoing
/// back the address the token was issued for.
pub async fn me(AuthUser(address): AuthUser) -> Json<MeResponse> {
    Json(MeResponse { address })
}
