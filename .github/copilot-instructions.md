<!-- DO NOT EDIT — generated from the Appmixer-ai/appmixer-skills repository
     (instructions/*.md) by scripts/build-instructions.js.
     To change the content, open a PR against appmixer-skills, then re-run
     the script here to refresh this file. -->

# Appmixer Development & Component Creation Guidelines

> These instructions are the canonical connector-design rules the
> [appmixer-skills](https://github.com/Appmixer-ai/appmixer-skills) follow. They
> are maintained in `instructions/` at the repo root and synced into each
> skill's `references/` directory (`node scripts/sync-references.mjs`) — edit
> them there, never the copies. Complete example files live in `examples/`.
> For real-world example connectors to learn from, see
> https://github.com/appmixer-ai/appmixer-connectors.

## Overview

Appmixer is a workflow engine with a web user interface that allows end-users to create business processes using a drag-and-drop UI without writing code. This comprehensive guide covers connector development, authentication, component creation, and best practices for both AI assistance and human developers.

## Workspace Structure

Connectors are developed in a local workspace — any directory containing
`src/<vendor>/<connector>/`. The `<vendor>` segment is a namespace: `appmixer`
is only the default, a customer workspace can use its own vendor name(s), and
several vendors can live side by side. Component names mirror the disk layout:
`<vendor>.<connector>.<module>.<Component>` ↔
`src/<vendor>/<connector>/<module>/<Component>/`.

```
src/
└── <vendor>/           # Source code for connectors (default vendor: appmixer)
    └── <connector>/
```

(Reference workspaces like the appmixer-connectors repo may carry extra
tooling — test runners, validators, example components — but none of it is
required.)

---

---

# Part 1: Connectors

## Overview

Connectors are integrations with external services. Each connector contains authentication logic, service metadata, and one or more components that perform specific actions.

## Connector Structure

```
connector_name/
├── service.json       # Service metadata and description
├── auth.js           # Authentication configuration
├── bundle.json       # Bundle metadata and changelog
├── package.json      # Dependencies (optional)
├── quota.js          # Rate limiting rules (optional)
└── core/             # Default module for components
    ├── ComponentName/
    │   ├── ComponentName.js    # Component behavior/logic
    │   └── component.json      # Component configuration
    └── AnotherComponent/
        ├── AnotherComponent.js
        └── component.json
```

**Documentation**: https://docs.appmixer.com/building-connectors/example-component#component-behaviour-sms-sendsms-sendsms.js

## Core Configuration Files

### package.json (Optional)

Optional file that contains dependencies.

### service.json

Describes the connector service and its metadata.

**Example**:
```json
{
    "name": "appmixer.connectorname",
    "label": "Connector Display Name",
    "category": "applications",
    "description": "Description of what this connector does",
    "version": "1.0.0",
    "icon": "https://example.com/icon.svg"
}
```

**JSON Schema**:
```json
{
    "type": "object",
    "description": "Service JSON file, used to describe the service",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the service, lower case, use the `appmixer.${CONNECTOR_NAME}` format "
        },
        "label": {
            "type": "string",
            "description": "The label of the service"
        },
        "category": {
            "type": "string",
            "description": "use default value 'applications'"
        },
        "description": {
            "type": "string",
            "description": "Description of the service, used in the UI to describe the connector."
        },
        "version": {
            "type": "string",
            "description": "Semantic version (e.g., 1.0.0)"
        },
        "icon": {
            "type": "string",
            "description": "url to the SVG icon of the application"
        }
    }
}
```

### bundle.json

Contains bundle metadata and version history.

**Example**:
```json
{
    "name": "appmixer.connectorname",
    "version": "1.0.0",
    "changelog": {
        "1.0.0": ["Initial release."],
        "1.0.1": ["Bug fixes and improvements."],
        "2.0.0": ["(breaking change) Updated API integration."]
    }
}
```

**JSON Schema**:
```json
{
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the bundle, lower case, use the `appmixer.${CONNECTOR_NAME}` format. This is the same as the name in service.json file."
        },
        "version": {
            "type": "string",
            "description": "The version of the bundle, use 1.0.0 by default"
        },
        "changelog": {
            "type": "object",
            "description": "The changelog of the bundle, used to describe the changes in the bundle. For example: {\n        \"1.0.4\": [\n            \"Initial release.\"\n        ],\n        \"1.0.5\": [\n            \"Renamed output variable name in ListBases from Array to Bases and in ListTables from Array to Tables.\"\n        ],\n        \"2.0.1\": [\n            \"(breaking change) Fixed output schema for ListTables and ListBases.\"\n        ]"
        }
    },
    "required": ["name", "version", "changelog"]
}
```

**IMPORTANT - Single Version Rule**: For unreleased connectors (new connectors being developed), the bundle.json must have only ONE version entry (typically 1.0.0). Do NOT pre-create multiple version entries (e.g., 1.0.0, 1.1.0, 1.2.0) before the connector is released. New versions should only be added when actual releases occur, not during initial development.

### quota.js

Defines rate limiting rules to prevent API quota violations.

**Example**:
```javascript
module.exports = {
    rules: [
        {
            limit: 2000,                          // Max calls per window
            throttling: 'window-sliding',         // Throttling method
            window: 1000 * 60 * 60 * 24,          // 24 hours in ms
            scope: 'userId',                      // Per user limits
            resource: 'messages.send'             // Resource identifier
        },
        {
            limit: 3,
            window: 1000,                         // 1 second
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'messages.send',
            scope: 'userId'
        }
    ]
};
```

**Rule Properties**:
- **limit**: Maximum number of calls in the time window specified by window.
- **window**: The time window in milliseconds.
- **throttling**: The throttling mechanism. Can be either a string 'window-sliding' or an object with type and getStartOfNextWindow function.
- **resource**: An identifier of the resource to which the rule applies. This can be referenced in component manifests in the quota.resources section.

---

---

# Part 2: Authentication

## Overview

Appmixer supports multiple authentication methods. The `auth.js` file defines how users authenticate with the external service.

## Authentication Types

### API Key Authentication

For services that use API keys or tokens.

**Generic Example**:
See [`examples/auth/api-key.js`](examples/auth/api-key.js).

**Real-World Example (Freshdesk)**:
See [`examples/auth/api-key-freshdesk.js`](examples/auth/api-key-freshdesk.js).

### OAuth 2.0 Authentication

For services using OAuth 2.0 flow.

> ⚠️ **Breaking Change Warning — OAuth Scopes**
>
> Adding new OAuth scopes to an existing connector is a **breaking change**. Existing users will need to re-authenticate to grant the new permissions. This must be reflected in the connector's `bundle.json`:
> - Bump the **major** version (e.g. `2.2.0` → `3.0.0`)
> - Document the scope change clearly in the changelog entry
> - Include a note in the PR description warning reviewers that existing users will be asked to re-authenticate
>
> Example `bundle.json` changelog entry:
> ```json
> "3.0.0": [
>     "BREAKING: Added w_organization_social OAuth scope to support posting as an organization page. Existing users must re-authenticate."
> ]
> ```

#### Simplified URL-Based Format

For services with standard OAuth 2.0 endpoints, you can use a simplified URL-based format where URLs are provided as strings instead of functions:

**Example (ClickUp)**:
```javascript
module.exports = {
    type: 'oauth2',

    definition: () => {
        return {
            scope: [],

            authUrl: 'https://app.clickup.com/api',

            requestAccessToken: 'https://api.clickup.com/api/v2/oauth/token',

            requestProfileInfo: 'https://api.clickup.com/api/v2/user',

            accountNameFromProfileInfo: 'user.username',

            validateAccessToken: 'https://api.clickup.com/api/v2/user'
        };
    }
};
```

**Key Differences from Function-Based Format**:
- `authUrl`: String URL instead of function - Appmixer handles OAuth parameters automatically
- `requestAccessToken`: String URL instead of async function - Appmixer handles the token exchange
- `requestProfileInfo`: String URL instead of async function - Appmixer makes GET request with Bearer token
- `accountNameFromProfileInfo`: Dot-notation path to extract account name from profile response (e.g., `'user.username'`)
- `validateAccessToken`: String URL instead of async function - Appmixer makes GET request to validate token

This format is simpler and works when the service follows standard OAuth 2.0 conventions. Use the function-based format (below) when you need custom logic for token handling or non-standard endpoints.

#### Function-Based Format

For services that require custom OAuth logic or have non-standard endpoints:

**Generic Example**:
See [`examples/auth/oauth2-generic.js`](examples/auth/oauth2-generic.js).

**Real-World Example (Google OAuth2)**:
See [`examples/auth/oauth2-google.js`](examples/auth/oauth2-google.js).

---

---

# Part 3: Plugins, Routes and Jobs

Files: `<connector>/jobs.js`, `<connector>/routes.js`, `<connector>/plugin.js`

> **Limitation**: Plugin code is deployed to pods that only load files from the connector root. Do **not** require helpers from component module folders (e.g. `./tasks/...`, `./core/...`) inside routes or jobs. Keep shared helpers/models alongside the plugin entry point (or re-export them there) so every pod can resolve the require.

## Context API

`context.log` MUST have this signature:
```js
context.log(level, message, [data]);
```

---

---

# Part 4: Components

## Overview

Components are the building blocks of workflows. Each component performs a specific action like sending an email, creating a task, or fetching data. A component is a self-contained unit of functionality that can be used in Appmixer workflows. It can have multiple inPorts and outPorts, and it can be used to process data, trigger actions, or perform other tasks.

A component is defined by a `component.json` file and a "behavior" file with the same name as the component folder.

## Component Structure

Each component consists of:
- `component.json` - Configuration and metadata
- `ComponentName.js` - Behavior and logic

## General Principles

- For components that require an ID as input, there must be another component that returns the entity from which the ID can be obtained. For example, if a connector has a GetEmail component that takes emailId as input, then there must also be a FindEmails component that returns one or more email entities containing the emailId.

---

---

# Part 5: Component Configuration (component.json)

### JSON Schema Reference

```json
{
    "type": "object",
    "properties": {
        "name": {
            "type": "string", "pattern": "^[\\w]+\\.[\\w]+\\.[\\w]+\\.[\\w]+$",
            "description": "Component name in the format 'vendor.connectorName.module.componentName'. Use 'core' as default module name"
        },
        "label": {
            "type": "string",
            "description": "The label of your component. If no label is specified, then last part of name will be used when component is dropped into Designer. If your component name is appmixer.twitter.statuses.CreateTweet then Create Tweet will be name of the component unless you specify label property."
        },
        "description": {
            "type": "string",
            "description": "Description of your component. The description is displayed in the Designer UI inspector panel. "
        },
        "author": { "type": "string", "description": "Appmixer <info@appmixer.com>" },
        "trigger": { "type": "boolean", "description": "Whether the component is a trigger component." },
        "inPorts": { "$ref": "#/definitions/inPorts" },
        "outPorts": { "$ref": "#/definitions/ports" },
        "auth": { "$ref": "#/definitions/auth" },
        "version": { "type": "string", "description": "The version of the component, e.g. '1.0.0'" },
        "tick": {
            "type": "boolean",
            "description": "When set to true, the component will receive signals in regular intervals from the engine. The tick() Component Virtual method will be called in those intervals (see Component Behaviour). This is especially useful for trigger-type of components that need to poll a certain API for changes. The polling interval can be set by the COMPONENT_POLLING_INTERVAL environment variable (for custom on-prem installations only). The default is 60000 (ms), i.e. 1 minute."
        },
        "webhook": {
            "type": "boolean",
            "description": "Set webhook property to true if you want your component to be a \"webhook\" type. That means that context.getWebhookUrl() method becomes available to you inside your component virtual methods (such as receive()). You can use this URL to send HTTP requests to. See the Behaviour section, especially the context.getWebhookUrl() for details and example."
        },
        "icon": { "type": "string", "description": "Link to svg icon. The icon representing the component in the UI." },
        "quota": {
            "type": "object",
            "description": "Configuration of the quota manager used for this component. Quotas allow you to throttle the firing of your component. This is especially useful and many times even necessary to make sure you don't go over limits of the usage of the API that you call in your components. Quota managers are defined in the quota.js file of your service/module.",
            "properties": {
                "manager": {
                    "type": "string", "description": "The name of the quota module where usage limit rules are defined."
                },
                "maxWait": { "type": "integer", "description": "If present it MUST be lower than 120000 (2 minutes) which is the default TTL for the quota manager." },
                "concurrency": { "type": "integer" },
                "resources": {
                    "description": "One or more resources that identify rules from the quota module that apply to this component. Each rule in the quota module can have the resource property. quota.resources allow you to cherry-pick rules from the list of rules in the quota module that apply to this component. quota.resources can either be a string or an array of strings.",
                    "oneOf": [
                        { "type": "array", "items": { "type": "string" } },
                        { "type": "string" }
                    ]
                },
                "scope": {
                    "type": "object",
                    "description": "This scope instructs the quota manager to count calls either for the whole application (service) or per-user. Currently, it can either be omitted in which case the quota limits for this component apply for the whole application or it can be { \"userId\": \"{{userId}}\" } in which case the quota limits are counted per Appmixer user."
                }
            }
        },
        "properties": {
            "type": "object",
            "description": "The configuration properties of the component. Note that unlike properties specified on input ports, these properties cannot be configured by the user to use data coming from the components back in the chain of connected components. In other words, these properties can only use data that is known before the flow runs. This makes them suitable mainly for trigger type of components.",
            "properties": {
                "schema": { "$ref": "#/definitions/jsonSchema" },
                "inspector": { "$ref": "#/definitions/inspector" }
            }
        },
        "icon": { "type": "string", "description": "Link to svg icon. The icon representing the component in the UI." }
    },
    "additionalProperties": false,
    "required": ["name"],
    "definitions": {
        "jsonSchema": {
            "type": "object",
            "description": "schema is a JSON Schema definition (http://json-schema.org) of the properties, their types and whether they are required or not."
        },
        "auth": {
            "type": "object",
            "description": "The authentication service and parameters. For example:\n\nCopy\n{\n    \"auth\": {\n        \"service\": \"appmixer:google\",\n        \"scope\": [\n            \"https://mail.google.com/\",\n            \"https://www.googleapis.com/auth/gmail.compose\",\n            \"https://www.googleapis.com/auth/gmail.send\"\n        ]\n    }\n}\nThe auth.service identifies the authentication module that will be used to authenticate the user to the service that the component uses. It must have the following format: [vendor]:[service]. The Appmixer engine looks up the auth.js file under that vendor and service category. auth.scope provides additional parameters to the authentication module. See the Authentication section for more details.\n\nWhen auth is defined, the component will have a section in the Designer UI inspector requiring the user to select from existing accounts or connect a new account. Only after an account is selected the user can continue configuring other properties of the component.",
            "properties": {
                "service": {
                    "type": "string"
                },
                "scope": {
                    "type": "array"
                }
            },
            "required": [
                "service"
            ]
        },
        "source": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL of the component to call. The URL is relative to the Appmixer API base URL, e.g. '/component/appmixer/google/spreadsheets/ListWorksheets?outPort=out'."
                },
                "data": {
                    "type": "object",
                    "properties": {
                        "messages": {
                            "description": "Messages that will be sent to the input port of the component referenced by the properties.source.url. Keys in the object represent input port names and values are any objects that will be passed to the input port as messages."
                        },
                        "properties": {
                            "type": "object",
                            "description": "Properties that will be used in the target component referenced by the properties.source.url. The target component must have these properties defined in its manifest file. The values in the object are references to the properties of the component that calls the target component in the static mode. For example:\n\nCopy\n{\n    \"properties\": {\n        \"targetComponentProperty\": \"properties/myProperty\"\n    }\n}"
                        }
                    }
                },
                "transform": {
                    "type": "string",
                    "description": "The transformation function used to transform the output of the target component. It should return an inspector-like object, i.e.:\n\nCopy\n{\n    inputs: { ... },\n    groups: { ... }\n}\nExample:\n\nCopy\n{\n    \"transform\": \"./transformers#columnsToInspector\"\n}\nThe transform function is pointed to be a special format [module_path]#[function], where the transformation module path is relative to the target component directory."
                }
            },
            "required": ["url"]
        },
        "port": {
            "type": "object",
            "properties": {
                "name": { "type": "string" },
                "maxConnections": { "type": "integer" },
                "schema": { "$ref": "#/definitions/jsonSchema" },
                "source": {
                    "$ref": "#/definitions/source",
                    "description": "The definition is similar to the `source` of properties. When used for the output port definition, it allows defining the output port schema dynamically.\n\nThere is one difference though. When defined in the output port, the source definition can reference both component properties and input fields, while the properties source definition can only hold references to other properties' values. \n\nAn example is a Google Spreadsheet component UpdatedRow. The output port options of this component consist of the column names in the spreadsheet. But that is specific to the selected Spreadsheet/Worksheet combination. Therefore it has to be defined dynamically. "
                },
                "options": {
                    "type": "array",
                    "description": "We support full schema definition for each option, so you can specify the structure of the data that is coming out from your component. You can add a schema property to each option, which contains a JSON Schema definition."
                }
            },
            "required": ["name"]
        },
        "state": {
            "type": "object",
            "properties": {
                "persistent": {
                    "type": "boolean"
                }
            }
        },
        "options": {
            "type": "array",
            "minItems": 0,
            "items": {
                "oneOf": [
                    { "type": "object" },
                    { "type": "string" }
                ]
            },
            "uniqueItems": true
        },
        "inspector": {
            "description": "Inspector tells the Designer UI how the input fields should be rendered. The format of this definition uses the Rappid Inspector definition format."
        },
        "inPorts": {
            "description": "The definition of the input ports of the component. It's an array of objects. Each component can have zero or more input ports. If a component does not have any input ports, we call it a trigger.",
            "type": "array"
        },
        "ports": {
            "description": "The definition of the output ports of the component. It's an array of objects. Components can have zero or more output ports.",
            "type": "array"
        }
    }
}
```

### Desired Attribute Order in component.json

1. `name`
2. `description`
3. `author`
4. `version`
5. `auth`
6. `quota`
7. `inPorts`
8. `properties`
9. `outPorts`
10. `icon`

### Type Mapping for Input Ports

Ensure `inPorts[0].schema.properties.<input_name>.type` and `inPorts[0].inspector.inputs.<input_name>.type` match:
- `string` → `text` or `textarea`
- `string` with `format: "date-time"` → `date-time`
- `string` with `format: "date"` → `date-time` with `config: { enableTime: false }`
- `integer` → `number`
- `boolean` → `toggle`

### Output Port Schema Definition

Each output port can define its output structure using **either** `schema` or `options`, but **not both**:

- **`schema`** (PREFERRED): Use JSON Schema to define the structure of output data. Provides type information, validation, and nested object/array support.
- **`options`**: Use an array of label/value pairs to define available output fields. Simpler but less structured — use only when fields are flat and you don't need typed schemas.

**IMPORTANT**: Always prefer `schema` (JSON Schema) over `options`. Use `options` only for legacy components or when dynamically generating a flat list of fields. You cannot have both `schema` and `options` at the root level of an output port. Choose one approach:

```json
// PREFERRED - using schema (JSON Schema)
"outPorts": [
    {
        "name": "out",
        "schema": {
            "type": "object",
            "properties": {
                "id": { "type": "string", "title": "ID", "example": "abc123" },
                "name": { "type": "string", "title": "Name", "example": "Acme Inc." }
            }
        }
    }
]

// ALTERNATIVE - using options (flat list only, no nested types)
"outPorts": [
    {
        "name": "out",
        "options": [
            { "label": "ID", "value": "id", "schema": { "type": "string", "example": "abc123" } },
            { "label": "Name", "value": "name", "schema": { "type": "string", "example": "Acme Inc." } }
        ]
    }
]

// INCORRECT - both schema and options
"outPorts": [
    {
        "name": "out",
        "schema": { ... },
        "options": [ ... ]  // ERROR: Cannot have both
    }
]
```

### Output Port Examples (variable picker preview)

Output port fields should include `example` values so users see realistic sample data in the variable picker UI when wiring downstream components.

**Rules:**

1. **Use `example` (singular), NOT `examples` (array).** Appmixer reads `example`; the JSON Schema `examples: [...]` array is not rendered.
2. **In JSON Schema format**: put `example` on each leaf property inside `schema.properties[key]`. This is the preferred form.
3. **In options format**: put `example` inside the per-option `schema` object: `options[k].schema.example`.
4. **Falsy values render correctly** (`0`, `false`, `""`) — don't omit them out of concern they won't show.
5. **Choose realistic sample values** that match the actual API response (real ID format, real date, etc.), not placeholders like `"string"` or `"value"`.
6. **Do NOT use `description`** on output port properties. Use `title` for the human-readable label; `description` is not rendered by the variable picker and only adds noise. Tooltips/help text belong on input port inspectors, not on outputs.

**JSON Schema format (PREFERRED):**

```json
"outPorts": [
    {
        "name": "out",
        "schema": {
            "type": "object",
            "properties": {
                "id": { "type": "string", "title": "ID", "example": "1001" },
                "title": { "type": "string", "title": "Title", "example": "Buy groceries" },
                "completed": { "type": "boolean", "title": "Completed", "example": false },
                "priority": { "type": "integer", "title": "Priority", "example": 0 },
                "created_at": { "type": "string", "format": "date-time", "title": "Created", "example": "2025-01-15T10:30:00Z" },
                "tags": {
                    "type": "array",
                    "title": "Tags",
                    "items": { "type": "string" },
                    "example": ["urgent", "shopping"]
                },
                "assignee": {
                    "type": "object",
                    "title": "Assignee",
                    "properties": {
                        "id": { "type": "string", "example": "u-42" },
                        "name": { "type": "string", "example": "Jane Doe" }
                    }
                }
            }
        }
    }
]
```

**Options format (only when you cannot use JSON Schema):**

```json
"outPorts": [
    {
        "name": "out",
        "options": [
            { "label": "ID", "value": "id", "schema": { "type": "string", "example": "1001" } },
            { "label": "Title", "value": "title", "schema": { "type": "string", "example": "Buy groceries" } },
            { "label": "Completed", "value": "completed", "schema": { "type": "boolean", "example": false } }
        ]
    }
]
```

**Background:** Until recently, `schema.example` on JSON Schema output ports was not rendered in the variable picker — only `options[k].schema.example` worked. That bug was fixed (see Appmixer-ai/appmixer-core#3734), so JSON Schema with per-property `example` is now the recommended approach.

---

---

# Part 6: Component Behavior (JavaScript)

The behavior file contains the component's logic.

## Basic Structure

### `receive` Method

The `receive` function is called when the component receives data from the input port.

```javascript
module.exports = {
    async receive(context) {

        // Get input data
        const { message, priority, count } = context.messages.in.content;

        // Perform the action
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.service.com/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                text: message,
                priority: priority,
                count: count
            }
        });

        // Return the result
        return context.sendJson(response.data, 'out');
    }
};
```

## Advanced Features

### Trigger Components

```javascript
module.exports = {
    async tick(context) {
        // Called periodically for polling
        const newItems = await fetchNewItems(context);

        for (const item of newItems) {
            await context.sendJson(item, 'out');
        }
    }
};
```

### Webhook Components

```javascript
module.exports = {
    async receive(context) {
        const webhookUrl = context.getWebhookUrl();

        // Register webhook with external service
        await registerWebhook(context, webhookUrl);

        return context.sendJson({ webhookUrl }, 'out');
    },

    async webhook(context) {
        // Handle incoming webhook
        const payload = context.messages.webhook;
        return context.sendJson(payload, 'out');
    }
};
```

---

---

# Part 7: Component Types and Patterns

## 1. Action Components

Action components perform operations when triggered by input data. They don't run continuously but execute when they receive input.

### Find (Items) Components

**Purpose**: Search for items based on criteria, returns array of matching items.

**Pattern**: `Find{EntityName}` (e.g., `FindTasks`, `FindUsers`, `FindProjects`)

**Key Characteristics**:
- Returns array of items
- Includes `outputType` for array vs individual items (outputType is always the last property in inPorts schema with maximum index)
- Has `notFound` output port for when no items match
- Limited by query/filter parameters
- No pagination, no limit. Returns maximum items per one page. Maximum number of items mentioned in description.
- **IMPORTANT**: Do NOT include `limit` or `offset` fields in component inputs - these are not supported by Appmixer Find components

**Example component.json structure**:
See [`examples/find-tasks/component.json`](examples/find-tasks/component.json).

**Example behavior pattern with lib support**:
See [`examples/find-tasks/FindTasks.js`](examples/find-tasks/FindTasks.js).

**lib.js helper utilities**:
See [`examples/find-tasks/lib.js`](examples/find-tasks/lib.js).

### outputType Helper Functions (REQUIRED)

Components with `outputType` (Find/List) **MUST** use standardized lib.js helpers.

**Required functions in connector's lib.js:**
- `sendArrayOutput({ context, outputPortName = 'out', outputType, records })` - handles all output types
- `getOutputPortOptions(context, outputType, schema, { label })` - dynamic output schema

**Canonical implementation:** copy [`examples/find-tasks/lib.js`](examples/find-tasks/lib.js)

**Required behavior pattern:**
```javascript
const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Items' });
        }

        const records = await fetchData();
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
```

**Critical rules:**
- For the `'array'` outputType, always use `result` as the array output field name and include the total count: `{ result: records, count: records.length }`
- Never use `records` or custom field names for consistency
- lib.js MUST exist in connector root if component has outputType — follow this rule even when the workspace has no tooling to enforce it

### List (Items) Components

**Purpose**: Retrieve all items of a specific type. Use when the service doesn't provide filter/search options.

**Pattern**: `List{EntityName}` (e.g., `ListTasks`, `ListUsers`, `ListProjects`)

**Key Characteristics**:
- Returns array of items by default
- Includes `outputType` for array vs individual items
- IMPORTANT: Ignore pagination or limits—use the maximum available page size
- Mention maximum page size count in description
- **IMPORTANT**: Do NOT include `limit` or `offset` fields in component inputs - these are not supported by Appmixer List components

**Example component.json structure**:
See [`examples/list-forms/component.json`](examples/list-forms/component.json).

### Get (Item) Components

**Purpose**: Retrieve a single item by its unique identifier.

**Pattern**: `Get{EntityName}` (e.g., `GetTask`, `GetUser`, `GetProject`)

**Key Characteristics**:
- Returns single item
- Requires unique identifier (ID)
- Throws error if item not found

**Example component.json structure**:
See [`examples/get-task/component.json`](examples/get-task/component.json).

**Example behavior pattern**:
```javascript
module.exports = {
    async receive(context) {
        const { taskId } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.service.com/tasks/${taskId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
```

### Create (Item) Components

**Purpose**: Create a new item in the external service.

**Pattern**: `Create{EntityName}` (e.g., `CreateTask`, `CreateUser`, `CreateProject`)

**Key Characteristics**:
- Creates new item
- Returns created item data
- Requires fields specific to the entity type

**Example component.json structure**:
See [`examples/create-task/component.json`](examples/create-task/component.json).

### Delete (Item) Components

**Purpose**: Delete an item by its unique identifier.

**Pattern**: `Delete{EntityName}` (e.g., `DeleteTask`, `DeleteUser`, `DeleteProject`)

**Key Characteristics**:
- Deletes item by ID
- Returns empty object on success
- Irreversible action
- Must have `outPorts: ['out']`
- Must have at least one required input (the ID)

**Example behavior pattern**:
```javascript
module.exports = {
    async receive(context) {
        const { taskId } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.service.com/tasks/${taskId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
```

### Update (Item) Components

**Purpose**: Update an existing item with new data.

**Pattern**: `Update{EntityName}` (e.g., `UpdateTask`, `UpdateUser`, `UpdateProject`)

**Key Characteristics**:
- Updates item by ID
- Returns empty object on success
- Requires at least ID to identify the item
- Must have at least one required input (the ID)

**Example behavior pattern**:
```javascript
module.exports = {
    async receive(context) {
        const { taskId, name, price } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.service.com/tasks/${taskId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                name, price
            }
        });

        return context.sendJson({}, 'out');
    }
};
```

## 2. Trigger Components

Trigger components monitor for events and start workflows when conditions are met. They use polling or webhooks.

### Common Trigger Patterns

**Key Characteristics**:
- Set `"trigger": true` in component.json
- Use `tick()` method for polling triggers
- Use `webhook()` method for webhook triggers
- Store state to track changes

### New/Created (Item) Triggers

**Purpose**: Trigger when new items are created.

**Pattern**: `New{EntityName}` or `{EntityName}Created` (e.g., `NewTask`, `TaskCreated`)

**Example component.json structure**:
See [`examples/polling-trigger/component.json`](examples/polling-trigger/component.json).

**Behavior file pattern**:
See [`examples/polling-trigger/NewTask.js`](examples/polling-trigger/NewTask.js).

**State Management Pattern using lib.js helper**:
See [`examples/polling-trigger/NewTaskWithLib.js`](examples/polling-trigger/NewTaskWithLib.js).

#### 2. Webhook Triggers (`webhook: true`)

Webhook triggers receive HTTP callbacks from external services. They require lifecycle methods to register/unregister webhooks.

**component.json structure**:
See [`examples/webhook-trigger/component.json`](examples/webhook-trigger/component.json).

**Behavior file pattern**:
See [`examples/webhook-trigger/UpdatedContact.js`](examples/webhook-trigger/UpdatedContact.js).

#### 2b. Plugin-based Triggers (shared global endpoint + `addListener`)

When the upstream service requires a **single global webhook callback URL per app** (Meta WhatsApp, Slack Events API, Stripe Webhooks at the app level), the per-trigger `getWebhookUrl()` pattern in section 2 does NOT work — you can only register one URL on the upstream service, and Appmixer issues a different URL per trigger instance. The right pattern is a **connector-level plugin** that owns one endpoint and fans out events to many subscribed trigger instances.

**Architecture**

```
External service (Meta App / Slack App / …)
         │  one global callback URL configured once by the admin
         ▼
<API_BASE>/plugins/<vendor>/<service>/<path>         (registered in plugin.js → routes.js)
         │
         │  routes.js parses payload, optionally HMAC-verifies, then:
         ▼
context.triggerListeners({ eventName, payload, filter })
         │
         │  Engine fans out to all matching listener instances:
         ▼
Trigger component instance (one per flow)
   start():    context.addListener(eventName, params)
   stop():     context.removeListener(eventName)
   receive():  context.messages.webhook.content.data  → sendJson
```

**Required files at the connector root**

`plugin.js` — entrypoint executed once when the connector is installed onto the Appmixer server. Loads routes (and optionally jobs):

See [`examples/plugin-webhook/plugin.js`](examples/plugin-webhook/plugin.js).

`routes.js` — registers the HTTP endpoint(s) and the listener-added validator:

See [`examples/plugin-webhook/routes.js`](examples/plugin-webhook/routes.js).

The endpoint URL is `<API_BASE>/plugins/<vendor>/<service>/<path>` — derived from the connector's directory path. **No `context.getWebhookUrl()` is involved** — the admin configures this single URL on the upstream service once.

**Trigger component pattern**

See [`examples/plugin-webhook/NewEvent.js`](examples/plugin-webhook/NewEvent.js).

**Key APIs**

| API | Where | Purpose |
|---|---|---|
| `context.http.router.register({ method, path, options })` | `routes.js` | Mount an HTTP route under `/plugins/<vendor>/<service>` |
| `context.onListenerAdded(cb)` | `routes.js` | Hook fired when a trigger calls `addListener` — validate / transform `listener.params` |
| `context.triggerListeners({ eventName, payload, filter })` | `routes.js` (inside route handler) | Fan an event out to all subscribed listeners matching `eventName` and optional `filter` |
| `context.addListener(eventName, params)` | trigger `start()` | Register this trigger instance as a consumer of `eventName` |
| `context.removeListener(eventName)` | trigger `stop()` | Unregister this instance |
| `context.messages.webhook.content.data` | trigger `receive()` | The payload from `triggerListeners` |

**When to use this pattern (vs. section 2's per-trigger webhook URL)**

- Upstream service allows **only one callback URL per app** (Meta App, Slack App, GitHub App)
- Upstream events fan out to many tenants and you must route them server-side
- You want HMAC signature verification of the **app's** secret centrally, not per-trigger
- You have multiple trigger types listening to the same upstream stream (e.g. `NewMessage` and `MessageStatusUpdated` both consume Meta's `messages` webhook)

**When NOT to use this pattern**

- The upstream service supports per-resource webhooks (ActiveCampaign, Stripe per-account) — section 2 is simpler
- Polling is acceptable and the upstream has no webhook API — use `tick: true`

**Reference implementations**

- `src/appmixer/slack/plugin.js` + `routes.js` + `list/NewChannelMessageRT/NewChannelMessageRT.js`
- `src/appmixer/whatsapp/plugin.js` + `routes.js` + `notifications/NewMessage/NewMessage.js`

#### 3. Hybrid Triggers (`webhook: true` + `tick: true`)

Some triggers use both webhook and tick - webhooks for real-time events and tick for maintenance (e.g., refreshing webhook registration before expiry).

**component.json structure**:
```json
{
    "name": "appmixer.service.core.NewRecord",
    "webhook": true,
    "tick": true,
    "auth": { "service": "appmixer:service" },
    "properties": { ... },
    "outPorts": [ ... ]
}
```

**Behavior file pattern**:
See [`examples/hybrid-trigger/NewRecord.js`](examples/hybrid-trigger/NewRecord.js).

### Trigger Naming Conventions

| Pattern | Usage | Examples |
|---------|-------|----------|
| `New{Entity}` | New item created | `NewTask`, `NewContact`, `NewEmail` |
| `{Entity}Created` | Alternative for new items | `TaskCreated`, `ContactCreated` |
| `Updated{Entity}` | Item modified | `UpdatedContact`, `UpdatedDeal` |
| `{Entity}Updated` | Alternative for updates | `ContactUpdated`, `DealUpdated` |
| `Deleted{Entity}` | Item removed | `DeletedTask`, `DeletedUser` |
| `New{Entity}Webhook` | Webhook-based new item | `NewRecordWebhook`, `NewUserWebhook` |

### Trigger component.json Requirements

1. **NO `inPorts`**: Triggers must NOT have input ports
2. **Use `properties`**: Configuration is defined in `properties`, not `inPorts`
3. **Set appropriate flags**:
    - `"tick": true` for polling triggers
    - `"webhook": true` for webhook triggers
    - Both for hybrid triggers
4. **Include `auth`**: Most triggers need authentication
5. **Define `outPorts`**: Specify the output schema

### Trigger Behavior Requirements

1. **Polling triggers (`tick: true`)**:
    - MUST implement `tick(context)` method
    - MUST use `loadState()`/`saveState()` to track known items
    - MUST compare new items against known items to avoid duplicates
    - Access user configuration via `context.properties` (NOT `context.messages.in.content`)

2. **Webhook triggers (`webhook: true`)**:
    - MUST implement `start(context)` to register webhook
    - MUST implement `stop(context)` to unregister webhook
    - MUST implement `receive(context)` to handle webhook payloads
    - MUST call `context.getWebhookUrl()` to get the callback URL
    - MUST return `context.response()` after processing webhook
    - SHOULD save `webhookId` in state for cleanup

3. **Deduplication**:
    - Use `context.staticCache` for short-term deduplication
    - Use `context.lock()` to prevent race conditions
    - Compare item IDs against known set from state

### Common Trigger Patterns

#### Deduplication with Cache and Lock
```javascript
async receive(context) {

    if (context.messages.webhook) {
        const events = context.messages.webhook.content.data;
        let lock;

        try {
            lock = await context.lock(context.componentId, {
                ttl: 1000 * 10,
                retryDelay: 500,
                maxRetryCount: 3
            });

            const ids = [];
            for (const event of events) {
                const cacheKey = `trigger-event-${event.id}`;
                const cached = await context.staticCache.get(cacheKey);
                if (cached) continue;

                await context.staticCache.set(cacheKey, event.id, 5000); // 5s TTL
                ids.push(event.id);
            }

            // Process non-duplicate events
            for (const id of ids) {
                await context.sendJson({ id }, 'out');
            }
        } finally {
            await lock?.unlock();
        }

        return context.response();
    }
}
```

#### Dynamic Output Port Schema

When using `source` to dynamically populate field options or output port schemas, the `data` object can contain either `messages` or `properties` depending on the target component's input type:

- **Use `messages`**: When the target component has `inPorts` (action components)
- **Use `properties`**: When the target component uses `properties` instead of `inPorts` (trigger components)

**IMPORTANT**: All **required** fields of the target component MUST be defined. You can use dummy data for fields that aren't needed for the specific call, but every required field must have a value.

**Example with `messages`** (target component has `inPorts`):
```json
{
    "inspector": {
        "inputs": {
            "folderId": {
                "type": "text",
                "label": "Folder ID",
                "source": {
                    "url": "/component/appmixer/clickup/core/ListFolders?outPort=out",
                    "data": {
                        "messages": {
                            "in/spaceId": "inputs/in/spaceId"
                        },
                        "transform": "./ListFolders#toSelectArray"
                    }
                }
            }
        }
    }
}
```

**Example with `properties`** (target component uses `properties`):
```json
{
    "outPorts": [
        {
            "name": "out",
            "source": {
                "url": "/component/appmixer/service/core/GetFields?outPort=out",
                "data": {
                    "properties": {
                        "entityType": "contact"
                    },
                    "transform": "./transformers#fieldsToSelectArray"
                }
            }
        }
    ]
}
```

**Using `variableFetch` / `isSource` for Dynamic Source Calls**

When a component is used as a dynamic data source (via `source` URL in inspector), four rules apply: **inspector field is `text`**, **dependencies are optional**, **error suppression**, and **response caching**.

**Rule 1 — Inspector field type is `text`, never `select`.**
The dropdown source can fail (auth not yet established, dependency input empty, API down). When that happens the user MUST be able to type the value manually. `select` constrains the field to dropdown options only and traps the user when the source returns `[]`. Use `type: "text"` with the `source` block — Appmixer renders this as a typeahead/autocomplete: user can pick from the loaded options OR type any value.

```jsonc
"phoneNumberId": {
    "type": "text",          // NOT "select"
    "label": "Phone Number",
    "tooltip": "Pick a phone number, or type the Phone Number ID directly.",
    "source": {
        "url": "/component/appmixer/<connector>/core/ListFoo?outPort=out",
        "data": {
            "properties": { "isSource": true },
            "transform": "./ListFoo#toSelectArray"
        }
    }
}
```

**Rule 2 — Dependency inputs are optional.**
When a dropdown depends on another input (e.g. `phoneNumberId` dropdown depends on `businessAccountId`), the dependency itself must NOT be in `schema.required[]`. Reason: the inspector evaluates required-input checks at design time on the host component; if a hard-required dependency is empty, the dropdown call never fires and the user sees no options AND no way to recover. Keeping the dependency optional means:

- The dropdown source is still called when the dependency is empty
- The source component handles missing input gracefully (returns `[]`)
- The user can still type the target value manually
- Runtime validation of the dependency happens at `receive()` time on the host component — set the actual requirement check there, not in `schema.required`.

```jsonc
"schema": {
    "properties": {
        "businessAccountId": { "type": "string" },
        "phoneNumberId":     { "type": "string" }
    },
    "required": ["phoneNumberId"]   // NOT businessAccountId — it's a dropdown helper, not a hard requirement
}
```

**Rule 3 & 4 — Error suppression and response caching** are covered below.

The convention is to pass a sentinel property in `source.data.properties` so the component knows it is being called from the inspector, not from a live flow. Two property names are in use — use whichever is already established in the connector, and be consistent within a connector:

| Property | Used in |
|---|---|
| `isSource: true` | monday, facebookbusiness — **preferred** |
| `variableFetch: true` | microsoft (onedrive, teams, …) — legacy |

> **Prefer `isSource` for new connectors. Do not mix both names in the same connector.**

**component.json** — add the sentinel to every `source.data.properties` block that uses a `transform`. Do NOT add it to `generateOutputPortOptions` sources.

```json
"source": {
    "url": "/component/appmixer/<connector>/core/ListFoo?outPort=out",
    "data": {
        "properties": { "variableFetch": true },
        "transform": "./ListFoo#toSelectArray"
    }
}
```

**Error suppression** — when the sentinel is set, catch errors and return an empty response instead of throwing. This prevents irrelevant error popups in the UI:

```javascript
async receive(context) {
    try {
        const drives = await listItems(context, 'me/drives?');
        return context.sendJson({ drives }, 'out');
    } catch (err) {
        if (context.properties.variableFetch) {
            return context.sendJson({ drives: [] }, 'out');
        }
        context.log({ stage: 'Error', err });
        throw new Error(err);
    }
},
```

**Response caching** — dynamic source calls happen every time the user opens a dropdown. To avoid hammering the API, cache the response using `context.staticCache` + `context.lock`. Put `callEndpointCached` in the connector's `lib.js` and call it only when the sentinel is set:

```javascript
// lib.js
const crypto = require('crypto');

function getCacheKey(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

async function callEndpointCached(context, url) {
    let lock;
    try {
        const key = getCacheKey({ url, token: context.auth.accessToken });
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) return { data: cached };
        const { data } = await context.httpRequest.get(url);
        await context.staticCache.set(key, data, context.config.listCacheTTL || (2 * 60 * 1000)); // 120s default
        return { data };
    } finally {
        lock?.unlock();
    }
}

module.exports = { callEndpointCached };
```

```javascript
// ListFoo.js
const { callEndpointCached } = require('../../lib');

async receive(context) {
    try {
        const url = `https://api.example.com/foo?token=${context.auth.accessToken}`;
        const { data } = context.properties.variableFetch
            ? await callEndpointCached(context, url)
            : await context.httpRequest.get(url);
        return context.sendJson({ items: data.items }, 'out');
    } catch (err) {
        if (context.properties.variableFetch) {
            return context.sendJson({ items: [] }, 'out');
        }
        throw err;
    }
},
```

Cache key is a SHA-256 hash of `{ url, token }` — unique per user and endpoint. Include **every input that shapes the result** in the key (endpoint/url, token, tenant or account ID, query params) so entries are never shared across users, tenants or queries. TTL is configurable via `context.config.listCacheTTL` (default 120 s).

The `context.lock(key)` around the fetch is not just for correctness — the designer fires source calls in a **concurrent burst** when a component's inspector opens (one call per dropdown, several dropdowns per component). The first caller populates the cache while the rest wait on the lock and then read the cached value, so the API sees one call instead of the whole burst.

**Variant — cache unconditionally (heavily rate-limited APIs):** when the upstream API has tight limits (e.g. Xero: 60 calls/min, 5 concurrent per tenant) or one source component backs a dropdown used by most components in the connector (typically a tenant/account selector), skip the sentinel check and cache inside `receive()` unconditionally, with a short TTL. Cache the **final assembled (post-pagination) records array** — one cache entry then saves up to ~100 upstream page calls, and ~2 min staleness on list data is an acceptable tradeoff even for normal flow execution. Pair this with honoring `Retry-After` on 429 responses in the connector's HTTP client, so a single throttled page does not fail the whole paginated fetch.

**Reference implementations:**
- Error suppression only: `src/appmixer/microsoft/onedrive/ListSites/ListSites.js`
- Caching + error suppression: `src/appmixer/facebookbusiness/marketing/GetAdAccounts/GetAdAccounts.js` + `facebookbusiness/lib.js`
- Unconditional caching of paginated results + burst dedupe + `Retry-After` on 429: `src/appmixer/xero/commons.js` (`withCache`) + `src/appmixer/xero/XeroClient.js`

Components referenced in a `source.url` **only** with `generateOutputPortOptions` (dynamic output port options) are exempt — that path returns static schema options and must not call the API at all.

---

---

# Part 8: Best Practices

## Code Style Guidelines (For All)

- Use 4 spaces for indentation
- Add one empty line after function definitions
- Add one empty line after the `receive` function definition
- Use camelCase for variable names in JavaScript behavior files (destructure with aliases if needed)
- Remove all unused variables and imports
- Property names in component.json must NEVER use a pipe `|` (e.g., `lockType`, not `lock|type`)
- **New input** property names should be camelCase (no underscore `_`). Existing snake_case inputs are fine and must NOT be renamed — that is a breaking change for connector users (input re-binding).
- Property names in component.json must exactly match those used in `context.messages.in.content`

## Development Guidelines (For All)

### auth.js Requirements

`auth.js` file with type `apiKey` MUST follow these rules:
- `requestProfileInfo` MUST return either:
    - An object with just the obfuscated apiKey (if profile info is not available via API) or
    - An object with the profile info

### Component Behavior (JavaScript) Requirements

Behavior JS file MUST follow these rules:
- Every required input in the component.json must be also asserted in the behavior file
- If a required input is missing, throw exception: `throw new context.CancelError('<human_readable_input_name> is required!')`
- Delete components must return an empty object, e.g., `return context.sendJson({}, 'out');` at the end of the function

### component.json Requirements

`component.json` file MUST follow these rules:
- Delete components must have `outPorts: ['out']`
- Update or delete components must have at least one required input, which is the ID of the entity being updated or deleted
- **IMPORTANT**: Find and List components must NOT include `limit` or `offset` fields in their input schema - these pagination controls are not supported by Appmixer and should be handled internally using the maximum available page size from the API

## Best Practices (AI Assistance)

Intended for AI assistance like Copilot, CodeRabbit, Claude, etc.

### Critical Restrictions for AI Code Generation

- **OAuth Scope Changes are Breaking Changes**: NEVER add new OAuth scopes to an existing connector's `component.json` `auth.scope` array without treating it as a **major** version bump. Adding a scope forces all existing users to re-authenticate. Always:
  - Bump the connector `bundle.json` to the next major version (e.g. `2.x.x` → `3.0.0`)
  - Add a `BREAKING:` prefix to the changelog entry describing the scope addition
  - Note in the PR description that existing users must re-authenticate

- **Pagination Fields**: NEVER generate `limit` or `offset` fields in Find or List component inputs. Appmixer does not support these pagination controls. Instead, use the maximum available page size from the external API and mention the limit in the component description.

- **Property Name Consistency**: Property names in `component.json` (both schema and inspector) MUST exactly match the property names used in the behavior file's `context.messages.in.content`. Use underscore `_` or camelCase as separator, NOT pipe `|`. For example:

  ```
  // component.json - WRONG
  "properties": {
    "lock|type": { "type": "string" },      // WRONG - uses pipe |
    "lock|expires_at": { "type": "string" } // WRONG - uses pipe |
  }
  
  // component.json - CORRECT (option 1: snake_case)
  "properties": {
    "lock_type": { "type": "string" },      
    "lock_expires_at": { "type": "string" }
  }
  
  // component.json - CORRECT (option 2: camelCase)
  "properties": {
    "lockType": { "type": "string" },      
    "lockExpiresAt": { "type": "string" }
  }
  
  // Behavior file - use camelCase variables
  // If component.json uses snake_case, destructure with aliases:
  const { 
    lock_type: lockType,
    lock_expires_at: lockExpiresAt
  } = context.messages.in.content;
  
  // If component.json uses camelCase, destructure directly:
  const { lockType, lockExpiresAt } = context.messages.in.content;
  ```

- **Unused Variables**: Remove all unused variables and imports. Every declared variable must be used in the code. If a property is not needed in the behavior logic, do not include it in component.json.

- **Unnecessary Input Fields**: Do not create select fields with only one option. If a value is constant, hardcode it in the behavior file instead of making it a user input.

- **Date/Time Input Types**: When a field accepts date or datetime values, use the appropriate inspector type:
    - For datetime fields: Use inspector type `"date-time"`
    - Schema: `"type": "string", "format": "date-time"`
    - Inspector: `"type": "date-time"`
    - For date-only fields: Use inspector type `"date-time"` with config `{ "enableTime": false }`
    - Do NOT use `"type": "text"` for date/datetime fields in the inspector

  Example:
  ```json
  {
    "schema": {
      "properties": {
        "expires_at": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "inspector": {
      "inputs": {
        "expires_at": {
          "type": "date-time",
          "label": "Expires At"
        }
      }
    }
  }
  ```

## Best Practices (Humans)

### Development Guidelines

- **Authentication**: Store sensitive data in auth configuration, not component code
- **Rate Limiting**: Use quota.js to prevent API abuse
- **Documentation**: Provide clear descriptions and tooltips for all fields

### Performance Considerations

- **Caching**: Cache frequently accessed data (e.g., user lists, configuration)
- **Pagination**: Handle large datasets with proper pagination
- **Locking**: Use locking mechanisms for shared resources
- **Batching**: Batch API calls when possible to reduce requests

#### Cache TTL using staticCache

When caching data (e.g., folder structures, user lists, property definitions), use `context.staticCache` with a TTL (Time-To-Live) to ensure the cache is refreshed periodically:

```javascript
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async tick(context) {
    const cacheKey = `myconnector_data_${context.componentId}`;
    let cachedData = await context.staticCache.get(cacheKey);

    if (!cachedData) {
        // Cache miss - fetch fresh data
        cachedData = await fetchData(context);
        // staticCache handles expiration automatically
        await context.staticCache.set(cacheKey, cachedData, CACHE_TTL_MS);
    }

    // ... rest of tick logic using cachedData
}
```

**Best practices for staticCache**:
- Use descriptive cache keys with connector name prefix (e.g., `hubspot_properties_contacts`)
- Include relevant identifiers in the key (e.g., user ID, folder ID) to avoid cache collisions
- Use TTL between 10-60 minutes depending on how frequently the data changes
- Combine with `context.lock()` when the fetch operation is expensive (see locking section below)

**Example with lock** (from hubspot/commons.js):
```javascript
async getObjectProperties(context, objectType) {
    const cacheKey = `hubspot_properties_${objectType}`;
    let lock;
    try {
        lock = await context.lock(cacheKey);
        const cached = await context.staticCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch data from API
        const { data } = await context.httpRequest({ /* ... */ });

        // Cache with 1 minute TTL
        await context.staticCache.set(cacheKey, data, 60 * 1000);
        return data;
    } finally {
        await lock?.unlock();
    }
}
```

**Why staticCache is preferred over state-based caching**: `staticCache` provides built-in TTL support, handles expiration automatically, and is shared across component instances. State-based caching requires manual timestamp tracking and persists in the database unnecessarily.

#### Locking for Long-Running Tick Operations

When a `tick()` function may take a long time to execute (e.g., fetching nested folder structures), use a lock to prevent concurrent execution:

```javascript
async tick(context) {
    let lock;
    try {
        lock = await context.lock(context.componentId, {
            ttl: 5 * 60 * 1000, // 5 minute lock TTL
            maxRetryCount: 0    // Don't wait, skip if already running
        });
    } catch (e) {
        // Another tick is already running, skip this one
        return;
    }

    try {
        // ... long-running tick logic
    } finally {
        lock?.unlock();
    }
}
```

**Why locking is important**: The Appmixer engine calls `tick()` at regular intervals (default: 60 seconds). If a tick operation takes longer than the interval, multiple concurrent tick executions can overwhelm external APIs and cause race conditions.

#### Batching Recursive API Calls

When fetching hierarchical data (e.g., recursive folder structures), use batched concurrent requests instead of sequential recursive calls:

```javascript
// ❌ BAD: Sequential recursive calls - slow and can timeout
async function getSubfoldersRecursive(context, folderId, result = []) {
    const { data } = await context.httpRequest({ /* ... */ });
    for (const folder of data.files) {
        result.push(folder.id);
        await getSubfoldersRecursive(context, folder.id, result); // Sequential!
    }
    return result;
}

// ✅ GOOD: Batched breadth-first traversal - faster and more reliable
async function getSubfolders(context, rootFolderId) {
    const allFolderIds = [];
    let foldersToProcess = [rootFolderId];

    while (foldersToProcess.length > 0) {
        // Process in batches of 10 to avoid overwhelming the API
        const batch = foldersToProcess.splice(0, 10);

        const batchResults = await Promise.all(
            batch.map(parentId => context.httpRequest({ /* ... */ }))
        );

        for (const { data } of batchResults) {
            for (const folder of (data.files || [])) {
                allFolderIds.push(folder.id);
                foldersToProcess.push(folder.id);
            }
        }
    }

    return allFolderIds;
}
```

**Why batching is important**: Deep recursive folder structures with hundreds of subfolders can take minutes to traverse sequentially. Batched concurrent requests significantly reduce total execution time and are less likely to timeout.
    
### Common Patterns

#### When Adding New Field to component.json

> Use-case: "I want to add a new number field `itemCount` to the `MyAwesomeComponent` component."

- Add the field to both `schema` and `inspector` sections in the `inPorts` array. Follow JSON schema format.
- Add the fields to behavior JS file, especially in `context.httpRequest` call.

#### Dynamic Field Options

Use `source` property to populate field options dynamically:

```json
{
    "inspector": {
        "inputs": {
            "projectId": {
                "type": "select",
                "source": {
                    "url": "/component/appmixer/service/core/ListProjects?outPort=out",
                    "data": {
                        "transform": "./transformers#projectsToOptions"
                    }
                }
            }
        }
    }
}
```

#### File Handling

##### file input components

```json
{
    "schema": {
        "properties": {
            "file": {
                "type": "string",
                "format": "data-url",
                "title": "File"
            }
        }
    },
    "inspector": {
        "inputs": {
            "file": {
                "type": "filepicker",
                "index": 1
            }
        }
    }
}
```

##### file output components
- use `context.saveFileStream()` in behavior JS
- must return `fileId` in output message
- should return additional info like `fileSize`, `prompt`, etc. — define these as fields in the `outPorts.schema.properties` (JSON Schema), each with a realistic `example`. See `05-component-config.md` § "Output Port Examples" for the canonical pattern.

Examples:

```javascript
const filename = `generated-image-${(new Date).toISOString()}.png`;
const file = await context.saveFileStream(filename, readStream);
return context.sendJson({ fileId: file.fileId, prompt, size }, 'out');
```
```javascript
const outFilename = filename || `${Date.now()}_elevenlabs_soundeffect`;
const file = await context.saveFileStream(outFilename, data);

return context.sendJson({ fileId: file.fileId, input: text, fileSize: file.length }, 'out');
```

---

# Testing Guidelines

### Unit Tests

- Use `mocha` for unit tests
- Place tests in `src/<vendor>/<connector_name>/artifacts/test/` directory (colocated with connector source)
- Use `assert` from Node.js for assertions
- Name test files with `.test.js` extension (e.g., `AIAgent.test.js`)

When working on a single connector, run its tests with mocha directly:

```bash
npx mocha src/<vendor>/<connector_name>/artifacts/test/*.test.js
```

(Workspaces may ship their own test runner script — e.g. the appmixer-connectors
repo's `npm run test-unit` discovers all `artifacts/test/` files — but plain
mocha works everywhere.)

### End-to-End (E2E) Test Flows

E2E test flows are automated workflow tests stored as `test-flow*.json` files in the connector's root directory (`src/<vendor>/<connector_name>/`). These flows test the complete integration by executing components in a realistic sequence.

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
            "x": 64,
            "y": 16,
            "source": {},
            "version": "1.0.0",
            "config": {}
        },
        "component-id-2": {
            "type": "appmixer.connector.core.ComponentName",
            "x": 256,
            "y": 16,
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

#### Component Layout Rules (IMPORTANT)

For clean, readable flows without crossing lines or cycles, follow these spacing rules strictly:

**Rule 1: Linear Sequence (A → B)**
When component A connects to component B in sequence:
```
B.x = A.x + 192   (horizontal spacing: 192px)
B.y = A.y         (same vertical level)
```

**Rule 2: Branching (A → B, A → C)**
When component A branches to two components (B and C):
```
B.x = A.x + 192   (horizontal spacing: 192px)
B.y = A.y         (same vertical level as A)

C.x = B.x         (SAME x as B! Vertical alignment)
C.y = A.y + 128   (vertical spacing: 128px below A)
```

**Example - Linear Flow**:
```
OnStart (64, 16) → SetVariable (256, 16) → Create (448, 16) → Assert (640, 16)
                   64+192=256              256+192=448          448+192=640
```

**Example - Branching Flow**:
```
Create (448, 16) 
  ├→ Assert rawJson (640, 16)      [B: x=448+192, y=16]
  └→ Delete (640, 144)             [C: x=640 (same as B), y=16+128]
       └→ Create fields (832, 144) [linear: 640+192]
            └→ Assert fields (1024, 144)
                 └→ Delete fields (1024, 272) [C: x=1024 (same as Assert), y=144+128]
```

**Constants**:
- `deltaX = 192px` - horizontal spacing between sequential components
- `deltaY = 128px` - vertical spacing for branching

**Start Position**:
- First component: `x = 64, y = 16`

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
    - **Layout rule**: When a Create/Get component branches, Assert goes HORIZONTALLY (x + 192px, same y), while Delete goes VERTICALLY below (same x, y + 128px)
    - Each Assert MUST be connected to AfterAll to report test results

5. **AfterAll** (`appmixer.utils.test.AfterAll`)
    - Aggregation point that receives outputs from all test and deletion components
    - Critical for proper flow termination and cleanup
    - **Connection rule**: AfterAll should receive inputs from **the final Delete component** and **all Assert components** in the flow
    - Should include timeout property (e.g., 120 seconds for complex operations)
    - Position: `x = final_component.x + 192, y = last_row.y` (continues the sequence)
    - **Key**: AfterAll validates all assertions passed before cleanup operations run

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
- **Delete component placement**: Delete components should be placed DIRECTLY BELOW their corresponding Assert component (same x position, y + 128px) to maintain clean visual layout and avoid crossing connection lines.
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

See [`examples/e2e-test-flow.json`](examples/e2e-test-flow.json).

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
    - Name: `src/<vendor>/<connector>/test-flow-<feature>.json`
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
    - ❌ `$.component.out` — Raw Output, forbidden. Always include a field name.
    - ❌ `$.component.out.items.0.id` — `.N.` array indexing does not work in variable paths.
    - ✅ `$.component-id.out.fieldName`
    - ✅ For array items use modifier functions: `g_jsonPath` with param `"$[0].id"` on `$.component.out.items`, or `g_first` / `g_last` for simple first/last element. See **Modifier Functions** section above.

3b. **Deep Paths Past the Static outPort Contract**
    - ❌ `$.make-api-call.out.response.opportunityid` — works at runtime, but MakeApiCall statically declares only `response`/`status`/`statusText`, so the designer's variable picker cannot offer the deep path and renders a red invalid-variable chip (validation error).
    - ✅ Reference the deepest DECLARED path and extract the leaf with a modifier: `"variable": "$.make-api-call.out.response"` + `"functions": [{ "name": "g_jsonPath", "params": [{ "value": "$.opportunityid" }] }]` (note: `params`, not `args`).
    - ✅ Dynamic outPorts (options generated by a live `source` call, e.g. polling triggers) DO offer entity leaf fields — reference those directly (`$.trigger.out.contactid`).

3c. **Arrays/Objects in String-Typed Inputs**
    - ❌ `"headers": [{ "key": "Prefer", "value": "return=representation" }]` — key-value inspector inputs (MakeApiCall `headers`/`parameters`) declare `"type": "string"`; a raw array works at runtime but fails the designer's schema validation with a red "must be string" chip.
    - ✅ Serialize as a JSON string: `"headers": "[{\"key\": \"Prefer\", \"value\": \"return=representation\"}]"`.

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

---

# Trigger `test(context)` Method

How to add a `test(context)` method to **trigger** components so the designer's Flow Test Mode
can produce a representative output **without** starting the flow and **without** waiting
for a real event.

## What `test()` is

When a flow is run in **Test Mode** with no explicit `payload`/`inputData`, the trigger's
`start()`/`stop()`/`tick()` are **skipped**. The engine resolves test data via a fallback chain:

1. the component's `test(context)` method — **this method**, called first
2. a search of recent run logs for an output from this component/flow
3. deterministic samples generated from the outPort JSON Schema
4. empty `receive()` / error

Steps 2–3 are weak: logs exist only after a production run, and schema samples produce
synthetic IDs (`"sample"`, `0`) that downstream API components reject on the first hop.
So `test()` is what makes Test Mode actually useful.

Key facts about how the engine calls it:
- The context is created from the component (with an **empty message**), so it carries the
  component's config — **`context.auth` and `context.properties` are fully available**.
- **`context.state` is empty** — the flow was never started, so no `tick()` has ever saved a
  cursor. `test()` must not rely on reading state (and must not write it, see Hard rules).
- `test()` runs inside a `try/catch`. If it **throws**, the error is logged and the chain
  falls through to the log/schema fallbacks. **Throw on "no example available" — never
  return null, send nothing, or fabricate fake data** (see Hard rule 5).

## Where `test()` lives

`test()` is just another exported method in the trigger's behavior file, next to
`tick()`/`receive()`. **No `component.json` change is needed** — the engine detects the method
automatically:

```javascript
'use strict';

module.exports = {

    async tick(context) { /* production polling logic */ },

    async test(context) { /* one read-only fetch + sendJson, see below */ }
};
```

## Core principle: `test()` and `tick()`/`receive()` must share code

This is the most important rule and the reason this guide exists. `test()` only has value if
its output is **byte-for-byte the same shape** as what the trigger emits in production. The way
to guarantee that — and to keep it true as the connector evolves — is to make `test()` and
`tick()`/`receive()` **call the same functions**, not re-implement the same logic side by side.

**Maximize shared code. `test()` should be a thin wrapper, not a parallel implementation.**

Factor the production path into helpers that both entry points reuse:
- **the upstream request** (URL, auth, headers, query building, pagination parsing), and
- **the record→output mapping** (`fields` object).

Ideally `test()` adds only: a different query (newest-first, single item), a "take the first
record" line, and a `throw` when empty. Everything else flows through the shared helpers.

❌ **Anti-pattern**: `test()` re-declares the base URL, auth config, query param logic and the
HTTP call, duplicating `tick()`. The two **will** drift — someone fixes a header or a mapped
field in `tick()` and forgets `test()`, and the test silently emits a stale/wrong shape.

✅ **Pattern:** one `requestX(context, query, opts)` helper does the fetch + map and returns
mapped records (+ next page); `tick()` loops/dedups/saves state around it, `test()` calls it
once with a newest-first query and emits `records[0]`.

Use the built-in **`context.httpRequest`** for the HTTP call (axios-compatible options/response:
`{ method, url, params, data, headers }` → `{ data, status, headers }`). It needs no extra
dependency in your connector's `package.json` and goes through the platform's HTTP stack.

```javascript
// shared by BOTH tick() and test() — request shape + mapping live in one place
async function requestTickets(context, urlOrParams, normalizedEmbed) {
    const { auth } = context;
    const url = typeof urlOrParams === 'string'
        ? urlOrParams
        : `https://${auth.domain}.example.com/api/v2/tickets?${urlOrParams.toString()}`;
    const credentials = Buffer.from(`${auth.apiKey}:X`).toString('base64');
    const res = await context.httpRequest({
        url, headers: { Authorization: `Basic ${credentials}` }
    });
    const records = (res.data || []).map(t => mapTicket(t, normalizedEmbed));
    const match = (res.headers.link || '').match(/<([^>]+)>;\s*rel="next"/);
    return { records, nextUrl: match ? match[1] : null };
}
```

If the connector already exposes a polling helper (`lib.listNewMessages`, etc.), reuse it
directly with empty state instead of writing a new request. Only extract a new helper when the
logic is inlined in `tick()`/`receive()`.

**SDK-based connectors.** Some connectors don't issue raw HTTP at all — they call a vendor SDK
(`asana`, `@slack/web-api`, `googleapis`, …) that builds the request *and* maps the response.
There's then no URL/auth/query/mapping to extract: **the SDK call itself is the shared seam.**
`test()` must call the **exact same SDK methods** `tick()`/`receive()` uses (e.g. the same
`list` + `findById` pair) so the emitted object is identical — the server does the mapping. The
only new code is usually a tiny "pick the newest record" selector. Don't wrap the SDK in a new
`context.httpRequest` helper just to satisfy the "share a helper" rule; reusing the same SDK
methods already satisfies it. See `src/appmixer/asana` (`asana-commons.pickLatest()` + each
trigger's `test()`).

## Hard rules

1. **Read-only against upstream.** Only `GET`/list. No `POST`/`PUT`/`PATCH`/`DELETE`, no
   `markAsRead`, `acknowledge`, `commit`, or anything that mutates remote state.
2. **No state writes — any scope.** Do NOT call `context.saveState`/`stateSet`/`stateUnset`/
   `stateClear`/`stateInc`/`stateAddToSet`/`stateRemoveFromSet`, nor the `context.flow.*` or
   `context.service.*` variants. Test Mode keeps the flow `stopped` and runs no shutdown
   cleanup, so any write leaks (component state lingers — worse for `"state": {"persistent": true}`
   triggers; service state leaks into other users' production runs). Use local variables for
   any dedup/cursor logic. When reusing a polling helper that takes state, pass `{ known: [] }`
   or `{ cursor: null }` so it returns the freshest item.
3. **Respect `context.properties`.** If the trigger filters (query, channelId, …), `test()`
   must return an item matching the same filters, or the test is misleading.
4. **Emit exactly one item** via `context.sendJson(item, '<port>')`, shaped **identically** to
   what `tick()`/`receive()` emits. Never use `sendArray`/`sendArrayOutput`.
5. **Throw, don't fabricate, when there's no real example.** Two cases: (a) the inbox/channel is
   empty right now, or (b) — more fundamental — the trigger is webhook-only and the upstream
   exposes **no API to fetch a representative sample** (e.g. WhatsApp received messages / status
   updates). In both, `throw new context.CancelError('<why + how to trigger it for real>')`.
   **Never hand-craft synthetic data** — fake IDs, phone numbers, `wamid.TEST…`, canned message
   bodies. It makes the test pass while testing nothing and emits data that matches no real run,
   which is worse than no `test()` at all. (Only exception: Group E timer triggers, whose payload
   is legitimately *computed* — real dates — not invented.)
6. **No quota abuse.** Reuse the same lib helpers `tick()` uses so the call goes through the
   same quota manager and rate limiter.

## Procedure

1. **Confirm it's a trigger.** `component.json` has `properties` (not `inPorts`) and the
   behavior file has `tick()` or `start()/receive()/stop()`. Actions are out of scope (they
   are tested via `inputData` → `receive()`).
2. **Find the outPort name** in `component.json` `outPorts[].name` (e.g. freshdesk → `ticket`,
   slack → `message`). `sendJson` must use this exact name.
3. **Refactor the production path into shared helpers FIRST** (see Core principle). Read
   `tick()`/`receive()` and pull out (a) the upstream **request** (URL/auth/query/pagination)
   and (b) the record→`fields` **mapping** into functions, then make `tick()`/`receive()` call
   them. Do this even if it means touching working code — the shared seam is the whole point.
   If a connector polling helper already exists, skip this and reuse it.
4. **Verify `tick()`/`receive()` still behaves identically** after the refactor (lint + the
   existing tests/E2E). `test()` is worthless if the refactor changed production output.
5. **Write `async test(context)` as a thin wrapper:** resolve properties with the same helper,
   call the shared request with a **newest-first, single-item** query (`per_page=1`/`limit=1`,
   `order_by=<created>` `desc`) honoring `context.properties` filters, then `sendJson(records[0],
   '<port>')`. **No cursor, no `saveState`.** `throw` if empty.
   - **Branching triggers.** If `tick()`/`receive()` takes a different code path depending on a
     property (e.g. `TaskCompleted`: a single-item lookup when `task` is set vs a project-wide
     scan when it isn't), `test()` must **mirror the same branch selection** so its output
     matches whichever path production would take for that config — don't collapse the branches
     into one.
6. **Verify** (see "Verifying your test() method" below): run lint/validate, then invoke
   `test()` either via the CLI `--test` flag or via Flow Test Mode on a live instance.

## Verifying your `test()` method

Run the workspace's lint/validators first when it provides them (the
appmixer-connectors repo ships `npm run lint` + `npm run validate`). Then verify the method actually emits a realistic item. Two options:

**Option 1 — Appmixer CLI** (requires a CLI version that supports the `--test` flag; check with
`appmixer test component --help`):

```bash
# one-time: store auth credentials for the connector
appmixer test auth login ./src/<vendor>/<connector>/auth.js

# invoke test() directly (skips start/stop/tick/receive, exactly like Flow Test Mode)
appmixer test component ./src/<vendor>/<connector>/<path-to-trigger> --test
```

Without stored auth data the CLI fails before `test()` is even called.

**Option 2 — live instance** (works with any CLI version): pack & publish the connector
(`appmixer pack` + `appmixer publish`), build a small flow with the trigger connected to a
downstream component, and run **Test** in the designer without starting the flow. The trigger's
output in the test run should show a real, fetchable item (not `"sample"` / `0` placeholders —
those mean the engine fell back to schema samples because `test()` threw or is missing).

## Trigger groups

| Group | Description | `test()` approach |
|-------|-------------|-------------------|
| **A** Polling list+dedup | `tick()` lists latest, dedups vs state (e.g. `freshdesk.NewTicket`, `gmail.NewEmail`, `github.NewIssue`, `wordpress.*`, `asana.*`) | Reuse the same fetch+map path, queried newest-first (`desc` + `limit 1`), emit first item. ⚠️ If the polling helper has a baseline/init phase that suppresses first-run output (e.g. gmail), don't call it with empty state — add a small `fetchLatest` helper that shares the mapping. For SDK-based connectors (`asana`) reuse the same SDK `list`+`findById` calls — the SDK is the shared seam (see "SDK-based connectors" above). |
| **B** Per-flow webhook | `start()` registers a per-flow webhook (e.g. `calendly`, `shopify`, `xero`, `hubspot`, `microsoft.mail`) | Do NOT register. Add a shared `lib.fetchLatestExample(context, type, properties)` once per connector, fetch newest record via REST, reshape into the webhook payload. |
| **C** Plugin-based (global URL + `addListener`) | app-level webhook, `plugin.js`/`routes.js` fan out (e.g. `slack`, `whatsapp`, `meta.*`) | Skip `addListener`, fetch one recent matching event via REST, return it in the exact shape `routes.js` puts on the wire. **If the upstream has no API to fetch such an event** (e.g. WhatsApp received messages / message-status updates), do NOT fabricate one — `throw new context.CancelError(...)` explaining it can only be triggered by a real event (see Hard rule 5). |
| **D** Generic webhook (`utils.http.Webhook*`) | no schema/upstream | **Do not implement.** Rely on log search or user-provided `payload`; document in the description. |
| **E** Scheduler/timer (`utils.timers.SchedulerTrigger`) | no external API | Return a synthetic well-formed payload (current/next dates). |
| **F** Form (`utils.forms.FormTrigger`) | dynamic schema from `properties.fields.ADD` | Walk fields, synthesize a plausible value per `field.type`. |

### Group A example (canonical — `freshdesk.NewTicket`)

The shared pieces live in the connector's `lib.js` so every component issues requests the same
way: `apiCall()` (auth + base URL on top of `context.httpRequest`), `mapTicket()` (raw ticket →
output `fields`) and `requestTickets()` (one page: fetch + map + pagination parsing). `tick()`
and `test()` both go through `requestTickets()`; `test()` adds only the newest-first query and
`records[0]`. See `src/appmixer/freshdesk/lib.js` + `tickets/NewTicket/NewTicket.js`.

```javascript
// lib.js — single source of truth for request shape, mapping and pagination
async function apiCall(context, { method = 'GET', url, params, data, headers = {} } = {}) {
    const baseUrl = `https://${context.auth.domain}.freshdesk.com/api/v2`;
    const credentials = Buffer.from(`${context.auth.apiKey}:X`).toString('base64');
    return context.httpRequest({
        method,
        url: /^https?:\/\//.test(url) ? url : `${baseUrl}${url}`,
        headers: { Authorization: `Basic ${credentials}`, ...headers },
        params, data
    });
}

async function requestTickets(context, urlOrParams, normalizedEmbed = []) {
    const url = typeof urlOrParams === 'string' ? urlOrParams : `/tickets?${urlOrParams.toString()}`;
    const res = await apiCall(context, { url });
    const records = (res.data || []).map(ticket => mapTicket(ticket, normalizedEmbed));
    const match = (res.headers.link || '').match(/<([^>]+)>;\s*rel="next"/);
    return { records, nextUrl: match ? match[1] : null };
}

// NewTicket.js
async test(context) {
    const normalizedEmbed = getNormalizedEmbed(context);

    const params = new URLSearchParams({
        order_by: 'created_at', order_type: 'desc', per_page: '1'
    });
    if (normalizedEmbed.length > 0) {
        params.set('include', normalizedEmbed.join(','));
    }

    const { records } = await requestTickets(context, params, normalizedEmbed);
    if (!records.length) {
        throw new Error('No recent tickets to use as test data.');
    }
    return context.sendJson(records[0], 'ticket');
}
```

### Group B example (`calendly.events.InviteeCreated`)

The production `receive()` just forwards the webhook body, so there's no fetch+map to share with
it — instead the reuse is **across the connector's webhook triggers**. Add `fetchLatestExample()`
+ `toWebhookShape()` to the connector's shared `lib.js` once (older connectors use a
`*-commons.js` file — for NEW code always use `lib.js`, the repository convention);
each trigger's `test()` is a thin wrapper.
See `src/appmixer/calendly/calendly-commons.js` + `events/InviteeCreated/InviteeCreated.js`.

```javascript
// calendly-commons.js — shared by every Calendly webhook trigger's test()
async fetchLatestExample(context) {
    const { accessToken, profileInfo: { resource } } = context.auth;
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    const events = await context.httpRequest({
        method: 'GET', url: 'https://api.calendly.com/scheduled_events', headers,
        params: { user: resource.uri, sort: 'start_time:desc', count: 1 }
    });
    const event = (events.data.collection || [])[0];
    if (!event) return null;
    const invitees = await context.httpRequest({
        method: 'GET', url: `${event.uri}/invitees`, headers, params: { count: 1 }
    });
    return (invitees.data.collection || [])[0] || null;
}
// toWebhookShape(context, invitee, 'invitee.created') -> the exact body the webhook delivers

// InviteeCreated.js
async test(context) {
    const invitee = await commons.fetchLatestExample(context);
    if (!invitee) throw new Error('No recent invitees to use as test data.');
    return context.sendJson(commons.toWebhookShape(context, invitee, 'invitee.created'), 'out');
}
```

### Group C example (`slack.list.NewChannelMessageRT`)

Plugin trigger: events normally arrive via `context.addListener`. `test()` skips that and reuses
the **same `conversations.history` call the polling `slack.list.NewChannelMessage` trigger uses**,
honoring the same `ignoreBotMessages` filter as `receive()`.
See `src/appmixer/slack/list/NewChannelMessageRT/NewChannelMessageRT.js`.

```javascript
const { WebClient } = require('@slack/web-api');
const Entities = require('html-entities').AllHtmlEntities;

async test(context) {
    const { channelId, ignoreBotMessages } = context.properties;
    const web = new WebClient(context.auth.accessToken);
    const { messages } = await web.conversations.history({ channel: channelId, limit: 1 });
    const sample = (messages || [])[0];
    if (!sample) throw new Error('No recent messages in the channel to use as test data.');
    if (ignoreBotMessages && sample.subtype === 'bot_message') {
        throw new Error('The most recent message is a bot message.');
    }
    sample.text = new Entities().decode(sample.text);
    return context.sendJson(sample, 'message');
}
```

### Group E example (`utils.timers.SchedulerTrigger`)

No external API — `test()` returns a synthetic but well-formed payload. The key is still code
sharing: the schedule computation (`getNextRun()`) is the same function `start()`/`receive()`
use, so the emitted dates respect the user's configured schedule, timezone and end date.
See `src/appmixer/utils/timers/SchedulerTrigger/SchedulerTrigger.js`.

```javascript
async test(context) {
    const { timezone = 'GMT' } = context.properties;
    if (timezone && !isValidTimezone(timezone)) {
        throw new context.CancelError('Invalid timezone');
    }

    const now = moment().toISOString();
    // Same computation start()/receive() use — no timeout set, no state touched.
    const nextDate = this.getNextRun(context, { now, previousDate: null, firstTime: true });
    if (!nextDate) {
        throw new Error('No next run within the configured schedule (end date reached).');
    }

    return context.sendJson({
        previousDate: null,
        nextDateGMT: nextDate.toISOString(),
        nextDateLocal: moment(nextDate).tz(timezone).format('YYYY-MM-DDTHH:mm:ss.SSS'),
        timezone
    }, 'out');
}
```

### Group F example (`utils.forms.FormTrigger`)

The output schema is dynamic (defined by `context.properties.fields.ADD`), so `test()` walks the
configured fields and synthesizes a plausible value per `field.type`. Match what a real
submission produces: HTML forms submit **strings** (only checkbox is normalized to a boolean by
`receive()`), and prefer the field's configured `defaultValue` for realism.
See `src/appmixer/utils/forms/FormTrigger/FormTrigger.js`.

```javascript
test(context) {
    const fields = (context.properties.fields && context.properties.fields.ADD) || [];
    if (!fields.length) {
        throw new Error('No form fields defined.');
    }

    const entry = {};
    fields.forEach((field, index) => {
        const name = 'field_' + index;
        if (field.type === 'checkbox') {
            entry[name] = true;
            return;
        }
        if (field.defaultValue) {
            entry[name] = field.defaultValue;
            return;
        }
        switch (field.type) {
            case 'number': entry[name] = '42'; break;
            case 'date': entry[name] = '2026-01-01'; break;
            case 'email': entry[name] = 'user@example.com'; break;
            case 'color': entry[name] = '#336699'; break;
            case 'password': entry[name] = 'secret'; break;
            default: entry[name] = field.label || 'Sample text';
        }
    });

    return context.sendJson(entry, 'entry');
}
```

## Per-trigger checklist

- [ ] **`test()` shares the request + mapping path with `tick()`/`receive()`** — no duplicated
      URL/auth/query/mapping. `test()` is a thin wrapper; the production path was refactored into
      shared helpers and still behaves identically.
- [ ] No state writes (component / flow / service), no upstream mutations
- [ ] Honors `context.properties` filters
- [ ] Emits exactly one item, shape matches `tick()`/`receive()` exactly, correct port name
- [ ] Throws (not returns null) when no example exists
- [ ] Workspace lint/validators pass (when provided), and `test()` verified via CLI `--test` or
      Flow Test Mode on a live instance (see "Verifying your test() method")

## Reference connectors

Worked examples across the groups:

**Group A — polling list+dedup:**
- **`freshdesk.NewTicket`** (`src/appmixer/freshdesk/tickets/NewTicket/`) — *extract from inlined
  logic.* `tick()` had the request + mapping inlined, so they were pulled into `lib.requestTickets()`
  + `lib.mapTicket()` and now `tick()` and `test()` both call them. Also has **dynamic** outPorts
  (via `GenerateTicketsOutput`), so the schema fallback is weak and `test()` carries real value.
  The sibling triggers `UpdatedTicket` (cursor on `updated_at`) and `DeletedTicket`
  (`filter=deleted`, own mapping) follow the same shape; `NewConversation` shares
  fetch/filter/emit helpers between `tick()` and `test()`.
- **`google.gmail.NewEmail`** (`src/appmixer/google/gmail/NewEmail/` + `../lib.js`) — *reuse an
  existing lib helper.* The per-message fetch+normalize was factored into `lib.fetchMessage()`
  (reused by both `listNewMessages()` and a new `lib.fetchLatestExample()`); `test()` is a 4-line
  wrapper. Note the gotcha: `listNewMessages()` suppresses output on first run (baseline-only
  init phase), so `test()` could **not** just call it with empty state — it needed the dedicated
  `fetchLatestExample()` that lists newest-first and honors `query`. Watch for this whenever the
  polling helper has init/baseline semantics.
- **`asana.*`** (`src/appmixer/asana/` — `NewTask`, `NewSubtask`, `NewStory`, `NewComment`,
  `NewTag`, `TagAdded`, `TaskCompleted`, `NewProject`, `NewTeam`) — *SDK-based, no HTTP helper.*
  Every `tick()` lists via the `asana` SDK, dedups vs state, then re-fetches each hit with
  `<resource>.findById(gid)` and emits that. `test()` calls the **same** list + `findById`, so
  the shape is identical; the one shared addition is `asana-commons.pickLatest()` (newest by
  `created_at`/`gid`). `NewComment` keeps the `type === 'comment'` filter; `TagAdded` reads the
  task's `tags`; `TaskCompleted` mirrors both of `tick()`'s branches (single `task` vs
  project-wide scan) — a worked example of the branching-trigger rule.

**Group B — per-flow webhook:**
- **`calendly.events.InviteeCreated`** (`src/appmixer/calendly/events/InviteeCreated/` +
  `../../calendly-commons.js`) — `receive()` only forwards the webhook body, so the reuse is
  *across the connector's webhook triggers*: `fetchLatestExample()` (REST, newest invitee) +
  `toWebhookShape()` live in commons; `test()` is a thin wrapper that reshapes the REST record
  into the exact body the webhook delivers.

**Group C — plugin-based (global URL + `addListener`):**
- **`slack.list.NewChannelMessageRT`** (`src/appmixer/slack/list/NewChannelMessageRT/`) — `test()`
  skips `addListener` and reuses the same `conversations.history` call the polling
  `slack.list.NewChannelMessage` trigger uses, honoring the same `ignoreBotMessages` filter as
  `receive()`.

**Group E — scheduler/timer:**
- **`utils.timers.SchedulerTrigger`** (`src/appmixer/utils/timers/SchedulerTrigger/`) — `test()`
  reuses the same `getNextRun()` computation as `start()`/`receive()` and emits the next-run
  payload without setting any timeout or touching state.

**Group F — form (dynamic schema):**
- **`utils.forms.FormTrigger`** (`src/appmixer/utils/forms/FormTrigger/`) — `test()` synthesizes
  one entry from `properties.fields.ADD`, matching the exact shape a real POST submission
  produces (`field_<index>` keys, string values, checkbox → boolean, `defaultValue` preferred).
