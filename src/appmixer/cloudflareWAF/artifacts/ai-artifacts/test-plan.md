---

## 📋 Test Execution Guide

### Step 1 — Install Dependencies (Prerequisite)
```bash
cd src/appmixer/cloudflareWAF
npm install
```

---

### Test 1 — `CreateCustomRules` (Block IPs)

**Goal:** Verify that one or more IPs are successfully added as blocking custom rules in Cloudflare WAF.

| Field | Value |
|-------|-------|
| `ips` | `"192.0.2.1"` (TEST-NET-1, safe for docs/testing) |
| `ttl` | `60` (60 seconds — short TTL so the rule auto-cleans up quickly) |
| `zoneId` (property) | *(Your Cloudflare Zone ID)* |

**Expected output on `out` port:**
```json
[
  { "ip": "192.0.2.1", "ruleId": "<some-rule-id>" }
]
```

**What is validated:**
- API token authenticates successfully against Cloudflare.
- The WAF custom ruleset (`http_request_firewall_custom` phase) is found or created.
- The IP is injected into a block rule expression.
- The TTL record is written to the internal DB plugin.
- The component returns the blocked IP and its associated WAF rule ID.

---

> **Note:** Since there is only **one component** in this connector and it has no dependent Get/List/Delete counterparts, there are no multi-step dependency chains to test. The single test fully exercises the connector's functionality.