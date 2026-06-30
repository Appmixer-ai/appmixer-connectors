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
```json
{
    "name": "appmixer.service.core.FindTasks",
    "label": "Find Tasks",
    "description": "Search for tasks based on specified criteria. This component will return a maximum of 500 records",
    "inPorts": [
        {
            "name": "in",
            "schema": {
                "type": "object",
                "properties": {
                    "query": { "type": "string" },
                    "status": { "type": "string" },
                    "outputType": { "type": "string", "default": "array" }
                }
            },
            "inspector": {
                "inputs": {
                    "query": {
                        "type": "text",
                        "index": 1,
                        "label": "Search Query",
                        "tooltip": "Search term to find tasks"
                    },
                    "status": {
                        "type": "select",
                        "index": 2,
                        "label": "Status",
                        "options": [
                            { "label": "All", "value": "" },
                            { "label": "Open", "value": "open" },
                            { "label": "Completed", "value": "completed" }
                        ]
                    },
                    "outputType": {
                        "type": "select",
                        "label": "Output Type",
                        "index": 3,
                        "defaultValue": "array",
                        "tooltip": "Choose whether you want to receive the result set as one complete list, or first item only or one item at a time or stream the items to a file.",
                        "options": [
                            { "label": "First Item Only", "value": "first" },
                            { "label": "All items at once", "value": "array" },
                            { "label": "One item at a time", "value": "object" },
                            { "label": "Store to CSV file", "value": "file" }
                        ]
                    }
                }
            }
        }
    ],
    "outPorts": [
        {
            "name": "out",
            "source": {
                "url": "/component/appmixer/service/core/FindTasks?outPort=out",
                "data": {
                    "properties": {
                        "generateOutputPortOptions": true
                    },
                    "messages": {
                        "in/outputType": "inputs/in/outputType"
                        // Fake any other required inputs here if needed
                    }
                }
            }
        },
        {
            "name": "notFound"
        }
    ]
}
```

**Example behavior pattern with lib support**:
```javascript
'use strict';

const lib = require('../../lib');

// schema of the single item
const schema = {
    'id': { 'type': 'string', 'title': 'Task Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'status': { 'type': 'string', 'title': 'Status' }
};

module.exports = {
    async receive(context) {
        const { searchQuery, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tasks', value: 'tasks' });
        }

        // any required inputs validation can be done here

        let url = 'https://api.service.com/tasks';
        const params = {};

        if (searchQuery) {
            params.q = searchQuery;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const tasks = data.tasks || [];

        if (tasks.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: tasks, outputType });
    }
};
```

**lib.js helper utilities**:
```javascript
const pathModule = require('path');

const DEFAULT_PREFIX = '{{connector_name}}-objects-export';

module.exports = {
    async sendArrayOutput({
                              context,
                              outputPortName = 'out',
                              outputType = 'array',
                              records = []
                          }) {
        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {
            const csvString = toCsv(records);
            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {
        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;
                    res.push({ label, value: field, schema: schemaWithoutTitle });
                    return res;
                }, [{
                    label: 'Current Item Index',
                    value: 'index',
                    schema: { type: 'integer' }
                }, {
                    label: 'Items Count',
                    value: 'count',
                    schema: { type: 'integer' }
                }]);
            return context.sendJson(options, 'out');
        }

        if (outputType === 'array') {
            return context.sendJson([{
                label,
                value,
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};

const toCsv = (array) => {
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(items => {
            return Object.values(items).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property;
            }).join(',');
        })
    ].join('\n');
};
```

### outputType Helper Functions (REQUIRED)

Components with `outputType` (Find/List) **MUST** use standardized lib.js helpers.

**Required functions in connector's lib.js:**
- `sendArrayOutput({ context, outputPortName = 'out', outputType, records })` - handles all output types
- `getOutputPortOptions(context, outputType, schema, { label })` - dynamic output schema

**Canonical implementation:** Copy from `appmixer-cli/src/ai/src/templates/libs/lib.js`

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
- lib.js MUST exist in connector root if component has outputType
- Run `npm run validate-outputtype` to check compliance

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
```json
{
    "name": "appmixer.googleForms.core.ListForms",
    "author": "Appmixer <info@appmixer.com>",
    "description": "Fetches a list of Google Forms.",
    "version": "1.0.0",
    "auth": {
        "service": "appmixer:googleForms",
        "scope": [
            "https://www.googleapis.com/auth/drive.readonly"
        ]
    },
    "quota": {
        "manager": "appmixer:googleForms",
        "resources": "forms.api",
        "scope": {
            "userId": "{{userId}}"
        }
    },
    "inPorts": [
        {
            "name": "in",
            "schema": {
                "type": "object",
                "properties": {
                    "outputType": {
                        "type": "string"
                    }
                }
            },
            "inspector": {
                "inputs": {
                    "outputType": {
                        "type": "select",
                        "label": "Output Type",
                        "index": 2,
                        "defaultValue": "array",
                        "options": [
                            { "label": "First Item Only", "value": "first" },
                            { "label": "All items at once", "value": "array" },
                            { "label": "One item at a time", "value": "object" },
                            { "label": "Store to CSV file", "value": "file" }
                        ]
                    }
                }
            }
        }
    ],
    "outPorts": [
        {
            "name": "out",
            "source": {
                "url": "/component/appmixer/googleForms/core/ListForms?outPort=out",
                "data": {
                    "properties": {
                        "generateOutputPortOptions": true
                    },
                    "messages": {
                        "in/outputType": "inputs/in/outputType"
                        // Fake any other required inputs here if needed
                    }
                }
            }
        }
    ]
}
```

### Get (Item) Components

**Purpose**: Retrieve a single item by its unique identifier.

**Pattern**: `Get{EntityName}` (e.g., `GetTask`, `GetUser`, `GetProject`)

**Key Characteristics**:
- Returns single item
- Requires unique identifier (ID)
- Throws error if item not found

**Example component.json structure**:
```json
{
    "name": "appmixer.service.core.GetTask",
    "label": "Get Task",
    "description": "Retrieve a specific task by ID.",
    "inPorts": [
        {
            "name": "in",
            "inspector": {
                "inputs": {
                    "taskId": {
                        "type": "text",
                        "index": 1,
                        "label": "Task ID",
                        "tooltip": "The unique identifier of the task"
                    }
                }
            },
            "schema": {
                "type": "object",
                "properties": {
                    "taskId": { "type": "string" }
                },
                "required": ["taskId"]
            }
        }
    ],
    "outPorts": [
        {
            "name": "out",
            "schema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "title": "Task ID", "example": "1001" },
                    "title": { "type": "string", "title": "Title", "example": "Buy groceries" },
                    "description": { "type": "string", "title": "Description", "example": "Milk, eggs, bread" },
                    "status": { "type": "string", "title": "Status", "example": "open" },
                    "created_at": { "type": "string", "format": "date-time", "title": "Created Date", "example": "2025-01-15T10:30:00Z" }
                }
            }
        }
    ]
}
```

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
```json
{
    "name": "appmixer.service.core.CreateTask",
    "label": "Create Task",
    "description": "Create a new task in the service",
    "inPorts": [
        {
            "name": "in",
            "schema": {
                "type": "object",
                "properties": {
                    "title": { "type": "string" },
                    "description": { "type": "string" },
                    "priority": { "type": "string" },
                    "dueDate": { "type": "string", "format": "date" }
                },
                "required": ["title"]
            },
            "inspector": {
                "inputs": {
                    "title": {
                        "type": "text",
                        "index": 1,
                        "label": "Title",
                        "tooltip": "Task title"
                    },
                    "description": {
                        "type": "textarea",
                        "index": 2,
                        "label": "Description",
                        "tooltip": "Task description"
                    },
                    "priority": {
                        "type": "select",
                        "index": 3,
                        "label": "Priority",
                        "options": [
                            { "label": "Low", "value": "low" },
                            { "label": "Medium", "value": "medium" },
                            { "label": "High", "value": "high" }
                        ]
                    },
                    "dueDate": {
                        "type": "date",
                        "index": 4,
                        "label": "Due Date",
                        "tooltip": "When the task should be completed"
                    }
                }
            }
        }
    ],
    "outPorts": [
        {
            "name": "out",
            "schema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "title": "Task ID", "example": "1001" },
                    "title": { "type": "string", "title": "Title", "example": "Buy groceries" },
                    "status": { "type": "string", "title": "Status", "example": "open" },
                    "created_at": { "type": "string", "format": "date-time", "title": "Created Date", "example": "2025-01-15T10:30:00Z" }
                }
            }
        }
    ]
}
```

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
```json
{
    "name": "appmixer.service.core.NewTask",
    "label": "New Task",
    "description": "Triggers when a new task is created",
    "trigger": true,
    "tick": true,
    "outPorts": [
        {
            "name": "out",
            "schema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "title": "Task ID", "example": "1001" },
                    "title": { "type": "string", "title": "Title", "example": "Buy groceries" },
                    "created_at": { "type": "string", "format": "date-time", "title": "Created Date", "example": "2025-01-15T10:30:00Z" }
                }
            }
        }
    ]
}
```

**Behavior file pattern**:
```javascript
'use strict';

module.exports = {

    async tick(context) {

        const { projectId } = context.properties;

        // Fetch items from API
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.service.com/projects/${projectId}/tasks`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        // Load previously known items from state
        const state = await context.loadState();
        const known = state.known ? new Set(state.known) : null;

        // Find new items by comparing with known items
        const tasks = data.tasks || [];
        const newItems = [];
        const actual = [];

        for (const task of tasks) {
            actual.push(task.id);
            if (known && !known.has(task.id)) {
                newItems.push(task);
            }
        }

        // Send new items to output port
        for (const item of newItems) {
            await context.sendJson(item, 'out');
        }

        // Save current state for next tick
        await context.saveState({ known: actual });
    }
};
```

**State Management Pattern using lib.js helper**:
```javascript
'use strict';
const lib = require('../../lib');

module.exports = {

    async tick(context) {

        const { projectId } = context.properties;

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.service.com/projects/${projectId}/tasks`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        // Use lib helper for state comparison
        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, data.tasks, 'id');

        if (diff.length) {
            await Promise.all(diff.map(task => context.sendJson(task, 'out')));
        }

        await context.saveState({ known: actual });
    }
};
```

#### 2. Webhook Triggers (`webhook: true`)

Webhook triggers receive HTTP callbacks from external services. They require lifecycle methods to register/unregister webhooks.

**component.json structure**:
```json
{
    "name": "appmixer.service.core.UpdatedContact",
    "label": "Updated Contact",
    "description": "Triggers when a contact is updated.",
    "author": "Appmixer <info@appmixer.com>",
    "webhook": true,
    "auth": {
        "service": "appmixer:service"
    },
    "properties": {
        "schema": {
            "properties": {
                "listId": { "type": "string" }
            }
        },
        "inspector": {
            "inputs": {
                "listId": {
                    "type": "select",
                    "label": "List",
                    "index": 1,
                    "source": {
                        "url": "/component/appmixer/service/core/ListLists?outPort=out",
                        "data": {
                            "transform": "./transformers#listsToSelectArray"
                        }
                    }
                }
            }
        }
    },
    "outPorts": [
        {
            "name": "out",
            "schema": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "title": "Contact ID", "example": "c-1001" },
                    "email": { "type": "string", "title": "Email", "example": "jane@example.com" },
                    "updated_at": { "type": "string", "format": "date-time", "title": "Updated Date", "example": "2025-01-15T10:30:00Z" }
                }
            }
        }
    ]
}
```

**Behavior file pattern**:
```javascript
'use strict';

module.exports = {

    async start(context) {

        // Register webhook with external service when flow starts
        const webhookUrl = context.getWebhookUrl();
        const { listId } = context.properties;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.service.com/webhooks',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                url: webhookUrl,
                events: ['contact.updated'],
                listId: listId
            }
        });

        // Save webhook ID for cleanup
        return context.saveState({ webhookId: data.id });
    },

    async receive(context) {

        // Handle incoming webhook payload
        if (context.messages.webhook) {
            const payload = context.messages.webhook.content.data;

            // Optionally fetch additional data from API
            const { data } = await context.httpRequest({
                method: 'GET',
                url: `https://api.service.com/contacts/${payload.contactId}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });

            await context.sendJson(data, 'out');

            // IMPORTANT: Always return context.response() to acknowledge webhook
            return context.response();
        }
    },

    async stop(context) {

        // Clean up: unregister webhook when flow stops
        const { webhookId } = await context.loadState();

        if (webhookId) {
            await context.httpRequest({
                method: 'DELETE',
                url: `https://api.service.com/webhooks/${webhookId}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });
        }
    }
};
```

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

```javascript
'use strict';
module.exports = async context => {
    require('./routes')(context);
    context.log('info', '[MYSERVICE] Plugin initialized.');
};
```

`routes.js` — registers the HTTP endpoint(s) and the listener-added validator:

```javascript
'use strict';

module.exports = async context => {

    // Runs every time a trigger calls context.addListener().
    // Use it to validate params, transform them, or perform per-subscription
    // setup against the upstream API.
    context.onListenerAdded(async listener => {
        // listener.eventName, listener.params  — mutable
        // throw to reject the subscription
    });

    context.http.router.register({
        method: 'POST',
        path: '/events',                        // → /plugins/<vendor>/<service>/events
        options: {
            auth: false,
            handler: async (req, h) => {
                if (!isValidSignature(context, req)) {
                    return h.response(undefined).code(401);
                }

                // Optional verification handshake (GET hub.challenge etc.)
                if (req.payload?.challenge) {
                    return { challenge: req.payload.challenge };
                }

                // Parse the payload then dispatch per-listener.
                await context.triggerListeners({
                    eventName: extractEventName(req.payload),
                    payload: extractEventBody(req.payload),
                    filter: listener => listener.params.userId === extractUserId(req.payload)
                });
                return {};
            }
        }
    });
};
```

The endpoint URL is `<API_BASE>/plugins/<vendor>/<service>/<path>` — derived from the connector's directory path. **No `context.getWebhookUrl()` is involved** — the admin configures this single URL on the upstream service once.

**Trigger component pattern**

```javascript
'use strict';

module.exports = {

    async start(context) {

        // (Optional) Upstream-side per-subscription setup. Mandatory only if
        // the upstream needs to know "this user wants events" — e.g. Meta's
        // POST /{waba-id}/subscribed_apps.

        await context.addListener(`channel:${context.properties.channelId}`, {
            userId: context.profileInfo.userId,
            accessToken: context.auth.accessToken
        });
    },

    async stop(context) {
        await context.removeListener(`channel:${context.properties.channelId}`);
    },

    async receive(context) {
        if (!context.messages.webhook) return;
        const data = context.messages.webhook.content.data;     // payload passed in via triggerListeners
        await context.sendJson(data, 'out');
    }
};
```

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
```javascript
'use strict';

module.exports = {

    async start(context) {

        const { id, expirationTime } = await registerWebhook(context);

        return context.saveState({
            webhookId: id,
            expirationTime: Date.parse(expirationTime)
        });
    },

    async receive(context) {

        if (context.messages.webhook) {
            const payload = context.messages.webhook.content.data;
            await context.sendJson(payload, 'out');
            return context.response();
        }
    },

    async tick(context) {

        // Use tick to refresh webhook before expiration
        let lock;
        try {
            lock = await context.lock(context.componentId);
            const state = await context.loadState();
            const { webhookId, expirationTime } = state;

            if (!webhookId) return;

            // Refresh 3 days before expiration
            const renewDate = expirationTime - (3 * 24 * 60 * 60 * 1000);
            const now = Date.now();

            if (now >= renewDate) {
                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: `https://api.service.com/webhooks/${webhookId}/refresh`,
                    headers: {
                        'Authorization': `Bearer ${context.auth.accessToken}`
                    }
                });
                state.expirationTime = Date.parse(data.expirationTime);
                await context.saveState(state);
            }
        } finally {
            if (lock) await lock.unlock();
        }
    },

    async stop(context) {

        const { webhookId } = await context.loadState();
        if (webhookId) {
            await context.httpRequest({
                method: 'DELETE',
                url: `https://api.service.com/webhooks/${webhookId}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });
        }
    }
};
```

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

Cache key is a SHA-256 hash of `{ url, token }` — unique per user and endpoint. TTL is configurable via `context.config.listCacheTTL` (default 120 s).

**Reference implementations:**
- Error suppression only: `src/appmixer/microsoft/onedrive/ListSites/ListSites.js`
- Caching + error suppression: `src/appmixer/facebookbusiness/marketing/GetAdAccounts/GetAdAccounts.js` + `facebookbusiness/lib.js`

---
