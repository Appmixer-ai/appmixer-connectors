# HubBI E2E test flows

Three flows cover every non-private HubBI component. The five `private: true`
components (`ListTargetHubs`, `ListSourceHubsWithPostData`,
`ListSourceHubsWithoutPostData`, `GetSourceFields`, `GetTargetFields`) are
dropdown/variable-picker source helpers — they must not be standalone flow
nodes (`no-private-component-node`) and are excluded from coverage. They are
exercised indirectly: every hub picker in these flows resolves through them,
and they have their own CLI component tests in `../ai-artifacts/test-plan.json`.

| Flow | Components under test | Runs unattended |
|------|----------------------|-----------------|
| `test-flow-e2e-hubbi-start-hubs.json` | `StartHub`, `StartHubWithData` | yes |
| `test-flow-e2e-hubbi-make-api-call.json` | `MakeApiCall` | yes |
| `test-flow-e2e-hubbi-receive-hub.json` | `NewHubEvent` (Receive Hub) | **no — manual** |

```bash
appmixer e2e import src/appmixer/hubbi/artifacts/test-flows
appmixer e2e list -c appmixer:hubbi --json
appmixer e2e run <flowId> --fix
appmixer e2e results -c appmixer:hubbi --json
```

## Tenant-bound values

`appmixer e2e import` re-resolves **account** bindings and nothing else. Every
hub key below belongs to the HubBI client behind the connected account
(`test-app.hubbi.nl`). Swapping the account means re-resolving all of them —
run the three list components and pick equivalents:

| Flow | Where | Hub key | Hub name | Resolve with |
|------|-------|---------|----------|--------------|
| start-hubs | SetVariable `startHubKey` | `fc2b69aa-1853-44aa-9992-a43fb8bf9a2b` | Flow as source (without data) | `ListSourceHubsWithoutPostData` |
| start-hubs | SetVariable `dataHubKey` | `59bd2669-808c-480b-b594-034c372f45a4` | Flow as Source (With data) | `ListSourceHubsWithPostData` |
| receive-hub | `NewHubEvent` `config.properties.conversionKey` | `f40d47ec-a9cf-4d4b-b021-5ecf30bce03a` | Flow as target | `ListTargetHubs` |

The start-hubs flow also hardcodes the **source field names** of
`Flow as Source (With data)` — `Name`, `Id`, `Age`, `DateOfBirth` — because
`StartHubWithData` has no static in-port schema: its inputs are generated from
the hub's field definitions. A different hub means different field names; read
them with `GetSourceFields`.

Likewise the receive-hub flow asserts on `FieldIdProduct`, a **target** field of
`Flow as target`; read a replacement hub's fields with `GetTargetFields`.

## Receive Hub is a manual harness

HubBI exposes no API for registering a webhook, so nothing in the flow can make
the event happen. The connector also refuses to start a flow where a Start Hub
component uses the same hub as Receive Hub (that would make the flow trigger
itself), so the provoke pattern from the E2E guidelines is not available here
either. To run it for real:

1. Start the flow and read the `Webhook registered` log entry the trigger's
   `start()` writes — it carries the `webhookUrl`
   (`appmixer flow trigger-url <flowId>` gives the same URL).
2. In HubBI, point the hub `Flow as target` at that URL.
3. Send data from the hub. The event must carry at least one record — an event
   with no records is acknowledged without firing the flow.

The `AfterAll` timeout is 600 s to leave time for those steps.

### Verifying the connector's half without HubBI

Everything the connector owns — webhook handling, `conversionKey` filtering,
record normalization, the `object` output mode, the output-port fields — can be
verified without touching HubBI by posting the payload HubBI would send:

```bash
curl -X POST "$BASE_URL/flows/<flowId>/components/<newHubEventComponentId>" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"conversionKey":"f40d47ec-a9cf-4d4b-b021-5ecf30bce03a",
       "data":[{"FieldIdProduct":"E2E Widget","ProductId":4711,
                "FieldIdPrice":9.99,"FieldIdStock":5}]}'
```

with the flow started (`appmixer flow start <flowId>`), then read
`appmixer e2e results -c appmixer:hubbi --json` and stop the flow. This is how
the flow was verified on 2026-08-21; it proves the connector side but not
HubBI's delivery, which still needs step 2 above.
