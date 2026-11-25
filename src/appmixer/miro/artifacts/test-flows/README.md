# Miro E2E test flows

## Tenant-bound values

| Flow | Value | What it is |
|---|---|---|
| `test-flow-trigger-new-item.json` | `uXjVEKmUffE=` | Board ID of "My First Board" of the E2E Miro account. New Item watches it (a trigger property cannot come from the flow); Create Sticky Note and Delete Item use it too. Replace it in all three places when the E2E account changes, and never delete that board. |

## Board limit

A Free Miro team has at most 3 editable boards. `test-flow-boards.json`, `test-flow-items.json` and
`test-flow-trigger-boards.json` each create one board and delete it in their cleanup step. A run that
is stopped before the cleanup leaves its `E2E Miro …` board behind; delete such boards by hand, or
the next run fails with `Creating more boards is not allowed in this plan`. The `AfterAll` timeouts
of the trigger flows (300 s) are kept below the 480 s run timeout so the cleanup still runs when a
trigger does not fire.

## Not covered by a flow

- **Share Board** — the E2E Miro account answers every invitation with HTTP 403
  `5.0514: Sharing is restricted. Please contact support.` (an account-level restriction of Miro, not
  a request problem). The component is covered by the unit test in `artifacts/test/miro.test.js`. Add it
  back to `test-flow-boards.json` once the E2E account is allowed to share boards.
