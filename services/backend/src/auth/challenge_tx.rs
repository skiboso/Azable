use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use sha2::{Digest, Sha256};
use stellar_xdr::{
    DataValue, DecoratedSignature, Hash, Limits, ManageDataOp, Memo, MuxedAccount, Operation,
    OperationBody, Preconditions, ReadXdr, SequenceNumber, String64, Transaction,
    TransactionEnvelope, TransactionExt, TransactionSignaturePayload,
    TransactionSignaturePayloadTaggedTransaction, TransactionV1Envelope, Uint256, VecM, WriteXdr,
};

use crate::error::{ApiError, ApiResult};

/// Data key used on the throwaway `ManageData` operation that carries the
/// auth nonce. Mirrors SEP-10's convention of a home-domain-scoped key,
/// without implementing the rest of the SEP-10 spec (home domains, web auth
/// domain, client domain, multi-sig thresholds) — see the plan doc for why
/// full SEP-10 is out of scope for v1.
const AUTH_DATA_KEY: &str = "azable-backend auth";

/// Builds an unsigned, never-submitted challenge transaction with a random
/// nonce embedded in a `ManageData` operation, source account set to the
/// address requesting auth. Returns (base64 envelope XDR, nonce hex,
/// signature-base tx hash hex) — the hash is what `verify_signed_envelope`
/// re-derives to confirm the returned envelope wasn't tampered with.
pub fn build_challenge(
    address: &str,
    network_passphrase: &str,
) -> ApiResult<(String, String, String)> {
    let source = decode_address(address)?;
    let nonce: [u8; 32] = rand::random();

    let data_name: String64 = String64(
        AUTH_DATA_KEY
            .parse()
            .map_err(|_| ApiError::Internal("invalid data name".to_string()))?,
    );
    let data_value: DataValue = DataValue(
        nonce
            .to_vec()
            .try_into()
            .map_err(|_| ApiError::Internal("nonce too large for ManageData value".to_string()))?,
    );

    let op = Operation {
        source_account: None,
        body: OperationBody::ManageData(ManageDataOp {
            data_name,
            data_value: Some(data_value),
        }),
    };

    let tx = Transaction {
        source_account: MuxedAccount::Ed25519(Uint256(source)),
        fee: 100,
        seq_num: SequenceNumber(0),
        cond: Preconditions::None,
        memo: Memo::None,
        operations: VecM::try_from(vec![op])
            .map_err(|_| ApiError::Internal("failed to build operations".to_string()))?,
        ext: TransactionExt::V0,
    };

    let tx_hash = signature_base_hash(&tx, network_passphrase)?;

    let envelope = TransactionEnvelope::Tx(TransactionV1Envelope {
        tx,
        signatures: VecM::default(),
    });

    let envelope_b64 = envelope
        .to_xdr_base64(Limits::none())
        .map_err(|_| ApiError::Internal("failed to encode challenge envelope".to_string()))?;

    Ok((envelope_b64, hex::encode(nonce), hex::encode(tx_hash)))
}

/// Recomputes the Stellar "signature base" for a transaction: the sha256 of
/// the XDR-encoded `TransactionSignaturePayload` (network id + tagged
/// transaction). This 32-byte hash is what wallets actually sign.
fn signature_base_hash(tx: &Transaction, network_passphrase: &str) -> ApiResult<[u8; 32]> {
    let network_id = Sha256::digest(network_passphrase.as_bytes());
    let payload = TransactionSignaturePayload {
        network_id: Hash(network_id.into()),
        tagged_transaction: TransactionSignaturePayloadTaggedTransaction::Tx(tx.clone()),
    };
    let payload_xdr = payload
        .to_xdr(Limits::none())
        .map_err(|_| ApiError::Internal("failed to encode signature payload".to_string()))?;
    Ok(Sha256::digest(payload_xdr).into())
}

fn decode_address(address: &str) -> ApiResult<[u8; 32]> {
    match stellar_strkey::Strkey::from_string(address) {
        Ok(stellar_strkey::Strkey::PublicKeyEd25519(pk)) => Ok(pk.0),
        _ => Err(ApiError::BadRequest(format!(
            "invalid Stellar address: {address}"
        ))),
    }
}

/// Verifies a signed transaction envelope (base64 XDR) against the given
/// expected source address and network passphrase, returning the
/// recomputed tx hash (used to look up the matching `auth_nonces` row) and
/// the nonce bytes found in its `ManageData` operation on success.
pub fn verify_signed_envelope(
    envelope_b64: &str,
    expected_address: &str,
    network_passphrase: &str,
) -> ApiResult<(String, Vec<u8>)> {
    let envelope_bytes = base64::engine::general_purpose::STANDARD
        .decode(envelope_b64)
        .map_err(|_| ApiError::BadRequest("invalid base64 envelope".to_string()))?;
    let envelope = TransactionEnvelope::from_xdr(envelope_bytes, Limits::none())
        .map_err(|_| ApiError::BadRequest("invalid transaction envelope XDR".to_string()))?;

    let TransactionEnvelope::Tx(v1) = envelope else {
        return Err(ApiError::BadRequest(
            "expected a v1 transaction envelope".to_string(),
        ));
    };

    let expected_source = decode_address(expected_address)?;
    let MuxedAccount::Ed25519(Uint256(source_bytes)) = v1.tx.source_account else {
        return Err(ApiError::BadRequest(
            "unsupported source account type".to_string(),
        ));
    };
    if source_bytes != expected_source {
        return Err(ApiError::BadRequest(
            "envelope source account does not match claimed address".to_string(),
        ));
    }

    let nonce = extract_nonce(&v1.tx)?;
    let tx_hash = signature_base_hash(&v1.tx, network_passphrase)?;

    let verifying_key = VerifyingKey::from_bytes(&source_bytes)
        .map_err(|_| ApiError::Internal("invalid ed25519 public key".to_string()))?;
    let hint = &source_bytes[28..32];

    let mut verified = false;
    for sig in v1.signatures.iter() {
        let DecoratedSignature {
            hint: sig_hint,
            signature,
        } = sig;
        if sig_hint.0 != hint {
            continue;
        }
        let sig_bytes: [u8; 64] = signature
            .as_slice()
            .try_into()
            .map_err(|_| ApiError::BadRequest("malformed signature".to_string()))?;
        let signature = Signature::from_bytes(&sig_bytes);
        if verifying_key.verify(&tx_hash, &signature).is_ok() {
            verified = true;
            break;
        }
    }

    if !verified {
        return Err(ApiError::Unauthorized(
            "signature verification failed".to_string(),
        ));
    }

    Ok((hex::encode(tx_hash), nonce))
}

fn extract_nonce(tx: &Transaction) -> ApiResult<Vec<u8>> {
    for op in tx.operations.iter() {
        if let OperationBody::ManageData(ManageDataOp {
            data_name,
            data_value: Some(value),
        }) = &op.body
        {
            if data_name.to_string() == AUTH_DATA_KEY {
                return Ok(value.as_slice().to_vec());
            }
        }
    }
    Err(ApiError::BadRequest(
        "challenge transaction missing auth ManageData operation".to_string(),
    ))
}
