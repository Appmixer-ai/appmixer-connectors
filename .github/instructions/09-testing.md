# Testing Guidelines

### Unit Tests

- Use `mocha` for unit tests
- Place tests in `src/appmixer/<connector_name>/artifacts/test/` directory (colocated with connector source)
- Use `assert` from Node.js for assertions
- Name test files with `.test.js` extension (e.g., `AIAgent.test.js`)

When working on a single connector, you can run tests with:

```bash
npm run test-unit -- src/appmixer/<connector_name>/artifacts/test/*.test.js
```

The test suite automatically discovers and runs all test files in the `artifacts/test/` directories across all connectors.

### End-to-End (E2E) Test Flows

E2E test flows are automated workflow tests stored as `test-flow*.json` files in the connector's root directory (`src/appmixer/<connector_name>/`). These flows test the complete integration by executing components in a realistic sequence.

**Important**: Connectors should have **multiple smaller test flows** rather than one large flow. Each flow should test a specific feature or workflow (e.g., `test-flow-crud.json`, `test-flow-search.json`, `test-flow-webhooks.json`). This approach makes tests easier to maintain, debug, and understand.

**Full Coverage Requirement**: All components in a connector MUST be tested. Verify that every component in the connector appears in at least one test flow.

#### Test Flow Structure

Test flows are JSON files that define a workflow using the Appmixer flow format. Each flow consists of:

1. **Metadata**: Flow name and description
2. **Components**: Dictionary of component instances with unique IDs
3. **Connections**: Data flow between components via source/target ports
4. **Configuration**: Input values and transformations

**Naming Convention**:
- Test flow names MUST follow the format: `"E2E Connector Name - test type"`
- Examples: `"E2E Google Docs - images"`, `"E2E Slack - messages"`, `"E2E GitHub - pull requests"`
- The testCase field in ProcessE2EResults should match this format

**Basic Structure**:
```json
{
    "name": "E2E Connector Name - feature",
    "description": "End-to-end test for Connector Name - tests specific feature",
    "flow": {
        "component-id-1": {
            "type": "appmixer.utils.controls.OnStart",
            "x": 100,
            "y": 200,
            "source": {},
            "version": "1.0.0",
            "config": {}
        },
        "component-id-2": {
            "type": "appmixer.connector.core.ComponentName",
            "x": 300,
            "y": 200,
            "version": "1.0.0",
            "source": {
                "in": {
                    "component-id-1": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "component-id-1": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "fieldName": {}
                                },
                                "lambda": {
                                    "fieldName": "value"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

#### Required Components

Every E2E test flow MUST include these components in sequence:

1. **OnStart** (`appmixer.utils.controls.OnStart`)
    - Triggers the flow execution
    - First component in the flow
    - No configuration needed

2. **Your Components Under Test**
    - The actual connector components being tested
    - Should test main CRUD operations (Create, Read, Update, Delete)
    - Chain components to test realistic workflows

4. **Assert Components** (`appmixer.utils.test.Assert`)
    - Validate component outputs
    - Supported assertions: `equal`, `notEmpty`, `regex`
    - Multiple assertions can be used throughout the flow

5. **AfterAll** (`appmixer.utils.test.AfterAll`)
    - Cleanup operations after all tests complete
    - Receives input from all assertion components
    - Should include timeout property (e.g., 30 seconds)

6. **ProcessE2EResults** (`appmixer.utils.test.ProcessE2EResults`)
    - Final component that processes test results
    - REQUIRED for all E2E test flows
    - Must be connected after cleanup operations
    - Reports success/failure to test infrastructure

#### ProcessE2EResults Component Configuration

The ProcessE2EResults component is REQUIRED and must be configured with:

**Required Properties**:
```json
{
    "type": "appmixer.utils.test.ProcessE2EResults",
    "source": {
        "in": {
            "cleanup-component": ["out"]
        }
    },
    "config": {
        "properties": {
            "successStoreId": "64f6f1f9193228000754082f",
            "failedStoreId": "64f6f1f0193228000754082e"
        },
        "transform": {
            "in": {
                "cleanup-component": {
                    "out": {
                        "type": "json2new",
                        "modifiers": {
                            "recipients": {},
                            "testCase": {},
                            "result": {
                                "result-var": {
                                    "variable": "$.after-all.out",
                                    "functions": []
                                }
                            }
                        },
                        "lambda": {
                            "recipients": "jirka@client.io",
                            "testCase": "E2E Connector Name - feature",
                            "result": "{{{result-var}}}"
                        }
                    }
                }
            }
        }
    }
}
```

**Key Fields**:
- `successStoreId`: Store ID for successful test results (use standard value)
- `failedStoreId`: Store ID for failed test results (use standard value)
- `recipients`: Email address for test result notifications
- `testCase`: Human-readable test name (e.g., "Google Docs E2E")
- `result`: Variable reference to AfterAll component output

#### Modifier Functions (Prefer Over CodeBlock)

Appmixer transforms support **modifier functions** in the `functions` array of a variable reference. These run natively in the engine without needing a CodeBlock component. **Always prefer modifiers over CodeBlock** — they are simpler, faster, and don't have the `result` wrapping issue.

| Function | Description | Parameters |
|----------|-------------|------------|
| `g_uuid4` | Generate UUID v4 | none |
| `g_timestamp` | Current Unix timestamp (ms) | none |
| `g_now` | Current ISO 8601 date | none |
| `g_addTimeSpan` | Add time to a date | `hashParams: { days: {value: N}, hours: {value: N}, minutes: {value: N} }` |
| `g_random` | Random number (0-1) | none |
| `g_flowName` | Current flow name | none |
| `g_flowId` | Current flow ID | none |
| `g_userId` | Current user ID | none |
| `g_jsonPath` | Extract from JSON via JSONPath | `params: [{value: "$.path"}]` |
| `g_regex` | Regex matching | `params` for pattern, `hashParams` for flags |
| `g_first` | First element of array | none |
| `g_last` | Last element of array | none |
| `g_length` | Length of string/array | none |
| `g_javascript` | Run arbitrary JS code | `params: [{value: "code"}]` |
| `g_stringify` | Object to JSON string | none |
| `g_split` | Split string by delimiter | `params: [{value: "delimiter"}]` |
| `g_add` | Addition | `params: [{value: N}]` |
| `g_mul` | Multiplication | `params: [{value: N}]` |
| `g_floor` | Floor rounding | none |
| `g_greaterThan` | Comparison (greater than) | `params: [{value: N}]` |

**Common E2E patterns using modifiers:**

**Unique email per run** (instead of CodeBlock):
```json
"email": {
    "email-var": {
        "variable": "$.set-variables.out.emailPrefix",
        "functions": []
    },
    "ts-var": {
        "variable": "$.on-start.out.started",
        "functions": [{ "name": "g_timestamp" }]
    }
}
```
With lambda: `"email": "{{{email-var}}}-{{{ts-var}}}@appmixer-test.com"`

**Future date** (instead of CodeBlock):
```json
"startTime": {
    "start-var": {
        "variable": "$.on-start.out.started",
        "functions": [
            { "name": "g_now" },
            { "name": "g_addTimeSpan", "hashParams": { "days": {"value": 14} } }
        ]
    }
}
```

**UUID as unique identifier**:
```json
"uniqueName": {
    "name-var": {
        "variable": "$.set-variables.out.baseName",
        "functions": [{ "name": "g_uuid4" }]
    }
}
```
With lambda: `"uniqueName": "E2E-{{{name-var}}}"`

**When to use CodeBlock instead:**
Use CodeBlock only when modifiers can't express the logic: complex string formatting requiring multiple transformations chained, conditional logic (if/else), math beyond simple add/multiply, parsing complex nested structures.

**CodeBlock gotchas:**
- Output wraps the return value under `result` field. Access via `$.code-block-id.out.result`. Deep access like `$.code-block-id.out.result.field` does NOT work — return simple strings/numbers.
- Code runs in `isolated-vm`. Bare `return` statements are illegal. Use expressions directly (e.g. `'value-' + Date.now()`) or IIFEs.

#### Deterministic Test Design

Tests must pass on repeated runs without input changes:

- **Unique inputs**: Use `g_timestamp` or `g_uuid4` modifier functions for unique identifiers (e.g. `e2e-{{{ts-var}}}@test.com`). Prefer modifiers over CodeBlock.
- **Avoid hardcoded dates**: Use `g_now` + `g_addTimeSpan` to compute future dates dynamically. Hardcoded dates expire and tests break.
- **Create + Delete cleanup**: If the API rejects duplicates (e.g. contacts by email), the test MUST delete created resources at the end.
- **Search/Find race conditions**: Many APIs have eventual consistency. A record created 1 second ago may not appear in search results. Best approach: search for a pre-existing test record instead of a just-created one. Alternative: add a CodeBlock delay (`await new Promise(r => setTimeout(r, 5000))`).
- **Cross-component variable references**: When referencing variables from indirect upstream components (2+ hops), prefer direct upstream references. E.g. use `$.find-items.out.id` instead of `$.create-item.out.id` when the update is triggered by find.

#### Component Configuration Pattern

**Setting Static Values**:
```json
{
    "config": {
        "transform": {
            "in": {
                "source-component": {
                    "out": {
                        "type": "json2new",
                        "modifiers": {
                            "fieldName": {}
                        },
                        "lambda": {
                            "fieldName": "static-value"
                        }
                    }
                }
            }
        }
    }
}
```

**Passing Data from Previous Component**:
```json
{
    "config": {
        "transform": {
            "in": {
                "source-component": {
                    "out": {
                        "type": "json2new",
                        "modifiers": {
                            "fieldName": {
                                "variable-id": {
                                    "variable": "$.source-component.out.fieldName",
                                    "functions": []
                                }
                            }
                        },
                        "lambda": {
                            "fieldName": "{{{variable-id}}}"
                        }
                    }
                }
            }
        }
    }
}
```

#### Assert Component Configuration

Assert components validate outputs using expressions:

```json
{
    "type": "appmixer.utils.test.Assert",
    "source": {
        "in": {
            "component-to-test": ["out"]
        }
    },
    "config": {
        "transform": {
            "in": {
                "component-to-test": {
                    "out": {
                        "type": "json2new",
                        "modifiers": {
                            "expression": {
                                "check-var": {
                                    "variable": "$.component-to-test.out.fieldName",
                                    "functions": []
                                }
                            }
                        },
                        "lambda": {
                            "expression": {
                                "AND": [
                                    {
                                        "field": "{{{check-var}}}",
                                        "assertion": "equal",
                                        "expected": "expected-value"
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
}
```

**Supported Assertion Types**:
- `equal`: Exact match comparison (e.g., field equals "expected-value")
- `notEmpty`: Checks that a field is not empty/null/undefined
- `regex`: Regular expression pattern match (e.g., field matches pattern "^[0-9]+$")

#### Critical Variable Mapping Rules

These rules are **CRITICAL** and must be followed exactly. Failure to follow these rules will cause test flows to fail silently.

**1. Lambda Values MUST Reference Modifiers with `{{{variable-id}}}` Pattern**

When a modifier defines a variable mapping, the lambda value MUST use the corresponding `{{{variable-id}}}` pattern (for example, `{{{check-var}}}`) - NEVER use an empty string.

**WRONG:**
```json
"modifiers": {
    "taskId": {
        "var-1": {
            "variable": "$.create-task.out.id",
            "functions": []
        }
    }
},
"lambda": {
    "taskId": ""  // WRONG! This ignores the modifier
}
```

**CORRECT:**
```json
"modifiers": {
    "taskId": {
        "var-task-id": {
            "variable": "$.create-task.out.id",
            "functions": []
        }
    }
},
"lambda": {
    "taskId": "{{{var-task-id}}}"  // CORRECT! References the modifier
}
```

**2. Assert `field` Property MUST Use Variable Reference**

The `field` property in Assert expressions must ALWAYS use `{{{uuid}}}` pattern that references a modifier. Never leave it empty.

**WRONG:**
```json
"modifiers": {
    "expression": {
        "check-id": {
            "variable": "$.create-task.out.id",
            "functions": []
        }
    }
},
"lambda": {
    "expression": {
        "AND": [{
            "field": "",  // WRONG! Empty field ignores the modifier
            "assertion": "notEmpty"
        }]
    }
}
```

**CORRECT:**
```json
"modifiers": {
    "expression": {
        "field-id": {
            "variable": "$.create-task.out.id",
            "functions": []
        }
    }
},
"lambda": {
    "expression": {
        "AND": [{
            "field": "{{{field-id}}}",  // CORRECT! References the modifier
            "assertion": "notEmpty"
        }]
    }
}
```

**3. Assert `expected` Property for Dynamic Values**

For `equal` assertions comparing dynamic values (from SetVariable or component outputs), BOTH `field` AND `expected` must use variable references.

**CORRECT PATTERN for comparing component output to SetVariable:**
```json
"modifiers": {
    "expression": {
        "field-content": {
            "variable": "$.get-task.out.content",
            "functions": []
        },
        "expected-content": {
            "variable": "$.set-variables.out.taskContent",
            "functions": []
        }
    }
},
"lambda": {
    "expression": {
        "AND": [{
            "field": "{{{field-content}}}",
            "assertion": "equal",
            "expected": "{{{expected-content}}}"
        }]
    }
}
```

**4. SetVariable Component Best Practices**

- Place SetVariable component early in flow (immediately after OnStart)
- Define ALL values that will be used in Assert comparisons
- Use descriptive variable names (e.g., `taskContent`, `updatedTaskContent`)
- For unique test data, use `{{{g_timestamp()}}}` or `{{{g_now()}}}` functions

**Example SetVariable Configuration:**
```json
"set-variables": {
    "type": "appmixer.utils.controls.SetVariable",
    "source": {"in": {"on-start": ["out"]}},
    "config": {
        "transform": {
            "in": {
                "on-start": {
                    "out": {
                        "type": "json2new",
                        "modifiers": {"variables": {}},
                        "lambda": {
                            "variables": {
                                "ADD": [
                                    {"type": "text", "name": "taskContent", "text": "E2E Test Task"},
                                    {"type": "text", "name": "updatedContent", "text": "E2E Test Task Updated"}
                                ]
                            }
                        }
                    }
                }
            }
        }
    }
}
```

**5. Component Dependencies and Source Connections**

Components that need data from another component MUST have that component in their `source.in`. The source component's output is accessed via `$.component-id.out.fieldName`.

**WRONG - GetTask sources from wrong component:**
```json
"get-task": {
    "source": {"in": {"before-all": ["out"]}},  // WRONG! Can't access create-task.out
    "config": {
        "modifiers": {
            "taskId": {"var-1": {"variable": "$.create-task.out.id"}}  // This won't work!
        }
    }
}
```

**CORRECT - GetTask sources from CreateTask:**
```json
"get-task": {
    "source": {"in": {"create-task": ["out"]}},  // CORRECT! Can access create-task.out
    "config": {
        "modifiers": {
            "taskId": {"var-1": {"variable": "$.create-task.out.id"}}  // This works!
        }
    }
}
```

**6. ProcessE2EResults `result` Field**

The `result` property MUST use `{{{uuid}}}` pattern referencing `$.after-all.out`. Never leave it empty.

**CORRECT:**
```json
"modifiers": {
    "result": {
        "result-var": {
            "variable": "$.after-all.out",
            "functions": []
        }
    }
},
"lambda": {
    "recipients": "test@appmixer.ai",
    "testCase": "E2E Connector - feature",
    "result": "{{{result-var}}}"
}
```

**7. AfterAll Must Receive ALL Assert Outputs - CRITICAL**

**EVERY** Assert component in the flow MUST have its output connected to the AfterAll component's `source.in`. This is **CRITICAL** - missing any Assert connection will cause that assertion's result to be lost and not included in the test report.

**Common Mistake**: Assert components that are in the middle of the flow (not at the end) are often forgotten. Even if an Assert flows to another component first, it MUST ALSO connect to AfterAll.

**WRONG - Missing assert-create connection:**
```json
"after-all": {
    "source": {
        "in": {
            "assert-get": ["out"],
            "assert-update": ["out"]
            // WRONG! assert-create is missing - its result will be lost!
        }
    }
}
```

**CORRECT - All Asserts connected:**
```json
"after-all": {
    "source": {
        "in": {
            "assert-create": ["out"],   // First assert
            "assert-get": ["out"],      // Second assert
            "assert-update": ["out"],   // Third assert
            "assert-list": ["out"]      // Fourth assert - ALL included!
        }
    }
}
```

**Verification Checklist**: Before finalizing any test flow:
1. Count the number of Assert components in the flow
2. Count the number of Assert connections in AfterAll's `source.in`
3. These numbers MUST match exactly
4. If counts don't match, the missing Assert results will not appear in the test report, causing silent test failures.

#### Best Practices for Test Flows

1. **Multiple Smaller Flows**
    - Create multiple focused test flows per connector instead of one large flow
    - Each flow should test a specific feature or workflow
    - Examples: `test-flow-crud.json`, `test-flow-search.json`, `test-flow-webhooks.json`
    - Smaller flows are easier to debug, maintain, and understand

2. **Ensure Full Coverage**
    - **CRITICAL**: Every component in the connector MUST be tested
    - Verify that each component appears in at least one test flow
    - Use a checklist to track which components are covered
    - Include both actions and triggers in test coverage

3. **Test Realistic Workflows**
    - Create → Modify → Read → Delete sequence
    - Test main user journeys
    - Include error cases where appropriate

4. **Multiple Assert Components - Separate Branches**
    - **CRITICAL**: If a flow has more than one Assert component, they MUST be in separate branches
    - Each Assert should test a different aspect or operation
    - Branches should have different y-coordinates for visual separation
    - All Assert components feed into the AfterAll component to merge results
    - Example structure:
      ```
      Component A (y=100)
        ├─> Assert 1 (y=100) ─┐
        └─> Component B (y=300) ─> Assert 2 (y=300) ─┘
                                                      └─> AfterAll
      ```
    - See `test-flow-images.json` for reference implementation

5. **Field Name Accuracy**
    - Use EXACT field names from component.json
    - Match required vs optional fields
    - Example: `paragraphText` not `text`, `oldText` not `searchText`

6. **Variable References**
    - Reference outputs using `$.component-id.out.fieldName`
    - Use consistent variable IDs in modifiers
    - Pass data between components via variables

7. **Cleanup Operations**
    - Always delete created test data
    - Use AfterAll to ensure cleanup runs after all assertions
    - Connect cleanup components properly

8. **Component Coordinates and Layout**
    - **Horizontal spacing**: Use **192px** between sequentially connected components on the x-axis
    - **Vertical spacing**: Use **128px** between parallel rows/branches on the y-axis
    - **Starting position**: OnStart at `x: 64, y: 16`
    - **Diagonal staircase pattern**: When operations branch off sequentially (Create → Get → Update → ...), each subsequent action moves **+192px right** and **+128px down**, forming a diagonal:
      ```
      on-start (64,16) → set-variables (272,16) → create (464,16)
                                                       ↓
                                                   get (656,144)
                                                       ↓
                                                   update (848,272)
                                                       ↓
                                                   get-content (1040,400)
      ```
    - **Assert column**: All Assert components are **right-aligned at a fixed x position** (e.g., `x: 1200`), each at the **same y as its corresponding action**:
      ```
      create (464,16)          →  assert-create (1200,16)
      get (656,144)            →  assert-get (1200,144)
      update (848,272)         →  assert-update (1200,272)
      get-content (1040,400)   →  assert-get-content (1200,400)
      ```
    - **Tail chain (AfterAll → Cleanup → ProcessResults)**: Place on a **horizontal line** at approximately the vertical center of the flow (e.g., `y: 144`), spaced ~192px apart after the assert column:
      ```
      after-all (1392,144) → delete (1616,144) → process-results (1792,144)
      ```

9. **Naming Conventions**
    - Use descriptive component IDs: `create-document`, `assert-content-exists`
    - Name test flows: `test-flow-<feature>.json` (e.g., `test-flow-crud.json`, `test-flow-list.json`)
    - Use clear, descriptive names that indicate what the flow tests

#### Example Test Flow Pattern

```json
{
    "name": "E2E Service - crud",
    "description": "End-to-end test for Service connector - tests CRUD operations",
    "flow": {
        "start": {
            "type": "appmixer.utils.controls.OnStart",
            "x": 64,
            "y": 16,
            "source": {},
            "version": "1.0.0",
            "config": {}
        },
        "create-item": {
            "type": "appmixer.service.core.CreateItem",
            "x": 256,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "start": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "start": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "name": {}
                                },
                                "lambda": {
                                    "name": "E2E Test Item"
                                }
                            }
                        }
                    }
                }
            }
        },
        "get-item": {
            "type": "appmixer.service.core.GetItem",
            "x": 448,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-item": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-item": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "itemId": {
                                        "var-1": {
                                            "variable": "$.create-item.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "itemId": "{{{var-1}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-item": {
            "type": "appmixer.utils.test.Assert",
            "x": 832,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "get-item": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "get-item": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "name-check": {
                                            "variable": "$.get-item.out.name",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{name-check}}}",
                                                "assertion": "equal",
                                                "expected": "E2E Test Item"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "after-all": {
            "type": "appmixer.utils.test.AfterAll",
            "x": 1024,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-item": ["out"]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "delete-item": {
            "type": "appmixer.service.core.DeleteItem",
            "x": 1216,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "after-all": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "after-all": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "itemId": {
                                        "var-1": {
                                            "variable": "$.create-item.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "itemId": "{{{var-1}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "process-results": {
            "type": "appmixer.utils.test.ProcessE2EResults",
            "x": 1408,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "delete-item": ["out"]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "delete-item": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "recipients": {},
                                    "testCase": {},
                                    "result": {
                                        "result-var": {
                                            "variable": "$.after-all.out",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "recipients": "jirka@client.io",
                                    "testCase": "E2E Service - crud",
                                    "result": "{{{result-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

#### Creating a Test Flow: Step-by-Step

1. **Plan Test Coverage**
    - List ALL components in the connector (actions and triggers)
    - Decide how many test flows you need (prefer multiple smaller flows)
    - Group related components into logical test scenarios
    - Example groupings:
        - `test-flow-crud.json`: Create, Update, Get, Delete components
        - `test-flow-list.json`: List and Find components
        - `test-flow-advanced.json`: Complex operations like ReplaceText, InsertParagraph
    - Ensure every component appears in at least one flow

2. **Identify Test Scenario**
    - Determine which components to test in this specific flow
    - Plan the workflow sequence
    - Identify what to assert

3. **Create JSON File**
    - Name: `src/appmixer/<connector>/test-flow-<feature>.json`
    - Use descriptive feature names: `crud`, `search`, `webhooks`, `list`, etc.

4. **Add Required Components**
    - Start with OnStart
    - Add your connector components
    - Include Assert components
    - End with AfterAll → Cleanup → ProcessE2EResults

5. **Configure Each Component**
    - Set correct field names from component.json
    - Pass data via variable references
    - Set static test values

6. **Verify Field Names**
    - Read each component's component.json
    - Check `inPorts[0].schema.properties` for required fields
    - Match EXACT field names in test flow config

7. **Test Locally**
    - Ensure authentication is configured
    - Run individual components with `appmixer test component`
    - Verify outputs before building full flow

8. **Verify Coverage**
    - Check that all components are covered across all test flows
    - Create additional flows if needed for untested components

#### Common Mistakes to Avoid

1. **Incorrect Field Names**
    - ❌ Using `text` instead of `paragraphText`
    - ❌ Using `searchText` instead of `oldText`
    - ✅ Always check component.json for exact names

2. **Missing Required Fields**
    - ❌ Omitting required inputs
    - ✅ Verify all `required` fields from schema are populated

3. **Wrong Variable References**
    - ❌ `$.component.out` (missing field name)
    - ✅ `$.component-id.out.fieldName`

4. **Forgetting ProcessE2EResults**
    - ❌ Ending flow without ProcessE2EResults
    - ✅ Always include as final component

5. **Skipping Cleanup**
    - ❌ Leaving test data in the service
    - ✅ Delete all created test data in cleanup phase

6. **Incomplete Component Coverage**
    - ❌ Creating one large test flow that doesn't test all components
    - ❌ Forgetting to test some components
    - ✅ Verify every component appears in at least one test flow
    - ✅ Create multiple smaller flows to cover all components

#### Reference Test Flows

Good examples to reference:
- `src/appmixer/googleDocs/test-flow.json` - Document CRUD operations
- `src/appmixer/monday/test-flow.json` - Board management
- `src/appmixer/jira/test-flow.json` - Issue tracking
- `src/appmixer/hubspot/test-flow-create-deal.json` - CRM operations

---
