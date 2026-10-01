# AI connector E2E test flows

Flows live at the **connector** level (`src/appmixer/ai/artifacts/test-flows/`) even
though the `ai` connector is split into per-provider modules, because that is where
`appmixer e2e import -c ai` looks.

## Scope

Right now the **groq** and **mcptools** modules are covered:

| Flow | Components |
|------|------------|
| `test-flow-prompt.json` | `groq.SendPrompt` (×2 — the output contract and conversation memory) |
| `test-flow-api-call.json` | `groq.MakeApiCall` (×2 — relative `GET` path, `POST` with a JSON body) |
| `test-flow-audio.json` | `groq.CreateTranscription`, `groq.CreateTranslation` |
| `test-flow-mcptools-gateway.json` | `mcptools.MCPGateway` (the `out` announcement and three tool calls through the webhook) |
| `test-flow-mcptools-remote-mcp.json` | `mcptools` remote MCP endpoint — plugin routes, no connector component |

`appmixer e2e validate` therefore still reports ~110 `component-coverage` warnings for
the other modules (`openai`, `claude`, `gemini`, `bedrock`, `openrouter`, `requesty`,
`voyageai`, `agentcore`, `agenttools`). They are not regressions — those modules have
never had E2E flows. Add them here as each module is brought onto the AI connector
contract.

`groq.ListModels` is `private: true`, so it is a source helper for the model dropdowns
rather than a testable action and must not appear as a flow node
(`no-private-component-node`). It is exercised indirectly: `MakeApiCall` hits the same
`GET /openai/v1/models` endpoint, and the designer calls `ListModels` to fill the
`model` typeahead of `SendPrompt` / `CreateTranscription` / `CreateTranslation`.

## MCP Tools flows

Neither mcptools flow needs a connected account — `MCPGateway` has no auth and the
metadata endpoint is unauthenticated — but both carry assumptions worth knowing before
they fail:

- **`test-flow-mcptools-gateway.json`** posts *literal* tool names
  (`pM5edMztbgussb84FReaoB_EchoTool`, `5K5ZxsRuVJshv8u9dMYXb3_GreetTool`) to the
  gateway webhook. `mcptools/tool.js buildToolName()` derives a tool name as
  `shortUuid(componentId)_<component label>`, so re-creating, copying or relabelling
  the two `MockValue` tool components changes the name and the call returns
  `404 Unknown tool`. Recompute with
  `require('short-uuid')().fromUUID(componentId)`. The third call proves a caller
  cannot override a literal configured on a tool: it passes `value` to `GreetTool`
  and the static `Hello, Appmixer!` must still come back.
- **`test-flow-mcptools-remote-mcp.json`** targets the remote MCP endpoint added in
  mcptools 1.1.0 and is the only flow here with an instance-specific URL: the
  `apiBaseUrl` variable in `SetVariable` must match `appmixer url` of the instance
  under test, because plugin routes only exist on the tenant's own API host. It asserts
  the RFC 9728 metadata document on both registered paths
  (`/.well-known/oauth-protected-resource` and the `/mcp`-suffixed alias) and that
  `resource` names this instance's `/plugins/appmixer/ai/mcptools/mcp`.

  The authenticated half of the endpoint (`POST /mcp` JSON-RPC, the `GET /mcp` SSE
  stream) is out of scope for a flow: it needs a user bearer token, and no token may
  be committed here. The 401 + `WWW-Authenticate` challenge and `DELETE /mcp` → 405
  are unreachable for a different reason — `appmixer.utils.http.*` throws on any
  non-2xx response, so asserting an error status would stop the flow instead. Those
  paths are covered by `test/ai/mcptools/{mcp-auth,streamable-http}.test.js` and, live,
  by `src/appmixer/ai/mcptools/artifacts/mcp-server-simulation/run-e2e-test.sh`.

## Groq account requirements

Nothing in these flows is bound to a tenant ID, but the model IDs are pinned literals
and must be available to the connected Groq account:

- `openai/gpt-oss-120b` — `SendPrompt` and the `MakeApiCall` chat completion
  (`llama-3.3-70b-versatile` was retired by Groq before the first run, 2026-09-08)
- `whisper-large-v3` — `CreateTranscription` and `CreateTranslation`

Groq retires models on its own schedule. When one of these disappears the flows fail
with a `404 model_not_found`; swap in whatever the account's `GET /models` currently
returns for the same role.

## Determinism notes

- **Prompt flow.** Both prompts run at `temperature: 0` and ask the model to echo the
  literal token `APPMIXER-E2E-GROQ`, so the asserts are `regex` rather than `equal`
  (the model may still add whitespace). `notEmpty` alone would be too weak — the Assert
  component implements it as `expect(field).to.exist`, which an empty string passes.
  The `conversationId` is suffixed with `g_timestamp`, so every run starts a fresh
  conversation instead of appending to the previous run's stored history.
  `gpt-oss` is a reasoning model: its hidden reasoning counts against
  `max_completion_tokens` (~60–80 tokens for the echo), so the flows allow 1000 —
  a 200 budget would end with `finish_reason: length` and an empty answer.
- **Audio flow.** The speech sample is downloaded at run time from
  `https://dpgr.am/spacewalk.wav` (the same public asset the deepgram flows use) —
  2.2 MB of real speech, too big to inline as base64. `appmixer.utils.files.RemoveFile`
  after `AfterAll` deletes the copy from the file store so repeated runs do not grow it.
  `create-without-cleanup` still warns here: it only counts *connector* components as
  cleanup, and `RemoveFile` is a `utils` one. Nothing is created on Groq's side.
- **`MakeApiCall` query parameters are not covered.** `url`, `method`, `body` and
  `headers` are. Groq's OpenAI-compatible endpoints take no query parameters, so
  populating `parameters` would only add an argument the API is free to reject —
  hence the standing `input-coverage-optional` warning for that field.
