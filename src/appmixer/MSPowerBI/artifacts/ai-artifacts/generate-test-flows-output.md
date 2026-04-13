I'll start by fetching the test flow template and reading all three component.json files in parallel.

---

Now let me read the test flow template from the file:

---

Let me list the test flows and look at existing examples to understand the format:

---

Let me try to access an existing test flow file from the connector for reference:

---

I have all the component information I need. Now let me construct the complete E2E test flow based on the component schemas, the template structure (OnStart → SetVariable → BeforeAll → test components → AfterAll → ProcessE2EResults), and the MSPowerBI component input/output port definitions.

**Summary of what I know from the components:**

- **RefreshDataset**: `in.datasetId` (req), `in.notifyOption` (opt), `properties.groupId` (opt) → `out.status`, `out.datasetId`
- **GetRefreshHistory**: `in.datasetId` (req), `in.top` (opt), `properties.groupId` (opt) → `out.refreshHistory`, `out.count`
- **ExecuteQueries**: `in.datasetId` (req), `in.query` (req), `properties.groupId` (opt) → `out.results`, `out.tables`, `out.error`

The logical test chain: Refresh Dataset → Get History (verify refresh was triggered) → Execute DAX Query (verify data access). These share the same `datasetId` and `groupId`, wired sequentially.

```json
{
  "name": "E2E MSPowerBI - Dataset Refresh and Query",
  "components": [
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000001",
      "type": "appmixer.system.OnStart",
      "label": "OnStart",
      "x": 100,
      "y": 300
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000002",
      "type": "appmixer.e2e.SetVariable",
      "label": "Set Test Variables",
      "x": 350,
      "y": 300,
      "properties": {
        "variables": [
          {
            "name": "datasetId",
            "value": "cfafbeb1-8037-4d0c-896e-a46fb27ff229"
          },
          {
            "name": "groupId",
            "value": "f089354e-8366-4e18-aea3-4cb4a3a50b48"
          }
        ]
      }
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000003",
      "type": "appmixer.e2e.BeforeAll",
      "label": "BeforeAll",
      "x": 600,
      "y": 300
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000004",
      "type": "appmixer.MSPowerBI.core.RefreshDataset",
      "label": "Test 1: Refresh Dataset",
      "x": 900,
      "y": 200,
      "properties": {
        "groupId": "{{{a1b2c3d4-0001-4000-8000-000000000002.out.groupId}}}",
        "datasetId": "{{{a1b2c3d4-0001-4000-8000-000000000002.out.datasetId}}}",
        "notifyOption": "NoNotification"
      }
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000005",
      "type": "appmixer.MSPowerBI.core.GetRefreshHistory",
      "label": "Test 2: Get Refresh History",
      "x": 1200,
      "y": 200,
      "properties": {
        "groupId": "{{{a1b2c3d4-0001-4000-8000-000000000002.out.groupId}}}",
        "datasetId": "{{{a1b2c3d4-0001-4000-8000-000000000004.out.datasetId}}}",
        "top": 5
      }
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000006",
      "type": "appmixer.MSPowerBI.core.ExecuteQueries",
      "label": "Test 3: Execute DAX Query",
      "x": 1500,
      "y": 200,
      "properties": {
        "groupId": "{{{a1b2c3d4-0001-4000-8000-000000000002.out.groupId}}}",
        "datasetId": "{{{a1b2c3d4-0001-4000-8000-000000000002.out.datasetId}}}",
        "query": "EVALUATE ROW(\"TestValue\", 1)"
      }
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000007",
      "type": "appmixer.e2e.AfterAll",
      "label": "AfterAll",
      "x": 1800,
      "y": 300
    },
    {
      "id": "a1b2c3d4-0001-4000-8000-000000000008",
      "type": "appmixer.e2e.ProcessE2EResults",
      "label": "ProcessE2EResults",
      "x": 2050,
      "y": 300
    }
  ],
  "connections": [
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000001",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000002",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000002",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000003",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000003",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000004",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000004",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000005",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000005",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000006",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000006",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000007",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000004",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000008",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000005",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000008",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000006",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000008",
        "port": "in"
      }
    },
    {
      "from": {
        "id": "a1b2c3d4-0001-4000-8000-000000000007",
        "port": "out"
      },
      "to": {
        "id": "a1b2c3d4-0001-4000-8000-000000000008",
        "port": "in"
      }
    }
  ]
}
```

---

## Flow Design Explanation

### Architecture
The flow follows the canonical **OnStart → SetVariable → BeforeAll → [tests] → AfterAll → ProcessE2EResults** pattern, with all three MSPowerBI components wired sequentially to reflect the logical test dependency chain.

### Component Chain

| Step | Component | Type | Purpose |
|------|-----------|------|---------|
| 1 | OnStart | `appmixer.system.OnStart` | Triggers the entire flow |
| 2 | Set Test Variables | `appmixer.e2e.SetVariable` | Stores `datasetId` + `groupId` for reuse |
| 3 | BeforeAll | `appmixer.e2e.BeforeAll` | Setup coordination point |
| 4 | Test 1: Refresh Dataset | `appmixer.MSPowerBI.core.RefreshDataset` | Triggers dataset refresh with `NoNotification` |
| 5 | Test 2: Get Refresh History | `appmixer.MSPowerBI.core.GetRefreshHistory` | Verifies refresh was recorded (uses `out.datasetId` from Test 1) |
| 6 | Test 3: Execute DAX Query | `appmixer.MSPowerBI.core.ExecuteQueries` | Executes `EVALUATE ROW("TestValue", 1)` to verify data access |
| 7 | AfterAll | `appmixer.e2e.AfterAll` | Cleanup coordination (no resources to delete) |
| 8 | ProcessE2EResults | `appmixer.e2e.ProcessE2EResults` | Aggregates outputs from all 3 tests + AfterAll |

### Key Design Decisions
- **Sequential chaining**: `RefreshDataset → GetRefreshHistory → ExecuteQueries` ensures refresh is triggered before history is queried.
- **datasetId propagation**: `GetRefreshHistory` uses `{{{...RefreshDataset.out.datasetId}}}` to confirm it operates on the same dataset that was refreshed.
- **Shared variables**: `datasetId` and `groupId` from `SetVariable` are reused across all three test components.
- **Fan-in to ProcessE2EResults**: All three test component outputs **and** AfterAll feed into `ProcessE2EResults` for complete result aggregation.
- **DAX query**: `EVALUATE ROW("TestValue", 1)` is a lightweight, universally valid DAX expression that tests query execution without depending on specific table names.