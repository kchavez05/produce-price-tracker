# Security Policy

PantryBot (`produce-price-tracker`) takes the security and privacy of our users, code, and infrastructure seriously. We appreciate the responsible disclosure of any vulnerabilities found in our software.

## Supported Versions

Security fixes are actively maintained and released for the current production release line.

| Version | Supported          | Status             |
| ------- | ------------------ | ------------------ |
| 1.4.x   | :white_check_mark: | Current Production |
| < 1.4.0 | :x:                | End of Life        |

## Reporting a Vulnerability

Please **do not** file public GitHub issues, discussions, or pull requests for suspected security vulnerabilities.

### Preferred Reporting Method: GitHub Private Vulnerability Reporting
1. Navigate to the **Security** tab of the [`kchavez05/produce-price-tracker`](https://github.com/kchavez05/produce-price-tracker) repository.
2. Under "Reporting", click **Advisories**.
3. Click **Report a vulnerability** to open a private advisory draft.

### Alternative Reporting Method: Email
If you are unable to use GitHub Advisories, please submit your report to:
* **Email**: `security@pantrybot.dev`

### What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
* **Type of issue**: (e.g., authentication bypass, SSR injection, rate limiting circumvention, sensitive data exposure)
* **Affected component(s)**: Specific endpoints, files, or packages
* **Steps to reproduce**: Step-by-step instructions, curl commands, or a minimal Proof of Concept (PoC)
* **Impact assessment**: How an attacker could exploit this vulnerability and the potential impact on users or data
* Any potential remediation suggestions or proposed fixes

## Vulnerability Handling & Response Process

1. **Initial Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**.
2. **Assessment & Triage**: Our team will validate the issue, determine its severity, and provide a triage update within **7 business days**.
3. **Remediation**: If confirmed, we will develop a fix on a private security advisory branch, run tests through our CI quality gates, and publish a patch release.
4. **Coordinated Disclosure**: Once a patch is deployed to [pantrybot.dev](https://pantrybot.dev), we will publish the security advisory and credit the reporter (if desired).

## Scope

### In-Scope
* [pantrybot.dev](https://pantrybot.dev) production application
* API endpoints under `/api/*` (including authentication, freezer lifecycle, and meal planner APIs)
* Authentication, authorization, and session token handling
* Remote code execution, SQL/NoSQL injection, cross-site scripting (XSS), cross-site request forgery (CSRF)

### Out-of-Scope
* Denial of Service (DoS/DDoS) attacks or automated volumetric testing
* Spam or social engineering attacks targeting maintainers
* Reports from automated scanners without verifiable demonstration of exploitability
* Issues in third-party services (e.g., Supabase, Vercel, USDA API) unless caused by our configuration or usage
