# appmixer.ai.mcptools

Appmixer as an **MCP server**: the components wired to an `MCPGateway`'s `tool`
port become MCP tools.

Two transports serve the same tools:

| Transport | Where it runs | Auth |
|-----------|---------------|------|
| stdio | [`appmixer-mcp`](https://github.com/Appmixer-ai/appmixer-mcp) on a developer machine (Claude Desktop, Cursor, VS Code) | `APPMIXER_ACCESS_TOKEN` in the process env |
| **Streamable HTTP** | this plugin, in the Appmixer backend | `Authorization: Bearer` + OAuth 2.1 resource-server metadata |

The remote transport exists because a serverless host (Vercel, Cloudflare,
Lambda) can neither spawn the stdio process nor connect to it. It also unblocks
remote MCP in Claude web, ChatGPT connectors and Cursor, which all need an HTTP
endpoint.

## Endpoints

All paths are relative to `https://<APPMIXER_TENANT_API_URL>`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/plugins/appmixer/ai/mcptools/mcp` | JSON-RPC: `initialize`, `ping`, `tools/list`, `tools/call` |
| `GET` | `/plugins/appmixer/ai/mcptools/mcp` | SSE stream, emits `notifications/tools/list_changed` |
| `DELETE` | `/plugins/appmixer/ai/mcptools/mcp` | `405` — the endpoint is stateless, there is no session to end |
| `GET` | `/plugins/appmixer/ai/mcptools/.well-known/oauth-protected-resource` | RFC 9728 protected resource metadata |

```bash
curl -XPOST \
  -H "Authorization: Bearer $APPMIXER_ACCESS_TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  "https://$APPMIXER_TENANT_API_URL/plugins/appmixer/ai/mcptools/mcp"
```

### Stateless by design

No `Mcp-Session-Id` is issued, so any node in the cluster can serve any request
and no sticky session store is needed. The spec permits this: a client is never
sent a session id, so it never has one to send back.

### Protocol versions

`2025-06-18` (default), `2025-03-26` and `2024-11-05` are accepted. An
unrecognised `MCP-Protocol-Version` header is answered with `400`, as the spec
requires. JSON-RPC batches are still accepted for `2025-03-26` clients.

## Authorization

The endpoint implements the **resource server** half of the MCP authorization
spec. The authorization server — `/authorize`, `/token`, dynamic client
registration — is a platform concern and is *not* implemented here.

What is implemented:

- **Protected resource metadata** (RFC 9728) naming the authorization server.
- **`WWW-Authenticate` on 401**, carrying `resource_metadata="..."` so a client
  can discover that metadata and start the OAuth flow.
- **Token validation** with **audience binding** (RFC 8707): a token carrying an
  `aud` claim is accepted only if the claim names this endpoint (or its origin).

Today's Appmixer access tokens carry no `aud` claim and are accepted as-is —
this is the "static credential" mode that Vercel Connect's *API key* connector
type can already use. Set `MCP_REQUIRE_TOKEN_AUDIENCE` once the authorization
server issues resource-bound tokens, and unbound tokens start being rejected
with no code change.

### Well-known path caveat

Connector plugins can only register routes under their own prefix, so the
metadata document lives at
`/plugins/appmixer/ai/mcptools/.well-known/oauth-protected-resource` rather than
at the origin root. Clients that follow the `resource_metadata` URL from the 401
challenge — which RFC 9728 §5.1 makes authoritative — work as-is. For clients
that instead guess the origin-root path, add an ingress rewrite:

```
/.well-known/oauth-protected-resource/plugins/appmixer/ai/mcptools/mcp
  → /plugins/appmixer/ai/mcptools/.well-known/oauth-protected-resource
```

## Configuration

| Key | Default | Meaning |
|-----|---------|---------|
| `MCP_PUBLIC_BASE_URL` | `APPMIXER_API_URL`, then request headers | Base URL used to build the canonical resource URI |
| `MCP_AUTHORIZATION_SERVER` | the Appmixer tenant itself | Authorization server(s) published in the metadata; comma-separated or an array |
| `MCP_REQUIRE_TOKEN_AUDIENCE` | off | Reject tokens with no `aud` claim |
| `MCP_ALLOWED_ORIGINS` | unset (all allowed) | Browser `Origin` allow-list; comma-separated or an array |
| `MCP_TOOL_CALL_TIMEOUT` | `120000` | Gateway webhook timeout in ms |

`MCP_ALLOWED_ORIGINS` is off by default because the DNS-rebinding attack the
spec's `Origin` check defends against needs ambient credentials to be useful,
and this endpoint is bearer-authenticated rather than cookie-authenticated.

## Scope and follow-ups

A session sees **the authenticated user's own running gateways**, which is the
same surface the stdio server exposes. Two things from
[appmixer-components#2871](https://github.com/Appmixer-ai/appmixer-components/issues/2871)
are deliberately left out:

- **Multi-tenancy.** The registry is keyed `mcpgateways:user:<userId>`. An app
  serving *its own* end users needs the integration templates/instances model,
  which is not wired to this registry today.
- **Catalogue mode.** `tools/list` returns what flow authors wired onto a `tool`
  port. A "hundreds of tools" surface needs either a catalogue mode over the
  connector index or a shipped template flow.
