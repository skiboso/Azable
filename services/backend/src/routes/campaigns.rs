use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::error::{ApiError, ApiResult};
use crate::state::AppState;

/// Reads off the real `campaigns` table created by
/// `migrations/0001_create_campaigns.sql`. This is the first real,
/// database-backed replacement for `apps/web/src/services/campaign.service.ts`'s
/// `InMemoryCampaignDataSource` — the rest of that in-memory/mock surface
/// (analytics, grants, sequels, etc.) migrates incrementally following this
/// same pattern, not all at once.
#[derive(Serialize, sqlx::FromRow)]
pub struct Campaign {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub creator: String,
    #[serde(rename = "goalAmount")]
    pub goal_amount: Option<String>,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

const SELECT_CAMPAIGN: &str = r#"
    SELECT id, name, description, creator, goal_amount::text as goal_amount, status, created_at, updated_at
    FROM campaigns
"#;

pub async fn list_campaigns(State(state): State<AppState>) -> ApiResult<Json<Vec<Campaign>>> {
    let sql = format!("{SELECT_CAMPAIGN} ORDER BY created_at DESC LIMIT 200");
    let campaigns = sqlx::query_as::<_, Campaign>(&sql)
        .fetch_all(&state.db)
        .await?;
    Ok(Json(campaigns))
}

pub async fn get_campaign(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<Campaign>> {
    let sql = format!("{SELECT_CAMPAIGN} WHERE id = $1");
    let campaign = sqlx::query_as::<_, Campaign>(&sql)
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(ApiError::NotFound)?;
    Ok(Json(campaign))
}
