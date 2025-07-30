# Behaviour

Components receive incoming messages, process them, and generate outgoing messages. The way messages are processed is called component behaviour. It defines what components do internally and how they react to inputs.

Components are implemented as NodeJS modules that return an object with a set of methods (**Component Virtual Methods**) that the Appmixer engine understands. Let's start with a simple example, a _SendSMS_ component that has one input port (`message`), no output ports and its purpose is to send an SMS using the Twilio API.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDmeU63VysbcQPwnd%2Ftwilio%20SendSMS%20component.png?generation=1524146851715074\&alt=media)

```javascript
const twilio = require('twilio');

module.exports = {

    receive(context) {
        let { fromNumber } = context.properties;
        let { accountSID, authenticationToken } = context.auth;
        let message = context.messages.message.content;
        let client = new twilio(accountSID, authenticationToken);
        return client.message.create({
            body: message.body,
            to: message.to,
            from: fromNumber
        });
    }
};
```

## Component Virtual Methods

As was mentioned in the previous paragraph, components are simple NodeJS modules that can implement a certain set of methods the Appmixer engine understands. The one most important method is the **receive()** method. This method is called by the engine every time messages are available on the input ports and the component is ready to execute. The method must return a promise that when resolved, acknowledges the processing of the input messages. If the promise is rejected, the Appmixer engine automatically retries to send the messages later using an exponential back-off strategy that prolongs intervals between the retries.

_Messages that have been rejected 30-times are put in a special internal "dead-letter" queue and never returned to the flow for processing again. They can be managed and recovered using the_ [unprocessed-messages](../api/unprocessed-messages "mention") Appmixer REST AP&#x49;_._

For trigger-type of components, the most important virtual methods to remember is **tick()** and **start()**.

| Virtual Method       | Description                                                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **receive(context)** | Called whenever there are new messages on input ports that the component is ready to consume. This method must return a promise that when resolved, tells Appmixer that the messages were successfully processed. When rejected, the engine retries to send the messages to the component again later. |
| **tick(context)**    | Called whenever the polling timer sends a tick. This method is usually used by trigger Components to implement a API polling mechanism or for schedulers.                                                                                                                                              |
| **start(context)**   | Called when Appmixer signals the component to start (when the flow starts). This method is usually used by trigger components that might schedule an internal timer to generate outgoing messages in regular intervals or to register a webhook URL (`context.getWebhookUrl()` with a 3rd party API).  |
| **stop(context)**    | Called when Appmixer signals the component to stop (when the flow stops). This is the right place to do a graceful shutdown if necessary. Webhook-based trigger components use this place to unregister their webhook URLs with 3rd a party API.                                                       |

## Context

All virtual methods have one argument, the `context`. The context object contains all the information you need to process your messages and send new messages to the output ports.

### Input/Output message(s)

#### context.messages

_(applies to_ `receive()`_)_

Incoming messages. An object with keys pointing to the input ports. Each message has a `content` property that contains the actual data of the message after all variables have been resolved (replaced with actual data). For example:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-LATDkr7Z9HspTfvbiBo%2F-LATDmspiOywObiQMNZ9%2Ftwilio%20SendSMS%20component.png?generation=1524146852892213\&alt=media)

```javascript
{
    receive(context) {
        const smsContent = context.messages.message.content;
    }
}
```

Remember, if before running the flow, the input port `message` was defined in the Inspector using variables:

![Variables](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wga65VT8gPdtaJ6DK%2F-L_wgdF2TXnyQn0oDaAc%2FScreenshot%202019-03-14%20at%2015.54.14.png?alt=media\&token=352b9bb4-7350-426b-966f-c99eae13080b)

where the flow descriptor would contain something like this:

```
Humidity: {{{$.ec8cd99f-0ad3-4bca-9efc-ebea5be6b596.weather.main.humidity}}}
```

the `context.messages` object contains the result of replacing variables with actual data that was sent through the output port of the connected component, i.e.

```javascript
context.messages.message.content === 'Humidity: 75'
```

Each message also contains the correlation ID in the `context.messages.myInputPort.correlationId` property.

{% hint style="info" %}
`correlationId` is a "session ID" that associates all the messages in one pass through the flow. Every time a trigger component sends a message to the flow (e.g. webhook, timer, ...) and the message does not have a correlation ID yet, the Appmixer engine assigns a new correlation ID to the message. This correlation ID is then copied to all the messages that were generated as a reaction to the original trigger message.
{% endhint %}

#### async context.sendJson(messageContent, outPort)

Call this method to emit a message on one of the components output ports. The first argument can be any JSON object and the second argument is the name of an output port. The function returns a promise that has to be either returned from the `receive()` , `tick()` or `start()` methods or awaited.

#### async context.sendArray(arrayOfObjects, outPort)

A convenient method for sending an array of objects to an output port. Note that this method does not send the entire array to the output port in one go but rather sends items in the array one-by-one to the output port. Therefore, your output port schema definition should contain the schema of the items of the array, not the array itself.

```javascript
const Promise = require('bluebird');

module.exports = {
    async receive(context) {
 
        // Without context.sendArray() function:
        const arrayOfObjects = [
            { name: 'John', surname: 'Doe' },
            { name: 'Martin', surname: 'Tester' }
        ];   
        await Promise.map(arrayOfObjects, item => {
            return context.sendJson(item, 'out');
        });
        
        // With context.sendArray() function:
        await context.sendArray(arrayOfObjects, 'out');
    }
}
```

### Authentication

#### context.auth

The authentication object. It contains all the tokens you need to call your APIs. The authentication object contains properties that you defined in the `auth` object in your Authentication module (`auth.js`) for your connector or implicit properties in case of OAuth (`context.auth.accessToken`). For example, if our authentication module for our service (`auth.js`) looks like this:

```javascript
const twilio = require('twilio');
module.exports = {
    type: 'apiKey',
    definition() {
        return {
            tokenType: 'authentication-token',
            accountNameFromProfileInfo: 'accountSID',
            auth: {
                accountSID: {
                    type: 'text',
                    name: 'Account SID',
                    tooltip: 'Log into your Twilio account and find <i>API Credentials</i> on your settings page.'
                },
                authenticationToken: {
                    type: 'text',
                    name: 'Authentication Token',
                    tooltip: 'Found directly next to your Account SID.'
                }
            },
            validate: context => {
                let client = new twilio(context.accountSID, context.authenticationToken);
                return client.api.accounts.list();
            }
        };
    }
};
```

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FxrDGY04eI591DyqJ2JUZ%2Fimage.png?alt=media&#x26;token=479b6cde-7681-43e4-8e48-a2a1ef5302e5" alt=""><figcaption><p>Authentication UI dialog for the above auth.js definition</p></figcaption></figure>

we can use the `context.auth.accountSID` and `context.auth.authenticationToken` in the component virtual methods to access the values for those properties that Appmixer requested from end-users when they authenticated to the connector:

```javascript
{
    receive(context) {
        let { accountSID, authenticationToken } = context.auth;
    }
}
```

### Backoffice configuration

#### context.config

When you configure your connector in the Backoffice, you can access the values in the `context.auth` or `context.config` objects. `context.config` is an alias to the original `context.auth`. This is especially handy for any configuration that you might want to have dynamically changed without the need to redeploy your connector with new configuration.

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2Fy435BflxtK0K3YG2lAok%2Fimage.png?alt=media&#x26;token=4b44b17d-7c3b-47a1-937e-0a63189023a5" alt=""><figcaption></figcaption></figure>

```javascript
module.exports = {
    receive(context) {
        const endpoint = context.config.baseUrl + '/weather';
        const { data } = await context.httpRequest.get(endpoint);
        // process results
    }
};

```

### Properties

#### context.properties

The configuration properties of the component. This corresponds to the `properties` object from the component manifest file. For example, if our component defines the following properties in the manifest file:

```
{
    "properties": {
        "schema": {
            "properties": {
                "fromNumber": { "type": "string" }
            }
        },
        "inspector": {
            ...
        }
    }
}
```

`context.properties.fromNumber` will contain the value the user entered in the Designer UI Inspector:

```javascript
{
    receive(context) {
        const fromNumber = context.properties.fromNumber;
    }
}
```

### Component State

#### context.state

A persistent state of the component. Sometimes you need to store data for the component that must be available across multiple `receive()` calls for the same component instance. If you also need the data to be persistent when the flow is stopped and restarted again, set the `state: { persistent: true }` property in your component manifest, otherwise, the `context.state` will be cleared when the flow containing the component stops.

`context.state` is a simple object with keys mapped to values that are stored in the internal Appmixer database. This object is loaded on-demand in each `receive()` call. It is not recommended to store large amounts of data here. Example:

```javascript
{
    async receive(context) {
        // Emit a message only once per day for this component instance.
        const day = (new Date).getDay();
        const state = context.state;
        if (!state[day]) {
            state[day] = true;
            await context.saveState(state);
            return context.sendJson({ tick: true }, 'out');
        }
    }
}
```

The `context.state` is especially useful for trigger-type of components when polling an API for changes to e.g. store the ID of the latest processed item from the API.

{% hint style="info" %}
The `context.state` object should not be used to store large amounts of data. The state is loaded with each received message on a component input port. The maximum limit is 16MB but storing such large objects will heavily slow down the processing of the component input messages.
{% endhint %}

#### async context.loadState()

Load the component's state from internal DB. Normally, you do not need to call this method explicitely since the component's state is loaded just before the component is triggered and the state is available in `context.state`.  However, there are cases when a component needs to reload its state from the DB where this function is useful.

#### async context.saveState(object)

Save an updated state object. See `context.state` for details. The function returns a promise that resolves if storing of the state was successful.

#### async context.stateSet(key, value)

Set a state `key` to hold the `value`. `key` must be a string. `value` can be any JSON object.

#### async context.stateGet(key)

Get a state value stored under `key`.

#### async context.stateUnset(key)

Remove a value under `key`.

#### async context.stateClear()

Clears the entire state.

#### async context.stateAddToSet(key, value)

Add value into set under `key`.

#### async context.stateRemoveFromSet(key, value)

Remove value from set under `key`.

#### async context.stateInc(key, value = 1, returnOriginal = false)

Increment value under `key`. The second parameter is optional and can be used to set the increment value. The function return by default the new value (after incremented), if `returnOriginal` is set to true, it will return the value before the increment.

### Flow State

Similar to the component state, this state is available to all components in the flow.

#### async context.flow.loadState()

Load the state from the DB.

#### async context.flow.stateSet(key, value)

Set a state `key` to hold the `value`. `key` must be a string. `value` can be a string, number or a JSON object.

#### async context.flow.stateGet(key)

Get a state value stored under `key`.

#### async context.flow.stateUnset(key)

Remove a value under `key`.

#### async context.flow.stateClear()

Clears the entire state.

#### async context.flow.stateAddToSet(key, value)

Add `value` into a _Set_ stored under `key`.

#### async context.flow.stateRemoveFromSet(key, value)

Remove `value` from _Set_ stored under `key`.&#x20;

#### async context.flow.stateInc(key, value = 1, returnOriginal = false)

Increment value under `key`. The second parameter is optional and can be used to set the increment value. The function return by default the new value (after incremented), if `returnOriginal` is set to true, it will return the value before the increment.

### Service State

This is similar to the component state, but the service state is available across all components in the connector.

#### async context.service.loadState()

Load the state from the DB. The returned value is an array of state items each having the `key` and `value` properties, e.g. `[{ key: "A", value: 1 }, { key: "B", value: 2 }]`.

#### async context.service.stateSet(key, value)

Set a state `key` to hold the `value`. `key` must be a string. `value` can be anything that can be stored in Mongo DB.

#### async context.service.stateGet(key)

Get a state value stored under `key`.

#### async context.service.stateUnset(key)

Remove a value under `key`.

#### async context.service.stateClear()

Clears the entire state.

#### async context.service.stateAddToSet(key, value)

Add `value` into a _Set_ stored under `key`.

```javascript
module.exports = {

    async start(context) {

        // register webhook in the slack plugin
        return context.service.stateAddToSet(
            context.properties.channelId,
            {
                componentId: context.componentId,
                flowId: context.flowId
            }
        );
    },

    async stop(context) {

        return context.service.stateRemoveFromSet(
            context.properties.channelId,
            {
                componentId: context.componentId,
                flowId: context.flowId
            }
        );
    }
}
```

#### async context.service.stateRemoveFromSet(key, value)

Remove `value` from _Set_ stored under `key`.&#x20;

#### async context.service.stateInc(key, value = 1, returnOriginal = false)

Increment value under `key`. The second parameter is optional and can be used to set the increment value. The function return by default the new value (after incremented), if `returnOriginal` is set to true, it will return the value before the increment.

### Files

#### async context.saveFile(fileName, mimeType, buffer)

**This method has been deprecated. Use** [**context.saveFileStream** ](#async-context.savefilestream-filename-stream)**instead.** Save a file to the Appmixer file storage. This function returns a promise that when resolved gives you a UUID that identifies the stored file. You can pass this ID through your flow (send it to an output port of your component) so that later components can load the file from the Appmixer storage using the file ID.

```javascript
{
    receive(context) {
        // getAttachment() is an example function that retrieves a file from an API
        return getAttachment(context.auth, context.messages.attachment.content.id)
            .then((file) => {
                return context.saveFile(file.name, file.mimeType, Buffer.from(file.data, 'base64'));
            })
            .then((result) => {
                return context.sendJson({ fileId: result.fileId }, 'file');
            });
    }
}
```

#### async context.saveFileStream(fileName, stream)

Save a file to the Appmixer file storage. The function returns a Promise that resolves with the ID of the stored file (`{ fileId }`). This is a more efficient and recommended version of `context.saveFile(name, mimeType, buffer)`.

The structure of the returned object looks like this:

```javascript
// Example
{
  length: 7,
  chunkSize: 261120,
  uploadDate: "2023-03-22T10:34:07.751Z",
  filename: "test",
  md5: "3e47b75000b0924b6c9ba5759a7cf15d",
  metadata: {
    userId: "638f734271b34799e665c9b9",
    fileId: "a1603390-1b86-4c3c-afe4-57ebb6b6c2c2",
    originFlowId: "7f3f6c28-cedb-4625-9853-853e395cabf5"
  },
  fileId: "a1603390-1b86-4c3c-afe4-57ebb6b6c2c2"
}
```

See, for example, the [AWS S3 GetFileObject](https://github.com/clientIO/appmixer-connectors/blob/19f93427390fc4bf58a7137784e8626457b7ea0e/src/appmixer/aws/s3/GetFileObject/GetFileObject.js#L17) component for an example of how `safeFileStream()` can be used.

#### async context.replaceFileStream(fileId, stream)

Replaces the content of the file. Returns a Promise with the ID of the file `{ fileId }`. The _fileId_ remains the same.&#x20;

Return object:

```javascript
// Example
{
  length: 7,
  chunkSize: 261120,
  uploadDate: "2023-03-22T10:34:07.765Z",
  filename: "something.txt",
  md5: "3e47b75000b0924b6c9ba5759a7cf15d",
  metadata: {
    userId: "638f734271b34799e665c9b9",
    fileId: "1bece4a9-cdd1-457a-8e1a-401658cbc030",
    originFlowId: "7f3f6c28-cedb-4625-9853-853e395cabf5"
  },
  fileId: "1bece4a9-cdd1-457a-8e1a-401658cbc030"
}
```

```javascript
'use strict';

module.exports = {

    receive(context) {

        const { fileId, content } = context.messages.in.content;
        return context.replaceFileStream(
            fileId,
            content
        ).then(savedFile => {
            return context.sendJson(savedFile, 'file');
        });
    }
};

```

#### async context.getFileInfo(fileId)

Returns a promise, which when resolved returns the file information (name, length, content type...).

Example return object:

```javascript
{
  "filename": "testFile",
  "contentType": "text",
  "length": 7,
  "chunkSize": 261120,
  "uploadDate": "2021-01-22T12:20:29.227Z",
  "metadata": {
    "userId": "5f804b96ea48ec47a8c444a7",
    "fileId": "fd0e9149-3249-4d42-b519-bfd9ab6773c5"
  },
  "md5": "9a0364b9e99bb480dd25e1f0284c8555",
  "fileId": "fd0e9149-3249-4d42-b519-bfd9ab6773c5"
}
```

#### async context.loadFile(fileId)

Load a file from the Appmixer file storage. The function returns a promise that when resolved, returns the file data as a Buffer.

```javascript
{
    receive(context) {
        return context.loadFile(context.messages.file.content.fileId)
            .then((fileContent) => {
                // uploadFileToAPI() is some function that uploads a file to an API
                return uploadFileToAPI(context.auth, content.messages.file.content.fileName, fileContent);
            });
    }
}
```

#### context.readFileStream(fileId)

**This method has been deprecated. Use** [**context.getFileReadStream**](#async-context.getfilereadstream-fileid) **instead**. Read a file stream from the Appmixer file storage. The function returns a NodeJS read stream that you can e.g. pipe to other, write streams (usually to a request object when uploading a file to a 3rd party API). This is a more efficient and recommended version of `context.loadFile(fileId)`.

#### async context.getFileReadStream(fileId)

Read a file stream from the Appmixer file storage. The function returns a Promise, which when resolved, returns a NodeJS read stream that you can e.g. pipe to other, write streams (usually to a request object when uploading a file to a 3rd party API). This is a more efficient and recommended version of `context.loadFile(fileId)`.

#### async context.removeFile(fileId)

Remove a file from the Appmixer file storage. The function returns a promise.

### Webhook

#### context.getWebhookUrl()

Get a URL that you can send data to with HTTP POST or GET requests. When the webhook URL is called, the `receive()` method of your component is called by Appmixer with `context.messages.webhook` object set and `context.messages.webhook.content.data` containing the actual data sent to the webhook URL:

```javascript
module.exports = {
    async receive(context) {
        if (context.messages.webhook) {
            // Webhook URL received data.
            await context.sendJson(context.messages.webhook.content.data, 'myOutPort');
            // Send response to the webhook HTTP call.
            // Note: you can also skip sending response immediately and send it
            // in other connected components in the flow.
            // If context.response() is not called, the engine waits for the first component
            // that sends the response (in the same "session", i.e. the same "message flow").
            return context.response('<myresponse></myresponse>', 200, { 'Content-Type': 'text/xml' });
        }
        // Otherwise, normal input port received data.
        const input = context.messages.myInPort.content;

        // The webhook URL. Do something with it (send to your API, send to other connected,
        // components, send to your backend, ...)
        const url = context.getWebhookUrl();
    }
};

```

{% hint style="info" %}
Note: The `context.getWebhookUrl()` is only available if you set `webhook: true` in your component manifest file (component.json). This tells Appmixer that this is a "webhook"-type of component.
{% endhint %}

The full `context.messages.webhook` object contains the following properties:

| Property           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content.method`   | HTTP method of the request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `content.hostname` | Hostname of the Appmixer API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `content.headers`  | HTTP headers of the request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `content.query`    | Object with query parameters, i.e. query string parsed into a JSON object.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `content.data`     | Object with the body parameters of the request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `correlationId`    | A special ID generated by Appmixer that uniquely identifies the input message which resulted in generating the webhook URL. In other words, if you call `context.getWebhookUrl()` in the `receive()` method in a reaction to an input message that arrived on an input port of the webhook component, the `correlationId` will be part of the returned webhook URL. This allows you to later associate the input message with the HTTP call to the webhook. A common pattern is to store the input message in the `context.state` object and later use the `context.messages.webhook.correlationId` to retrieve it back. For example, if you have an input port named `myInPort`, you can get the `correlationId` of the input message that just arrived by accessing the `context.messages.myInPort.correlationId.` |

#### async context.response(body, statusCode, headers)

Send a response to the webhook HTTP call. When you set your component to be a webhook-type of component (`webhook: true` in your component.json file), `context.getWebhookURL()` becomes available to you inside your component virtual methods. You can use this URL to send HTTP POST or GET requests to.&#x20;

When a request is received by the component, the `context.messages.webhook.content.data` contains the body of your HTTP request. In order to send a response to this HTTP call, you can use the `context.response()` method. See `context.getWebhookUrl()` for details and examples.

### HTTP

#### **async context.httpRequest**

Since it is very common for components to initiate HTTP requests, Appmixer provides a convenient method to do so. The `httpRequest` object/function is a wrapper around the well known [axios](https://axios-http.com/docs/api_intro) library.

```javascript
module.exports = {
  async receive(context) {
    const { data } = await context.httpRequest({
      url: "https://some-url.com/api",
      method: "POST",
      data: {
        username: "someuser",
        password: "somepass",
      },
      headers: { Authentication: "some"}        
    });
        
    // it is also possible to execute dedicated http methods
    // see here https://axios-http.com/docs/api_intro
    // for example
    // context.httpRequest.get(url[, config])
    const { data } = await context.httpRequest.get("https://url", { params: { name: "some" }, headers: {}});
    // context.httpRequest.post(url[, data[, config]])
    const { data } = await context.httpRequest.post("https://url", { username: "some" }, headers: {});
        
    return context.response(data);
  }
}
```

### Store

#### async context.store.listStores()

Get the list of user's Data Stores.

#### async context.store.get(storeId, key)

Get value from the Data Store, stored under the _key_.

#### async context.store.set(storeId, key, value)

Set value to the Data Store under the _key._

#### async context.store.remove(storeId, key)

Remove the _key_ from the Data Store.

#### async context.store.clear(storeId)

Clear all data from the Data Store.

#### async context.store.find(storeId, query)

Find items in the Data Store.

```javascript
await context.store.find(storeId, { query: { key: { $nin: rowIds } } })
```

#### async context.store.getCursor(storeId, query, options)

Get a cursor.

#### async context.store.registerWebhook(storeId, events = undefined)

Register Data Store webhook. If no events are specified, then the component will get all events from the Data Store. Possible events are _insert, update_ and _delete_.

```javascript
module.exports = {

    async receive(context) {

        // whenever there is an item added/updated/removed from the data
        // store, this component will get triggered with data on the
        // context.messages.webhook.content
        const data = context.messages.webhook.content.data.currentValue;

        if (context.messages.webhook.content.data.type === 'insert') {
            await context.sendJson({
                key: data.key,
                storeId: data.storeId,
                value: data.value,
                updatedAt: data.updatedAt,
                createdAt: data.createdAt
            }, 'item');
        }
        return context.response('ok');
    },

    async start(context) {

        // register without specifying 'events'.
        await context.store.registerWebhook(context.properties.storeId);
    },

    async stop(context) {

        await context.store.unregisterWebhook(context.properties.storeId);
    }
};
```

And the same functionality with registering only for the _insert_ events.

```javascript
module.exports = {

    async receive(context) {

        const data = context.messages.webhook.content.data.currentValue;
        await context.sendJson({
            key: data.key,
            storeId: data.storeId,
            value: data.value,
            updatedAt: data.updatedAt,
            createdAt: data.createdAt
        }, 'item');
        return context.response('ok');
    },

    async start(context) {

        // register only the 'insert' events on the data store.
        await context.store.registerWebhook(context.properties.storeId, ['insert']);
    },

    async stop(context) {

        await context.store.unregisterWebhook(context.properties.storeId);
    }
};
```

#### async context.store.unregisterWebhook(storeId);

Unregister a webhook.

### Scheduling

#### async context.setTimeout(messageContent, delay)

Set a timer that causes the component to receive `messageContent` in the `receive()` method in the special `context.messages.timeout.content` object. `delay` is the time, in milliseconds, the timer should wait before sending the `messageContent` to the component itself. This is especially useful for any kind of scheduling components.

The `context.setTimeout()` function works in a cluster environment as opposed to using the global `setTimeout()` JavaScript function. For example, a component that just _slows down_ incoming messages before sending them to its output port, waiting e.g. 5 minutes, can look like this:

```javascript
module.exports = {
    receive(context) {
        if (context.messages.timeout) {
            // Timeout message.
            return context.sendJson(context.messages.timeout.content, 'out');
        } else {
            // Normal input message.
            return context.setTimeout(context.messages.in.content, 5 * 60 * 1000);
        }
    }
};
```

You can also access the correlation ID of the timeout message which can be useful in some scenarios. The correlation ID is available in the `context.messages.timeout.correlationId` property.

The **return** value from this context method is a _timeout Id_ (a _UUID_ string). Each timeout has its own unique identifier. That can be used to clear the timeout.

#### async context.clearTimeout(timeoutId)

Clear (cancel) a scheduled timeout.&#x20;

### Miscellaneous

#### async context.callAppmixer(request)

Call an Appmixer REST API endpoint. You can call any of the Appmixer endpoints defined in the [API section](broken-reference). The main advantage of this method (as opposed to calling the API endpoint manually) is that the method automatically populates the "Authorization" header of the request to the access token of the user who owns the flow this component runs in. For example:

```javascript
const task = await context.callAppmixer({
    endPoint: '/people-task/tasks',
    method: 'POST',
    body: {
        title: 'My Task',
        description: 'My Example Task',
        requester: 'john@example.com',
        approver: 'alice@example.com',
        decisionBy: (function() {
            const tomorrow = new Date;
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString();
        })()
    }
});
```

#### async context.stopFlow()

Stop the running flow. Example:

```javascript
module.exports = {
    async receive(context) {
        return context.stopFlow();
    }
};
```

#### context.componentId

The ID of the component.

#### context.flowId

The ID of the flow the component runs in.

#### context.flowDescriptor

The flow descriptor of the running flow. This allows you to access configuration of the entire flow within your component virtual methods. To get the configuration of the component itself, you can use `context.flowDescriptor[context.componentId]`. Note that this is normally not necessary since you can access the properties of the component with `context.properties` and the current input message with `context.messages.myInPort.content` but it can be useful in some advanced scenarios.

#### context.customFields

Flow [_customFields_](../../tutorials/flows-metadata-and-filtering#setting-custom-metadata) properties are available in this object.

#### context.evalJavaScript(code, jsonData)

This function lets you evaluate a JavaScript code in a sandbox. The first argument is the JavaScript code and the second is an object with data available to the code. The object is then available under `$data` variable.

```javascript
'use strict';

module.exports = {

    receive(context) {

        const code = `
        function sum(a, b) {
            return a + b;
        }
        sum(parseInt($data.number), 100);
        `;

        let sum = 0;

        // You can call the context.evalJavascript multiple times in receive()
        for (let i = 0; i < 3; i++) {
            const result = context.evalJavaScript(code, context.messages.webhook.content.data);
            sum = sum + result;
        }

        return context.response({ result: sum });
    }
};
```

#### context.setMaxWait(timestamp)

To support components that receive inputs and wait for some future asynchronous response to continue the flow execution from the state of the flow at the time the inputs arrived, Appmixer internally stores a data structure called _Continuity scope_. The _Continuity scope_ is a document stored in the Appmixer internal DB and contains all the data the flow produced until it reached the component with the first message.

For example, some components receive an input message, call a 3rd party API, and wait for an asynchronous push-type of webhook call originating from the 3rd party API - that arrives at a later time - to receive at the component webhook URL. When the webhook arrives, the component produces a JSON and sends it to its output port. At this point, the component must have the state of the flow (all the related data from the same flow "run") to be able to resolve variables and continue execution.

The _Continuity scope_ documents are deleted after a certain time (by default 100 days). If you need to have a component that can wait more than 100 days for the incoming webhook to resume the flow, you can use this function to adjust the timeout. The function excepts `Date, number or a string`. If the argument is a number, it is considered to be the number of milliseconds from now (the time of the function call). If it is a string, it will be converted to `Date` object using `new Date(string)`function.

#### async context.loadVariables()

Load variables in your component. Variables are data available from components connected back in the chain. `loadVariables()` returns a promise that resolves to an array that looks like this:

```json
[
  {
    "variables": {
      "dynamic": [
        {
          "label": "Column A",
          "value": "columnA",
          "componentId": "2c724dff-a04b-43ed-9787-c9a891a721cc",
          "port": "out"
        },
        {
          "label": "Column B",
          "value": "columnB",
          "componentId": "2c724dff-a04b-43ed-9787-c9a891a721cc",
          "port": "out"
        }
      ],
      "static": {}
    },
    "sourceComponentId": "2c724dff-a04b-43ed-9787-c9a891a721cc",
    "outPort": "out",
    "inPort": "in"
  },
  {
    "variables": {
      "dynamic": [
        {
          "label": "Column C",
          "value": "columnC",
          "componentId": "71eb1f40-ce29-4963-8922-102739bafee4",
          "port": "out"
        },
        {
          "label": "Column D",
          "value": "columnD",
          "componentId": "71eb1f40-ce29-4963-8922-102739bafee4",
          "port": "out"
        }
      ],
      "static": {}
    },
    "sourceComponentId": "71eb1f40-ce29-4963-8922-102739bafee4",
    "outPort": "out",
    "inPort": "in"
  }
]
```

The array has as many items as there are other components connected to this component.

Example:

```javascript
{
    receive(context) {
        return context.loadVariables()
            .then(data => {
                const newSchema = data.reduce((acc, item) => {
                    return acc.concat(item.variables.dynamic.map(o => ({ label: o.label, value: o. value })));
                }, []);
                context.sendJson(newSchema, 'leftJoin');
                context.sendJson(newSchema, 'innerJoin');
                context.sendJson(newSchema, 'rightJoin');
            });
    }
}
```

#### async context.log(object)

Log a message. The log message will be available to the end-users in the log panel of the Designer UI or in the Insights page of the Appmixer Studio. The argument has to be an object that can be stringified into JSON.

Example:

```javascript
{
    async start(context) {
        
        await context.log({ test: 'my test log' });
        return context.sendJson({ started: (new Date()).toISOString() }, 'out');
    }
}
```

And the object can be seen in the log panel as:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-METv8_S7S7xOvxJd2gZ%2F-METzGz3Tjo53CRzwgQS%2FAppmixer.png?alt=media\&token=269167f1-2bb4-4564-884d-d1de29edb1e3)

#### async context.lock(lockName, options)

This method allows components to create a cluster lock. This is useful when creating a mutually exclusive section inside the component's code. Such a thing can be achieved in Appmixer using either [quota](quotas-and-limits) (you can define a quota the way that only one `receive` call can be executed at a time) or using locks. This method returns the `lock` instance. Don't forget to call `lock.unlock()` when you're done. Otherwise, the lock will be released after TTL.

`lockName` string will be automatically prefixed with `vendor.service:`. If a component type is `appmixer.google.gmail.NewEmail`, the lockName will be prefixed with `appmixer.google:`. This allows you to create a lock that is shared among all components within a service and prevents possible collisions between components from different vendors or services.

The first parameter is required, the second (options) is optional with the following optional properties:

* `ttl`, number, 20000 by default (ms)
* `retryDelay`, number, 200 by default (ms)
* `maxRetryCount`, number, 30 by default

Example:

```javascript
    async receive(context) {

        let lock = null;
        try {
            lock = await context.lock(context.flowId, {
                ttl: 30000,
                maxRetryCount: 1
            });
            let { callCount = 0, messages = [] } = await context.loadState();
            messages.push(context.messages.in.originalContent);

            if (++callCount === context.messages.in.content.callCount) {
                await context.sendJson(messages || [], 'out');
                await context.saveState({ callCount });
                return;
            }

            await context.saveState({ callCount, messages });
        } finally {
            if (lock) {
                await lock.unlock();
            }
        }
    }

```

### Error Handling

Every function a component implements may throw an exception (or return a rejected promise).

#### receive(context)

If this function throws an exception, Appmixer will try to process the message that triggered this `receive` call again later using an exponential backoff strategy. In total, Appmixer will try to process the failing message 30 times before it is saved into [`unprocessedMessages`](../api/unprocessed-messages) collection. Every unsuccessful attempt will be logged and visible in Insights.

Sometimes you, as a developer of a component, know that there is no point in retrying a message since no matter how many times Appmixer tries, the message will fail repeatedly. In such cases, you can tell Appmixer to cancel the message by throwing the `context.CancelError(reason)` error object. This instructs Appmixer not to apply the auto-retry mechanism and the message will simply be discarded.

```javascript
/**
 * Example of context.CancelError
 */
module.exports = {

    async receive(context) {

        let data = context.messages.in.content;

        try {
            // In this component is trying to create a record in a 3rd party
            // system.
            const resp = await someAPI.createSomething(data);
            await context.sendJson(resp, 'out');
        } catch (err) {
            // And there might be a unique constraint, let's say an email
            // address. And the 3rd party API will return an error with a
            // message saying that this record cannot be created.
            if (err.message === 'duplicate record') {
                // In this case, we can tell Appmixer to cancel the message.
                // Because next attempt would fail again with the same result.
                throw new context.CancelError(err.message);
            }
            // In case of any other error, rethrow the exception. Appmixer will
            // then try to process it again.
            throw err;
        }
    }
};

```

#### tick(context)

If a `tick` function throws an exception, the exception will be logged (and visible in Insights). Appmixer will not apply the auto-retry mechanism since it assumes the developer handles the error manually inside the component code next time the `tick()` function is executed.

#### start(context)

Appmixer won't start a flow if any component in the flow throws an exception in the `start` function. Such error will be logged and visible in Insights.

#### stop(context)

Appmixer will stop the flow even when a component in the flow throws an exception in the `stop` function. Such errors will be logged and visible in Insights.
