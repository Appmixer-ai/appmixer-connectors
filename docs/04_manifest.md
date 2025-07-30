# Manifest

The component manifest provides information about a component (such as name, icon, author, description and input/outputs definition) in a JSON text file. The manifest file must be named **component.json**.

Example manifest file:

```
{
    "name": "appmixer.utils.controls.OnStart",
    "author": "Martin Krčmář <martin@client.io>",
    "label": "On Flow Start",
    "description": "This trigger fires once and only once the flow starts.",
    "icon": "data:image/svg+xml;base64,PD94bWwgdmV...",
    "outPorts": [
        {
            "name": "out",
            "schema": {
                "properties": {
                    "started": {
                        "type": "string",
                        "format": "date-time"
                    }
                },
                "required": [ "started" ]
            },
            "options": [
                { "label": "Start time", "value": "started" }
            ]
        }
    ]
}
```

# name

(_required)_

The name of your component. The name must have the following format: **\[vendor].\[service].\[module].\[component]**. Note that all the parts of the name must contain alphanumeric characters only. For example:

```
{ "name": "appmixer.twitter.statuses.CreateTweet" }
```

The `vendor` part of the component name is the ID of the author of the component set. `service` and `module` allows you to organize your components into categories. These categories not only help you keep your components in a tidy hierarchical structure but it also has a meaning in that you can share your authentication and quota definitions between modules and components (more on that later). `component` describes the actual component activity.

# label

(_optional)_

The label of your component. If not label is specified, then last part of `name` will be used when component is dropped into Designer. If your component name is `appmixer.twitter.statuses.CreateTweet` then `CreateTweet` will be name of the component unless you specify `label` property. This allows you to use spaces as opposed to the `name` property.&#x20;

```
{ "label": "Create Tweet" }
```

# icon

The icon representing the component in the UI. It must be in the Data URI image format as described here: [https://en.wikipedia.org/wiki/Data\_URI\_scheme](https://en.wikipedia.org/wiki/Data_URI_scheme). `image/png` or `image/svg+xml` image types are recommended. Example:

```
{
    "icon": "data:image/svg+xml;base64,PD94bWwgdmV..."
}
```

# description

Description of your component. The description is displayed in the Designer UI inspector panel like this:

![Component Description](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wX6vC3ERnOFpc31W4%2F-L_wZRQ0CgS1eEtwPt6W%2FScreenshot%202019-03-14%20at%2015.18.26.png?alt=media\&token=5dc20aa9-590f-4b22-8276-6d93a3322438)

The description should not be longer than a sentence or two. Example:

```
{
    "description": "This action gets the current weather conditions for a location."
}
```

# auth

The authentication service and parameters. For example:

```
{
    "auth": {
        "service": "appmixer:google",
        "scope": [
            "https://mail.google.com/",
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/gmail.send"
        ]
    }
}
```

The `auth.service` identifies the [authentication module](../authentication) that will be used to authenticate the user to the service that the component uses. It must have the following format: **\[vendor]:\[service]**. The Appmixer engine looks up the `auth.js` file under that vendor and service category. `auth.scope` provides additional parameters to the authentication module. See the Authentication section for more details.

When `auth` is defined, the component will have a section in the Designer UI inspector requiring the user to select from existing accounts or connect a new account. Only after an account is selected the user can continue configuring other properties of the component.

![Connected Accounts](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wX6vC3ERnOFpc31W4%2F-L_wa-u3yA7oI5VjxcFw%2FScreenshot%202019-03-14%20at%2015.25.22.png?alt=media\&token=3fa3a7aa-6e7f-43ff-b76d-59b2995def22)

# inPorts

The definition of the input ports of the component. It's an array of objects.

Each component can have zero or more input ports. If a component does not have any input ports, we call it a **trigger**. Input ports allow a component to be connected to other components. Input ports receive data from output ports of other connected components when the flow is running and the data is available. Each input port has a `name` and configuration that has the exact same structure as the configuration of `properties`, i.e. it has `schema` , `inspector` or `source` objects. The difference is that the user can use placeholders (variables) in the data fields that will be eventually replaced once the actual data is available. The placeholders (variables) can be entered by the user using the "variables picker" in the Designer UI inspector (see below). Example:

```json
{
    "inPorts": [
        {
            "name": "message",
            "schema": {
                "type": "object",
                "properties": {
                    "body": { "type": "string" },
                    "phoneNumber": { "type": "string" }
                },
                "required": [ "phoneNumber" ]
            },
            "inspector": {
                "inputs": {
                    "body": {
                        "type": "text",
                        "group": "transformation",
                        "label": "Text message",
                        "index": 1
                    },
                    "phoneNumber": {
                        "type": "text",
                        "group": "transformation",
                        "label": "Phone number",
                        "index": 2
                    }
                },
                "groups": {
                    "transformation": {
                        "label": "Transformation",
                        "index": 1
                    }
                }
            }
        }
    ]
}
```

![Input Port Configuration using Variables](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wafleSA7oup24f2Rm%2F-L_wcC27OQsaMGPIBmg2%2FScreenshot%202019-03-14%20at%2015.34.52.png?alt=media\&token=879eba67-be81-451e-bc83-1d311e94ef47)

The `message` from the example looks like this in the raw form:

```
City: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[name]}}}
Humidity: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[main.humidity]}}}
Pressure: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[main.pressure]}}}
Temperature: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[main.temp]}}}
```

As you can see, the placeholders for variables use a special format that the Appmixer engine eventually replaces with real values that come from the _GetCurrentWeather_ component once the data is available.

## inPort.schema

Definition of the schema of the data that the input port expects. Please see the [Properties Schema](../properties#properties.schema) section for more details.

## inPort.inspector

Definition of the inspector UI for this input port. Please see the [Properties Inspector](../properties#properties.inspector) section for more details.

## inPort.source

Definition of the source of the variables or dynamic inspector that will be available in the designer UI for this input port.

An example of how the _source_ property can be used to generate the input port Inspector dynamically for the appmixer.google.spreadsheets.CreateRow component. When showing the Inspector for the CreateRow, we need to know the structure (columns) of the Worksheet, the Inspector input fields will copy the columns in the Worksheet

```json
{
...
    "inPorts": [
        {
            "name": "in",
            "schema": {
                "type": "object"
            },
            "source": {
                // The ListColumns component can return an array of columns in a
                // Worksheet.
                "url": "/component/appmixer/google/spreadsheets/ListColumns?outPort=out",
                "data": {
                    // The ListColumns component needs two properties in order
                    // to get the list of columns, the Spreasheet Id and the
                    // Worksheet Id. Both will be taken from properties of the
                    // CreateRow component (the caller).
                    "properties": {
                        // Appmixer will replace 'properties/sheetId' with
                        // the actual value before making the call
                        "sheetId": "properties/sheetId",
                        "worksheetId": "properties/worksheetId"
                    },
                    // A transformer function 'columnsToInspector' from the 
                    // ListColumns.js will be executed in order to transform a list
                    // of columns to the Appmixer Inspector.
                    "transform": "./ListColumns#columnsToInspector"
                }
            }
        }
    ]
}
```

Note how we mapped the configuration properties of the `CreateRow` component to the configuration properties of the `ListColumns`  component that is called internally to retrieve the list of columns. The `data.properties` section defined property mappings. To map input port values, you can use the `data.messages` section instead. Let's see another example of a component, this time with input message mappings, the `trello.list.CreateCard` component inspector definition:

```json
"inspector": {
        "inputs": {
            "boardId": {
                "type": "select",
                "label": "Board",
                "index": 1,
                "source": {
                    "url": "/component/appmixer/trello/list/ListBoards?outPort=boards",
                    "data": {
                        "transform": "./transformers#boardsToSelectArray"
                    }
                },
                "tooltip": "Select a board."
            },
            "boardListId": {
                "type": "select",
                "label": "Board list",
                "index": 2,
                "source": {
                    "url": "/component/appmixer/trello/list/ListBoardsList?outPort=lists",
                    "data": {
                        "messages": {
                            "in/boardId": "inputs/in/boardId",
                            "in/isSource": true
                        },
                        "transform": "./transformers#boardListsToSelectArray"
                    }
                },
                "tooltip": "Select a list."
            },
            ...
        }
}
```

As you can see, the `boardId` (referenced to by the `"inputs/in/boardId"` syntax) configured by the end-user on the `CreateCard` component is mapped into the input port property of the same name of the `ListBoards` component (`"in/boardId"`).

## inPort.variablesPipeline

This object allows you to control what variables will be available to this component in the UI and in the component `receive()` method. By default, variables are collected from all the components back in the chain of connected components. This might not be desirable in some cases. One can set `scopeDepth` to a number that represents the depth (levels back the graph of connected components) used to collect variables. `rawValue` can be used to tell the engine not to resolve variable placeholders to their actual values but to treat variable names as values themselves. Example:

```
{
    "variablesPipeline": {
        "scopeDepth": 1,
        "rawValue": true
    }
}
```

## inPort.maxConnections

Set the maximum number of links that can be connected to the input port. Maximum number of connections is infinite by default but in some applications, it might be desirable to set a limit on this, usually `1`. The Appmixer Designer UI will not allow the user to connect more than `maxConnections` links to the input port.

# outPorts

The definition of the output ports of the component. It's an array of objects.

Components can have zero or more output ports. Each output port has a `name` and optionally an array `options` that defines the structure of the message that this output port emits. Without the options object, the user won't be able to see the possible variables they can use in the other connected components. For example, a component connected to the `weather` output port of our _GetCurrentWeather_ component can see the following variables in the variables picker:

![Variables Picker](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wcYkSuKCvV5EIl_0-%2F-L_wcaqcV6j_urLLeTrG%2FScreenshot%202019-03-14%20at%2015.36.36.png?alt=media\&token=7b5941ba-0d9a-430c-8b08-1b1c453df60f)

An example of an `outPorts` definition can look like this:

```json
{
    "outPorts": [
        {
            "name": "weather",
            "options": [
                { "label": "Temperature", "value": "main.temp" },
                { "label": "Pressure", "value": "main.pressure" },
                { "label": "Humidity", "value": "main.humidity" },
                { "label": "Sunrise time (unix, UTC)", "value": "sys.sunrise" },
                { "label": "Sunset time (unix, UTC)", "value": "sys.sunset" },
                { "label": "City name", "value": "name" },
                { "label": "Weather description", "value": "weather[0].description" },
                { "label": "Weather icon code", "value": "weather[0].icon" },
                { "label": "Weather icon URL", "value": "weather[0].iconUrl" }
            ]
        }
    ]
}
```

#### JSON Schema

We support full schema definition for each option, so you can specify the structure of the data that is coming out from your component. You can add a `schema` property to each option, which contains a [JSON Schema](https://json-schema.org/) definition. For example:

```json
{
    "outPorts": [
        {
            "name": "weather",
            "options": [
                { "label": "Temperature", "value": "main.temp" },
                { "label": "Pressure", "value": "main.pressure" },
                { "label": "Humidity", "value": "main.humidity" },
                { "label": "Sunrise time (unix, UTC)", "value": "sys.sunrise" },
                { "label": "Sunset time (unix, UTC)", "value": "sys.sunset" },
                { "label": "City name", "value": "name" },
                { 
                    "label": "Weather data", 
                    "value": "weather", 
                    "schema": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "description": { "type": "string", "title": "Weather description" },
                                "icon": { "type": "string", "title": "Weather icon code" },
                                "iconUrl": { "type": "string", "title": "Weather icon URL" }
                            }    
                        }
                    }
                }
            ]
        }
    ]
}
```

As you can see, compared to the first example, we replaced the last 3 options with a single one, which is actually an array of items with three properties. Each of these items has `title` which determines the label that will be visible in the UI. Note that the type of these inner properties could be an `object` or `array`, and have their own nested schemas.

If the `option` is defined as an `array` and you want to work with that array using modifiers:

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FKkJOW7jFBQ65bESytpSy%2FAppmixer_SDK.png?alt=media&#x26;token=d6614ff9-33c2-4bfe-9fe1-6bf3d1a3757e" alt=""><figcaption></figcaption></figure>

You will see the `item properties` among other variables.

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2Ft0EPjqDQ21iHu6m2NF0k%2FAppmixer_SDK.png?alt=media&#x26;token=491d04e8-ef3f-40e7-b85c-d949740d46d3" alt=""><figcaption></figcaption></figure>

And if you use the _Each_ connector, you will see the `item properties` in the Variables picker.

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FyPXSYOqqkiIUoyQbU47F%2FAppmixer_SDK.png?alt=media&#x26;token=35151190-70af-48ee-b8de-4f5c28b32617" alt=""><figcaption></figcaption></figure>

Alternatively, you can define a schema at the top level instead of using the options property. For example:

```json
{
    "outPorts": [
        {
            "name": "weather",
            "schema": {
                "type": "object",
                "properties": {
                    { "title": "Temperature", "value": "main.temp" },
                    { "title": "Pressure", "value": "main.pressure" },
                    { "title": "Humidity", "value": "main.humidity" },
                    { "title": "Sunrise time (unix, UTC)", "value": "sys.sunrise" },
                    { "title": "Sunset time (unix, UTC)", "value": "sys.sunset" },
                    { "title": "City name", "value": "name" },
                    { 
                        "label": "Weather data", 
                        "value": "weather", 
                        "schema": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "description": { "type": "string", "title": "Weather description" },
                                    "icon": { "type": "string", "title": "Weather icon code" },
                                    "iconUrl": { "type": "string", "title": "Weather icon URL" }
                                }
                            }                            
                        }
                    }
                }
            }
        }
    ]
}
```

When you define the structure of the data coming out from your component, the users of your component will have an easier time working with it, as they will be able to do things like selecting nested properties directly, selecting properties on iteration modifiers, and getting properties paths in modifiers. You can find more details about this in [this section](broken-reference).

## outPort.source

The definition is similar to the source `source` of [properties](../properties#properties.source). When used for the output port definition, it allows defining the output port schema dynamically.

There is one difference though. When defined in the output port, the `source` definition can reference both component properties and input fields, while the properties `source` definition can only hold references to other properties' values.&#x20;

An example is a Google Spreadsheet component UpdatedRow. The output port options of this component consist of the column names in the spreadsheet. But that is specific to the selected Spreadsheet/Worksheet combination. Therefore it has to be defined dynamically.&#x20;

![Dynamic output port options.](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FMb5LaOjgzndrHRootooa%2FAppmixer.png?alt=media\&token=9258d2fb-7603-4be7-83c2-896a5643ed7b)

Here is an example of the UpdatedRow output port definition.

```json
{
    "outPorts": [
        {
            "name": "out",
            "source": {
                // We will call another component to construct the output port
                // options, in this case, the GetRows component
                "url": "/component/appmixer/google/spreadsheets/GetRows?outPort=out",
                // Every Appmixer component can have 'properties' and input ports,
                // the 'data' sections is used to create the input data object 
                // for the component
                "data": {
                    // in this particular case, the GetRows component has an
                    // optional property called 'generateOutputPortOptions', we
                    // will pass that property with the value 'true'. The GetRows
                    // component will use this property to change its return value
                    // and instead of returning rows from Worksheet, it will
                    // return the 'options' array.
                    "properties": {
                        "generateOutputPortOptions": true
                    },
                    // the GetRows component expects the Spreadsheet ID and
                    // Worksheet ID as part of the message at its input port
                    // called 'in'. The UpdatedRow component is a trigger, it
                    // does not have an input port, but it has the same options like
                    // 'allAtOnce', 'withHeaders', ... and since it does not have
                    // an input port, it has these options defined in the
                    // 'properties' section. The next 'messages' section is used
                    // to construct an input port object for the GetRows component.
                    // It copies the user defined properties from the UpdatedRow.
                    // Appmixer will replace these with the actual values before
                    // calling the GetRows component.
                    "messages": {
                        "in/sheetId": "properties/sheetId",
                        "in/worksheetId": "properties/worksheetId",
                        "in/allAtOnce": "properties/allAtOnce",
                        "in/withHeaders": "properties/withHeaders",
                        "in/rowFormat": "properties/rowFormat"
                    }
                }
            }
        }
    ]
}

```

## outPort.maxConnections

Set the maximum number of outgoing links that can exist from the output port. The maximum number of connections is infinite by default but in some applications, it might be desirable to set a limit on this, usually `1`. The Appmixer Designer UI will not allow the user to connect more than `maxConnections` links from the output port.

# properties

The configuration properties of the component. Note that unlike properties specified on input ports (described later on in the documentation), these properties cannot be configured by the user to use data coming from the components back in the chain of connected components. In other words, these properties can only use data that is known before the flow runs. This makes them suitable mainly for trigger type of components.

![Component Configuration](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wafleSA7oup24f2Rm%2F-L_waiJsX3XykxpTKJiP%2FScreenshot%202019-03-14%20at%2015.28.24.png?alt=media\&token=227bfe62-f3f3-48f0-bdc7-403f667ca5ab)

Configuration properties are defined using two objects `schema` and `inspector`.

## properties.schema

`schema` is a JSON Schema definition ([http://json-schema.org](http://json-schema.org)) of the properties, their types and whether they are required or not. An example looks like this:

```
{
    "properties": {
        "schema": {
            "properties": {
                "interval": {
                    "type": "integer",
                    "minimum": 5,
                    "maximum": 35000
                }
            },
            "required": [
                "interval"
            ]
        }
}
```

The JSON Schema gives you enough flexibility to describe your property types and the required format, possibly using regular expressions or other mechanisms. When the user fills in the forms in the Designer UI inspector to configure their components, the Designer automatically validates all inputs using the schema. If any of the properties are invalid, the Designer UI gives an immediate feedback to the user that they should correct their configuration:

![Invalid Inspector field](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wafleSA7oup24f2Rm%2F-L_wb3SCt3j399NLibhb%2FScreenshot%202019-03-14%20at%2015.30.00.png?alt=media\&token=934e87e4-4364-4f7c-af1b-77de995c4a7b)

![Configuration Overview](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wafleSA7oup24f2Rm%2F-L_wb8zhnz5cwvj43-n8%2FScreenshot%202019-03-14%20at%2015.30.22.png?alt=media\&token=d73cf776-7961-48b4-8642-c175dd481303)

## properties.inspector

`inspector` tells the Designer UI how the input fields should be rendered. The format of this definition uses the [Rappid Inspector definition format](https://resources.jointjs.com/docs/rappid/v2.2/ui.html#ui.Inspector). Example:

```
{
    "properties: {
        "inspector": {
            "inputs": {
                "interval": {
                    "type": "number",
                    "group": "config",
                    "label": "Interval (in minutes, min 5, max 35000)"
                }
            },
            "groups": {
                "config": {
                    "label": "Configuration",
                    "index": 1
                }
            }
        }
    }
}
```

{% hint style="warning" %}
Do not use special characters `.` or `/` in the name of the input.
{% endhint %}

As you can see, fields (e.g. `interval` in this case) are nested inside the `inputs` object and have the following properties:

* `type` can be any of the built-in types. See below for more details. (Custom inspector fields are also possible for on-prem installations. See the Custom Inspector Fields page for more details.)
* `group` is an identifier of an Inspector group this field belongs to. As you can see in the example above, you can have one or more custom groups (like `config` in this case) that you can define in the `groups` object. Groups will render in the Inspector UI in an accordion-like fashion. This is handy to organize your fields.
* `label` is a short text that appears above your input field. This is a great place to tell your users what your field is.

### Inspector built-in types:

#### text

A single line input field.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDq2OzXRf4RxKIFPk%2Finspector%20text%20field.png?generation=1524146870096497\&alt=media)

```
{
    "type": "text",
    "label": "Text message."
}
```

#### textarea

A multi-line text input field.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDq4QxkmyI1pdv0ab%2Finspector%20textarea%20field.png?generation=1524146868546255\&alt=media)

```
{
    "type": "textarea",
    "label": "A multi-line text message."
}
```

#### number

A numerical input field. Additional configuration includes _min_, _max_ and _step_ numbers.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDq7rg1OIw_Fz4Sol%2Finspector%20number%20field.png?generation=1524146868079352\&alt=media)

```
{
    "type": "number",
    "label": "A numerical input.",
    "min": 1,
    "max": 10,
    "step": 1
}
```

#### select

A menu of options. Options are defined in the `options` array each item having `content` and `value` properties. Note that `content` can be HTML. You can optionally provide `placeholder` that is displayed if no option is selected. Default values can be defined with `defaultValue`. If you need one of the items to clear the value of the select input field, use `{ "clearItem": true, "content": "Clear" }` as one of the objects in the `options` array.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqD-lMCOHwI8Y9PO%2Finspector%20select%20field.png?generation=1524146868029349\&alt=media)

#### multiselect

Similar to `select` type, multiselect defines options the user can choose from. The difference is that with multiselect, the user can select multiple options, not only one. The value stored in the flow descriptor is an array of values the user selected. Supported options are `options` and `placeholder.`

```
{
    "type": "multiselect",
    "options": [
        { "content": "one", "value": 1 },
        { "content": "two", "value": 2 },
        { "content": "three", "value": 3 }
    ],
    "placeholder": "-- Select something --",
    "label": "Multi Select box"
}
```

#### date-time

A date-time input field allows the user to select a date/time using a special date/time picker interface. The date-time input field can be configured to support different type of formats or modes (only date or date-time combination). The configuration is stored in the "config" object. The following table shows list of all the available options:

| Option          | Description                                                                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`        | String representing the format of the date/time. Please see the moment.js library documentation for all the available tokens: [https://momentjs.com/docs/#/parsing/string-format/](https://momentjs.com/docs/#/parsing/string-format/). |
| `enableTime`    | Boolean. Enables time picker.                                                                                                                                                                                                           |
| `enableSeconds` | Boolean. Enables seconds in the time picker.                                                                                                                                                                                            |
| `maxDate`       | String representing the maximum date that a user can pick to (inclusive).                                                                                                                                                               |
| `minDate`       | String representing the minimum date that a user can pick to (inclusive).                                                                                                                                                               |
| `mode`          | Mode of the date/time picker. Possible values are `"single"`, `"multiple"`, or `"range"`.                                                                                                                                               |
| `time_24hr`     | Boolean. Displays time picker in 24 hour mode without AM/PM selection when enabled.                                                                                                                                                     |
| `weekNumbers`   | Boolean. Enables display of week numbers in calendar.                                                                                                                                                                                   |

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqGWLzxCQ2r09y7G%2Finspector%20date-time%20field.png?generation=1524146870049357\&alt=media)

```
{
    "type": "date-time",
    "label": "Date",
    "config": {
        "enableTime": true
    }
}
```

#### toggle

A toggle input field allows the user to switch between true/false values.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqJS7RS7uKJgVqkt%2Finspector%20toggle%20field.png?generation=1524146868124706\&alt=media)

```
{
    "type": "toggle",
    "label": "Toggle field"
}
```

#### color-palette

A menu of colors. Colors are defined in the `options` array each item having `content` and `value` properties, where `values` must be a color in any of the [CSS color formats](https://developer.mozilla.org/en-US/docs/Web/CSS/color) (named-color, hex-color, rgb() or hsl()).

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqQVvdKKSkH98xaS%2Finspector%20color-palette%20field.png?generation=1524146868512521\&alt=media)

```
{
    "type": "color-palette",
    "label": "Color palette",
    "options": [
        { "value": "green", "content": "Green" },
        { "value": "yellow", "content": "Yellow" },
        { "value": "orange", "content": "Orange" },
        { "value": "red", "content": "Red" },
        { "value": "purple", "content": "Purple" }
    ]
}
```

#### select-button-group

A group of toggle buttons. Both single and multiple selection is allowed (can be controlled with the `multi` flag). Buttons are defined in the `options` array each item having `value`, `content` and `icon` properties.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqZS5y2v3QvZn6Ys%2Fselect-button-group.png?generation=1524146872074344\&alt=media)

```
{
    "type": "select-button-group",
    "label": "Select button group",
    "options": [
        { "value": "line-through", "content": "<span style=\"text-decoration: line-through\">S</span>" },
        { "value": "underline", "content": "<span style=\"text-decoration: underline\">U</span>" },
        { "value": "italic", "content": "<span style=\"font-style: italic\">I</span>" },
        { "value": "bold", "content": "<span style=\"font-weight: bold\">B</span>" }
    ]
}
```

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqd48FrG3HugUE_D%2Fselect-button-group%20multi.png?generation=1524146870622316\&alt=media)

```
{
    "type": "select-button-group",
    "label": "Select button group",
    "multi": true,
    "options": [
        { "value": "line-through", "content": "<span style=\"text-decoration: line-through\">S</span>" },
        { "value": "underline", "content": "<span style=\"text-decoration: underline\">U</span>" },
        { "value": "italic", "content": "<span style=\"font-style: italic\">I</span>" },
        { "value": "bold", "content": "<span style=\"font-weight: bold\">B</span>" }
    ]
}
```

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqiciBsQT1Es8XZd%2Fselect-button-group%20icons.png?generation=1524146872148652\&alt=media)

```
{
    "type": "select-button-group",
    "label": "Select button group with icons",
    "multi": true,
    "options": [
        { "value": "cloud", "icon": "data:image/png;base64,iVBORw0KGgoAA..." },
        { "value": "diamond", "icon": "data:image/png;base64,iVBORw0KGgoAAAA..." },
        { "value": "oval", "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUh..." },
        { "value": "line", "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..." },
        { "value": "ellipse", "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU..." }
    ]
}
```

#### expression

A multi-field type field that allows for the definition of logical expressions (OR/AND) or dynamic field definitions. This field accepts a list of other inspector field types (text, textarea, number, toggle, ....) and renders a "field builder" UI that enables the user to dynamically create nested fields.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDqryk0yaeMkhimxK%2Finspector-expression-field.png?generation=1524146872786939\&alt=media)

```
{
      "type": "expression",
      "label": "Filter expression",
      "levels": ["OR", "AND"],
      "exclusiveFields": ["myText"]
      "fields": {
          "myText": {
              "type": "text",
              "label": "Column",
              "required": true,
              "index": 1
          },
          "mySelect": {
              "type": "select",
              "label": "Filter action",
              "variables": false,
              "required": true,
              "options": [
                  { "content": "Equals", "value": "equals" },
                  { "content": "Not Equals", "value": "notEquals" }
              ],
              "index": 2
          },
          "myAnotherText": {
              "label": "Filter value",
              "type": "text",
              "defaultValue": "My Filter",
              "index": 3
          }
      ]
}
```

The value of this field has the following structure:

```
{
    "OR": [
        {
            "AND": [
                { "myText": "My column name", "mySelect": "My filter action", "myAnotherText": "My filter value" },
                { "myText": "Another column name", "mySelect": "Another filter action", "myAnotherText": "Another filter value" }
            ]
        },
        {
            "AND": [
                { "myText": "Alternative column", "mySelect": "Alternative action", "myAnotherText": "Alternative value" }
            ]
        }
    ]
}
```

Note that by specifying the `levels` option, you can define the nesting. Currently, a maximum of 2 levels of nesting is supported. The common use case is to use just one level. In that case, set e.g. `"levels": ["ADD"]`.

The `exclusiveFields` is an optional property that defines the fields that will use variables in an exclusive way. For example, let's say that the component has `variableA` and `variableB` available for use in its fields. Now if the `myText` field is in `exclusiveFields` array which means that you can use each variable once across all the fields inside the expression groups. To clarify this further, imagine the following scenario configuring an expression type:

1. Click the `ADD` button to create a second group.
2. Select `variableA` on the `myText` field inside the first group using the variables picker.
3. When opening the variables picker in `myText` field inside the second group, only `variableB` will be available, because `variableA` is already been used.

The `expand` option in `source`. The `select` inputs in the `expression` can have dynamic values retrieved with the [`source`](#properties.source) configuration (just like an ordinary `select` input). Sometimes you may want to define different dynamic values for every expression box based on another field(s) in that box:

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FFB9v94ZmFpy0QIGBcnbk%2FAppmixer_%F0%9F%94%8A.png?alt=media&#x26;token=6bae9bb6-2938-47cc-8d33-5183ce5a57c1" alt=""><figcaption><p>source with expand</p></figcaption></figure>

This is how it is done:

```json
{
...
    "inspector": {
        "inputs": {
            "expressionWithSource": {
                "type": "expression",
                "label": "Dynamic Expression",
                "tooltip": "Dynamic Expression with a <b>source</b> call.",
                "exclusiveFields": [ "select" ],
                "index": 1,
                "levels": [ "AND", "OR" ],
                "fields": {
                    "text": {
                        "type": "text",
                        "label": "Text",
                        "tooltip": "A plain text field with <b>required: true</b>. The <b>value</b> of this field will be part of the variables in the select box <b>Dynamic Select</b>. If the <b>value</b> is <b>break</b> the component will throw an error that has to be visible in the UI.",
                        "required": true,
                        "index": 1
                    },
                    "select": {
                        "type": "select",
                        "label": "Dynamic Select",
                        "tooltip": "Dynamic Select options have to be available.",
                        "index": 2,
                        "source": {
                            "url": "/component/test/test/source/ExpressionWithExpand?outPort=out",
                            // The "expand" value is actually a path to an array
                            // in the flow JSON, that array is generated by this
                            // "expression", the Appmixer engine will then expand
                            // this array and call the "source" for each item in it.
                            // If you have different "levels" in your expression, 
                            // then you have to use yours here.
                            "expand": "$.expressionWithSource.AND.OR",
                            "data": {
                                "properties": {
                                    "generateOptions": "select",
                                    // it will find the correct "text" input value
                                    // in the same "box" and use it in the "source"
                                    // call
                                    "text": "./text"
                                },
                                "transform": "./ExpressionWithExpand#fieldsToSelectArray"
                            }
                        }
                    }
                }
            }
        }
    }
...
}

```

#### filepicker

An input that allows selecting and uploading files from the user's computer. When clicked, it will open the browser's file selector, and the file selected will be uploaded to Appmixer and referenced on the input.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-MOCl_r8u5ZRBklo17ss%2F-MOCnY79aJIhTUFDF3WU%2Fproperties_-_Appmixer.png?alt=media\&token=fef650d6-1e34-49aa-aa9a-bcc16ff6b290)

```
"inputs": {
    "fileId": {
        "type": "filepicker",
        "label": "Select file",
        "index": 1,
        "tooltip": "Pick a CSV file to import into the flow"
    }
}
```

#### googlepicker

Similar to the _filepicker_ input, this one allows users to select files or folders on their Google Drive accounts. When clicked a Google Drive file picker is opened, showing the user's Google Drive content. When selecting a folder/file, the input value becomes an object which includes the Id of the folder/file which should be used on Google API calls to reference that asset.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-MOCl_r8u5ZRBklo17ss%2F-MOCoQHQiRNAAcYbcEJ8%2FAppmixer.png?alt=media\&token=224ede90-baad-482a-847f-4d898a75828e)

```
"inputs": {
    "file": {
        "type": "googlepicker",
        "index": 1,
        "label": "File",
        "placeholder": "Choose a file...",
        "tooltip": "Choose a file to export."
    }
}
```

You can use _googlepicker_ to pick folders instead of files:

```
"inputs": {
    "file": {
        "type": "googlepicker",
        "index": 1,
        "label": "Folder",
        "placeholder": "Choose a folder...",
        "tooltip": "Choose a folder.",
        "view": "FOLDERS"
    }
}
```

This input type needs`appmixer.google.drive.GooglePicker` component to be installed.

#### onedrivepicker

Similar to the _googlepicker_, this one allows users to select files or folders from their OneDrive accounts.  When clicked, an OneDrive file picker is opened, showing the user's OneDrive content. When selecting a folder/file, the input value becomes an object which includes the id of the folder/file which should be used on OneDrive API calls to reference that asset.

```
"input": {
    "folder": {
        "type": "onedrivepicker",
        "index": 1,
        "label": "Folder",
        "placeholder": "Choose a folder...",
        "tooltip": "Choose a folder to upload the file to.",
        "view": "folders"
    }
}
```

The view property works similar to the same property on googlepicker. It can be used to determine what is shown on the picker. You can use 3 values: `files`, `folder`, `all`. As their names indicate, if select `files`, only files will be shown, if you select `folder` it will show only your folders and if you select `all` it will show both. This input type needs `appmixer.microsoft.onedrive.OneDrivePicker` component to be installed.

### Conditional fields

There are some cases when you want to show input fields depending on other values in the inspector. This allows to a better UX for component configuration. For this we use the `when`property in the field we want to be conditional:

```
"inputs": {
    "field1": {
        "type": "toggle",
        "label": "This input controls rendering of field2",
        "index": 1
    },
    "field2": {
        "when": { "eq": { "field1": true }}
        "type": "text",
        "label": "This field will be only rendered if field1 is set to true",
        "index": 2
    }
}
```

The when field has the following structure: `{ op: { field: comparisonValue }}`.&#x20;

* **op:** Is the operand that will be used to determine if the condition holds true or false. The following operands are supported:
  * **`eq`:** Equality between the values.
  * **`equal`:** Equality between the values by deep comparison. Used for objects and arrays.
  * **`ne`:** Values are not equal.
  * **`regex`:** Check if the value in given `field` matches the regex in the `comparisonValue`.
  * **`text`:** Check if the value in the given `field` contains the string in the `comparisonValue`.
  * **`lt`:** Check if the value in the given `field` is less than the `comparisonValue`.
  * **`lte`:** Check if the value in the given `field` is less or equal than the `comparisonValue`.
  * **`gt`:** Check if the value in the given `field` is greater than the `comparisonValue`.
  * **`gte`:** Check if the value in the given `field` is greater or equal than the `comparisonValue`.
  * **`in`:** Check if the value in the given `field` is included on the given `comparisonValue` array.
  * **`nin`:** Check if the value in the given path is not included in the given `comparisonValue`.
* **field:** The field that is used for comparison, there are several ways to reference the field:
  * **`field`:** The same form presented in the example. It will search the given fields in current input port fields.
  * **`properties/someProperty`:** Refer to a property inside component properties.
  * **`./field`:** It will refer to sibling fields of the current field. Specially useful when working with expression types.
* **comparisonValue:** The value used to compare the field against.

As it was mentioned, conditional fields also work with expression types, allowing to control the field rendering inside those expressions:

```
{
      "type": "expression",
      "label": "Filter expression",
      "levels": ["OR", "AND"],
      "fields": {
          "myText": {
              "type": "text",
              "label": "Column",
              "required": true,
              "index": 1
          },
          "conditionalField": {
              "when": { "eq": { "./myText": "Render" }}
              "type": "select",
              "label": "Filter action",
              "variables": false,
              "required": true,
              "options": [
                  { "content": "Equals", "value": "equals" },
                  { "content": "Not Equals", "value": "notEquals" }
              ],
              "index": 2
          }
      ]
}
```

## properties.source

Sometimes the structure of the inspector is not known in advance and it cannot be hardcoded in the manifest. Instead, the inspector fields are composed dynamically based on the data received from an API. A good example is the _google.spreadsheets.CreateRow_ component where the inspector renders fields representing columns fetched from the actual worksheet. For this to work, we can define the `source` property in the manifest that calls a component of our choosing in a so called "static" mode. For example:

```
{
       "source": {
           "url": "/component/appmixer/google/spreadsheets/ListColumns?outPort=out",
           "data": {
               "messages": {
                   "in": 1
               },
               "properties": {
                   "sheetId": "properties/sheetId",
                   "worksheet": "properties/worksheet"
               },
               "transform": "./transformers#columnsToInspector"
           }
       }
}
```

In the example above, we call the _ListColumns_ component and we're interested in the output coming from the output port `out`.Since this is just a normal component, we need to transform the result into the inspector-like object, i.e.:

```
{
    inputs: { ... },
    groups: { ... }
}
```

We need to tell Appmixer where it can find the transformation function. For this we use the `transform` property which tells Appmixer to look for the `transformers.js` file inside the `ListColumns/` directory. The transformer must return an object with a function named `columnsToInspector` that can look like this:

```
module.exports.columnsToInspector = (columns) => {

    let inspector = {
        inputs: {},
        groups: {
            columns: { label: 'Columns', index: 1 }
        }
    };

    if (Array.isArray(columns) && columns.length > 0) {
        columns.forEach((column, index) => {
            inspector.inputs[column[0]] = {
                type: 'text',
                group: 'columns',
                index: index + 1
            };
        });
    }
    return inspector;
};
```

### properties.source.url

A special URL that identifies a component that should be called in a "static" mode. It has to be of the form `/component/[vendor]/[service]/[module]/[component]`. It should also contain `outPort` in the query string that point to the output port in which we're interested to receive data from. Example:

```
"/component/appmixer/google/spreadsheets/ListColumns?outPort=out"
```

### properties.source.data.messages

Messages that will be sent to the input port of the component referenced by the `properties.source.url`. Keys in the object represent input port names and values are any objects that will be passed to the input port as messages.

### properties.source.data.properties

Properties that will be used in the target component referenced by the `properties.source.url`. The target component must have these properties defined in its manifest file. The values in the object are references to the properties of the component that calls the target component in the static mode. For example:

```
{
    "properties": {
        "targetComponentProperty": "properties/myProperty"
    }
}
```

### properties.source.data.transform

The transformation function used to transform the output of the target component. It should return an inspector-like object, i.e.:

```
{
    inputs: { ... },
    groups: { ... }
}
```

Example:

```
{
    "transform": "./transformers#columnsToInspector"
}
```

The transform function is pointed to be a special format `[module_path]#[function]`, where the transformation module path is relative to the target component directory.

# quota

Configuration of the [quota manager](../quotas-and-limits) used for this component. Quotas allow you to throttle the firing of your component. This is especially useful and many times even necessary to make sure you don't go over limits of the usage of the API that you call in your components. Quota managers are defined in the `quota.js` file of your service/module. Example:

```
{
     "quota": {
        "manager": "pipedrive",
        "resources": "requests",
        "scope": {
            "userId": "{{userId}}"
        }
    }
}
```

## quota.manager

The name of the quota module where usage limit rules are defined.

## quota.resources

One or more resources that identify rules from the quota module that apply to this component. Each rule in the quota module can have the `resource` property. `quota.resources` allow you to cherry-pick rules from the list of rules in the quota module that apply to this component. `quota.resources` can either be a string or an array of strings.

## quota.scope

This scope instructs the quota manager to count calls either for the whole application (service) or per-user. Currently, it can either be omitted in which case the quota limits for this component apply for the whole application or it can be `{ "userId": "{{userId}}" }` in which case the quota limits are counted per Appmixer user.

# tick

When set to `true`, the component will receive signals in regular intervals from the engine. The `tick()` Component Virtual method will be called in those intervals (see [Component Behaviour](../behaviour)). This is especially useful for trigger-type of components that need to poll a certain API for changes. The polling interval can be set by the `COMPONENT_POLLING_INTERVAL` environment variable (for custom on-prem installations only). The default is 60000 (ms), i.e. 1 minute.

# private

When set to `true`, the component will not be visible to end users.

# webhook

Set `webhook` property to `true` if you want your component to be a "webhook" type. That means that `context.getWebhookUrl()` method becomes available to you inside your component virtual methods (such as `receive()`). You can use this URL to send HTTP requests to. See the [Behaviour](../behaviour) section, especially the [`context.getWebhookUrl()`](../../behaviour#context-getwebhookurl) for details and example.

# state

Set `state` property to `{ persistent: true }` to tell the engine not to delete component state when flow is stopped. See [context.state](../../behaviour#context-state) for more information.

# author

The author of the component. Example:

```
{
    "author": "David Durman <david@client.io>"
}
```

# marker

The marker icon that can be added to the component in the UI to give some extra context. The most common use case is to display e.g. a "Beta" badge to tell the user that this component is in beta. The marker must be in the Data URI image format as described here: [https://en.wikipedia.org/wiki/Data\_URI\_scheme](https://en.wikipedia.org/wiki/Data_URI_scheme). `image/png` or `image/svg+xml` image types are recommended. The marker icon is displayed in the top right corner of the component shape.\
\
Example:

![Beta badge](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M-FD9epr8sG3GNneyMe%2F-M-K3NhV1AWHMnlWSaAb%2FScreenshot%202020-02-05%20at%2012.17.03.png?alt=media\&token=3552e477-311a-4fed-9cc2-44224dced9d9)

```
{
    "marker": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL..."
}
```

# localization

An optional object containing localization strings. For example:

```
{
    "name": "appmixer.twilio.sms.SendSMS",
    "author": "David Durman <david@client.io>",
    "icon": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwMCIgaGVp...",
    "description": "Send SMS text message through Twilio.",
    "private": false,
    "auth": {
        "service": "appmixer:twilio"
    },
    "outPorts": [
        {
            "name": "sent",
            "options": [
                { "label": "Message Sid", "value": "sid" }
            ]
        }
    ],
    "inPorts": [
        {
            "name": "message",
            "schema": {
                "type": "object",
                "properties": {
                    "body": { "type": "string" },
                    "to": { "type": "string" },
                    "from": { "type": "string" }
                },
                "required": [
                    "from", "to"
                ]
            },
            "inspector": {
                "inputs": {
                    "body": {
                        "type": "text",
                        "label": "Text message",
                        "tooltip": "Text message that should be sent.",
                        "index": 1
                    },
                    "from": {
                        "type": "select",
                        "label": "From number",
                        "placeholder": "Type number",
                        "tooltip": "Select Twilio phone number.",
                        "index": 2,
                        "source": {
                            "url": "/component/appmixer/twilio/sms/ListFromNumbers?outPort=numbers",
                            "data": {
                                "transform": "./transformers#fromNumbersToSelectArray"
                            }
                        }
                    },
                    "to": {
                        "type": "text",
                        "label": "To number",
                        "tooltip": "The destination phone number. <br/><br/>Format with a '+' and country code e.g., +16175551212 (E.164 format).",
                        "index": 3
                    }
                }
            }
        }
   ],
   "localization": {
       "cs": {
           "label": "Pošli SMS",
           "description": "Pošli SMS pomocí Twilia",
           "inPorts[0].name": "Zpráva",
           "inPorts[0].inspector.inputs.body.label": "Textová zpráva",
           "inPorts[0].inspector.inputs.from.label": "Číslo volajícího",
           "inPorts[0].inspector.inputs.from.placeholder": "Hledej číslo",
           "outPorts[0].name": "Odesláno",
           "outPorts[0].options[sid].label": "Sid zprávy"
       },
       "sk": {
           "label": "Pošli SMS",
           "description": "Pošli SMS pomocou Twilia",
           "inPorts[0].name": "Správa",
           "inPorts[0].inspector.inputs.body.label": "Textová správa",
           "inPorts[0].inspector.inputs.from.label": "číslo volajúceho",
           "outPorts[0].name": "Odoslané",
           "outPorts[0].options[sid].label": "Sid správy"
       }
   }
}
```

For more information about component localization, refer to the [Custom Component Strings](../../../customizing-embedded-ui/custom-component-strings#components-manifest-localization-object) section.

# firePatterns

Fire patterns is an advanced configuration of a component that allows you to define when your component is ready to fire (ready to process input messages). Fire patterns can make the engine to hold input messages on components input ports until the pattern matches and then send the messages to the component in bulk. Fire patterns are defined as an array or a matrix. An example of fire patterns may look like this:

```
{
    "firePatterns": ['*', 1]
}
```

The fire pattern above is interpreted as follows: The component processes messages only if the first input port has zero or more messages waiting in the queue and at least one message waiting in the second input port queue. Another example can be a fire pattern:

```
{
    "firePatterns": [1, 1]
}
```

In this case, the component only processes messages if there is at least one message on each of its two input ports. A good example for this pattern is the Sum component:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDtrsqccOD-Js7SYR%2Fsum%20component.png?generation=1524146875242199\&alt=media)

The _Sum_ component expects messages on both of its input ports before it can produce a sum of its inputs.

The following table lists all the possible fire pattern symbols:

| Symbol | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \*     | (_Any)_ The input port must have zero or more messages in the queue.                                                                                                                                                                                                                                                                                                                                                                                               |
| 1      | (_Exists)_ The input port must have at least one message in the queue.                                                                                                                                                                                                                                                                                                                                                                                             |
| 0      | (_Empty_) The input port must have no message in the queue.                                                                                                                                                                                                                                                                                                                                                                                                        |
| A      | (_All_) The input port must have at least one message from all the connected components in the queue. This is a synchronization pattern that lets you specify that the component must wait for all the connected components to send a message before it can start processing. A typical example is a "Multiple-to-Single" join component. This component must wait for all the LoadCSV components to send a message before it can produce an SQL-like join schema. |

Note that you can also define a set of fire patterns for a component, for example:

```
{
    "firePatterns": [
        ['*', 1],
        [1, 0]
    ]
}
```

When more fire patterns are used, there must be at least one fire pattern that matches before the component fires.

