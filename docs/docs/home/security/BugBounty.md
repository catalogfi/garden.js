---
id: bug-bounty
---

# Bug Bounty Program

# Overview

Garden is the fastest way to swap BTC and WBTC, providing a 10x improvement over existing options. It is decentralized, trustless, audited and not a real garden.

# Bounty Rewards

We are offering rewards for critical vulnerabilities that are reported to us. The rewards are based on the severity of the vulnerability and the quality of the report. The minimum reward is $200 and the maximum reward is $50,000. The reward will be paid in SEED tokens. The reward will be determined by the Garden team based on the severity of the vulnerability and the quality of the report. The reward will be paid out within 30 days of the vulnerability being reported.

We only reward the first reporter of a vulnerability. Public disclosure of the vulnerability prior to resolution will result in disqualification from the program.

## Disclosure Policy

1. Let us know as soon as possible upon discovery of a potential security issue, and we'll make every effort to quickly resolve the issue.
2. Provide us a reasonable amount of time to resolve the issue before any disclosure to the public or a third-party.
3. Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our service.
4. Only interact with accounts you own or with the explicit permission of the account holder.

### Test Plan

Please include a header `X-Garden: <arbitrum_address>` when you test so we can identify your requests easily.

# Scope

Our Bug Bounty Program invites skilled security researchers to proactively identify and report vulnerabilities within a defined scope of our digital assets. This scope typically includes our website, APIs, specific backend systems and blockchain based assets. By incentivising responsible disclosure, we aim to strengthen our defenses and ensure the highest level of security for our users' funds. Participants in the program have the opportunity to earn rewards for valid vulnerability reports, based on the severity and impact of their findings.

## Assets

### Blockchain

| Address                                                                                                               | Chain    | Severity |
| --------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| [0x86f65121804D2Cdbef79F9f072D4e0c2eEbABC08](https://arbiscan.io/token/0x86f65121804D2Cdbef79F9f072D4e0c2eEbABC08)    | Arbitrum | Critical |
| [0x203DAC25763aE783Ad532A035FfF33d8df9437eE](https://arbiscan.io/address/0x203DAC25763aE783Ad532A035FfF33d8df9437eE)  | Arbitrum | Critical |
| [0xa5e38d098b54c00f10e32e51647086232a9a0afd](https://etherscan.io/address/0xa5e38d098b54c00f10e32e51647086232a9a0afd) | Ethereum | Critical |
| [Atomic Swap](https://github.com/catalogfi/swapper/blob/main/bitcoin/AtomicSwap.ts)                                   | Bitcoin  | Critical |

### URLs & APIs

| URL                                               | Severity |
| ------------------------------------------------- | -------- |
| [API](https://api.garden.finance)                 | Low      |
| [Docs](https://docs.garden.finance)               | Low      |
| [Blog](https://garden.finance/blog)               | Low      |
| [Landing Page](https://garden.finance)            | Medium   |
| [FeeHub](https://feehub.garden.finance)           | High     |
| [Staking](https://staking.garden.finance)         | High     |
| [Leaderboard](https://leaderboard.garden.finance) | High     |
| [Referral](https://referral.garden.finance)       | Medium   |
| [Orderbook](https://orderbook.garden.finance)     | High     |
| [Price](https://price.garden.finance)             | Low      |
| [Balance](https://balance.garden.finance)         | Low      |

## Impacts

### Critical

-   Exploits resulting in the permanent locking or theft of user funds.
-   Permanent DoS attacks (excluding volumetric attacks).
-   Remote Code Execution (RCE) - able to execute arbitrary commands on a remote device.
-   SQL Injection - able to write access to a database.
-   Server-Side Request Forgery (SSRF) - able to pivot to internal application and/or access credentials (not blind).

### High

-   Any governance voting result manipulation.
-   Permanent freezing of unclaimed yield.
-   Stored Cross-Site Scripting (XSS) - stored XSS with access to non HttpOnly cookies.
-   Subdomain Takeover - on a domain that sees heavy traffic or would be a convincing candidate for a phishing attack.
-   Cross-Site Request Forgery (CSRF) - leading to account takeover.
-   Account Takeover (ATO) - with no or minimal user interaction.
-   Insecure Direct Object Reference (IDOR) - read or write access to sensitive data or important fields that you do not have permission to.
-   SQL Injection - able to perform queries with a limited access user

### Medium

-   Griefing (e.g. no profit motive for an attacker, but damage to the users or the protocol)
-   CSRF - able to modify important information (authenticated)
-   IDOR - write access to modify objects that you do not have permission to
-   XSS - reflected/DOM XSS with access to cookies

### Low

-   Directory listings
-   XSS - POST based XSS (with CSRF bypass)
-   Lack of HTTPS on dynamic pages (judged on a case-by-case basis)
-   Server information page (no credentials)
-   Subdomain Takeover - on an unused subdomain

## Out of Scope

-   Any services hosted by third-party providers.
-   Any services hosted by Garden that are not explicitly mentioned in the Scope section.
-   Attacks that the reporter has already exploited themselves, leading to damage.
-   Attacks requiring access to leaked keys/credentials.

### Blockchain

-   Attacks requiring access to privileged addresses (governance, strategist).
-   Incorrect data supplied by third party oracles.
    -   Not to exclude oracle manipulation/flash loan attacks.
-   Basic economic governance attacks (e.g. 51% attack).
-   Lack of liquidity.
-   Best practice critiques.
-   Sybil attacks.
-   DoS/DDoS of Garden Finance infrastructure.

### URLs & APIs

-   Broken Link Hijacking issues are categorized as low severity and are not eligible for rewards.
-   Clickjacking on pages with no sensitive actions.
-   Cross-Site Request Forgery (CSRF) on unauthenticated forms or forms with no sensitive actions.
-   Attacks requiring MITM or physical access to a user's device.
-   Previously known vulnerable libraries without a working Proof of Concept.
-   Comma Separated Values (CSV) injection without demonstrating a vulnerability.
-   Missing best practices in SSL/TLS configuration.
-   Any activity that could lead to the disruption of our service (DoS).
-   Content spoofing and text injection issues without showing an attack vector/without being able to modify HTML/CSS.
-   Rate limiting or brute force issues.
-   Invalidation/expiry on CDN assets.
-   Missing best practices in Content Security Policy.
-   Missing `HttpOnly` or Secure flags on cookies.
-   Missing email best practices (Invalid, incomplete or missing SPF/DKIM/DMARC records, etc.).
-   Vulnerabilities only affecting users of outdated or unpatched browsers [Less than 2 stable versions behind the latest released stable version].
-   Software version disclosure / Banner identification issues / Descriptive error messages or headers (e.g. stack traces, application or server errors).
-   Public Zero-day vulnerabilities that have had an official patch for less than 1 month will be awarded on a case by case basis.
-   Tabnabbing.
-   Open redirect - unless an additional security implication can be demonstrated.
-   Self XSS.
-   Able to retrieve user's public information.

# Safe Harbour

We will not pursue a civil action or initiate a complaint to law enforcement for accidental, good faith violations of this policy. We consider activities conducted consistent with this policy to constitute “authorised” conduct under the Computer Fraud and Abuse Act (CFAA). We will not bring a DMCA claim against you for circumventing the technological measures we have used to protect the applications in scope.

If legal action is initiated by a third party against you and you have complied with Garden's bug bounty policy, Garden will take steps to make it known that your actions were conducted in compliance with this policy.

Please submit a report to us before engaging in conduct that may be inconsistent with or unaddressed by this policy.

Thank you for helping keep [@garden_finance](https://x.com/garden_finance) safe for the community!

Garden Security Team
