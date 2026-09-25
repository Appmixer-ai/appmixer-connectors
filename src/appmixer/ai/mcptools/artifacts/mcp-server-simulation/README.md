# MCP Server simulation (script-driven checks)

`../../../artifacts/test-flows/test-flow-mcptools-gateway.json` is the E2E flow
the standard runner executes (`appmixer e2e import -c ai` / `run`): the gateway
announces its webhook on the `out` port and the flow calls its own tools through
it. It lives at the **connector** level because that is the only place
`appmixer e2e import` looks — never inside a module directory.

What a flow cannot reach is the part of the module that lives outside the flow:
the plugin routes, the SSE endpoint and the HTTP error contract of the webhook
(`appmixer.utils.http.*` throws on any non-2xx response, so a flow cannot assert
a 401 or a 405 at all). The one exception is the unauthenticated protected
resource metadata document, covered by
`../../../artifacts/test-flows/test-flow-mcptools-remote-mcp.json`.
`run-e2e-test.sh` covers those by acting as the Appmixer MCP Server would —
it reads the gateway registry over the API, calls the webhook and checks the
responses.

```bash
bash run-e2e-test.sh
```

10 checks: gateway registration, tool count, public tool structure (no internal
`_` keys, names within 64 chars), the parameter model (a field marked with
`Model Defined Parameter` becomes a tool parameter, a literal one does not),
EchoTool and GreetTool calls, unknown tool → 404, malformed arguments → 400,
and SSE `/events` → 401 without a token.

The flow here is kept out of `artifacts/test-flows/` on purpose: it has no
`OnStart`/`Assert`/`ProcessE2EResults` chain, so the E2E runner's validator
would reject it.
