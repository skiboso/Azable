use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::error::{ApiError, ApiResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Stellar wallet address this token was issued for.
    pub sub: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn issue(address: &str, secret: &str, ttl_seconds: i64) -> ApiResult<String> {
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: address.to_string(),
        iat: now,
        exp: now + ttl_seconds,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| ApiError::Internal(format!("failed to issue jwt: {e}")))
}

pub fn verify(token: &str, secret: &str) -> ApiResult<Claims> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| ApiError::Unauthorized("invalid or expired token".to_string()))
}
