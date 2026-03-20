# E2E Test Flow JSON Format

## Top-Level Structure

```json
{
  "flow": { "<component-id>": { ... }, ... },
  "name": "E2E <Connector> - <test-name>",
  "type": "automation",
  "notes": {}
}
```

## Component Types Used in Test Flows

### OnStart (trigger)
```json
{
  "type": "appmixer.utils.controls.OnStart",
  "x": 64, "y": 16,
  "source": {},
  "version": "1.0.0",
  "config": {}
}
```

### BeforeAll (state reset — REQUIRED)
```json
{
  "type": "appmixer.utils.test.BeforeAll",
  "version": "1.0.0",
  "source": { "in": { "on-start": ["out"] } },
  "x": 160, "y": 16,
  "config": {}
}
```
Resets Assert/AfterAll state between runs. **Must** appear after OnStart and before SetVariable. Without it, stale state from previous runs accumulates and corrupts results.

Flow sequence: `OnStart -> BeforeAll -> SetVariable -> ... -> AfterAll -> [Cleanup] -> ProcessE2EResults`

### SetVariable (test data setup)
```json
{
  "type": "appmixer.utils.controls.SetVariable",
  "version": "1.0.0",
  "source": { "in": { "before-all": ["out"] } },
  "config": {
    "transform": { "in": { "on-start": { "out": {
      "type": "json2new",
      "modifiers": { "variables": {} },
      "lambda": { "variables": { "ADD": [
        { "type": "text", "name": "varName", "text": "value" }
      ]}}
    }}}}
  }
}
```

### Connector Component (action under test)
Connected via `source.in` from previous component. Input mapping via `config.transform`.

### Assert
```json
{
  "type": "appmixer.utils.test.Assert",
  "version": "1.0.0",
  "source": { "in": { "<prev-component>": ["out"] } },
  "config": {
    "transform": { "in": { "<prev-component>": { "out": {
      "type": "json2new",
      "modifiers": { "expression": { "<var>": { "variable": "$.<component>.out", "functions": [] }}},
      "lambda": { "expression": { "AND": [
        { "field": "{{{<var>}}}", "assertion": "notEmpty" }
      ]}}
    }}}}
  }
}
```

Assertions: `notEmpty`, `equals`, `contains`, `greaterThan`, `lessThan`, `isTrue`, `isFalse`

### AfterAll (waits for all asserts)
```json
{
  "type": "appmixer.utils.test.AfterAll",
  "version": "1.0.0",
  "source": { "in": { "assert-a": ["out"], "assert-b": ["out"] } },
  "config": { "properties": { "timeout": 30 } }
}
```

### ProcessE2EResults (final reporter)
```json
{
  "type": "appmixer.utils.test.ProcessE2EResults",
  "version": "1.0.1",
  "source": { "in": { "after-all": ["out"] } },
  "config": {
    "properties": {},
    "transform": { "in": { "after-all": { "out": {
      "type": "json2new",
      "modifiers": {
        "recipients": {},
        "testCase": {},
        "result": { "result-var": { "variable": "$.after-all.out", "functions": [] }}
      },
      "lambda": {
        "recipients": "test@appmixer.ai",
        "testCase": "E2E <Connector> - <test-name>",
        "result": "{{{result-var}}}"
      }
    }}}}
  }
}
```

## Auth in Flows

Flows reference accounts by ID. After creating the flow, patch each connector component's `config.properties` with:
```json
{ "account": "<accountId>" }
```
The account must exist (created via `POST /accounts`) with the correct service and auth fields.

## Transform Format (Input Mapping)

Appmixer uses `config.transform.in.<sourceComponent>.out` for input wiring:
- `modifiers` — variable references with `$.component.out.field` paths
- `lambda` — the template using `{{{var-name}}}` placeholders
- For static values, put them directly in `lambda` without a modifier
