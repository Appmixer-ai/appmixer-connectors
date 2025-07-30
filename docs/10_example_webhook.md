# Example: Webhook Trigger

This tutorial shows you how you can implement your own custom webhook trigger component. The component will register its own webhook URL with a 3rd party API (possibly your own) and start accepting HTTP requests at that URL to further process and send to its output port. Moreover, we also show how to implement an API key based authentication for our component.

### Demo Todo API

Throughout our example, we'll be using a non-existing Todo API service. This imaginary API provides the following endpoints and functionality:\


* Authentication: API key based authentication. All requests must provide the `X-Api-Key` HTTP header that contains an API key that identifies a particular user.
* `POST /webhooks` HTTP endpoint with `{ url: SOME_URL }` payload to register a new webhook URL that will be called by the Todo API server every time there's a change in the user's todo list (new todo item, deleted todo item, updated todo item). This endpoint returns the webhook ID in its response (`{ id: WEBHOOK_ID }`).
* `DELETE /webhooks/:id` HTTP endpoint that unregisters a previously registered webhook identified by its ID.
* `GET /me` HTTP endpoint that returns the user's profile.
* Webhook callbacks: Our TODO API server calls registered webhooks every time there's a change in the user's todo list. The following events (webhook request payloads) are supported:
  * `{ event: "todo-created", todo: { label: String, id: String } }`
  * `{ event: "todo-deleted", todo: { label: String, id: String } }`
  * `{ event: "todo-updated", todo: { label: String, id: String } }`

### Appmixer Service Definition

Components in Appmixer are organized in a three level hierarchy: **service**, **module**, **component**. For example, a component that creates new rows in a Google Spreadsheet is organized as `google.spreadsheets.CreateRow`. This hierarchy allows for sharing e.g. configurations or authentication mechanism between components by placing them either on the service or module level (in our example, all Google components use the standard Google OAuth 2 mechanism for authentication, therefore, the authentication module (`auth.js` file) is inside the `google/` directory). The component hierarchy is also reflected in the directory structure when you implement new services/modules/components. The directory/file structure of our demo component looks like this:\


```
tododemo
├── core
│   └── NewTodo
│       ├── NewTodo.js
│       └── component.json
├── auth.js
└── service.json
```

The top level directory is called `tododemo` (our service), under which we have one module called `core` and one component called `NewTodo`.&#x20;

The service directory contains two files, one that defines our authentication mechanism (remember our Todo API uses API key based authentication and we want to get the API key from the user) and one with our service manifest (`service.json`) with metadata such as icon, label and description.

Our module (`core`) contains just one component that resides the `NewTodo` directory. The component is defined with two files, component manifest ( `component.json` ) and component behaviour (`NewTodo.js`).

Let's now have a look at all the files in more detail.

### Service Manifest (service.json)

The entire `service.json` manifest for our connector looks like this:

```json
{
    "name": "appmixer.tododemo",
    "label": "Todo Demo",
    "description": "Appmixer Todo Demo Connector",
    "category": "applications",
    "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQA..."
}
```

The most important field in the service manifest file is the `name` field. This field must follow the service naming syntax of the form `[vendor].[service]`. In our case, we use `appmixer` vendor name but you can create your own vendor too. Only keep in mind that to be able to publish a component with a certain vendor name, you must set this vendor name in the user profile via the Backoffice admin panel. See [https://docs.appmixer.com/appmixer/appmixer-self-managed/installation#enabling-users-to-publish-custom-components](https://docs.appmixer.com/appmixer/appmixer-self-managed/installation#enabling-users-to-publish-custom-components) for details. Our service name is simply `tododemo`.

The rest of the fields mainly define how this service will be displayed in the UI. Once we publish our service to Appmixer, you'll notice a new connector in the left panel of the Designer UI:\


![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FhCiCZQebcpyrbqxoOhL6%2Fimage.png?alt=media\&token=e2af3aea-a508-47dd-aa4b-bcee94fec66a)

As you can see, the metadata fields are displayed in the UI: the `label` ("Todo Demo"), `description` ("Appmixer Todo Demo Connector"), `icon` (represented as a Data URI scheme instead of a URL link for better portability, see [https://en.wikipedia.org/wiki/Data\_URI\_scheme](https://en.wikipedia.org/wiki/Data_URI_scheme)) and the connector is displayed in the collapsible "Applications" category in the left panel.

### Service Authentication Module

The next file in our `tododemo` directory is the `auth.js` authentication module. This module defines how our users authenticate to our service. In our case, the Todo API requires API key based authentication so we want to collect the API key from the user when they use our NewTodo component in their flows/integrations:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FOJF8IXQLciighG2LaWk4%2Fimage.png?alt=media\&token=88fcb5e5-3c89-406c-b2b5-1210808eadae)

Our `auth.js` file looks like this:

```javascript
module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Your Todo app account API key. Find it in your user profile.'
            }
        },
        validate: {
            method: 'GET',
            url: '{{config.baseUrl}}/me',
            headers: {
                'X-Api-Key': '{{apiKey}}'
            }
        }
    }
};
```

As you can see, the authentication module is a NodeJS module that exports a JavaScript object with the definition of our authentication scheme. The top level `type` field defines the type of the authentication scheme that Appmixer understands (see [https://docs.appmixer.com/appmixer/component-definition/authentication#authentication-module-structure](https://docs.appmixer.com/appmixer/component-definition/authentication#authentication-module-structure) for details). In our case, we want to use the `apiKey` authentication type. The `definition.auth` section then describes the fields of the form that will be displayed to the user when they click on "Connect account", i.e. the API key that we want to collect from them. Note the key of each field is then used to reference the values in our component behaviour (see below). In our case, this is just one field with the key `apiKey`.

The UI of the form looks like this:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2Fee0IQtXsWtt1wpWfQiZe%2Fimage.png?alt=media\&token=70d6b85b-1708-4b7f-8c77-25fc7241de20)

As you can see, the form contains only one field with the label "API Key" (`definition.auth.apiKey.name`) and tooltip "Your Todo app account ..." (`definition.auth.apiKey.tooltip`). The type of the form field is `text`.

The `definition.validate` section of our authentication module tells Appmixer how to validate the user provided credentials (the api key in this case). The section can be defined as a templated HTTP request with `url`, `method`, `headers` and `data` fields (Appmixer actually uses the axios library to make the request so any axios request configuration field is supported: [https://github.com/axios/axios#request-config](https://github.com/axios/axios#request-config)). As you can see, you can use fields from the `definition.auth` object by enclosing them with the `{{` and `}}` brackets. We take advantage of that by injecting the user provided api key in the `X-Api-Key` HTTP header. Moreover, notice the `url` field and the use of `{{config.baseUrl}}`. The `{{config.CONFIG_KEY}}` allow us to use service configuration values defined in the Backoffice admin panel. This is very handy if you don't want to hardcode certain values in your service/module/component definition and instead, make those values configurable via Backoffice. To do that, visit your Appmixer tenant Backoffice interface, go to "Services", click "Add" to add a new service configuration, provide the correct service ID in the form `[vendor]:[service]` and add your custom configuration key/values by clicking on the "burger" icon:

\


![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FhlBFgQm6QMuUsCQVv5ux%2Fimage.png?alt=media\&token=52c05cea-8a52-4b5e-9394-7759ea46d43c)

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2F3yRAu28GF62ay5LVSFxP%2Fimage.png?alt=media\&token=df3555fb-4c1f-4551-85dc-f28d20769f0b)

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FoHU0mhytEQznuYTHujRB%2Fimage.png?alt=media\&token=cb9ce5da-41ef-4126-a991-3bc33e25acbf)

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FmB65cVTYYHAservk0LzO%2Fimage.png?alt=media\&token=f5958bec-fe62-4a90-96bd-b4f5236a6c5d)

### Component manifest (component.json)

At this point, our service definition is complete. We can start defining our `NewTodo` trigger component. Note that our `core` module does not have any definitions. In our example, we don't need to have separate modules under our service with their own definitions. We treat our entire service as a module. However, the `core/` directory must still exist (or a directory with a different name that you choose).

Let's now have a look at the `component.json` manifest file:

```json
{
    "name": "appmixer.tododemo.core.NewTodo",
    "author": "Appmixer <info@appmixer.com>",
    "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQA...",
    "webhook": true,
    "auth": {
        "service": "appmixer:tododemo"
    },
    "outPorts": [
        {
            "name": "out",
            "options": [
                { "label": "Todo ID", "value": "id" },
                { "label": "Todo Label", "value": "label" }
            ]
        }
    ]
}
```

As you can see, the component manifest contains metadata about our component. Again, following the same convention, the `name` of the component must be of the form `[vendor].[service].[module].[component]` and it must follow the same directory structure our component lives in (`core/NewTodo`). The `author` field just contains the author of the component, possibly including their email address between `<` and `>` brackets. `icon` field is again an image icon represented with the Data URI scheme. The `webhook: true` field tells Appmixer to accept external HTTP requests on the component internal webhook URL (see below the `context.getWebhookUrl()` function that gives us the component URL endpoint). The `auth.service` field points to our authentication module and must be of the form `[vendor].[service]`  (or `[vendor].[service].[module]` in case the `auth.js` authentication module is defined under the module directory (which is not our case).

The `outPorts` section defines the component output ports. In our `NewTodo` trigger component, we only have one output port (`out`)  (In general, Appmixer supports an arbitrary number of output ports.):

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FpxOtE31ryKIqOEo7A9te%2Fimage.png?alt=media\&token=8f9e6ec9-e038-4db3-a848-d63431cd39db)

The `options` section of our `out` output port then defines the variables that users can use in other connected components to reference output fields from our `NewTodo` component. For example, let's say we want to send a Slack message for each new todo. We can create a flow that looks like the one below and use the variables from our component when composing the Slack message:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FILIfHsjvgR42qNOcrS13%2Fimage.png?alt=media\&token=6a206fbe-5329-484f-9fd4-fb2ad07af05b)

As you can see, the variables that show up in the variables picker are the ones that we defined in our `options` section ("Todo ID" and "Todo Label"). The special "Raw Output" variable was added automatically by Appmixer to allow the user to use the raw JSON output of the component (which can be useful in some cases). Also note that the `options` field is an array of objects with the `label` and `value` fields. The `label` field simply defines the label of the output variable (e.g. "Todo Label"). The `value` field references a key of the component output object, i.e. the object passed to the `context.sendJson(obj, outputPort)` function in the first argument (see below the Component Behaviour section for more details).

### Component Behaviour (NewTodo.js)

The last missing piece to our demo Todo connector is the actual component behaviour, i.e. what the component actually does. The component behaviour is implemented as a NodeJS module. In other words, anything that you can implement in NodeJS can be a component in Appmixer (file conversions, business logic utilities, any API calls, ...). In our example, our `NewTodo.js` file looks like this:

```javascript
module.exports = {

    async receive(context) {
        // Components defined with webhook: true in the component.json file
        // are eligible to receive HTTP requests to the context.getWebhookUrl().
        // The headers and data of that request is available to us in the
        // context.messages.webhook.content object.
        if (context.messages.webhook) {
            const { data } = context.messages.webhook.content;
            // Remember the webhooks of the example Todo API contain a payload
            // of the form { event, todo: { id, label } }. In the line below,
            // we're interested only in todo-created events since our
            // NewTodo component is supposed to trigger when new todo items are
            // added.
            if (data.event === 'todo-created') {
                // If indeed a new todo item was created, send an output to the
                // only component output port 'out'. The output object the
                // todo object { id, label } which fields correspond to the
                // 'options' list from our output port definition in component.json.
                return context.sendJson(data.todo, 'out');
            }
        }
    },

    async start(context) {
        // In our start() method, we register the component webhook with our
        // Todo API so that we're notified of changes.
        
        // Note the context.auth object gives us the values the user filled in
        // in the authentication form defined in our tododemo service auth.js
        // file.
        const { apiKey } = context.auth;
        // context.config object allows us to use the dynamic configuration 
        // from the Backoffice, the same way as we used it in our auth.js file.
        const url = context.config.baseUrl + '/webhooks';
        // context.getWebhookUrl() gives us the component webhook URL that 
        // 3rd parties (our Todo API) can call to reach our component and send
        // input to it.
        const { data } = await context.httpRequest.post(url, { url: context.getWebhookUrl() }, {
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        // context.saveState(myState) allows us to save a temporary state.
        // This state (an arbitrary JSON object) is persisted only for the
        // period the component is running (i.e. from the start of the flow
        // until the flow stops. See https://docs.appmixer.com/appmixer/component-definition/behaviour#component-state
        // for details.
        // For our purposes, we need to store the webhook ID that we received
        // from the webhook subscription endpoint so that we can later
        // unsubscribe it in the stop() method below. Note that you can't
        // just store the webhook ID in the NodeJS module local variable since
        // it is not guaranteed by the Appmixer engine that it will keep the 
        // NodeJS module in memory. Moreoever, if Appmixer is running in a cluster
        // environment, different nodes can execute the start() and stop() methods.
        return context.saveState({ id: data.id });
    },

    async stop(context) {
        const { apiKey } = context.auth;
        const url = context.config.baseUrl + '/webhooks';
        // The component state object is available to use in the context.state
        // property. This property contains the object that we previously
        // saved using the context.saveState(myState) method.
        return context.httpRequest.delete(url + '/' + context.state.id, {
            headers: {
                'X-Api-Key': apiKey
            }
        });
    }
};
```

The module exports functions known to the Appmixer engine that the Appmixer engine calls at the right times. See Component Behaviour for more details: [https://docs.appmixer.com/appmixer/component-definition/behaviour](https://docs.appmixer.com/appmixer/component-definition/behaviour). For our example component, we export three virtual methods (naming convention for the exported functions):&#x20;

* `receive(context)` that the Appmixer engine calls when the component receives an input (in our case, since our component does not have any input ports, the only input it can receive is from the component webhook URL, i.e. HTTP requests to the `context.getWebhookUrl()` endpoint).&#x20;
* `start(context)` that the Appmixer engine calls when the flow starts. This is the place where we initiate the HTTP request to the Todo API to register the component webhook URL so that our component is notified of changes in the user todo list (the actual changes are received in the `receive()` method).
* `stop(context)` that the Appmixer engine calls when the flow stops. This is the place where we unsubscribe our webhook from the Todo API to properly clean up after ourselves (remove the webhook from the Todo API).

### Packing and Publishing our Service

At this point, we have our entire service ready to be packed and published to our Appmixer tenant. To pack and publish services/modules, use the Appmixer CLI tool ([https://docs.appmixer.com/appmixer/appmixer-cli/appmixer-cli](https://docs.appmixer.com/appmixer/appmixer-cli/appmixer-cli)). In short, the process is pretty straightforward and looks like this:

```
$ npm install -g appmixer
$ appmixer url https://api.your-tenant.appmixer.cloud # or any other custom endpoint in case of self-managed Appmixer installation
$ appmixer login your-admin-user@example.com # note the user must have the "appmixer" vendor set in Backoffice
$ appmixer pack tododemo/
$ appmixer publish appmixer.tododemo.zip
```

You should now be able to see the "Todo Demo" connector in the left panel of the Designer UI:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2Fynp4hFPXquSEOBKhezIo%2Fimage.png?alt=media\&token=9ec5a0bc-df24-4863-bc5c-f48080e928ce)

TIP: during debugging of your component, you'll be often re-packing/re-publishing the component and running a sample flow to see if it behaves correctly. Use the Log panel of the Designer UI to see the activity in your flow:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2F7vpyzTZY3Mr6aRX3HCWM%2Fimage.png?alt=media\&token=3276321f-cf08-4f35-b045-ff06bbca8c46)

TIP 2: use the `await context.log({ "foo": "bar" })` function to log any JSON object anywhere in your component behaviour file (our NewTodo.js). This allows you to print your own custom log messages in the Log panel.

### Download the demo Service

You can download our sample service below. It's important to note that the service will not work without modifications since we used a dummy, non-existing Todo API. You should modify the service/component to fit your own needs and point it to your own API.

{% file src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FIbnNJXEOOe7T4FdbCtrE%2Fappmixer.tododemo.zip?alt=media&token=1acd414f-452a-44a4-8255-2850baff07b7" %}
