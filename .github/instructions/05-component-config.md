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
