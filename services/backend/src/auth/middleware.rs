use axum::{extract::FromRequestParts, http::request::Parts};

use super::jwt;
use crate::error::ApiError;
use crate::state::AppState;

/// Axum extractor for `GET /me` (and any future protected route): pulls a
/// `Bearer` JWT from the `Authorization` header, verifies it, and yields the
/// wallet address it was issued for.
pub struct AuthUser(pub String);

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| ApiError::Unauthorized("missing Authorization header".to_string()))?;

        let token = header
            .strip_prefix("Bearer ")
            .ok_or_else(|| ApiError::Unauthorized("expected Bearer token".to_string()))?;

        let claims = jwt::verify(token, &state.config.jwt_secret)?;
        Ok(AuthUser(claims.sub))
    }
}
