# Appmixer

## Overview

Appmixer is a workflow engine with a web user interface that allows end-users to create business processes using a
drag-and-drop UI without writing code.

## Project Structure

```
src/
├── appmixer/           # Source code for connectors
└── examples/           # Example components (not for production)
test/
├── utils.js           # Appmixer stub for testing
└── [test files]
```

# Connectors

## Overview

Connectors are integrations with external services. Each connector contains authentication logic, service metadata, and
one or more components that perform specific actions.

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

documentation: https://docs.appmixer.com/building-connectors/example-component#component-behaviour-sms-sendsms-sendsms.js

## Core Configuration Files

### package.json (Optional)

Optional file that contains dependencies.

### service.json

Describes the connector service and its metadata.

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

json schema of the service.json file:

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

```json
{
    "name": "appmixer.connectorname",
    "version": "1.0.0",
    "changelog": {
        "1.0.0": ["Initial release"],
        "1.0.1": ["Bug fixes and improvements"],
        "2.0.0": ["(breaking change) Updated API integration"]
    }
}
```
json schema of the bundle.json file:

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
            "description": "The changelog of the bundle, used to describe the changes in the bundle. for example: {\n        \"1.0.4\": [\n            \"Initial release\"\n        ],\n        \"1.0.5\": [\n            \"Renamed output varible name in LisBases from Array to Bases and in ListTables from Array to Tables.\"\n        ],\n        \"2.0.1\": [\n            \"(breaking change) Fixed output schema for ListTables and ListBases.\"\n        ]"
        }
    },
    "required": ["name", "version", "changelog"]
}
```

### quota.js

Defines rate limiting rules to prevent API quota violations.

```javascript
module.exports = {
    rules: [
        {
            limit: 2000,                          // Max calls per window
            throttling: 'window-sliding',         // Throttling method
            window: 1000 * 60 * 60 * 24,        // 24 hours in ms
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

**rules**: An array of rules that define usage limits. Each rule can have the following properties:
**limit**: Maximum number of calls in the time window specified by window.
**window**: The time window in milliseconds.
**throttling**: The throttling mechanism. Can be either a string 'window-sliding' or an object with type and
getStartOfNextWindow function.
**resource**: An identifier of the resource to which the rule applies. The resource is a way for a component to pick
rules that apply to that specific component. This can be done in the component manifest file in the quota.resources
section.

# Authentication

## Overview

Appmixer supports multiple authentication methods. The `auth.js` file defines how users authenticate with the external service.

## Authentication Types

### API Key Authentication

For services that use API keys or tokens.

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
                },
                json: true
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

### OAuth 2.0 Authentication

For services using OAuth 2.0 flow.

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

```js

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

            // curl https://mydomain.freshdesk.com/api/v2/agents/me \
            //  -u myApiKey:X'
            return context.httpRequest({
                method: 'GET',
                url: `https://${context.domain}.freshdesk.com/api/v2/agents/me`,
                auth: {
                    user: context.apiKey,
                    password: 'X'
                },
                json: true
            });
        },

        validate: async context => {

            // curl https://mydomain.freshdesk.com/api/v2/agents/me \
            //  -u myApiKey:X'
            const credentials = `${context.apiKey}:X`;
            const encoded = (new Buffer(credentials)).toString('base64');
            await context.httpRequest({
                method: 'GET',
                url: `https://${context.domain}.freshdesk.com/api/v2/agents/me`,
                headers: {
                    'Authorization': `Basic ${encoded}`
                }
            });
            // if the request doesn't fail, return true (exception will be captured in caller)
            return true;
        }
    }
};
```

type `oauth2` example :

```js
module.exports = {

    type: 'oauth2',

    definition: () => {

        return {

            clientId: initData.clientId,
            clientSecret: initData.clientSecret,

            scope: ['profile', 'email'],

            /**
             * Works exactly the same way as described in the `apiKey` section.
             * @param context
             * @returns {*|string}
             */
            accountNameFromProfileInfo: function(context) {
                return context.profileInfo.email;
            },

            emailFromProfileInfo: function(context) {
                return context.profileInfo.email;
            },

            /**
             * Function, object or a string URL returning auth URL. Appmixer will then use this URL to redirect the user to the proper authentication page. The `requestToken` is available in the context. The example shows the authUrl declaration using the token provided by the context.
             */
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

            /**
             * This function should return a promise with an object which contains `accessToken`, `refreshToken` (optional, some OAuth 2 implementations do not have refresh tokens) and accessTokenExpDate or expires_in (also optional if the implementation does not have tokens that expire). Inside this function, you should call the endpoint which handles the access tokens for the application. The following context properties are available to you in this function: clientId, clientSecret, callbackUrl and authorizationCode.
             * @param context
             * @returns {proimise}
             */
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

            /**
             * Works exactly the same way as described in the `apiKey` section.
             * @returns {*}
             */
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

            /**
             * Part of the OAuth 2 specification is the ability to refresh short-lived access tokens via a refresh token that is issued along with the access token. This function should call the refresh token endpoint on the third-party app and resolve to an object with `accessToken` and `accessTokenExpDate` (and `refreshToken` if needed) properties, as shown in the example.  You have access to context properties `clientId`, `clientSecret`, `callbackUrl` and `refreshToken`.
             * @param context
             * @returns {*}
             */
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

            /**
             * This property serves the same purpose as validate property in the API Key mechanism. This is used by Appmixer to test if the access token is valid and accepted by the third-party app. You have access to context.accessToken and context.accessTokenSecret to make authenticated requests. If the token is valid, this function should resolve to any value. Otherwise, throw an error.
             * @param context
             * @returns {boolean}
             */
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


# Components

## Overview

Components are the building blocks of workflows. Each component performs a specific action like sending an email, creating a task, or fetching data.
A component is a self-contained unit of functionality that can be used in Appmixer workflows. It can have multiple
inPorts and outPorts, and it can be used to process data, trigger actions, or perform other tasks.
A component is defined by a `component.json` file and a "behavior" file with the same name as the component folder.

## Component Structure

Each component consists of:
- `component.json` - Configuration and metadata
- `ComponentName.js` - Behavior and logic

### component.json

json schema of the component.json

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
            "description": "The label of your component. If not label is specified, then last part of name will be used when component is dropped into Designer. If your component name is appmixer.twitter.statuses.CreateTweet then CreateTweet will be name of the component unless you specify label property. This allows you to use spaces as opposed to the name property. "
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
                "maxWait": { "type": "integer" },
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
                    "description": "We support full schema definition for each option, so you can specify the structure of the data that is coming out from your component. You can add a schema property to each option, which contains a JSON Schema definition. For example:\n\nCopy\n{\n    \"outPorts\": [\n        {\n            \"name\": \"weather\",\n            \"options\": [\n                { \"label\": \"Temperature\", \"value\": \"main.temp\" },\n                { \"label\": \"Pressure\", \"value\": \"main.pressure\" },\n                { \"label\": \"Humidity\", \"value\": \"main.humidity\" },\n                { \"label\": \"Sunrise time (unix, UTC)\", \"value\": \"sys.sunrise\" },\n                { \"label\": \"Sunset time (unix, UTC)\", \"value\": \"sys.sunset\" },\n                { \"label\": \"City name\", \"value\": \"name\" },\n                { \n                    \"label\": \"Weather data\", \n                    \"value\": \"weather\", \n                    \"schema\": {\n                        \"type\": \"array\",\n                        \"items\": {\n                            \"type\": \"object\",\n                            \"properties\": {\n                                \"description\": { \"type\": \"string\", \"title\": \"Weather description\" },\n                                \"icon\": { \"type\": \"string\", \"title\": \"Weather icon code\" },\n                                \"iconUrl\": { \"type\": \"string\", \"title\": \"Weather icon URL\" }\n                            }    \n                        }\n                    }\n                }\n            ]\n        }\n    ]\n}",
                    "items": {
                        "type": "object",
                        "properties": {
                            "content": { "type": "string" },
                            "label": { "type": "string" },
                            "value": { "type": "string" }
                        },
                        "required": ["value"]
                    }
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
        "inspectorInput": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "type": { "type": "string" },
                        "tooltip": { "type": "string" },
                        "index": { "type": "number" },
                        "placeholder": { "type": "string" },
                        "options": { "$ref": "#/definitions/options" },
                        "source": { "$ref": "#/definitions/source" }
                    },
                    "additionalProperties": true,
                    "required": ["type", "index"]
                },
                {
                    "type": "object",
                    "properties": {
                        "source": { "$ref": "#/definitions/source" }
                    },
                    "additionalProperties": false,
                    "required": ["source"]
                }
            ]
        },
        "inspector": {
            "description": "Inspector tells the Designer UI how the input fields should be rendered. The format of this definition uses the Rappid Inspector definition format.",
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "inputs": {
                            "patternProperties": {
                                "^.*$": { "$ref": "#/definitions/inspectorInput" }
                            }
                        }
                    },
                    "required": ["inputs"]
                },
                {
                    "type": "object",
                    "description": "Sometimes the structure of the inspector is not known in advance and it cannot be hardcoded in the manifest. Instead, the inspector fields are composed dynamically based on the data received from an API. A good example is the google.spreadsheets.CreateRow component where the inspector renders fields representing columns fetched from the actual worksheet. For this to work, we can define the source property in the manifest that calls a component of our choosing in a so called \"static\" mode. Example: {\n       \"source\": {\n           \"url\": \"/component/appmixer/google/spreadsheets/ListColumns?outPort=out\",\n           \"data\": {\n               \"messages\": {\n                   \"in\": 1\n               },\n               \"properties\": {\n                   \"sheetId\": \"properties/sheetId\",\n                   \"worksheet\": \"properties/worksheet\"\n               },\n               \"transform\": \"./transformers#columnsToInspector\"\n           }\n       }\n}\n",
                    "properties": {
                        "source": { "$ref": "#/definitions/source" }
                    },
                    "required": ["source"]
                }
            ]
        },
        "inPort": {
            "allOf": [
                { "$ref": "#/definitions/port" },
                {
                    "type": "object",
                    "properties": {
                        "inspector": { "$ref": "#/definitions/inspector" }
                    }
                }
            ]
        },
        "inPorts": {
            "description": "The definition of the input ports of the component. It's an array of objects.\n\nEach component can have zero or more input ports. If a component does not have any input ports, we call it a trigger. Input ports allow a component to be connected to other components. Input ports receive data from output ports of other connected components when the flow is running and the data is available. Each input port has a name and configuration that has the exact same structure as the configuration of properties, i.e. it has schema , inspector or source objects. The difference is that the user can use placeholders (variables) in the data fields that will be eventually replaced once the actual data is available. The placeholders (variables) can be entered by the user using the \"variables picker\" in the Designer UI inspector (see below)",
            "type": "array",
            "minItems": 0,
            "items": {
                "oneOf": [
                    { "$ref": "#/definitions/inPort" },
                    { "type": "string" }
                ]
            },
            "uniqueItems": true
        },
        "ports": {
            "description": "The definition of the output ports of the component. It's an array of objects.\n\nComponents can have zero or more output ports. Each output port has a name and optionally an array options that defines the structure of the message that this output port emits. Without the options object, the user won't be able to see the possible variables they can use in the other connected components. For example, a component connected to the weather output port of our GetCurrentWeather component can see the following variables in the variables picker",
            "type": "array",
            "minItems": 0,
            "items": {
                "oneOf": [
                    { "$ref": "#/definitions/port" },
                    { "type": "string" }
                ]
            },
            "uniqueItems": true
        }
    }
}
```

Desired order of attributes in `component.json`:
1. `name`
2. `label`
3. `description`
4. `author`
5. `version`
6. `auth`
7. `inPorts`
8. `properties`
9. `outPorts`
10. `icon`

### Component Behavior (JavaScript)

The behavior file contains the component's logic.

#### Basic Structure

##### `receive`
function is called when the component receives data from the input port.

```javascript
module.exports = {
    async receive(context) {
        
        // Get input data
        const { message, priority, count } = context.messages.in;
        
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

#### `context` Object

#### Advanced Features

##### Trigger Components

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

##### Webhook Components

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

# Best Practices

## Code Style Guidelines

- Use 4 spaces for indentation
- Add one empty line after function definitions
- Use camelCase for variable and function names
- Follow consistent formatting patterns

## Development Guidelines

- **Validation**: Don't check required properties in behavior code - use schema validation
- **Error Handling**: Always handle API errors gracefully
- **Authentication**: Store sensitive data in auth configuration, not component code
- **Rate Limiting**: Use quota.js to prevent API abuse
- **Documentation**: Provide clear descriptions and tooltips for all fields

## Performance Considerations

- **Caching**: Cache frequently accessed data (e.g., user lists, configuration)
- **Pagination**: Handle large datasets with proper pagination
- **Locking**: Use locking mechanisms for shared resources
- **Batching**: Batch API calls when possible to reduce requests

## Common Patterns

### When adding new field to component.json

> Use-case: "I want to add a new number field `itemCount` to the `MyAwesomeComponent` component."

- Add the field to both `schema` and `inspector` sections in the `inPorts` array. Follow json schema format.
- Add the fields to behavior JS file, especially in `context.httpRequest` call.


### Dynamic Field Options

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

### File Handling

For file input components:

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
