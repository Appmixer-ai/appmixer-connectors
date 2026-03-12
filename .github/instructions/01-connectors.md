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
