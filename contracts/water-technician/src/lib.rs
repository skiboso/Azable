#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env,
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// Storage key enumeration.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Global admin address (instance storage).
    Admin,
    /// Reward token address (XLM) (instance storage).
    RewardToken,
    /// Reward amount in stroops (instance storage).
    RewardAmount,
    /// WaterTechnician info keyed by address (persistent storage).
    WaterTechnician(Address),
    /// Referral info keyed by referrer address (persistent storage).
    Referrals(Address),
}

/// WaterTechnician information.
#[contracttype]
#[derive(Clone)]
pub struct WaterTechnicianInfo {
    /// WaterTechnician address.
    pub address: Address,
    /// Who referred this technician (if any).
    pub referrer: Option<Address>,
    /// Number of jobs completed.
    pub jobs_completed: u64,
    /// Whether the first job completion reward has been claimed.
    pub first_job_reward_claimed: bool,
}

/// Referral information.
#[contracttype]
#[derive(Clone)]
pub struct ReferralInfo {
    /// Number of technicians referred.
    pub referral_count: u64,
    /// Number of referred technicians who completed their first job.
    pub successful_referrals: u64,
}

/// Event emitted when a technician is registered.
#[contracttype]
#[derive(Clone)]
pub struct WaterTechnicianRegisteredEvent {
    pub technician: Address,
    pub referrer: Option<Address>,
}

/// Event emitted when a technician completes a job.
#[contracttype]
#[derive(Clone)]
pub struct JobCompletedEvent {
    pub technician: Address,
    pub job_count: u64,
}

/// Event emitted when a referral reward is claimed.
#[contracttype]
#[derive(Clone)]
pub struct ReferralRewardClaimedEvent {
    pub referrer: Address,
    pub referred_technician: Address,
    pub amount: i128,
}

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Contract already initialized.
    AlreadyInitialized = 1,
    /// Contract not initialized.
    NotInitialized = 2,
    /// Unauthorized caller.
    Unauthorized = 3,
    /// WaterTechnician already registered.
    AlreadyRegistered = 4,
    /// WaterTechnician not found.
    WaterTechnicianNotFound = 5,
    /// Invalid reward amount.
    InvalidRewardAmount = 6,
    /// Reward already claimed.
    RewardAlreadyClaimed = 7,
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Storage TTL threshold: ~30 days at 5 s/ledger.
const LEDGER_THRESHOLD: u32 = 518_400;
/// Storage TTL bump: ~31 days at 5 s/ledger.
const LEDGER_BUMP: u32 = 535_680;
/// Default reward: 2 XLM (2 * 10^7 stroops).
const DEFAULT_REWARD: i128 = 20_000_000;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WaterTechnicianMetrics {
    pub wells_completed: u32,
    pub avg_completion_time: u64,
    pub success_rate: u32,
    pub current_bond_locked: i128,
}

#[contract]
pub struct WaterTechnicianContract;

#[contractimpl]
impl WaterTechnicianContract {
    /// Initialize the contract.
    ///
    /// # Arguments
    /// * `admin` — Admin address authorized to update parameters.
    /// * `reward_token` — XLM token contract address.
    /// * `reward_amount` — Reward amount in stroops (default: 20,000,000 = 2 XLM).
    pub fn initialize(env: Env, admin: Address, reward_token: Address, reward_amount: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        if reward_amount <= 0 {
            panic_with_error!(&env, Error::InvalidRewardAmount);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RewardToken, &reward_token);
        env.storage().instance().set(&DataKey::RewardAmount, &reward_amount);
        env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDGER_BUMP);
    }

    /// Register a new technician with an optional referrer.
    ///
    /// # Arguments
    /// * `technician` — WaterTechnician address to register.
    /// * `referrer` — Optional referrer address.
    pub fn register_technician(env: Env, technician: Address, referrer: Option<Address>) {
        if env.storage().persistent().has(&DataKey::WaterTechnician(technician.clone())) {
            panic_with_error!(&env, Error::AlreadyRegistered);
        }
        technician.require_auth();

        let technician_info = WaterTechnicianInfo {
            address: technician.clone(),
            referrer: referrer.clone(),
            jobs_completed: 0,
            first_job_reward_claimed: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::WaterTechnician(technician.clone()), &technician_info);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::WaterTechnician(technician.clone()), LEDGER_THRESHOLD, LEDGER_BUMP);

        // Update referrer's referral count
        if let Some(referrer_addr) = referrer.clone() {
            let mut referral_info = Self::load_referral_info(&env, referrer_addr.clone());
            referral_info.referral_count += 1;
            Self::save_referral_info(&env, referrer_addr.clone(), &referral_info);
        }

        env.events().publish(
            ("WaterTechnicianRegistered", technician.clone()),
            WaterTechnicianRegisteredEvent {
                technician,
                referrer,
            },
        );
    }

    /// Record a job completion for a technician.
    ///
    /// # Arguments
    /// * `technician` — WaterTechnician address.
    pub fn complete_job(env: Env, technician: Address) {
        let mut technician_info = Self::load_technician(&env, technician.clone());
        technician.require_auth();

        technician_info.jobs_completed += 1;
        Self::save_technician(&env, technician.clone(), &technician_info);

        env.events().publish(
            ("JobCompleted", technician.clone()),
            JobCompletedEvent {
                technician,
                job_count: technician_info.jobs_completed,
            },
        );
    }

    /// Claim referral reward for a referred technician's first job completion.
    ///
    /// # Arguments
    /// * `referrer` — Referrer address claiming the reward.
    /// * `referred_technician` — The referred technician who completed their first job.
    pub fn claim_referral_reward(env: Env, referrer: Address, referred_technician: Address) {
        referrer.require_auth();

        let referred_info = Self::load_technician(&env, referred_technician.clone());
        
        // Verify the referrer is correct
        if referred_info.referrer != Some(referrer.clone()) {
            panic_with_error!(&env, Error::Unauthorized);
        }

        // Verify the referred technician has completed at least one job
        if referred_info.jobs_completed == 0 {
            panic_with_error!(&env, Error::WaterTechnicianNotFound);
        }

        // Verify reward hasn't been claimed yet
        if referred_info.first_job_reward_claimed {
            panic_with_error!(&env, Error::RewardAlreadyClaimed);
        }

        let reward_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RewardAmount)
            .unwrap_or(DEFAULT_REWARD);

        let reward_token: Address = env
            .storage()
            .instance()
            .get(&DataKey::RewardToken)
            .unwrap();

        // Mark reward as claimed
        let mut updated_info = referred_info;
        updated_info.first_job_reward_claimed = true;
        Self::save_technician(&env, referred_technician.clone(), &updated_info);

        // Update referrer's successful referral count
        let mut referral_info = Self::load_referral_info(&env, referrer.clone());
        referral_info.successful_referrals += 1;
        Self::save_referral_info(&env, referrer.clone(), &referral_info);

        // Transfer reward
        let token_client = token::Client::new(&env, &reward_token);
        // Note: This assumes the contract has enough XLM balance to pay rewards
        // In production, this would need to be funded or use a different mechanism
        token_client.transfer(&env.current_contract_address(), &referrer, &reward_amount);

        env.events().publish(
            ("ReferralRewardClaimed", referrer.clone()),
            ReferralRewardClaimedEvent {
                referrer,
                referred_technician,
                amount: reward_amount,
            },
        );
    }

    /// Get technician information.
    ///
    /// # Arguments
    /// * `technician` — WaterTechnician address.
    pub fn get_technician(env: Env, technician: Address) -> WaterTechnicianInfo {
        Self::load_technician(&env, technician)
    }

    /// Get referral information.
    ///
    /// # Arguments
    /// * `referrer` — Referrer address.
    pub fn get_referral_info(env: Env, referrer: Address) -> ReferralInfo {
        Self::load_referral_info(&env, referrer)
    }

    /// Get current reward amount.
    pub fn get_reward_amount(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::RewardAmount)
            .unwrap_or(DEFAULT_REWARD)
    }

    /// Update reward amount (admin only).
    ///
    /// # Arguments
    /// * `new_amount` — New reward amount in stroops.
    pub fn set_reward_amount(env: Env, new_amount: i128) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized));
        admin.require_auth();

        if new_amount <= 0 {
            panic_with_error!(&env, Error::InvalidRewardAmount);
        }

        env.storage().instance().set(&DataKey::RewardAmount, &new_amount);
        env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDGER_BUMP);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    fn load_technician(env: &Env, technician: Address) -> WaterTechnicianInfo {
        let key = DataKey::WaterTechnician(technician);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(env, Error::WaterTechnicianNotFound))
    }

    fn save_technician(env: &Env, technician: Address, info: &WaterTechnicianInfo) {
        let key = DataKey::WaterTechnician(technician);
        env.storage().persistent().set(&key, info);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
        env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDGER_BUMP);
    }

    fn load_referral_info(env: &Env, referrer: Address) -> ReferralInfo {
        let key = DataKey::Referrals(referrer);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(ReferralInfo {
                referral_count: 0,
                successful_referrals: 0,
            })
    }

    fn save_referral_info(env: &Env, referrer: Address, info: &ReferralInfo) {
        let key = DataKey::Referrals(referrer);
        env.storage().persistent().set(&key, info);
        env.storage()
            .persistent()
            .extend_ttl(&key, LEDGER_THRESHOLD, LEDGER_BUMP);
        env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDGER_BUMP);
    }

    /// Return aggregate metrics for a technician wallet.
    pub fn get_technician_metrics(env: Env, wallet: Address) -> WaterTechnicianMetrics {
        env.storage()
            .persistent()
            .get(&wallet)
            .unwrap_or(WaterTechnicianMetrics {
                wells_completed: 0,
                avg_completion_time: 0,
                success_rate: 0,
                current_bond_locked: 0,
            })
    }

    /// Persist aggregate metrics for a technician wallet.
    pub fn set_technician_metrics(env: Env, wallet: Address, metrics: WaterTechnicianMetrics) {
        env.storage().persistent().set(&wallet, &metrics);
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token::StellarAssetClient,
    };

    /// Deploy and initialise the contract with a real reward token.
    ///
    /// Returns `(admin, reward_token, contract_id, client)`.
    fn setup(env: &Env) -> (Address, Address, Address, WaterTechnicianContractClient) {
        let contract_id = env.register(WaterTechnicianContract, ());
        let client = WaterTechnicianContractClient::new(env, &contract_id);
        let admin = Address::generate(env);
        let token_admin = Address::generate(env);
        let reward_token = env
            .register_stellar_asset_contract_v2(token_admin.clone())
            .address();
        client.initialize(&admin, &reward_token, &DEFAULT_REWARD);
        (admin, reward_token, contract_id, client)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let (_, _, _, client) = setup(&env);

        assert_eq!(client.get_reward_amount(), DEFAULT_REWARD);
    }

    #[test]
    fn test_register_technician() {
        let env = Env::default();
        env.mock_all_auths();
        let (_, _, _, client) = setup(&env);

        let technician = Address::generate(&env);
        client.register_technician(&technician, &None);

        let info = client.get_technician(&technician);
        assert_eq!(info.jobs_completed, 0);
        assert_eq!(info.first_job_reward_claimed, false);
    }

    #[test]
    fn test_register_technician_with_referrer() {
        let env = Env::default();
        env.mock_all_auths();
        let (_, _, _, client) = setup(&env);

        let referrer = Address::generate(&env);
        let technician = Address::generate(&env);
        client.register_technician(&technician, &Some(referrer.clone()));

        let info = client.get_technician(&technician);
        assert_eq!(info.referrer, Some(referrer.clone()));

        let referral_info = client.get_referral_info(&referrer);
        assert_eq!(referral_info.referral_count, 1);
    }

    #[test]
    fn test_complete_job() {
        let env = Env::default();
        env.mock_all_auths();
        let (_, _, _, client) = setup(&env);

        let technician = Address::generate(&env);
        client.register_technician(&technician, &None);
        client.complete_job(&technician);

        let info = client.get_technician(&technician);
        assert_eq!(info.jobs_completed, 1);
    }

    #[test]
    fn test_claim_referral_reward() {
        let env = Env::default();
        env.mock_all_auths();
        let (_, reward_token, contract_id, client) = setup(&env);

        let referrer = Address::generate(&env);
        let technician = Address::generate(&env);

        client.register_technician(&technician, &Some(referrer.clone()));
        client.complete_job(&technician);

        // Fund the contract so it can pay out the reward.
        let token_admin_client = StellarAssetClient::new(&env, &reward_token);
        token_admin_client.mint(&contract_id, &DEFAULT_REWARD);

        client.claim_referral_reward(&referrer, &technician);

        let info = client.get_technician(&technician);
        assert_eq!(info.jobs_completed, 1);
        assert_eq!(info.first_job_reward_claimed, true);

        let referral_info = client.get_referral_info(&referrer);
        assert_eq!(referral_info.successful_referrals, 1);
    }
}
