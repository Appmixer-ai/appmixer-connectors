# Trending Connector Gaps

Research trending apps supported by Zapier, Make, and n8n that Appmixer is **missing**, and return a prioritized list with the auth type each one uses.

## Arguments

`$ARGUMENTS` — all optional, space-separated tokens:

- `count=<N>` — how many top-priority gaps to return (default: `10`)
- `category=<name>` — restrict to one category: `ai`, `messaging`, `crm`, `marketing`, `sales`, `devops`, `support`, `finance`, `social`, `productivity`, `analytics`, `email`, `meeting-ai` (default: all categories)
- `create-issues=<true|false>` — if `true`, open one GitHub issue per gap in `Appmixer-ai/appmixer-components` (default: `false`)
- `min-platforms=<1|2|3>` — only include gaps supported by at least this many of {Zapier, Make, n8n} (default: `3` = all three)

Example: `/trending-connector-gaps count=5 category=ai create-issues=true`

## Instructions

### Step 1 — Inventory existing Appmixer connectors

List the current connector folders so the gap comparison is accurate:

```bash
ls src/appmixer/ | sort
```

Treat each top-level folder as one existing connector. Note that some apps are nested (e.g. Google services live under `google/`, Microsoft services under `microsoft/`).

### Step 2 — Build the candidate list

Identify apps that meet **all** of:
1. Trending / high market share in 2025–2026 (AI tools, growing SaaS, social platforms with momentum).
2. Available on **at least `min-platforms`** of {Zapier, Make, n8n}.
3. **Not** present in `src/appmixer/`.

Cross-reference public catalogs:
- Zapier: `https://zapier.com/apps`
- Make: `https://www.make.com/en/integrations`
- n8n: `https://n8n.io/integrations/`

Use `WebFetch` or `WebSearch` to verify presence and capabilities when you're not confident. Be skeptical of cached training data — auth options change.

### Step 3 — Score & rank

For each candidate produce a priority score considering:
- **Market demand** — is this an AI tool, messaging platform, or category Appmixer is conspicuously missing?
- **Auth simplicity** — API key is faster to ship and has fewer support tickets than OAuth.
- **Synergy with existing Appmixer connectors** — does it pair naturally with what's already there (e.g. CRM, observability)?
- **Strategic gaps** — entire missing categories outrank "yet another tool in a saturated category".

Pick the top `count`.

### Step 4 — For each pick, identify auth type

Verify on the app's official docs (don't trust memory):
- **OAuth 2.0** — standard auth-code or PKCE flow
- **API key** — header / bearer / basic
- **Hybrid** — note both options when supported, but recommend the simpler one

### Step 5 — Output

Render this table verbatim:

```markdown
## Top <N> Missing Trending Connectors

| # | App | Category | What it does | Auth | Why priority |
|---|-----|----------|--------------|------|--------------|
| 1 | **<App>** | <category> | <one-line> | **<API key | OAuth 2.0>** | <one-line> |
| ... | ... | ... | ... | ... | ... |

### Honourable mentions
| App | Category | Auth |
|-----|----------|------|
| ... | ... | ... |

### Observations
- <2-4 bullets about clusters, auth distribution, synergy opportunities>
```

### Step 6 — Optional: create GitHub issues

If `create-issues=true`, open one issue per top-N gap in `Appmixer-ai/appmixer-components`. Use this template:

```markdown
## Summary

Add Appmixer connector for **<App>** — currently supported by Zapier, Make, and n8n but missing from Appmixer.

## Why

<one-paragraph from the "Why priority" column>

## Authentication

- **Type:** <API key | OAuth 2.0>
- **Docs:** <link to auth section>
<for OAuth: app registration URL, scopes; for API key: where to generate>

## API surface

<bullet list of key resources / endpoints — at least the CRUD primary entity>

## Suggested components

| Component | Type | Endpoint | Method |
|-----------|------|----------|--------|
| ... | ... | ... | ... |

## Triggers (if applicable)

| Component | Webhook / polling | Notes |
|-----------|-------------------|-------|

## References
- Official API docs: <link>
- Zapier integration: <link>
- Make integration: <link>
- n8n integration: <link>
```

Create with:
```bash
gh issue create --repo Appmixer-ai/appmixer-components --title "<App>: new connector" --body "$(cat <<'EOF'
<body>
EOF
)"
```

Use `apx-vero` account if available (memory: never use `vtalas` for Appmixer-ai). If only `vtalas` is logged in, **ask the user first** before creating.

### Step 7 — Report

End with a short summary:
- N gaps reported
- Auth distribution (X API key, Y OAuth)
- If `create-issues=true`: list of created issue URLs

## Notes

- Do **not** include apps already in `src/appmixer/` — re-check the inventory carefully (e.g. `google/`, `microsoft/` umbrellas hide many services).
- Do **not** invent apps. If you can't verify support on all three platforms, drop the candidate or note the uncertainty.
- Keep the table tight — one line per cell.
- The auth field MUST be one of: `API key`, `OAuth 2.0`, or `OAuth 2.0 / API key` (when both are first-class).
