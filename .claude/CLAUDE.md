# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Appmixer Connectors is a collection of integrations for the Appmixer workflow engine. Each connector enables integration with an external service (Slack, GitHub, Salesforce, etc.) and contains components that perform specific actions.

## Commands

```bash
# Install dependencies (required before running tests)
node scripts/npm_install.js

# Run all unit tests
npm run test-unit

# Run tests for a specific connector
npm run test-unit -- test/<connector_name>

# Run linting
npm run lint
```

## Architecture

### Connector Structure

Each connector lives in `src/appmixer/<connector_name>/` with this structure:

```
<connector_name>/
├── service.json       # Service metadata (name, label, icon, version)
├── auth.js           # Authentication configuration (OAuth2 or API key)
├── bundle.json       # Version and changelog
├── package.json      # Dependencies (optional)
├── quota.js          # Rate limiting rules (optional)
├── lib.js            # Shared utilities (optional)
├── routes.js         # HTTP routes for webhooks (optional)
├── jobs.js           # Background jobs (optional)
└── <module>/         # Component module (usually "core")
    └── <ComponentName>/
        ├── component.json      # Component configuration and UI schema
        └── <ComponentName>.js  # Component behavior logic
```

### Component Types

**Action Components** (have `inPorts`):
- **Get**: Retrieve single item by ID (`GetTask`, `GetUser`)
- **List**: Retrieve all items, no filtering (`ListTasks`, `ListUsers`)
- **Find**: Search with filters, includes `outputType` and `notFound` port (`FindTasks`)
- **Create**: Create new item (`CreateTask`)
- **Update**: Modify existing item by ID (`UpdateTask`)
- **Delete**: Remove item by ID, returns empty object (`DeleteTask`)

**Trigger Components** (NO `inPorts`, use `properties` instead):
- **Polling** (`tick: true`): Use `tick(context)` method, called periodically
- **Webhook** (`webhook: true`): Use `start()`, `receive()`, `stop()` lifecycle methods
- **Hybrid**: Both `tick` and `webhook` for real-time events with maintenance

### Key Files

- `component.json`: Defines inputs (`inPorts`), outputs (`outPorts`), authentication (`auth`), and UI inspector config
- `<Component>.js`: Implements `receive(context)` for actions, `tick(context)` for polling triggers
- `auth.js`: Either `type: 'apiKey'` or `type: 'oauth2'` with validation and profile fetching
- `lib.js`: Shared helpers like `sendArrayOutput()` for Find/List components with `outputType` support

## Testing

### Unit Tests

Tests use Mocha with the stub in `test/utils.js`. The `createMockContext()` function provides a mock Appmixer context with stubbed methods for `httpRequest`, `sendJson`, `stateGet/Set`, etc.

Test files can be in `test/<connector>/` or `src/appmixer/<connector>/artifacts/test/`.

### E2E Test Flows

End-to-end test flows are JSON files (`test-flow*.json`) stored in the connector root directory that test complete workflows.

**Naming Convention**:
- Flow name format: **`"E2E Connector Name - feature"`** (e.g., `"E2E Dropbox - crud"`, `"E2E Slack - messages"`)
- File name format: `test-flow-<feature>.json` (e.g., `test-flow-crud.json`)
- The `testCase` field in ProcessE2EResults must match the flow name

**Best practices**:
- Create **multiple smaller test flows** per connector (e.g., `test-flow-crud.json`, `test-flow-search.json`)
- Prefer focused flows testing specific features over one large flow
- **Ensure full coverage**: Every component in the connector MUST be tested in at least one flow

**Required components in order**:
1. `OnStart` - Triggers the flow
2. Your connector components - Under test
3. `Assert` - Validate outputs (supported types: `equal`, `notEmpty`, `regex`)
4. `AfterAll` - Cleanup coordination
5. Cleanup components - Delete test data
6. `ProcessE2EResults` - **REQUIRED** - Final component with `recipients`, `testCase`, `result` fields

**Critical Rules**:
- **Assertion types**: Only `equal`, `notEmpty`, and `regex` are supported
- **Multiple Asserts**: MUST be in separate branches with different y-coordinates
- Use EXACT field names from component.json required fields
- Pass data via `$.component-id.out.fieldName` variables
- Always cleanup test data
- Include ProcessE2EResults with standard store IDs (success: `64f6f1f9193228000754082f`, failed: `64f6f1f0193228000754082e`)
- Verify all components are covered across all test flows

**See detailed guide**: `.github/copilot-instructions.md` section "End-to-End (E2E) Test Flows"

**Reference examples**:
- `src/appmixer/googleDocs/test-flow.json`
- `src/appmixer/monday/test-flow.json`

## Key Patterns

### Component Naming

Components must follow the pattern: `vendor.connectorName.module.componentName`
- Use `appmixer` as vendor
- Use `core` as default module name
- Example: `appmixer.slack.core.SendMessage`

### Component Principles

**ID Requirements**: For components that require an ID as input, there MUST be another component that returns the entity containing that ID.
- Example: If `GetEmail` requires `emailId`, then `FindEmails` must exist and return entities with `emailId`

### Component Behavior

```javascript
module.exports = {
    async receive(context) {
        const { inputField } = context.messages.in.content;

        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.example.com/resource',
            headers: { 'Authorization': `Bearer ${context.auth.accessToken}` }
        });

        return context.sendJson(response.data, 'out');
    }
};
```

**Delete Components**:
- MUST return empty object: `return context.sendJson({}, 'out');`
- MUST have `outPorts: ['out']` in component.json
- MUST have at least one required input (the ID of entity being deleted)

**Update Components**:
- MUST return empty object: `return context.sendJson({}, 'out');`
- MUST have at least one required input (the ID of entity being updated)

### Find/List Components with outputType

Find and List components support `outputType` (first/array/object/file) via `lib.js` helpers:
- Use `lib.getOutputPortOptions()` for dynamic output port schema
- Use `lib.sendArrayOutput()` to handle different output types
- Do NOT include `limit` or `offset` fields - use API's max page size internally

### Trigger Components

**Polling trigger** (`tick: true`):
```javascript
module.exports = {
    async tick(context) {
        const { projectId } = context.properties;  // NOT context.messages.in.content
        const state = await context.loadState();
        const known = state.known ? new Set(state.known) : null;

        const { data } = await context.httpRequest({ ... });

        // Compare and send only new items
        for (const item of data.items) {
            if (!known || !known.has(item.id)) {
                await context.sendJson(item, 'out');
            }
        }
        await context.saveState({ known: data.items.map(i => i.id) });
    }
};
```

**Webhook trigger** (`webhook: true`):
```javascript
module.exports = {
    async start(context) {
        const webhookUrl = context.getWebhookUrl();
        const { data } = await context.httpRequest({
            method: 'POST', url: 'https://api.service.com/webhooks',
            data: { url: webhookUrl, events: ['item.created'] }
        });
        return context.saveState({ webhookId: data.id });
    },
    async receive(context) {
        if (context.messages.webhook) {
            await context.sendJson(context.messages.webhook.content.data, 'out');
            return context.response();  // MUST acknowledge webhook
        }
    },
    async stop(context) {
        const { webhookId } = await context.loadState();
        if (webhookId) await context.httpRequest({ method: 'DELETE', url: `.../${webhookId}` });
    }
};
```

### Required Input Validation

```javascript
if (!taskId) {
    throw new context.CancelError('Task ID is required!');
}
```

## Context API

**Logging**: `context.log` must use this signature:
```javascript
context.log(level, message, [data]);
```

## Authentication

**requestProfileInfo** in `auth.js` (type: `apiKey`) MUST return:
- Object with obfuscated apiKey (if profile API not available), OR
- Object with profile info

## Code Style

- 4 spaces indentation
- camelCase for JavaScript variables (destructure with aliases if API uses snake_case)
- Property names in component.json must match `context.messages.in.content` keys
- Use underscore or camelCase separators in property names (not pipe `|`)
- **Remove unused variables/imports** - every declared variable must be used
- **No single-option selects** - hardcode constants instead of making them user inputs
- **Date/Time fields**: Use inspector type `date-time`, NOT `text`
  - Schema: `"type": "string", "format": "date-time"`
  - Inspector: `"type": "date-time"`
  - For date-only: Add `{ "enableTime": false }` config

## Documentation Reference

Full connector development guide: https://docs.appmixer.com/getting-started/custom-connectors

### Testing compoenents 

it's possible to test components locally using the Appmixer CLI. 

#### setup

before running a test, make sure the connector is authenticated. to check the authentication status, run `appmixer test auth validate <path to auth.js file>`

for example:
`appmixer test auth validate ./src/appmixer/slack/auth.js`

if the authentication is not valid, stop and ask user to authenticate.

#### testng component

use command `appmixer test component <path to component>`

sage: appmixer test component [options] [componentDir]

Options:
-c, --config [config]                  service configuration
-f, --transform [transform]            specify transformer
-i, --input [input]                    input test message object of file path to the JSON file (default: [])
-m, --mime [mime]                      mime type, application/json by default
-p, --properties [properties]          component properties (JSON format)
-s, --no-state                         do not show component's state
-t, --tickPeriod [tickPeriod]          tick period (in ms), default is 10000 ms
-u, --appmixerApiUrl [appmixerApiUrl]  public url, used to test webhooks
-h, --help                             output usage information

Examples:
Following example will send input message { "to": "your@email.com" } to component's input port 'in'.
You always have to specify to which input port you want to send message.
$ appmixer test component [path-to-your-component-directory] -i '{ "in": { "to": "your@email.com" } }'

This is how to specify transformer function from transformer file.
$ appmixer test component [path-to-component] -i '{}' -f './transformers#channelsToSelectArray'

How to set properties and tick period:
$ appmixer t c [path-to-component] -p '{ "channelId: "123XYZ" }' -t 2000

You can send more than one message:
$ appmixer t c [path-to-component] -i '{ "in": { "to": "first@email.com" }}' -i '{ "in": { "to": "second@email.com" }}'

You can also specify the input in a separate file and use the file as a input:
$ appmixer t c [path-to-component] -i  [path-to-input-json-file]

sample input json file:
{
"in": {
"type": "page",
"outputType": "object"
}
}

You can specify service configuration (that is normally set through the Backoffice):
$ appmixer t c [path-to-component] -c '{ "key": [service-api-key] }'

You can test webhook components as well. You have to create a tunnel to the localhost server,
which is running by default on http://localhost:2300. You can use ngrok to create the tunnel, for example.
$ appmixer t c [path-to-webhook-component] --appmixerApiUrl "https://541a-86-49-182-253.ngrok.io"

You can run appmixer command in your component's directory:
$ appmixer test c
Directory has to contain component.json file and component's source code file.




