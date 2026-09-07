# Security Policy

Azable's smart contracts hold and move real value once deployed to mainnet.
We take security issues seriously and appreciate responsible disclosure.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately using one of these channels, in order of preference:

1. **GitHub Security Advisories** — open a
   [private vulnerability report](https://github.com/skiboso/Azable/security/advisories/new)
   on this repository. This is the preferred channel: it's private by
   default and lets us coordinate a fix and disclosure timeline with you
   directly in GitHub.
2. If you cannot use GitHub Security Advisories, open a regular issue
   stating only that you've found a security issue and would like a private
   channel to report it through — without any vulnerability details — and a
   maintainer will follow up.

Please include as much of the following as you can:

- The affected component (a specific contract, `apps/web`, `services/backend`,
  or `packages/sdk`) and, if applicable, contract address/network.
- Steps to reproduce, or a proof-of-concept.
- The potential impact (e.g. fund loss, unauthorized state transition, data
  exposure, denial of service).
- Any suggested mitigation, if you have one.

## Scope

| Component | In scope |
| --- | --- |
| `contracts/` | Yes — logic errors, authorization bypasses, integer overflow/precision issues, reentrancy-style issues, DoS via unbounded storage growth |
| `services/backend` | Yes — auth bypass, injection, indexer data integrity, secrets handling |
| `apps/web` | Yes — XSS, CSRF, auth/session handling, sensitive data exposure |
| `packages/sdk` | Yes — transaction-building bugs that could cause fund loss or an unintended on-chain action |
| Third-party dependencies | Report upstream, but let us know if it materially affects Azable |
| Denial-of-service via brute-force/volume against public testnet endpoints | Generally out of scope unless it reveals an underlying logic flaw |

## Our commitment

- We will acknowledge your report within **72 hours**.
- We will give you an initial assessment (confirmed / not applicable / needs
  more info) within **7 days**.
- We will keep you informed of progress toward a fix and agree with you on
  a disclosure timeline before any public write-up, once a fix has shipped
  or mitigations are in place.
- We will credit you in the advisory/release notes, unless you'd prefer to
  stay anonymous.

## Supported versions

This project does not yet have tagged releases with independent security
support windows — treat `main` as the only supported version. Once mainnet
contract deployments exist, this section will be updated with the specific
deployed contract addresses and versions covered by this policy.

## For contract deployers

If you deploy any contract from `contracts/` yourself, you are responsible
for reviewing it against your own risk tolerance before putting real funds
at risk. See [docs/audits/](docs/audits/soroban-best-practices-audit.md) for
existing audit notes, and note that not every contract in this repo has
received a third-party audit.
