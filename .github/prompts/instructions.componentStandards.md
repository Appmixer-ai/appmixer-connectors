# Appmixer Component Creation Guidelines

## Overview

This guide provides comprehensive patterns and best practices for creating Appmixer components. Components are the building blocks of workflows that perform specific actions like fetching data, creating items, or triggering on events.

## General Principles

- For components that require an ID as input, there must be another component that returns the entity from which the ID can be obtained. For example, if a connector has a GetEmail component that takes emailId as input, then there must also be a FindEmails component that returns one or more email entities containing the emailId.


## General Principles

- For components that require an ID as input, there must be another component that returns the entity from which the ID can be obtained. For example, if a connector has a GetEmail component that takes emailId as input, then there must also be a FindEmails component that returns one or more email entities containing the emailId.

## Component Types

### 1. Action Components

Action components perform operations when triggered by input data. They don't run continuously but execute when they receive input.

#### Find (Items) Components

**Purpose**: Search for items based on criteria, returns array of matching items.

**Pattern**: `Find{EntityName}` (e.g., `FindTasks`, `FindUsers`, `FindProjects`)

**Key Characteristics**:
- Returns array of items
- Includes `outputType` for array vs individual items, `outputType` is always the last property in the `inPorts` schema, it has maximum index.
- Has `notFound` output port for when no items match
- Limited by query/filter parameters
- no pagination, no limit. It returns maximum items per one page. Maximum number of items is mentioned in the description.

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
                    "limit": { "type": "number", "default": 50 },
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
                    "limit": {
                        "type": "number",
                        "index": 3,
                        "label": "Limit",
                        "tooltip": "Maximum number of results to return (default: 50)"
                    },
                    "outputType": {
                        "type": "select",
                        "label": "Output Type",
                        "index": 5,
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

**Example behavior pattern**:
```javascript
'use strict';

const lib = require('../../lib');

// schema of the single item
const schema = {
    'lastModifyingUser': {
        'type': 'object',
        'properties': {
            'displayName': { 'type': 'string', 'title': 'Last Modifying User.Display Name' },
            'kind': { 'type': 'string', 'title': 'Last Modifying User.Kind' },
            'title': 'Last Modifying User'
        },
    },
    'owners': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'photoLink': { 'type': 'string', 'title': 'Owners.Photo Link' }
            }
        },
        'title': 'Owners'
    },
    'capabilities': {
        'type': 'object', 'properties': {
            'canAcceptOwnership': { 'type': 'boolean', 'title': 'Capabilities.Can Accept Ownership' },
            'canAddChildren': { 'type': 'boolean', 'title': 'Capabilities.Can Add Children' },
            'canAddMyDriveParent': { 'type': 'boolean', 'title': 'Capabilities.Can Add My Drive Parent' },
            'canChangeCopyRequiresWriterPermission': {
                'type': 'boolean',
                'title': 'Capabilities.Can Change Copy Requires Writer Permission'
            },
            'canUntrash': { 'type': 'boolean', 'title': 'Capabilities.Can Untrash' }
        }, 'title': 'Capabilities'
    },
    'id': { 'type': 'string', 'title': 'Form Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'shared': { 'type': 'boolean', 'title': 'Shared' },
    'ownedByMe': { 'type': 'boolean', 'title': 'Owned By Me' }
};

module.exports = {

    async receive(context) {
        const orderBy = 'modifiedTime desc';
        const {
            searchQuery,
            outputType
        } = context.messages.in.content;

        // generate output port schema dynamicaly based on the outputType
        // this is triggered by definition from the component.json, outPorts.out.source.url=/component/appmixer/service/core/FindTasks?outPort=out",
        // it will generate output port options based on the outputType selected by the user
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Forms', value: 'forms' });
        }

        let query = 'mimeType=\'application/vnd.google-apps.form\'';

        if (searchQuery) {
            query += ` and name contains '${searchQuery.replace(/'/g, '\\\'')}'`;
        }

        const params = {
            q: query,
            orderBy,
            fields: 'nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,webViewLink,iconLink,thumbnailLink,owners,lastModifyingUser,shared,ownedByMe,capabilities)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        };

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://www.googleapis.com/drive/v3/files',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: params
        });

        // Calculate total forms and whether there are more pages
        const forms = data.files || [];

        if (forms.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // modify the output based on the outputType
        return lib.sendArrayOutput({ context, records: forms, outputType });
    }
};

```

lib.js
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
            // One by one.
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            // One by one.
            // One by one.
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            // All at once.
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {

            // Into CSV file.
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

    getProperty(obj, path) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;

                    res.push({
                        label, value: field, schema: schemaWithoutTitle
                    });
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

/**
 * @param {array} array
 * @returns {string}
 */
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

#### List (Items) Components

**Purpose**: "Find (Items) Components" are preferred. However, if the service does not provide any options to filter the output using search queries or other methods, use the List component instead. The List component retrieves all items of a specific type. 
IMPORTANT: Ignore pagination or limits—use the maximum available page size. Be sure to mention this in the component description, including the maximum page size count.

**Pattern**: `List{EntityName}` (e.g., `ListTasks`, `ListUsers`, `ListProjects`)

**Key Characteristics**:
- Returns array of items by default
- Includes `outputType` for array vs individual items

**Example component.json structure**:
```json
{
    "name": "appmixer.googleForms.core.ListForms",
    "author": "Appmixer <info@appmixer.com>",
    "description": "Fetches a list of Google Forms.",
    "version": "1.0.0",
    "private": false,
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
                        "tooltip": "Choose whether you want to receive the result set as one complete list, or first item only or one item at a time or stream the items to a file.",
                        "options": [
                            {
                                "label": "First Item Only",
                                "value": "first"
                            },
                            {
                                "label": "All items at once",
                                "value": "array"
                            },
                            {
                                "label": "One item at a time",
                                "value": "object"
                            },
                            {
                                "label": "Store to CSV file",
                                "value": "file"
                            }
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
                "url": "/component/appmixer/googleForms/core/FindForms?outPort=out",
                "data": {
                    "properties": {
                        "generateOutputPortOptions": true
                    },
                    "messages": {
                        "in/outputType": "inputs/in/outputType"
                    }
                }
            }
        }
    ]
}
```

#### Get (Item) Components

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
            "options": [
                { "label": "Task ID", "value": "id" },
                { "label": "Title", "value": "title" },
                { "label": "Description", "value": "description" },
                { "label": "Status", "value": "status" },
                { "label": "Created Date", "value": "created_at" }
            ]
        }
    ]
}
```

**Example behavior pattern**:
```javascript
module.exports = {
    async receive(context) {
        const { taskId } = context.messages.in.content;
        
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

#### Create (Item) Components

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
            "options": [
                { "label": "Task ID", "value": "id" },
                { "label": "Title", "value": "title" },
                { "label": "Status", "value": "status" },
                { "label": "Created Date", "value": "created_at" }
            ]
        }
    ]
}
```

#### Delete (Item) Components

**Purpose**: Delete an item by its unique identifier.

**Pattern**: `Delete{EntityName}` (e.g., `DeleteTask`, `DeleteUser`, `DeleteProject`)

**Key Characteristics**:
- Deletes item by ID
- Returns empty object on success
- Irreversible action

**Example behavior pattern**:
```javascript
module.exports = {
    async receive(context) {
        const { taskId } = context.messages.in.content;
        
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

#### Update (Item) Components

**Purpose**: Update an existing item with new data.
**Pattern**: `Update{EntityName}` (e.g., `UpdateTask`, `UpdateUser`, `UpdateProject`)
**Key Characteristics**:
- Updates item by ID
- Returns empty object on success
- Requires at least ID to identify the item

**Example behavior pattern**:
```javascript
module.exports = {
    async receive(context) {
        const { taskId, name, price } = context.messages.in.content;
        const response = await context.httpRequest({
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

### 2. Trigger Components

Trigger components monitor for events and start workflows when conditions are met. They use polling or webhooks.

#### Common Trigger Patterns

**Key Characteristics**:
- Set `"trigger": true` in component.json
- Use `tick()` method for polling triggers
- Use `webhook()` method for webhook triggers
- Store state to track changes

#### New/Created (Item) Triggers

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
            "options": [
                { "label": "Task ID", "value": "id" },
                { "label": "Title", "value": "title" },
                { "label": "Created Date", "value": "created_at" }
            ]
        }
    ]
}
```

**Example behavior pattern**:
TODO
