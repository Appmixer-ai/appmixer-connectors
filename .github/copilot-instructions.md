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
            "description": "SVG icon of the application, as a data:image/svg+xml URI"
        }
    }
}
```

### Icons must be SVG

`service.json` and every `component.json` carry an `icon` as a
`data:image/svg+xml;base64,…` URI. A PNG or JPEG data URI fails the
`component-icon-svg` validator — it is not a style preference, it is a gate.

When the brand only publishes raster art, trace it instead of shipping the
raster or drawing an approximation by hand:

```bash
# 1. split the image into masks: the background, and the glyph inside it
#    (flood-fill from the border to find "outside", glyph = inside AND light)
# 2. trace each mask
potrace -s -o glyph.svg --flat -O 0.4 glyph.pbm
# 3. compose: background path/rect + glyph path, viewBox matching the source
```

**Verify numerically, never by eye** — render the SVG, threshold both images and
compare: mismatch ratio and bounding box. Eyeballing a side-by-side whose panels
sit on different backgrounds reliably produces false "it is distorted" calls.
A good trace lands near 0.1 % mismatched pixels with an identical bounding box.
On macOS `qlmanage -t -s <size> -o <dir> icon.svg` renders faithfully;
ImageMagick's built-in SVG renderer does not.

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

> **Not every webhook component is a trigger.** An *action* that starts a
> long-running provider job can also carry `"webhook": true` and hand the
> provider `context.getWebhookUrl()`, so the result comes back to the very
> component that submitted the job (ports: `out` = job id, `done` = result).
> That is the **self-callback** pattern — see `14-async-components.md`. Do NOT
> use `tick()` to deliver a job's result: a tick emit has no message scope and
> cannot continue the branch that started the job.

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

E2E test flows are automated workflow tests stored as `test-flow-*.json` files in the connector's `artifacts/test-flows/` directory (`src/<vendor>/<connector_name>/artifacts/test-flows/`). These flows test the complete integration by executing components in a realistic sequence.

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

**Component IDs MUST be freshly generated UUIDs** (`crypto.randomUUID()`) —
never readable slugs like `create-task`. The engine resolves OAuth scopes via a
global componentId lookup that ignores the flow id, so readable ids reused
across flows bind accounts to the wrong flow (see `11-e2e-flow-generation.md`,
rule 0b; enforced by the `component-id-uuid` validator). The JSON snippets in
THIS document use short readable ids purely for legibility — do not copy them
into real flows.

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

For clean, readable flows without crossing lines or cycles, lay flows out as a
**left→right staircase** (checked, as warnings, by the `layout` validator —
same rules as `11-e2e-flow-generation.md` rule 14):

**Grid minimums**:
- `MIN_DX = 208px` — horizontal gap between connected components
- `MIN_DY = 128px` — vertical gap between rows
- First component: `x = 64, y = 16`

**Rule 1: Linear Sequence (A → B)**
```
B.x = A.x + 208   (horizontal spacing)
B.y = A.y         (same row)
```

**Rule 2: Staircase (one row per tested component)** — a tested component and
**its** Assert share the same `y` (the Assert sits at `x + 208`); the NEXT
tested component steps down to `y + 128` (and right), so each
component→Assert pair gets its own row. Connected components either share a
row (Δy = 0) or are ≥ 128 apart — never backward or overlapping edges.

**Example (staircase)**:
```
OnStart (64, 16) → Create (272, 16)
Get (480, 144) → Assert (688, 144)
AfterAll (896, 144) → Delete cleanup (1104, 144) → ProcessE2EResults (1312, 144)
```
AfterAll → cleanup (Delete) → ProcessE2EResults continue to the right after
the last Assert (see Required Components below).

#### Required Components

Every E2E test flow MUST include these components in sequence — and **every
component in the flow MUST carry fail-fast error handling**:
`"errorHandling": { "autoRetry": false, "onError": "stopFlow" }` (see
`11-e2e-flow-generation.md` rule 0; enforced by the `error-handling`
validator).

1. **OnStart** (`appmixer.utils.controls.OnStart`)
    - Triggers the flow execution
    - First component in the flow
    - No configuration needed

2. **Your Components Under Test**
    - The actual connector components being tested
    - Should test main CRUD operations (Create, Read, Update, Delete)
    - Chain components to test realistic workflows

3. **Assert Components** (`appmixer.utils.test.Assert`)
    - Validate component outputs
    - Supported assertions: `equal`, `notEmpty`, `regex`
    - Multiple assertions can be used throughout the flow
    - **Layout rule**: a tested component and its Assert share the same row
      (Assert at x + 208); the next tested component starts a new row (see
      Layout Rules above)
    - Each Assert MUST be connected to AfterAll to report test results

4. **AfterAll** (`appmixer.utils.test.AfterAll`)
    - Aggregation point that receives the outputs of **ALL Assert components**
      in the flow
    - Critical for proper flow termination and cleanup
    - **Connection rule**: every Assert feeds AfterAll; **cleanup (Delete)
      components come AFTER AfterAll** (AfterAll → cleanup →
      ProcessE2EResults), so cleanup runs once all assertions have reported
    - Should include a `timeout` property (e.g. 180 seconds; use 420–600 for
      trigger flows waiting on webhooks or manual steps — see
      `11-e2e-flow-generation.md` rule 18)
    - Position: `x = last_assert.x + 208, y = last_row.y` (continues the sequence)

5. **ProcessE2EResults** (`appmixer.utils.test.ProcessE2EResults`)
    - Final component that processes test results
    - REQUIRED for all E2E test flows
    - Connected after the cleanup components (or directly after AfterAll when
      the flow creates nothing to clean up)
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
- **Search/Find race conditions**: Many APIs have eventual consistency. A record created 1 second ago may not appear in search results. Best approach: search for a pre-existing test record instead of a just-created one. Alternative: insert `appmixer.utils.timers.Wait` with `interval: "1m"` (minimum unit is minutes) — CodeBlock CANNOT delay: it runs synchronously in isolated-vm (`evalSync`), `await`/`setTimeout`/Promises error out.
- **Cross-component variable references**: When referencing variables from indirect upstream components (2+ hops), prefer direct upstream references. E.g. use `$.find-items.out.id` instead of `$.create-item.out.id` when the update is triggered by find.

#### Provider Latency Is a Design Input

Before authoring a flow around a polling trigger, **measure how long the
provider takes to make a new record visible**, and size the `AfterAll` timeout
from that. Do not assume "a few seconds".

Real case: Deepgram's request log lags **12–17 minutes** — records created at
13:39 were absent at 13:50 and present at 13:56, and a job's detail endpoint
answers `200` with an empty body immediately after the submit. Every trigger
flow authored with a 420 s window was structurally unable to pass, no matter
what the component code did.

When the window is long, the runner needs a matching one:

```bash
AGENT_TIMEOUT_MS=3600000 appmixer e2e run <flowId> --fix --timeout 1700
```

(Budget the overall `AGENT_TIMEOUT_MS` for TWO windows plus overhead — a clean
timeout on a trigger flow triggers one deterministic re-run, and a budget that
only covers one window kills the runner mid-retry; see `13-e2e-run.md`.)

If a component can get its result via a callback instead (see
`14-async-components.md`), that lag disappears — 4 seconds instead of 17 minutes
— and it is worth changing the component rather than nursing the timeouts.

#### Provoking Failure States

A trigger that watches a **failure** (failed job, rejected request, bounced
message) needs a provocation the provider **accepts** and then fails. Verify
that at design time.

Real case: the Deepgram Failed Request flow submitted an unreachable audio URL.
The provider fetches that URL while handling the submit and rejects the whole
call synchronously (`415`), so the component throws, the flow stops on first
error the way E2E flows must, and the trigger never sees anything — and a
rejected submit is not logged as a failed request either. The flow could never
pass.

If no deterministic provocation exists, do not ship a flow that cannot pass.
Remove it, cover the component with review plus its `test()` method, and write
down why in `artifacts/test-flows/README.md` so the next person does not re-add
it.

#### Tenant-Bound Values in Flows

`appmixer e2e import` re-resolves **account** bindings, but nothing else. A
trigger's `config.properties` (e.g. `projectId`, `boardId`, `viewId`) is a plain
string that belongs to whoever's credentials authored the flow. Swap the E2E
account and those flows fail with `404 … cannot be found`.

- Keep the list of tenant-bound properties in `artifacts/test-flows/README.md`.
- Remember that swapping the account also resets the **data** the flows rely on:
  a fresh API key can mean an empty project, so `Find*` components correctly
  return `notFound` and the asserts never fire.

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
    - **Horizontal spacing**: at least **208px** (MIN_DX) between sequentially connected components on the x-axis
    - **Vertical spacing**: at least **128px** (MIN_DY) between parallel rows/branches on the y-axis
    - **Starting position**: OnStart at `x: 64, y: 16`
    - **Diagonal staircase pattern**: When operations branch off sequentially (Create → Get → Update → ...), each subsequent action moves **+208px right** and **+128px down**, forming a diagonal:
      ```
      on-start (64,16) → set-variables (272,16) → create (480,16)
                                                       ↓
                                                   get (688,144)
                                                       ↓
                                                   update (896,272)
                                                       ↓
                                                   get-content (1104,400)
      ```
    - **Assert column**: All Assert components are **right-aligned at a fixed x position** (e.g., `x: 1312`), each at the **same y as its corresponding action**:
      ```
      create (480,16)          →  assert-create (1312,16)
      get (688,144)            →  assert-get (1312,144)
      update (896,272)         →  assert-update (1312,272)
      get-content (1104,400)   →  assert-get-content (1312,400)
      ```
    - **Tail chain (AfterAll → Cleanup → ProcessResults)**: Place on a **horizontal line** at approximately the vertical center of the flow (e.g., `y: 144`), spaced ≥208px apart after the assert column:
      ```
      after-all (1520,144) → delete (1728,144) → process-results (1936,144)
      ```

9. **Naming Conventions**
    - Component IDs are **freshly generated UUIDs** (`crypto.randomUUID()`) —
      never readable slugs (see Component IDs above; `component-id-uuid`
      validator)
    - Name test flow files: `test-flow-<feature>.json` (e.g., `test-flow-crud.json`, `test-flow-list.json`)
    - Use clear, descriptive flow names that indicate what the flow tests

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
    - Name: `src/<vendor>/<connector>/artifacts/test-flows/test-flow-<feature>.json`
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

Good examples to reference (under each connector's `artifacts/test-flows/`):
- `src/appmixer/googleDocs/artifacts/test-flows/` - Document CRUD operations
- `src/appmixer/todoist/artifacts/test-flows/` - Task/project/label workflows
- `src/appmixer/hubspot/artifacts/test-flows/` - CRM operations

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

**Option 1 — Appmixer CLI** (requires version **2.6.0 or newer** — the `--test` flag is
not implemented in 2.3.4 and older; check `appmixer --version` and
`appmixer test component --help`. On older CLIs skip to Option 2, or verify the trigger's
production path by running its real `tick()` loop with a short `-t` period and creating a
matching resource mid-run):

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

---

# E2E Test Flows

Generate E2E test flow JSON files for a connector's components. **You (the agent)
write the flows directly** — there is no separate sub-agent. After writing them
you run a deterministic validator and fix anything it flags, looping until clean.

> **Tooling:** the validator and the canonical flow template ship with the
> `appmixer` CLI (`npm i -g appmixer`, version **>= 2.6.0** — the version-gate
> snippet is in `12-e2e-upload.md` Prerequisites; quick probe:
> `appmixer e2e validate --help`). No other setup is needed.

## How it works

1. **Pick the components** to cover (one trigger or action per flow; default: all
   testable components of the connector).
2. **Read the canonical template**
   [`examples/test-flow-template.json`](examples/test-flow-template.json)
   (shipped next to this document) — copy its structure (OnStart → setup →
   component-under-test → Assert → AfterAll → ProcessE2EResults). It is a
   complete, working example.

   ⚠️ **The template is the ONLY structural source of truth. Do NOT copy patterns
   from other connectors' committed test flows** — many pre-date the current
   rules and still contain deprecated shapes, most notoriously
   `appmixer.utils.test.BeforeAll` (forbidden — the `no-beforeall` validator
   rejects it) and components without `errorHandling`. If a flow you are looking
   at disagrees with the template, the template wins.
3. **Read each component's `component.json`** under
   `src/<vendor>/<connector>/...` (`<vendor>` = the namespace dir under `src/`;
   `appmixer` is only the default) to get the REAL input
   schema and output port name(s) — do not guess them.
4. **Write** each flow to
   `src/<vendor>/<connector>/artifacts/test-flows/test-flow-<name>.json`.
5. **Validate**:
   ```bash
   appmixer e2e validate src/<vendor>/<connector>/artifacts/test-flows
   ```
   Fix every reported failure and re-run until it prints `Validation passed`.
   Warnings are informational (improve them when easy, but they don't block).
   (`--ruleset basic` limits the run to the generic flow rules; server-side
   validation of a live flow is `appmixer flow validate <flowId>`.
   `--connectors-dir <dir>` points the coverage rules at the workspace when
   running from elsewhere.)

## Critical rules (the validator enforces these)

0. **Every component MUST carry fail-fast error handling** —
   `"errorHandling": { "autoRetry": false, "onError": "stopFlow" }` on every
   component in the flow (the template already does this). **Why it matters:**
   without it the engine silently auto-retries a failing component with backoff
   while the flow keeps "running" — failures surface late and
   non-deterministically. With it, the first component error stops the flow
   immediately: the run has a clear terminal state, logs carry the single real
   error, and the runner detects the failure in seconds. Enforced by
   `error-handling`.

0b. **Component ids MUST be unique UUIDs** — every key under `flow` (and every
   reference to it in `source.in`, `config.transform.in`, and `$.<id>.<port>`
   variable paths) must be a freshly generated UUID (`crypto.randomUUID()`), NOT
   a readable slug like `create-project` / `get-project`. The template already
   does this. **Why it matters:** the engine resolves a component's OAuth scopes
   via a GLOBAL `findByComponentId(userId, componentId)` lookup that ignores the
   flow id; readable ids are reused across every flow, so connecting an account
   binds to the wrong flow and requests only the base scope → the provider
   rejects auth ("no supported scopes"). Enforced by `component-id-uuid`.

0c. **Key `source` and `config.transform` by the component's REAL inPort name** —
   read it from the component.json `inPorts` of the component you are wiring INTO.
   It is `in` for most components, but NOT all (salesforce CreateLead/UpdateLead →
   `lead`, CreateContact/UpdateContact → `contact`). **Why it matters:** a wrong
   key uploads fine and even passes the variables check, but the engine rejects
   flow START with an opaque 400 "Malformed transformation" that names no
   component. Enforced by `inport-key-match`.

0d. **Don't invent `config.properties.account`** in newly generated flows —
   binding happens at import time (`appmixer e2e import`, optionally
   `--account <accountId>`). Flows exported from a live instance
   (`appmixer e2e export`) DO carry that instance's account IDs — leave them
   in place; the import ignores IDs that don't exist on the target instance and
   rebinds a live account instead.

1. **Flow name starts with `E2E `** and is descriptive.
2. **Required components present**: `OnStart`, `AfterAll`, `ProcessE2EResults`
   (wired per the template).
3. **NEVER assert on Raw Output** — `$.comp-id.out` / `$.comp-id.channels` always
   contains something, so the assertion is meaningless. Assert a SPECIFIC field,
   e.g. `$.comp-id.out.id`.
4. **Use the REAL output port name** — it is not always `out` (e.g. Slack
   `ListChannels` uses `channels`, `utils.files.SaveFile` uses `file`). Read
   `outPorts[*].name` in `component.json`. A link to a non-existent port uploads
   and starts fine but the listener NEVER receives a message — the flow stalls
   with zero errors until AfterAll times out. Enforced by `outport-exists`
   (both links and `$.id.port.…` variable paths).
5. **List/outputType components need a single-item `outputType`** in the flow
   transform so the component emits one item and individual fields like
   `$.comp-id.out.id` are accessible — assert on those fields **directly** (do NOT
   route through SetVariable/CodeBlock). **Read the component's
   `inspector.inputs.outputType.options` and use a value that is actually
   declared there** — connectors differ (`first` vs `object` = "one item at a
   time"); a value the runtime happens to accept but the inspector doesn't
   declare renders as a validation error in the designer. The validator allows
   `$.comp.out.field` precisely when the flow sets a single-item outputType.
   Note: with `first` an empty result throws CancelError; with per-record modes
   (`object` microsoft-style, `item` xero-style) an empty result emits NOTHING
   (flow stalls until AfterAll timeout) — filter for data you created in the
   same flow so the result is never empty.
5b. **Connectors without `first` (e.g. xero: `item`/`items`/`file`)** — prefer the
   array mode (`items`/`array`) for components under test and assert the wrapper
   field notEmpty (`$.comp.<port>.items` / `.result` for `array`): it always
   emits, so an empty result fails LOUDLY in the Assert instead of hanging
   AfterAll.
5c. **Per-record modes must NOT feed the middle of a chain** — `item`/`object`
   emit one message PER RECORD, so every downstream component re-executes once
   per record (real case: ListTenants in `item` mode on an account with two
   Xero organisations ran the entire pipeline twice, in both orgs). Mid-chain,
   use `items`/`array` (single message) and extract the first record on the
   consumer with a `g_jsonPath "$[0].<field>"` modifier. Enforced by
   `outputtype-fanout`.
6. **Assert variable paths must resolve to a scalar** (string/number/boolean) —
   never an object or array; use `g_jsonPath` / `g_first` to extract a leaf.
6b. **Never reference deeper than the sender's STATIC outPort contract** —
   `$.x.out.response.opportunityid` resolves at RUNTIME (the flow even passes),
   but if the sender declares only `response`/`status`/`statusText`
   (e.g. MakeApiCall), the designer's variable picker cannot offer the deep path
   and renders a red invalid-variable chip. Reference the deepest DECLARED path
   and extract the leaf with a modifier:
   `"variable": "$.x.out.response", "functions": [{ "name": "g_jsonPath",
   "params": [{ "value": "$.opportunityid" }] }]` (note: `params`, not `args`).
   Dynamic outPorts (options generated by a live `source` call, e.g. entity
   triggers) DO offer leaf fields — reference those directly. Enforced by
   `static-outport-deep-path`.
7. **Input fields** should use realistic values that satisfy the component's
   `inPorts[0].schema` (required fields set, no generic placeholders).
8. **No numeric array indexing** in variable paths (`$.x.out.items.0.id` does NOT
   resolve) — use a modifier (`g_jsonPath "$[0].field"`, `g_first`, `g_last`).
9. **Bind every modifier in `lambda`** — a field that defines `modifiers` must have
   a non-empty lambda value (`{{{var-id}}}`); Assert clause `field` must not be
   empty. An empty binding silently ignores the modifier.
9b. **String-typed inputs take STRINGS — serialize arrays/objects as JSON** —
   key-value inspector inputs (MakeApiCall `headers`/`parameters`) declare
   `"type": "string"` in the schema; the runtime parses either form, but a raw
   array (`"headers": [{ "key": "Prefer", "value": "return=representation" }]`)
   fails the designer's schema validation with a red "must be string" chip.
   Write `"headers": "[{\"key\": \"Prefer\", \"value\": \"return=representation\"}]"`.
   Enforced by `lambda-string-schema`.
10. **Assert assertions** are only `equal`, `notEmpty`, `regex`.
11. **Prefer modifiers over CodeBlock** (g_jsonPath/g_first/g_now+g_addTimeSpan/…);
    CodeBlock is a last resort.
12. **No hardcoded dates** — compute with `g_now` + `g_addTimeSpan` (determinism).
13. **Clean up what you create** — a flow that Creates a resource should Delete it.
14. **Layout flows as a left→right staircase** — grid minimums **MIN_DX = 208**
    (horizontal gap between components) and **MIN_DY = 128** (vertical). Pattern: a
    tested component and **its** Assert share the same **y**; the Assert sits at the
    component's **x + MIN_DX**. The next tested component steps down to **y + MIN_DY**
    (and right), so each component→Assert pair gets its own row. OnStart/SetVariable
    lead in on the first row; AfterAll → cleanup (Delete) → ProcessE2EResults follow
    to the right after the last Assert. Connected components either share a row
    (Δy = 0) or are ≥ MIN_DY apart; never backward/overlapping edges. Enforced
    (as warnings) by `layout`.
15. **Cover every component** — each connector **action** should appear in at least
    one flow. `component-coverage` excludes `trigger: true` components, so it only
    flags uncovered **actions** — but triggers CAN and SHOULD be E2E-covered too,
    using the provoke pattern below.
16. **Never verify a Create via full-text search** — search endpoints
    (`searchTerm`-style inputs) read an eventually-consistent index: a record
    created a second earlier is deterministically missing (and archived/deleted
    records are often excluded by default). Verify with Get-by-ID or a
    consistent list filter (`where Name=="…"` + `includeArchived` in Xero) —
    list endpoints read the primary store.
17. **Unique names per run where the API enforces uniqueness** — contact names,
    option/category names etc. reject duplicates. Either make the name unique
    per run (append `{{{mod}}}` bound to `$.<onStart>.out.started`, or
    `g_now`/timestamp modifiers) or create+archive/delete in the same flow so
    the name is reusable. NEVER create per-run instances of org-capped
    resources (e.g. Xero allows max 2 active tracking categories per org) —
    reuse an existing one via `items[0]` instead.
18. **Trigger flows (provoke pattern)** — the trigger sits **sourceless** in the
    flow next to the normal OnStart chain; an action in the same flow provokes the
    event it listens for:
    - webhook trigger: `OnStart → SetVariable → Wait 1m → Create/Update/Delete
      (provokes) …` + `Trigger → Assert → cleanup` — the Wait lets the provider-side
      subscription propagate before provoking; the trigger's subscription itself is
      created during flow start, before OnStart fires.
    - polling trigger (e.g. event-start): create data the first poll will match
      (an ongoing/imminent item) — no Wait needed.
    - Webhook notifications can take **minutes** to arrive (MS Graph: ~5 measured)
      — set the AfterAll `timeout` to 420 and expect the runner to wait, not fail.
    - Cleanup should consume the TRIGGER's output (`$.trigger.out.id`) — it then
      doubles as the assertion that the trigger fired.
    - **No native action component for the provoke?** Use the connector's
      `MakeApiCall` in the provoke lane. Extract values from its response with
      `$.<makeApiCallId>.out.body` + a `g_jsonPath` modifier (its out port is
      `{status, body}` — there is no `response` field, and deep paths like
      `.out.body.order.id` are designer-invalid). Chain as many calls as the
      provoke needs (create → lookup → mutate), each step reading ids from the
      previous step's `body`.
    - **Transition-fired webhooks**: many events fire on a STATE TRANSITION, not
      on a state (orders/paid, fulfilled, closed…). The provoke must create the
      entity in a NON-target state and then explicitly transition it — and watch
      for API defaults that silently pre-satisfy the target state (Shopify:
      API-created orders default to `financial_status: paid` even when omitted,
      so orders/paid never fires unless you create with `pending` and then POST
      a `sale` transaction). If a created-as-X entity doesn't fire "X" events,
      that's why.
    - **Event not provokable via API at all** (real storefront/UI action:
      checkout sessions, customer-portal steps)? Still generate the flow —
      trigger lane + `OnStart → Wait` (validators require OnStart) — and add a
      sticky `note` in the flow JSON with numbered manual steps to fire the
      event, plus a longer AfterAll `timeout` (600) so a human has time to click
      through. The flow then serves as a repeatable manual verification harness.
    - **Verify the trigger's topic fires at all** before writing the flow: a
      generic "updated" topic can be dead for the whole real journey (per-step
      topics fire instead) — see the multi-topic trigger pattern in
      `07-component-types.md`. A wrong topic produces a flow that registers
      fine and times out forever.

(Failures 1-10 — including 5c, 6b and 9b — fail validation; 11-18 are warnings
or generation guidance.)

## Adding / changing a rule

The validator suite lives in the appmixer CLI repo (`src/validators/rules/*.js`):
each rule exports `{ name, description, run(ctx) }` and calls `ctx.addFailure` /
`ctx.addWarning`; shared check logic lives in `src/validators/rules/lib/`. Add a
new file there to add a rule — the suite auto-discovers it.

## Next step

Publish the connector and upload the flows per `12-e2e-upload.md` (part of the `test-connector` skill).

---

# Publish & Prepare for E2E

Publish a connector to a live Appmixer instance and prepare it for E2E runs
(auth account, validation). Flow upload is `appmixer e2e import`'s job — it
createOrUpdates every flow from the local JSON by its E2E identity
(customFields `category`/`connector`/`name`), injects the E2E stores, binds
accounts (+ validity preflight) and validates variables server-side. Running
is `appmixer e2e run` (see `13-e2e-run.md`).

## Prerequisites

- **`appmixer` CLI** — installed (`npm i -g appmixer`) at version **2.6.0 or
  newer** (the first with the `e2e` commands). This is the ONLY dependency —
  there is no other tooling and no required environment variable.
  **Verify the version before anything else** and stop with an upgrade hint
  when it is too old:

  ```bash
  V=$(appmixer --version 2>/dev/null) || { echo "appmixer CLI not installed — npm i -g appmixer"; exit 1; }
  [ "$(printf '%s\n2.6.0\n' "$V" | sort -V | head -1)" = "2.6.0" ] \
    || { echo "appmixer >= 2.6.0 required (found $V) — npm i -g appmixer@latest"; exit 1; }
  ```
- **CLI configured against the target instance:**
  ```bash
  appmixer url https://api.your-instance.com
  appmixer login your@email.com          # the e2e user — see Step 1
  ```
  If the CLI is not configured yet, ask the user for the API URL and the e2e
  user's credentials and run the two commands. Every command in this skill
  (publish, `e2e import/run/...`) uses this session.
- **Run from the connector workspace** — the current directory (or a parent)
  contains `src/<vendor>/<connector>/`; the e2e commands resolve the
  workspace from the cwd (`--connectors-dir <dir>` overrides it when running
  from elsewhere — see the worktree section below). `<vendor>` is the
  namespace directory under `src/` — `appmixer` is only the default; a
  workspace can hold several vendors side by side. Bare connector names are
  searched across all vendor dirs; when ambiguous, qualify as
  `<vendor>/<connector>`.
- Test flow JSON files in `artifacts/test-flows/` (generated per `11-e2e-flow-generation.md`, shipped with `build-connector`)

**⚠️ Instance check:** the CLI session decides WHICH INSTANCE every command
talks to; a wrong one looks like auth breakage (fresh tokens get 401 "Invalid
JWT", flow/store listings return foreign IDs/empty lists). Before anything
else, confirm `appmixer url` prints the instance you expect — abort if it
doesn't.

> **Optional env overrides (CI, dedicated e2e user):** the e2e commands also
> honor `APPMIXER_TOKEN` (pre-obtained JWT) and the `APPMIXER_SKILL_*`
> variables (`_API_URL`, `_USERNAME`, `_PASSWORD`, `_ACCOUNT_ID`,
> `_CONNECTORS_DIR`, `_UI_URL`) — CLI features documented in the CLI README.
> When any are exported they take precedence over the CLI session; make sure
> they point at the same instance and user, or unset them.

## Quick Start

```bash
# 1. Publish the connector (as the e2e user — see Step 1)
cd src/<vendor>   # from the workspace root
appmixer pack <connector>
appmixer publish <vendor>.<connector>.zip   # pack outputs <vendor>.<connector>.zip

# 2. Make sure an auth account exists for the connector (Step 2)
appmixer account ls --json

# 3. Import the flows — local validation, upload, store injection, account
#    binding and server-side variable validation in one step (exit 1 = fix first)
appmixer e2e import src/<vendor>/<connector>/artifacts/test-flows

# 4. Run each flow by its ID (see 13-e2e-run.md)
appmixer e2e list -c <vendor>:<connector> --json
appmixer e2e run <flowId> --fix
```

## Workflow

### Step 1: Publish Connector

**⚠️ Components are per-user copies.** `appmixer publish`/`remove` act on the copies
owned by whoever the CLI is logged in as — if that is NOT the user who runs the
E2E flows, the publish looks successful but the e2e user's designer, flows and
API keep serving **their own stale copy**. ALWAYS make sure the CLI login is
the e2e user before publishing (idempotent, do it every session — "already
logged in" may mean logged in as someone else):

```bash
appmixer url https://api.your-instance.com
appmixer login <e2e-user@email>     # prompts for the password
# non-interactive alternative: printf '%s\n' "$PASSWORD" | appmixer login <e2e-user@email>
```

**Run the workspace validators for the WHOLE connector first** (when the
workspace ships them — the appmixer-connectors repo does; skip otherwise) —
pre-commit only validates CHANGED files, so long-standing bugs (e.g. a dynamic
outPort source missing a required input → empty variable pickers / invalid
chips in the designer) survive for months until someone runs the full check:

```bash
node scripts/validate.js --connector <connector>   # from the workspace root
# triage the failures for the components you are about to test; legacy findings
# on untouched components are threshold-gated and may be left alone
```

**⚠️ Run the validators from `dev`, not from the branch.** The validator set
lives in the repo, so a branch cut before a validator was added never runs it
and reports a clean connector. Real case: a branch predating
`component-icon-svg` and `tick-requires-tick-flag` validated clean while 14 icon
failures waited on the other side of the rebase. Rebase first, or copy the
missing `scripts/validators/*.js` in from `dev` before trusting a clean run.

**"Legacy findings may be left alone" applies to the repo-wide run, not to
commits.** The pre-commit hook validates every CHANGED file strictly, with no
thresholds, so a one-line fix in a connector that carries pre-existing debt is
blocked by that debt rather than by your change. Either clear it, or commit with
`--no-verify` and say so in your report.

Pack and publish (absolute zip path — `pack` writes the zip into the CWD and stale
zips from earlier sessions may exist elsewhere in the repo; a relative `publish`
after a cwd reset silently publishes the wrong one):

```bash
cd src/<vendor>   # from the workspace root
rm -f <vendor>.<connector>.zip
appmixer pack <connector>
appmixer publish "$PWD/<vendor>.<connector>.zip"
```

**⚠️ `appmixer remove` can fail with a transient 502/504 (Bad Gateway / Gateway
Timeout) — the remove did NOT happen.** A publish right after appends a stale
duplicate instead of refreshing (see the stale-snapshot section). Retry every
failed remove until it prints `… removed.`, and only then publish.

**Verify what the server actually stored** (as the e2e user):
`GET /components/<full.component.name>` returns the stored component **zip** — unzip
it and compare a marker (version, a changed URL) with your local component.json.
The zip may legitimately contain the SAME file several times (each publish of an
existing version appends a copy): that is harmless **only when all copies are
byte-identical AND carry your marker** — otherwise remove + publish again:

```bash
# Reuse the CLI's stored login token and API URL (aligned with the e2e user in Step 1)
TOKEN=$(node -e "console.log(require(require('os').homedir()+'/.config/configstore/appmixer.json').token)")
BASE_URL=$(node -e "console.log(require(require('os').homedir()+'/.config/configstore/appmixer.json')['appmixer-url'].default.url)")
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/components/<vendor>.<connector>.<module>.<Component>" -o /tmp/comp.zip
python3 - <<'EOF'
import zipfile
z = zipfile.ZipFile('/tmp/comp.zip')
infos = [i for i in z.infolist() if i.filename.endswith('component.json')]
contents = [z.read(i) for i in infos]
marker = b'<some string unique to your change>'
print(f'copies={len(contents)} identical={all(c == contents[0] for c in contents)} '
      f'marker_in_all={all(marker in c for c in contents)}')
EOF
```

### Step 2: Ensure Auth Account Exists

List existing accounts (filter by service yourself — service is
`<vendor>:<connector>`, nested connectors often authenticate at the top level,
e.g. `appmixer:microsoft`):

```bash
appmixer account ls --json
```

**Creating an account is a user step.** The reliable path is a human
authenticating in the Appmixer designer UI ("Connect account" on any component
of the connector) — ask the user to do it and then re-list. Injecting an
account directly (`appmixer account create <file>` with
`{ "name": ..., "service": "<vendor>:<connector>", "token": {...}, "profileInfo": {} }`)
also works, but mind the engine's requirements:

- **OAuth2 scopes**: the engine validates scopes on account creation and reads
  them from **`token.scope` (singular, array)** — `token.scopes` or a top-level
  `scopes` field is silently ignored and the request fails with `400 "Scopes
  provided have missing required scopes"`. Fill `token.scope` with the scope
  array from the connector's `auth.js` if the token payload doesn't carry it.
- **Service config must exist** (`GET /service-config/<vendor>:<connector>` must
  return a `clientId`) — the engine instantiates the connector's auth module during
  account creation and needs it. Without it the API fails with an opaque 500.
  Set it first: `PUT /service-config/<vendor>:<connector>
  {"clientId":"...","clientSecret":"..."}` (or via Backoffice > Services).
- **500 wrapping `Request failed with status code 404`** on account creation means
  the connector's `requestProfileInfo` makes an HTTP call that fails server-side
  (e.g. the service has no userinfo endpoint). Fix the connector: derive profile
  info without HTTP (decode JWT claims locally) or guard the call — then
  remove + republish the connector (stale auth-module snapshots survive plain
  publishes; a worker restart may be needed).

Test the account is valid:
```bash
appmixer account test <accountId>
# Should return {"ok":true}
```

**API-key connectors: check the key's SCOPES, not just its validity.** The runner
diagnoses missing OAuth scopes; for API keys there is no such safety net, and a
key can authenticate perfectly while every interesting endpoint answers 403. Real
case: a Deepgram key listed projects happily and returned `403 … does not have
the required scope` on every project-scoped endpoint, blocking five flows. Have
the connector document which key scopes its components need (a line in the
connector README) and check the E2E key against that list before running
anything.

Replacing the account also replaces the **tenant** behind it: a new key can
belong to a different project or workspace, so the data the flows expect — records
to find, request history to poll — is simply not there, and the failures look
nothing like an auth problem.

**⚠️ `{"ok":true}` may prove nothing.** The test runs the connector's
`validateAccessToken`, and some connectors (e.g. salesforce) only compare a stored
expiry date — a revoked/dead token still returns ok. Confirm with a REAL service
call: hit a cheap component source endpoint with the account bound, the way the
designer does:

```bash
TOKEN=$(node -e "console.log(require(require('os').homedir()+'/.config/configstore/appmixer.json').token)")
BASE_URL=$(node -e "console.log(require(require('os').homedir()+'/.config/configstore/appmixer.json')['appmixer-url'].default.url)")
curl -s -X POST "$BASE_URL/component/<vendor>/<connector>/<module>/<ListComponent>?outPort=out" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"componentId":"<any-component-id-with-this-account>","flowId":"<flowId>"}'
# Options/data back = token really works. 401/403 (Bad_OAuth_Token, INVALID_SESSION_ID) = dead account.
```

Dead-account symptom downstream: flow START fails with 400 wrapping an inner 401
AxiosError whose `config.url` points at the service (trigger `start()` calls), or
components fail mid-run with 401/403. When several accounts exist for the service,
test each and pin the working one with `appmixer e2e import --account <accountId>`.

### Step 3: Flow Upload & Account Binding — `appmixer e2e import` Does It

`appmixer e2e import <file|dir>` handles the whole upload-and-bind cycle:

- **createOrUpdate by identity**: flows are identified on the instance by
  customFields `category: "E2E_test_flow"`, `connector` (a ref like
  `appmixer:google:gdrive`, derived from the file path or given via
  `--connector`) and `name` (the flow's test-case name). A matching flow is
  stopped and updated in place (`?forceUpdate=true`); flows are never deleted
  and recreated. Legacy flows carrying only the category are matched by
  display name and adopted (the identity fields are written on update).
- Sets a description, strips server-only fields, enforces fail-fast
  `errorHandling`.
- **E2E stores**: creates `E2E Failed Tests` / `E2E Succeeded Tests` if missing
  and injects their IDs into ProcessE2EResults.
- **Account binding**: binds an account to every connector component
  (precedence: `--account <id>` / `APPMIXER_SKILL_ACCOUNT_ID` override > the
  component's own `config.properties.account` > first flow-authored account
  that exists on the instance > first existing account of the service), then
  validity-tests every bound account — a plain flow PUT always drops bindings,
  which is why re-import after every edit is the rule.
- **Server-side variable validation**: checks every transform variable against
  what the designer's variables-fetch endpoint offers ("red chip" detection).
  Any INVALID variable fails the import with exit 1.
- Local validation (`appmixer e2e validate` rules) runs first by default;
  `--no-validate` skips it.

**Uploading without running** (rare — e.g. handing a flow to someone in the
designer): `appmixer flow import <file>` creates the flow as-is — no E2E
tagging, no store injection, no account binding. The user must then connect
accounts in the designer by hand (or bind per component:
`appmixer auth bind <componentId> <accountId>`).

**Account IDs in flow JSONs are tolerated but instance-specific.** Flows
exported from a live instance (`appmixer e2e export`) carry that instance's
`config.properties.account` values — do not strip them (they keep the file in
sync with the export output), but never rely on them either: they are
meaningless on any other tenant and rot when accounts are deleted. Binding is
always re-done at import time, which ignores flow-authored IDs that don't
exist on the target instance and rebinds a live account
(`appmixer e2e import --account <accountId>` overrides everything).

**⚠️ Recipients are NOT injected.** If you want ProcessE2EResults to notify
someone, set `recipients` in the flow JSON's ProcessE2EResults lambda yourself.

### Step 4: Validate Before Running

#### 4a: Validate Flow JSONs Locally

`appmixer e2e import` runs this automatically; run it standalone while
iterating on flow JSONs:

```bash
appmixer e2e validate src/<vendor>/<connector>/artifacts/test-flows
```

This catches issues like:
- Assert testing Raw Output (meaningless — always passes)
- Missing AfterAll connections
- Variable path referencing non-existent components
- Required input fields not provided
- ProcessE2EResults missing storeIds

**Common issues in generated flows to check manually:**

1. **Missing required fields** — The generator sometimes omits fields in `inPorts[0].schema.required`. Cross-check every Create component's transform against `component.json` and ensure all required fields are present.

2. **Hardcoded IDs that don't exist on the test account** — Dynamic-select fields (stage ID, view ID, pipeline ID) may be hardcoded with placeholder values like `1` or `12345`. These will 403/404 at runtime. Fetch real IDs from the API or use upstream List* components.

3. **Wrong `view_id` for Find* components** — If a component uses a view-based search (e.g. `FindDeals`), the generated flow may use `view_id: 1`. Always verify a valid view ID exists.

#### 4b: Validate Variable References (Automatic at Import)

`appmixer e2e import` performs this check automatically after upload and fails
with exit 1 on any INVALID variable (with hints about what IS offered). For a
manual deep-dive on a live flow:

```bash
appmixer flow variables "$FLOW_ID" --json
```

This calls the variables-fetch endpoint (`POST /variables/$FLOW_ID/fetch`) —
the SAME endpoint the designer uses to render variable chips. Compare every
variable used in the flow's `config.transform.*` / `lambda` values against what
the response offers: a transform variable that is NOT among the offered ones
renders as an invalid (red) chip in the designer and typically never resolves
at runtime.

Response internals: with `compress=true` the offered variables are deduplicated
into `dynamicComponentVariables[]` and each
`components.<id>.links.in.<sender>.<port>.variables` carries `refs` — indices
into that array; entry values look like `{{{$.<id>.<port>.<field>}}}`.
`variables.errors` entries mean the source's options call failed.

**NEVER assert on Raw Output** (`$.comp-id.out`) — it always contains something, making the assertion meaningless. Always test specific fields (e.g. `$.comp-id.out.ManualJournalID` notEmpty).

## Auth — When `appmixer login` Is Not Possible

With the default setup the e2e commands reuse the CLI's stored login token —
no extra auth happens. For an account that cannot `appmixer login` (SSO-only,
or `POST /user/auth` rejects the password), provide a pre-obtained JWT via the
`APPMIXER_TOKEN` env var — it takes precedence over everything:

```bash
export APPMIXER_TOKEN=<jwt>
```

## Running Outside the Workspace (worktrees, CI)

The e2e commands resolve the workspace by walking up from the cwd (or
from the flow path). When you must run from elsewhere — or target a specific
git worktree different from your cwd — set the override explicitly:

```bash
appmixer e2e import  <dir> --connectors-dir /path/to/worktree
appmixer e2e validate <dir> --connectors-dir /path/to/worktree
# or once per shell: export APPMIXER_SKILL_CONNECTORS_DIR=/path/to/worktree
```

## Stale Worker OAuth State After Re-authentication

Engine workers also cache per-account OAuth state (the refresh-token lineage).
After a user re-authenticates an OAuth account to gain NEW permissions (e.g.
Epic: re-consent after adding app APIs), workers still holding the old lineage
keep minting **fresh access tokens with the OLD entitlements** — the token's
`iat` looks current, yet some calls 403 while identical calls from another
worker succeed (search 200 + read 403 within one flow run; scratch flows
pass/fail per worker). Rebinding accounts, new flowIds or new componentIds do
NOT help. Fix: **restart the engine workers**, or create a brand-new account
(new accountId) and rebind. Real case: epic GetAppointment, 2026-07-17.

## Stale Component Definition / Code After Publish

`appmixer publish` **does not refresh already-existing component versions** — neither
their definitions (`inPorts`/`outPorts`/inspector) nor their **runtime code,
including shared files like `lib.js`** that components `require()`. Each
(component, version) is snapshotted at first publish; re-publishing the connector
only adds NEW components/versions.

Symptoms:
- `/components` returns old `inPorts`/`outPorts`/`source` URLs after a "successful" publish.
- Newly added components work while an old sibling crashes at runtime with
  `Cannot read properties of undefined (reading 'someApiFn')` — its frozen snapshot
  pre-dates a function you added to `lib.js`.
- Flow start rejected with 400 `Component transformation validation error` because
  stale inPort schemas are validated against current flow transforms.

**Fix: remove + publish, as the e2e user** (see Step 1 — removes/publishes by a
different CLI login do NOT touch the e2e user's copies), for every affected component:

```bash
appmixer remove <vendor>.<connector>.<module>.<Component>
sleep 1
appmixer publish "$PWD/<vendor>.<connector>.zip"
```

Whack-a-mole warning: each publish of an existing version **appends a duplicate
copy** into the stored package of every non-removed component — removing A+B and
publishing refreshes A+B but appends a dupe to the just-cleaned C+D. Duplicates
are harmless **when byte-identical** (verify with the zipfile snippet in Step 1);
only content that differs across copies needs another remove+publish round. And
retry any `appmixer remove` that fails with 502/504 — a gateway error means the
remove did NOT happen.

Alternative when definitions refuse to update in place: **bump the component
`version`** in component.json (new version = new snapshot) and update the flows'
`version` pins to match.

Verify after:
```bash
TOKEN=...
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/components?limit=500" | python3 -c "
import sys,json; items=json.loads(sys.stdin.read()); items=items if isinstance(items,list) else items.get('components',[])
for i in items:
    if i.get('name')=='<vendor>.<connector>.<module>.<Component>':
        print(json.dumps({k:i[k] for k in ['inPorts','outPorts']}, indent=2)[:400]); break
"
```

## Known Gotchas

### Stores are created at import
The `E2E Failed Tests` and `E2E Succeeded Tests` stores must exist with their
IDs injected into ProcessE2EResults — `appmixer e2e import` creates and
injects them automatically; there is nothing to do manually.
(`appmixer store ls` / `appmixer store create <name>` exist for manual work;
`appmixer e2e results [--clean]` reads/prunes the stored per-test-case results.)

### Flows must be stopped before PUT update
`PUT /flows/:flowId` rejects updates on running flows. `appmixer e2e import` handles this automatically (stop → update → re-bind accounts). Never update a running flow manually without stopping first.

### Dynamic output ports show "Raw Output" — fix source URL
If the variables check shows a component only exposes "Raw Output" instead of individual fields, the component's `generateOutputPortOptions` is failing. Common causes:
1. **The source call fails server-side** — reproduce it directly (the way the designer does) and read the actual error:
   ```bash
   curl -s -X POST "$BASE_URL/component/<vendor>/<connector>/<module>/<SourceComponent>?outPort=out" \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"messages":{"in":{...}},"transform":"./transformers#...","componentId":"<comp-id>","flowId":"<flow-id>"}'
   ```
2. **Missing `dummy` for required fields**: If inPort schema has required fields not needed for schema generation, send `"dummy"` as their value in source messages.
3. **`ignoreAuth=true` — only for sources that genuinely need NO auth.** ⚠️ Do NOT
   cargo-cult it: with `ignoreAuth=true` the engine calls the source component
   WITHOUT the account, so a source that needs auth (describe/list endpoints reading
   `context.auth.accessToken` / `context.profileInfo.instanceUrl`) builds its URL from
   `undefined` and fails with 500 `"Invalid URL"` — the designer then renders red
   **"Invalid URL" chips** in the inspector and all output variables show as invalid.
   The designer sends the caller's bound account automatically; auth-requiring
   sources must keep the default (no `ignoreAuth`).
After fixing, re-publish the connector (remove + publish — see the stale-snapshot section) and re-run the flow.

### The variables check reads designer offerings, not runtime data
It validates that every transform variable is among what the designer's
variables-fetch endpoint offers (red-chip detection). It does NOT validate
runtime VALUES — a variable like `$.codeblock.out.result.field` can be offered
yet empty at runtime. Always confirm by running the flow.

## Key API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| List E2E flows | GET | `/flows?filter=customFields.category:E2E_test_flow&limit=500` |
| Get flow | GET | `/flows/:flowId?projection=flow` (always use projection!) |
| Create flow | POST | `/flows` |
| Update flow | PUT | `/flows/:flowId?forceUpdate=true` |
| Assign account | PUT | `/auth/component/:componentId/:accountId` |
| List accounts | GET | `/accounts` |
| Test account | POST | `/accounts/:accountId/test` |
| Get stores | GET | `/stores` |
| Validate variables | POST | `/variables/:flowId/fetch?compress=true` |

## References

- **API details**: the appmixer CLI's `src/api/` modules are the single source of truth for Appmixer API calls; the raw endpoints are in the table above

---

# Run E2E Flows

Execute E2E test flows against a live Appmixer instance and evaluate results.

The heavy lifting is done by the **`appmixer e2e` commands** built into the
appmixer CLI (deterministic, no LLM). **You (the agent) are the fix loop**:
when `appmixer e2e run --fix` exits with a `NEEDS_FIX` brief, you diagnose it,
edit the local flow JSON, re-import it, and re-run. Uploading, store setup and
account binding are `appmixer e2e import`'s job; `appmixer e2e run` only runs
a flow that already lives on the instance.

**Assumes the connector is already published** (`appmixer pack` + `publish` per
`12-e2e-upload.md`) and the flows are imported (`appmixer e2e import`, also in
`12-e2e-upload.md`).

## Prerequisites

- **`appmixer` CLI** — installed (`npm i -g appmixer`) at version **2.6.0 or
  newer**. The ONLY dependency — no other tooling, no required environment
  variable. Verify it first (the version-gate snippet is in
  `12-e2e-upload.md` Prerequisites; quick probe: `appmixer e2e run --help`).
- **CLI configured** — `appmixer url` + `appmixer login` as the e2e user (see
  `12-e2e-upload.md` Prerequisites; that doc also lists the optional
  `APPMIXER_TOKEN`/`APPMIXER_SKILL_*` env overrides for CI).
- Connector published on the instance; an auth account exists for it
- Flows imported (`appmixer e2e import` — see `12-e2e-upload.md`)
- **Design conventions** — the fix loop consults
  `references/09-testing.md` in this skill's directory (no setup needed).

## The runner

```bash
appmixer e2e run <flowId> [--fix] [--max-attempts <n>] [--timeout <seconds>] [--json]
```

The argument is a **flow ID on the instance** — get it from
`appmixer e2e list -c <connector-ref> --json` (connector refs look like
`appmixer:todoist` or `appmixer:google:gdrive`). Options:
`--fix` (enable the deterministic fix loop — use it in agent workflows),
`--max-attempts <n>` (deterministic fix attempts, `--fix` only, default 5),
`--timeout <seconds>` (per-run completion timeout, default 480), `--json`
(machine-readable result object on the last line).

The runner starts the flow, monitors **the logs of the current run only** (the
run boundary is anchored on the server's own log timestamps, so previous runs
can never leak into the result), waits for completion, and reports OK or the
list of errors. With `--fix` it also triages failures deterministically —
rebinds accounts on token errors, re-runs on transient infra failures — and
emits a structured FIX BRIEF when no deterministic rule matches.

**Fail-fast error handling is enforced at import:** `appmixer e2e import`
injects `errorHandling: { autoRetry: false, onError: "stopFlow" }` into any
component that doesn't already carry it (flow-authored settings win), so the
first component error stops the flow instead of silently auto-retrying. On
older engines that reject the property, the import strips it and re-uploads
automatically.

**Exit codes:**

| Code | Meaning | Your action |
|------|---------|-------------|
| `0` | Flow passed | Next flow |
| `1` | Failed — errors/timeout; with `--fix` also: config error, retry budget spent, no account, **missing OAuth scopes** | Report to user — a scope failure prints the exact scopes to re-authenticate with |
| `2` | `NEEDS_FIX` — structured brief printed as JSON (`--fix` only) | Fix the flow JSON, re-import, re-run (see below) |

The last line of every run is machine-parsable:
`RESULT | PASSED\|FAILED\|NEEDS_FIX | <flow name> | <designer URL>`.
The designer URL opens the flow in the instance UI. It is built from
`APPMIXER_SKILL_UI_URL` (no host derivation from the API URL); when unset, the
runner prints the flowId instead of a link. Progress output goes to stderr;
results (`RESULT |` line, FIX BRIEF, `--json` payload) go to stdout.

**Unbound accounts fail fast:** without `--fix`, the runner refuses to start a
flow whose connector components have no valid account bound and tells you to
run `appmixer e2e import` (which binds accounts and validity-tests them).

**Auth failures are detected automatically:**
- **Preflight at import** — every bound account is validity-tested
  (`POST /accounts/:id/test`) by `appmixer e2e import`; an expired/revoked token
  fails the import with the account id, before anything runs. ⚠️ This test runs
  the connector's `validateAccessToken`, which in some connectors (salesforce)
  only compares a stored expiry date — a dead token can still pass preflight and
  surface as runtime 401/403 (`Bad_OAuth_Token`, `INVALID_SESSION_ID`) or as a
  flow-start 400 wrapping an inner 401 from the trigger's `start()` call. In
  that case try the service's OTHER accounts and pin the working one.
- **Scopes (`--fix`)** — a TokenError that persists after one account rebind
  means the bound account's token lacks the component's required scopes (read
  from its `component.json`). The runner hard-fails with the exact scopes —
  pass that to the user; only a human OAuth re-consent fixes it. After the
  re-consent, pin the new account with `appmixer e2e import --account
  <accountId>` if the old scope-less account still exists next to it.

**A pinned account is authoritative:** with `appmixer e2e import --account
<accountId>` (or the `APPMIXER_SKILL_ACCOUNT_ID` env override), the import
overrides flow-authored `config.properties.account` values both in the
uploaded flow definition and in the auth grants — a stale account hardcoded in
the flow JSON can never shadow it. (Unpinned imports keep flow-authored
accounts — that is how multi-account flows work — but only when the ID exists
on the target instance; foreign/deleted IDs, e.g. from a flow exported off
another tenant, are ignored and a live account is bound instead.)

**Clean timeouts are triaged by flow type (`--fix`):** a timeout with zero
errors means some Assert never fired.
- **Flow with an external trigger** (a sourceless non-utils component): the event
  just may not have arrived yet — latency varies from seconds to many minutes.
  The runner re-runs once deterministically; only a second clean timeout
  surfaces as NEEDS_FIX.
- **OnStart-only flow** (every component wired): nothing can "arrive later", so
  the runner does NOT retry — it reports NEEDS_FIX immediately with
  `assertsFired`/`assertsSilent` in the brief. A silent assert points at its
  upstream: typically a per-record `outputType` that emitted NOTHING on an empty
  result, or a link/variable referencing a non-existent outPort (run the
  `outport-exists` / `outputtype-fanout` validators on the flow).

**Transient infra errors re-run once (`--fix`):** errors matching quota-server /
ECONNREFUSED / ETIMEDOUT patterns (e.g. `Error while calling quota server:
connect ECONNREFUSED …`) trigger one plain re-run (triage rule
`infra-transient`); if the error repeats, the runner hard-fails with an
instance-outage message instead of burning the fix budget.

**A killed runner stops the flow:** on runner timeout, SIGINT or SIGTERM the
runner stops the flow (best-effort, 10 s cap) before exiting, so no run leaks a
running flow with live trigger subscriptions.

**Overall runner timeout is `AGENT_TIMEOUT_MS` (default 10 min).** With two
482 s WAIT windows plus stop overhead, the default expires DURING the second
window — an external event arriving after ~9 min is lost to "Runner timeout
exceeded". For trigger flows waiting on slow external events (manual
storefront/UI steps, provider-side latency in the tens of minutes), export
`AGENT_TIMEOUT_MS=1500000` (or more) before invoking the runner.

## The fix loop (you)

On exit code 2 (`--fix`) the runner prints a `NEEDS_FIX` JSON brief: `reason`,
`errors` (componentType + message), `recentLogs` (current-run only), `flowId`,
`flowName`, `connector`, and — for clean timeouts —
`assertsFired`/`assertsSilent` (component IDs). The local file lives at
`src/<vendor>/<connector>/artifacts/test-flows/` (the `connector` field of the
brief maps `appmixer:google:gdrive` → `src/appmixer/google/gdrive/`); match it
by the flow name. Then:

1. **Diagnose from the brief.** Typical failure classes:
   - HTTP errors (4xx/5xx) from connector components
   - Assert failures (wrong field values, missing fields) — Assert output has
     `success` and `error` arrays
   - Variable reference errors (invalid paths in `config.transform.*` / `lambda`)
   - Component errors (bad config); `"Component error"` on ProcessE2EResults
     usually means an upstream Assert or AfterAll failed
   - `"timeout"` in AfterAll = not all Asserts fired — something upstream is stuck
   - **Flow start rejected: `Component transformation validation error` /
     `Malformed transformation`** (the response names no component) — some
     component's `source`/`config.transform` is keyed on a port name that is not
     one of its inPorts. Most components use `in`, but not all (salesforce
     CreateLead → `lead`, CreateContact → `contact`). Check every component's
     `component.json` inPorts; the `inport-key-match` validator catches this
     statically.
   - **Flow start rejected: 400 wrapping an inner 401/AxiosError with a service
     URL** — the engine called the service during start (trigger `start()`) with a
     dead/wrong account; see the auth notes above. `Cannot read properties of
     undefined (reading 'fn')` in an OLD component after a publish = stale
     per-version code snapshot — remove + republish that component (see
     `12-e2e-upload.md` "Stale Component Definition / Code After Publish").
2. **Read the failing component's `component.json`** to confirm expected
   inputs/outputs before changing variable paths.
3. **Fix the flow JSON on disk**: variable paths, assert expressions, input
   mappings, modifiers. Consult `references/09-testing.md` for flow design
   patterns.
4. **If the component source itself is broken**, fix it in the connector and
   re-publish (`appmixer pack && appmixer publish`) before re-running.
5. **Validate** the edited flow:
   ```bash
   appmixer e2e validate <flow.json>
   ```
6. **Re-import and re-run:**
   ```bash
   appmixer e2e import <flow.json>
   appmixer e2e run <flowId> --fix
   ```
   (Import updates the flow in place by identity — the flowId stays the same.)

### Fix rules (hard requirements)

- **Never delete and recreate flows** — `appmixer e2e import` always updates in
  place by identity.
- **Do NOT change the flow name or component IDs** — the name is part of the
  flow's identity (`customFields.name`); IDs are referenced by variable paths.
- **Removing a component or assert is a LAST RESORT.** Only when the underlying
  API feature is confirmed unsupported in this environment. If you do, report it
  loudly: `⚠️ REMOVED COMPONENT: <id> — <reason>` — never remove silently.
- Always read the flow JSON from disk before editing — never work from memory of
  a previous version.
- When fixing variable paths, verify the referenced component ID exists in the
  flow and the field matches the component's output schema.
- **Max 5 fix iterations per flow.** Still failing → report remaining errors to
  the user and stop.

## Running all flows of a connector

Import the directory once, then run each flow by ID:

```bash
appmixer e2e import src/<vendor>/<connector>/artifacts/test-flows
appmixer e2e list -c <vendor>:<connector> --json    # → [{ flowId, ... }, ...]
for id in $(appmixer e2e list -c <vendor>:<connector> --json | jq -r '.[].flowId'); do
    appmixer e2e run "$id" --fix | tee -a /tmp/e2e-run.log
done
grep '^RESULT |' /tmp/e2e-run.log
appmixer e2e results -c <vendor>:<connector> --json   # stored per-test-case results; exit 1 = failures
```

Never run flows **in parallel** — parallel runs against one instance cause
noisy logs and account contention. Apply the fix loop to each failing flow
before moving on.

**Always end your report to the user with the summary table** built from the
`RESULT |` lines — one row per flow: name, status, designer URL.

## Flow Completion Detection

Flows are monitored via **log polling**, not flow stage:

- **ProcessE2EResults in logs** = flow completed. The runner stops the flow and parses results.
- **Component errors in logs** = tracked and reported. OnError/StopFlow errors are **ignored** (noisy infrastructure artifacts).
- E2E flows don't auto-stop after ProcessE2EResults — the runner handles stopping.
- Only logs of **the current run** count: the run boundary is the newest log
  timestamp that existed before start (+1 ms), taken from the server's own
  clock; hits without a parseable timestamp are excluded.

Do NOT use `OnError + StopFlow` components in test flows — they cause spurious lock errors on some instances and add noise to logs.

## Known Gotchas

### Polling triggers baseline on their first tick — the flow must be RUNNING when the event lands
A `tick()` trigger records the current item set on its first poll after flow
start and only emits items that appear LATER. The runner stops the flow between
its retry windows, so an event that becomes visible during that stopped gap is
swallowed by the next run's fresh baseline — with slow provider latency (e.g.
Shopify lists an abandoned checkout ~10 min after the customer leaves) the
runner's stop/start windows can miss it forever. Workaround for such flows:
start the flow directly (`appmixer flow start <flowId>`), keep it running until
the event is visible, verify the emission in `/logs` manually, then stop the
flow (`appmixer flow stop <flowId>`). Note the flow-authored AfterAll timeout
still applies — a very late event yields a recorded "timeout" result even
though the trigger emission proves the component works; restart the flow just
before the event if you need a clean PASSED record.

### Webhook registration fails with 422/404 "Invalid topic"
Two distinct causes, in triage order: (1) the auth token lacks the topic's
required scope — fix by granting the scope upstream; (2) the topic does not
exist on that API surface — some providers expose certain topics only via a
different registration channel (Shopify: most `returns/*` topics are
GraphQL-`webhookSubscriptionCreate`-only; REST rejects them). Probe the topic
with a direct API call before touching the component code.

### Stale logs from previous runs
The runner filters strictly by a server-side run boundary — errors from
previous runs (including log entries with no timestamp) cannot appear in its
results or the FIX BRIEF. When reading `/logs` **manually**, always check
`gridTimestamp` yourself.

### `GET /flows` default limit is 100
**Always use `limit=500`** in list queries: `GET /flows?filter=...&limit=500`.
(`appmixer e2e list` does this for you.)

### `GET /flows/:flowId` Elasticsearch errors
**Always use `?projection=stage` for status checks** and `?projection=flow` for the definition.

### Search/Find race conditions after Create
Many APIs have eventual consistency on search indexes. A record created 1 second ago may not appear in search results yet:
- **Best approach:** Search for a pre-existing test record instead of a just-created one
- **Alternative:** Insert `appmixer.utils.timers.Wait` with `interval: "1m"` (minimum unit is minutes). CodeBlock CANNOT delay — it runs synchronously in isolated-vm (`evalSync`), `await`/`setTimeout`/Promises are unavailable and error out.
- **Alternative:** Use GetById between Create and Find to add natural delay

### Duplicate records on re-runs
Previous test runs may leave records behind if cleanup failed:
1. Stop any running flows first
2. Check if the API rejects duplicates
3. Clean up leftover test data from previous runs via the connector's API

### CodeBlock output wraps results under `result`
`appmixer.utils.controls.CodeBlock` wraps the return value under a `result` field. Access it via `$.code-block-id.out.result`. Deep access like `$.code-block-id.out.result.field` does NOT work — return simple strings/numbers only.

### CodeBlock code syntax
CodeBlock runs in `isolated-vm`, **synchronously** (`evalSync`) — no `await`, no `setTimeout`, no Promises. Input variables are exposed on **`$data`** (e.g. `$data.body`), not as bare identifiers. Bare `return` statements are illegal. Use expressions directly (e.g., `'value-' + Date.now()`) or IIFEs — a single expression that evaluates to a value.

### Assert failures do NOT stop the flow — and `equal` reads `expected`, not `value`
A failed assertion is logged in the Assert result payload (`error[]`) as a plain info message; the flow continues and ProcessE2EResults still completes. The runner scans Assert payloads (`collectAssertFailures`) so these fail the run — but when reading logs manually, always check the Assert `success`/`error` arrays, not just component errors. Common authoring bug: `{"assertion": "equal", "field": ..., "value": "200"}` — the Assert component reads the comparison value from the key **`expected`**; with `value` it compares against `undefined` and fails with the misleading message "expected undefined to equal 200".

### Log parsing
The `/logs` API returns raw Elasticsearch hits. Error details are in `hits[]._source.err` as a **JSON string** (not object). Parse `err.response.data` for the actual error message.

### Deterministic test design
Tests must pass on repeated runs without input changes:
- **Create + Delete cleanup**: If the API rejects duplicates, the test MUST delete created resources at the end.
- **Unique inputs via modifiers**: Use `g_timestamp` or `g_uuid4` modifier functions for unique identifiers.
- **Avoid hardcoded dates**: Use `g_now` + `g_addTimeSpan` modifiers to compute future dates dynamically.

## Key API Endpoints

Prefer the CLI (`appmixer e2e list/run/results`, `appmixer flow start/stop`);
raw endpoints for manual debugging:

| Action | Method | Endpoint |
|--------|--------|----------|
| List E2E flows | GET | `/flows?filter=customFields.category:E2E_test_flow&limit=500` |
| Get flow status | GET | `/flows/:flowId?projection=stage` |
| Start flow | POST | `/flows/:flowId/coordinator` `{"command":"start"}` |
| Stop flow | POST | `/flows/:flowId/coordinator` `{"command":"stop"}` |
| Get logs | GET | `/logs?flowId=:flowId&from=0&size=100` |

## References

- **Flow design patterns**: `references/09-testing.md` — read before diagnosing or fixing flows
- **API details**: the appmixer CLI's `src/api/` modules are the single source of truth for Appmixer API calls (auth, flows, accounts, logs, stores); raw endpoints are listed in the table above
- **Triage rules**: `src/e2e-runner/triage.js` in the appmixer CLI repo — add deterministic rules there for repeatable failure classes (keeps fixes rare)

---

# Async Components (jobs that finish later)

Some provider operations do not finish inside one request: transcription,
enrichment, rendering, video encoding, a human approval. The component must
return control immediately **and still deliver the result into the same flow**.

This file covers the two shapes that work and the four that do not.

## Decision rule

| The provider offers | Use | Reference implementation |
|---------------------|-----|--------------------------|
| A callback / webhook URL parameter | **Self-callback** — `"webhook": true` + `context.getWebhookUrl()` | `clearbit/enrichment/FindPerson`, `plivo/sms/SendSMSAndWaitForReply`, `twilio/calls/ForwardCall`, `utils/tasks/RequestApproval` |
| Only a status endpoint to poll | **Continuation chain** — `context.setTimeout` | `gladia/core/TranscribeAudio`, `akamai/lib.js` |

Prefer the self-callback whenever the provider supports one: it delivers in
seconds, while polling inherits whatever visibility lag the provider's job/log
API has (Deepgram's request log lags 12–17 minutes — see `09-testing.md`).

---

## 1. Self-callback

The component hands the provider **its own** webhook URL, so the same component
that started the job is the one the provider reports back to. No trigger, no
second flow, no polling.

```
receive(in) ──▶ submit job, callback = context.getWebhookUrl() ──▶ out { job id + echo }
                                       │
provider finishes, POSTs the result ───┘
receive(webhook) ──▶ look up the echo by job id ──▶ done { result + echo }
```

### component.json

```json
{
    "webhook": true,
    "outPorts": [
        { "name": "out",  "schema": { "…": "job id + the echoed input" } },
        { "name": "done", "schema": { "…": "the result + the same echo" } }
    ]
}
```

`"webhook": true` is what makes `context.getWebhookUrl()` available inside
`receive()`. The component stays a **plain action** — no `trigger`, no `tick`.

### Behavior

```javascript
const jobKey = (requestId) => `job-${requestId}`;

module.exports = {

    async receive(context) {

        // ── the provider calling back ──────────────────────────────────
        if (context.messages.webhook) {

            const body = (context.messages.webhook.content || {}).data || {};
            const requestId = (body.metadata || {}).request_id;

            // The submit branch stashed this job's input under its id; replaying
            // it here is what lets downstream tell parallel jobs apart.
            const submitted = (requestId && await context.stateGet(jobKey(requestId))) || {};

            await context.sendJson({
                ...submitted,
                request_id: requestId,
                result: body.result
            }, 'done');

            if (requestId) {
                await context.stateUnset(jobKey(requestId));
            }

            // Acknowledge, or the provider keeps retrying the callback.
            return context.response();
        }

        // ── the submit ─────────────────────────────────────────────────
        const { audioUrl, correlationId } = context.messages.in.content;

        const response = await lib.apiRequest(context, {
            method: 'POST',
            path: '/v1/jobs',
            params: { callback: context.getWebhookUrl() },
            data: { url: audioUrl }
        });

        const requestId = (response.data || {}).request_id;
        const echo = { audioUrl, correlationId };

        if (requestId) {
            await context.stateSet(jobKey(requestId), echo);
        }

        return context.sendJson({ ...echo, request_id: requestId }, 'out');
    }
};
```

### The echo is mandatory, not a nicety

**One component instance has ONE callback URL.** It is keyed by flow and
component — not by message. Ten parallel jobs all report back to the same place
and arrive in completion order, so the fifth `done` may belong to the eighth
input, and the webhook branch cannot see the message that started the job.

Nothing is *mixed up* — each callback carries its own payload — but without the
state-keyed echo a downstream component cannot tell which result belongs to
which input. So:

- Stash the job's inputs in component state under the provider's job id at
  submit time, replay them on the callback, and `stateUnset` afterwards.
- Namespace the key (`job-${id}`) so it cannot collide with other component
  state.
- Give the user a **Correlation ID** input — any value of their own (an order
  number, a file name, a record id) — and echo it on **both** ports.

### Do not expose the callback URL as an input

It looks helpful and it is a footgun: the moment a user fills it in, the
provider delivers elsewhere and the `done` port silently never fires. None of
the four reference components expose one. A user who wants the result somewhere
else sends `done` onward to an HTTP component.

---

## 2. Continuation chain (no callback available)

When the provider only offers "submit, then poll status", do not sleep in the
component — schedule a continuation with `context.setTimeout` and let the worker
go. State travels in the timeout payload.

```javascript
async receive(context) {

    // A continuation scheduled by a previous invocation.
    if (context.messages.timeout) {
        const { jobId, deadline, pollIntervalMs } = context.messages.timeout.content;
        const { data } = await lib.apiRequest(context, { path: `/jobs/${jobId}` });

        if (data.status === 'done') {
            return context.sendJson(data, 'out');
        }
        if (Date.now() > deadline) {
            throw new context.CancelError(`Job ${jobId} did not finish in time.`);
        }
        return context.setTimeout({ jobId, deadline, pollIntervalMs }, pollIntervalMs);
    }

    // The submit.
    const { data } = await lib.apiRequest(context, { method: 'POST', path: '/jobs', data: payload });
    return context.setTimeout({
        jobId: data.id,
        deadline: Date.now() + timeoutSeconds * 1000,
        pollIntervalMs
    }, pollIntervalMs);
}
```

**Appmixer will not schedule a continuation shorter than one minute** — that is
both the floor and a sensible default for the poll interval.

---

## Anti-patterns

| Do not | Why |
|--------|-----|
| Block on the provider's synchronous endpoint | The provider holds the connection until the job is done: one worker per job, and a gateway timeout past the provider's ceiling (Deepgram: 504 after 10 minutes, 20 for Whisper) |
| Use `tick()` to deliver the completion | A tick emit has no message scope — it cannot continue the branch that started the job, and it cannot see the input that produced it |
| Make a separate polling trigger the completion path | Couples two flows, and inherits the provider's log/visibility lag (measured: 12–17 min vs. 4 s by callback) |
| Expose the callback URL as a component input | Setting it silently kills the `done` port |

A polling trigger is still legitimate **on its own** — for jobs submitted
outside Appmixer. It just must not be the way an action component gets its own
result back.

## Testing an async component

E2E-test both ports in one flow: assert the job id on `out` **and** the result
on `done`, and wire both asserts into `AfterAll` so the flow cannot pass while
the callback path is broken. Size the `AfterAll` window for the provider's real
job duration.

If the component takes a Correlation ID, assert it comes back on `done` — that
is the only cheap way to catch a broken echo before a user hits it with ten
parallel jobs.
