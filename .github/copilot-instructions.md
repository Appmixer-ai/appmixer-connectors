# Appmixer Development & Component Creation Guidelines

## Overview

Appmixer is a workflow engine with a web user interface that allows end-users to create business processes using a drag-and-drop UI without writing code. This comprehensive guide covers connector development, authentication, component creation, and best practices for both AI assistance and human developers.

## Project Structure

```
src/
├── appmixer/           # Source code for connectors
└── examples/           # Example components (not for production)
test/
├── utils.js           # Appmixer stub for testing
└── [test files]
```

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

# Part 2: Authentication

## Overview

Appmixer supports multiple authentication methods. The `auth.js` file defines how users authenticate with the external service.

## Authentication Types

### API Key Authentication

For services that use API keys or tokens.

**Generic Example**:
```javascript
module.exports = {
  type: 'apiKey',
  definition: {
    tokenType: 'authentication-token',

    // Authentication fields shown to user
    auth: {
      domain: {
        type: 'text',
        name: 'Domain',
        tooltip: 'Your subdomain (e.g., "example" for example.service.com)'
      },
      apiKey: {
        type: 'text',
        name: 'API Key',
        tooltip: 'Find your API key in your account settings'
      }
    },

    // How to extract account name from profile
    accountNameFromProfileInfo: 'contact.email',

    // Fetch user profile information
    requestProfileInfo: async (context) => {
      return context.httpRequest({
        method: 'GET',
        url: `https://${context.domain}.service.com/api/v1/me`,
        auth: {
          user: context.apiKey,
          password: 'X'
        }
      });
    },

    // Validate credentials
    validate: async (context) => {
      const credentials = `${context.apiKey}:X`;
      const encoded = Buffer.from(credentials).toString('base64');

      await context.httpRequest({
        method: 'GET',
        url: `https://${context.domain}.service.com/api/v1/me`,
        headers: {
          'Authorization': `Basic ${encoded}`
        }
      });

      return true; // If request succeeds, credentials are valid
    }
  }
};
```

**Real-World Example (Freshdesk)**:
```javascript
module.exports = {
  type: 'apiKey',
  definition: {
    tokenType: 'authentication-token',
    auth: {
      domain: {
        type: 'text',
        name: 'Domain',
        tooltip: 'Your Freshdesk subdomain - e.g. if the domain is <i>https://example.freshdesk.com</i> just type <b>example</b> inside this field'
      },
      apiKey: {
        type: 'text',
        name: 'API Key',
        tooltip: 'Log into your Freshdesk account and find <i>Your API Key</i> in Profile settings page.'
      }
    },
    accountNameFromProfileInfo: 'contact.email',
    requestProfileInfo: async (context) => {
      return context.httpRequest({
        method: 'GET',
        url: `https://${context.domain}.freshdesk.com/api/v2/agents/me`,
        auth: {
          user: context.apiKey,
          password: 'X'
        }
      });
    },
    validate: async context => {
      const credentials = `${context.apiKey}:X`;
      const encoded = (new Buffer(credentials)).toString('base64');
      await context.httpRequest({
        method: 'GET',
        url: `https://${context.domain}.freshdesk.com/api/v2/agents/me`,
        headers: {
          'Authorization': `Basic ${encoded}`
        }
      });
      return true;
    }
  }
};
```

### OAuth 2.0 Authentication

For services using OAuth 2.0 flow.

**Generic Example**:
```javascript
module.exports = {
  type: 'oauth2',
  definition: () => ({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scope: ['profile', 'email'],

    // Extract account info from profile
    accountNameFromProfileInfo: (context) => context.profileInfo.email,
    emailFromProfileInfo: (context) => context.profileInfo.email,

    // Authorization URL
    authUrl: (context) => {
      const params = new URLSearchParams({
        client_id: 'your-client-id',
        redirect_uri: context.callbackUrl,
        response_type: 'code',
        scope: context.scope.join(' '),
        state: context.ticket,
        access_type: 'offline'
      });
      return `https://service.com/oauth/authorize?${params}`;
    },

    // Exchange authorization code for access token
    requestAccessToken: async (context) => {
      const response = await context.httpRequest({
        method: 'POST',
        url: 'https://service.com/oauth/token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: {
          code: context.authorizationCode,
          client_id: 'your-client-id',
          client_secret: 'your-client-secret',
          redirect_uri: context.callbackUrl,
          grant_type: 'authorization_code'
        }
      });

      return {
        accessToken: response.data.access_token,
        accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000),
        refreshToken: response.data.refresh_token
      };
    },

    // Get user profile
    requestProfileInfo: async (context) => {
      const response = await context.httpRequest({
        method: 'GET',
        url: 'https://service.com/api/v1/userinfo',
        headers: { Authorization: `Bearer ${context.accessToken}` }
      });
      return response.data;
    },

    // Refresh expired access token
    refreshAccessToken: async (context) => {
      const response = await context.httpRequest({
        method: 'POST',
        url: 'https://service.com/oauth/token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: {
          client_id: 'your-client-id',
          client_secret: 'your-client-secret',
          refresh_token: context.refreshToken,
          grant_type: 'refresh_token'
        }
      });

      return {
        accessToken: response.data.access_token,
        accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000)
      };
    },

    // Validate access token
    validateAccessToken: async (context) => {
      const response = await context.httpRequest({
        method: 'GET',
        url: 'https://service.com/api/v1/tokeninfo',
        params: { access_token: context.accessToken }
      });
      return !!response.data.expires_in;
    }
  })
};
```

**Real-World Example (Google OAuth2)**:
```javascript
module.exports = {
  type: 'oauth2',
  definition: () => {
    return {
      clientId: initData.clientId,
      clientSecret: initData.clientSecret,
      scope: ['profile', 'email'],

      accountNameFromProfileInfo: function(context) {
        return context.profileInfo.email;
      },

      emailFromProfileInfo: function(context) {
        return context.profileInfo.email;
      },

      authUrl: function(context) {
        const params = new URLSearchParams({
          client_id: initData.clientId,
          redirect_uri: context.callbackUrl,
          response_type: 'code',
          scope: context.scope.join(' '),
          state: context.ticket,
          access_type: 'offline',
          approval_prompt: 'force'
        }).toString();

        return `https://accounts.google.com/o/oauth2/auth?${params}`;
      },

      requestAccessToken: async function(context) {
        const data = {
          code: context.authorizationCode,
          client_id: initData.clientId,
          client_secret: initData.clientSecret,
          redirect_uri: context.callbackUrl,
          grant_type: 'authorization_code'
        };

        const response = await context.httpRequest({
          method: 'POST',
          url: 'https://oauth2.googleapis.com/token',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data
        });

        return {
          accessToken: response.data.access_token,
          accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000),
          refreshToken: response.data.refresh_token
        };
      },

      requestProfileInfo: async function(context) {
        const response = await context.httpRequest({
          method: 'GET',
          url: 'https://www.googleapis.com/oauth2/v2/userinfo',
          headers: {
            Authorization: `Bearer ${context.accessToken}`
          }
        });

        if (!response.data) {
          throw new Error('Failed to retrieve profile info');
        }

        return response.data;
      },

      refreshAccessToken: async function(context) {
        const data = {
          client_id: initData.clientId,
          client_secret: initData.clientSecret,
          refresh_token: context.refreshToken,
          grant_type: 'refresh_token'
        };

        const response = await context.httpRequest({
          method: 'POST',
          url: 'https://oauth2.googleapis.com/token',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data
        });

        return {
          accessToken: response.data.access_token,
          accessTokenExpDate: new Date(Date.now() + response.data.expires_in * 1000)
        };
      },

      validateAccessToken: async function(context) {
        const response = await context.httpRequest({
          method: 'GET',
          url: 'https://www.googleapis.com/oauth2/v2/tokeninfo',
          params: {
            access_token: context.accessToken
          }
        });

        if (response.data.expires_in) {
          return !!response.data.expires_in;
        }

        return false;
      }
    };
  }
};
```

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
- `integer` → `number`
- `boolean` → `toggle`

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
            "options": [
                { "label": "Task ID", "value": "id" },
                { "label": "Title", "value": "title" },
                { "label": "Created Date", "value": "created_at" }
            ]
        }
    ]
}
```

---

# Part 8: Best Practices

## Code Style Guidelines (For All)

- Use 4 spaces for indentation
- Add one empty line after function definitions
- Add one empty line after the `receive` function definition
- Use camelCase for variable names in JavaScript behavior files (destructure with aliases if needed)
- Remove all unused variables and imports
- Property names in component.json must use underscore `_` or camelCase as separator (NOT pipe `|`, e.g., `lock_type` or `lockType`, not `lock|type`)
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
- should return additional info like `fileSize`, `prompt`, etc. See component.json `outPorts.options` for more details

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

# Testing Guidelines

### Unit Tests

- Use `mocha` for unit tests
- Place tests in `test/unit` directory
- Use `assert` from Node.js for assertions

When working on a single connector, you can run tests with:

```bash
npm run test-unit -- test/<connector_name>
```