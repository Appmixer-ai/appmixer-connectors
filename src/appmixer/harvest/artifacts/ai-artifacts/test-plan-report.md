# Test Plan Report

## 1. CreateClient
```
appmixer test component src/appmixer/harvest/client/CreateClient/ -i '{"in":{"name":"Test Client Company","isActive":true,"address":"123 Main Street\\nNew York, NY 10001","currency":"USD"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Client ID': 16978813,
  'Client Name': 'Test Client Company',
  'Is Active': true,
  Address: '123 Main Street\\nNew York, NY 10001',
  'Statement Key': 'ce0b6f9142dd90315064eb847aa66aa9',
  Currency: 'USD',
  'Created At': '2025-10-23T09:20:00Z',
  'Updated At': '2025-10-23T09:20:00Z'
}

Component's receive method finished in: 220 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 2. FindClients
```
appmixer test component src/appmixer/harvest/client/FindClients/ -i '{"in":{"in":{"isActive":true,"outputType":"array"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\client\FindClients
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        isActive:   true
        outputType: array
    scope: 

[ERROR]: this.sendArrayOutput is not a function
TypeError: this.sendArrayOutput is not a function
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\client\FindClients\FindClients.js:45:21)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
</details>

```
appmixer test component src/appmixer/harvest/client/FindClients/ -i '{"in":{"in":{"isActive":true,"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 16978813,
      name: 'Test Client Company',
      is_active: true,
      address: '123 Main Street\\nNew York, NY 10001',
      statement_key: 'ce0b6f9142dd90315064eb847aa66aa9',
      created_at: '2025-10-23T09:20:00Z',
      updated_at: '2025-10-23T09:20:00Z',
      currency: 'USD'
    },
    {
      id: 16959641,
      name: 'Example Client',
      is_active: true,
      address: null,
      statement_key: 'b1230ead353b344d95230cade6a695f2',
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      currency: 'CZK'
    }
  ],
  count: 2
}



Component's receive method finished in: 174 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/FindClients/ -i '{"in":{"in":{"outputType":"first"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 16978813,
      name: 'Test Client Company',
      is_active: true,
      address: '123 Main Street\\nNew York, NY 10001',
      statement_key: 'ce0b6f9142dd90315064eb847aa66aa9',
      created_at: '2025-10-23T09:20:00Z',
      updated_at: '2025-10-23T09:20:00Z',
      currency: 'USD'
    },
    {
      id: 16959641,
      name: 'Example Client',
      is_active: true,
      address: null,
      statement_key: 'b1230ead353b344d95230cade6a695f2',
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      currency: 'CZK'
    }
  ],
  count: 2
}



Component's receive method finished in: 167 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/FindClients/ -i '{"in":{"in":{"outputType":"object"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 16978813,
      name: 'Test Client Company',
      is_active: true,
      address: '123 Main Street\\nNew York, NY 10001',
      statement_key: 'ce0b6f9142dd90315064eb847aa66aa9',
      created_at: '2025-10-23T09:20:00Z',
      updated_at: '2025-10-23T09:20:00Z',
      currency: 'USD'
    },
    {
      id: 16959641,
      name: 'Example Client',
      is_active: true,
      address: null,
      statement_key: 'b1230ead353b344d95230cade6a695f2',
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      currency: 'CZK'
    }
  ],
  count: 2
}



Component's receive method finished in: 192 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/FindClients/ -i '{"in":{"in":{}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 16978813,
      name: 'Test Client Company',
      is_active: true,
      address: '123 Main Street\\nNew York, NY 10001',
      statement_key: 'ce0b6f9142dd90315064eb847aa66aa9',
      created_at: '2025-10-23T09:20:00Z',
      updated_at: '2025-10-23T09:20:00Z',
      currency: 'USD'
    },
    {
      id: 16959641,
      name: 'Example Client',
      is_active: true,
      address: null,
      statement_key: 'b1230ead353b344d95230cade6a695f2',
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      currency: 'CZK'
    }
  ],
  count: 2
}



Component's receive method finished in: 167 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 3. GetClient
```
appmixer test component src/appmixer/harvest/client/GetClient/ -i '{"in":{"in":{"clientId":16978813}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\client\GetClient
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        clientId: 16978813
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":14916,"level":50,"msg":"Validation error on port in {\n  componentId: 'f41d196c-1ca4-41e4-8b96-e75c176445da',\n  flowId: '2ac0ae73-e0db-4aaa-9a39-3cc16e28d32e',\n  userId: '68f9f37a5bfa323a44fec8b0',\n  componentType: 'appmixer.harvest.client.GetClient',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-10-23T09:20:59.137Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: clientId
      message:      must have required property 'clientId'
</details>

```
appmixer test component src/appmixer/harvest/client/GetClient/ -i '{"in":{"clientId":16978813}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 16978813,
  Name: 'Test Client Company',
  'Is Active': true,
  Address: '123 Main Street\\nNew York, NY 10001',
  'Created At': '2025-10-23T09:20:00Z',
  'Updated At': '2025-10-23T09:20:00Z'
}

Component's receive method finished in: 171 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/GetClient/ -i '{"in":{"clientId":16959641}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 16959641,
  Name: 'Example Client',
  'Is Active': true,
  Address: null,
  'Created At': '2025-10-18T14:34:19Z',
  'Updated At': '2025-10-18T14:34:19Z'
}

Component's receive method finished in: 167 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/GetClient/ -i '{"in":{"clientId":16978813}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 16978813,
  Name: 'Test Client Company',
  'Is Active': true,
  Address: '123 Main Street\\nNew York, NY 10001',
  'Created At': '2025-10-23T09:20:00Z',
  'Updated At': '2025-10-23T09:20:00Z'
}

Component's receive method finished in: 160 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 4. UpdateClient
```
appmixer test component src/appmixer/harvest/client/UpdateClient/ -i '{"in":{"clientId":16978813,"name":"Updated Test Client Company","isActive":true,"address":"456 Updated Street\\nNew York, NY 10002","currency":"EUR"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 191 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/UpdateClient/ -i '{"in":{"clientId":16978813,"name":"Another Updated Name"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 202 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/UpdateClient/ -i '{"in":{"clientId":16978813,"isActive":false,"currency":"GBP"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 208 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/UpdateClient/ -i '{"in":{"clientId":16959641,"name":"Updated Example Client","address":"789 New Address\\nLondon, UK"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 189 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/UpdateClient/ -i '{"in":{"clientId":16959641,"name":"Fully Updated Client","isActive":true,"address":"999 Complete Address\\nParis, France","currency":"EUR"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 198 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 5. CreateTask
```
appmixer test component src/appmixer/harvest/task/CreateTask/ -i '{"in":{"in":{"name":"Development Work","isActive":true,"billableByDefault":true,"defaultHourlyRate":150,"isDefault":false}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\task\CreateTask
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        name:              Development Work
        isActive:          true
        billableByDefault: true
        defaultHourlyRate: 150
        isDefault:         false
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":12576,"level":50,"msg":"Validation error on port in {\n  componentId: 'fa885d48-414b-4f49-8574-76edc153f8fd',\n  flowId: '4e5dabe3-d53b-4968-aa6f-974f2cdb71bc',\n  userId: '68f9f3c1f0c6ca3120008e25',\n  componentType: 'appmixer.harvest.task.CreateTask',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-10-23T09:22:09.683Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: name
      message:      must have required property 'name'
</details>

```
appmixer test component src/appmixer/harvest/task/CreateTask/ -i '{"in":{"name":"Development Work","isActive":true,"billableByDefault":true,"defaultHourlyRate":150,"isDefault":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25344611,
  'Task Name': 'Development Work',
  'Is Active': true,
  'Billable By Default': true,
  'Is Default': false,
  'Default Hourly Rate': 150,
  'Created At': '2025-10-23T09:22:12Z',
  'Updated At': '2025-10-23T09:22:12Z'
}

Component's receive method finished in: 196 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/CreateTask/ -i '{"in":{"name":"Simple Task"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25344612,
  'Task Name': 'Simple Task',
  'Is Active': true,
  'Billable By Default': true,
  'Is Default': false,
  'Default Hourly Rate': null,
  'Created At': '2025-10-23T09:22:16Z',
  'Updated At': '2025-10-23T09:22:16Z'
}

Component's receive method finished in: 197 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/CreateTask/ -i '{"in":{"name":"Inactive Task","isActive":false,"billableByDefault":false,"defaultHourlyRate":75.5}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25344619,
  'Task Name': 'Inactive Task',
  'Is Active': false,
  'Billable By Default': false,
  'Is Default': false,
  'Default Hourly Rate': 75.5,
  'Created At': '2025-10-23T09:22:20Z',
  'Updated At': '2025-10-23T09:22:20Z'
}

Component's receive method finished in: 226 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/CreateTask/ -i '{"in":{"name":"Default Task","isActive":true,"isDefault":true,"billableByDefault":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25344620,
  'Task Name': 'Default Task',
  'Is Active': true,
  'Billable By Default': true,
  'Is Default': true,
  'Default Hourly Rate': null,
  'Created At': '2025-10-23T09:22:24Z',
  'Updated At': '2025-10-23T09:22:24Z'
}

Component's receive method finished in: 189 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 6. FindTasks
```
appmixer test component src/appmixer/harvest/task/FindTasks/ -i '{"in":{"in":{"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 25344620,
      name: 'Default Task',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-23T09:22:24Z',
      updated_at: '2025-10-23T09:22:24Z',
      default_hourly_rate: null
    },
    {
      id: 25344619,
      name: 'Inactive Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-23T09:22:20Z',
      updated_at: '2025-10-23T09:22:20Z',
      default_hourly_rate: 75.5
    },
    {
      id: 25344612,
      name: 'Simple Task',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:16Z',
      updated_at: '2025-10-23T09:22:16Z',
      default_hourly_rate: null
    },
    {
      id: 25344611,
      name: 'Development Work',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:12Z',
      updated_at: '2025-10-23T09:22:12Z',
      default_hourly_rate: 150
    },
    {
      id: 25332919,
      name: 'Final CamelCase Test',
      billable_by_default: true,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:30:27Z',
      updated_at: '2025-10-21T19:30:27Z',
      default_hourly_rate: null
    },
    {
      id: 25332864,
      name: 'CamelCase Test Task 2',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:24:37Z',
      updated_at: '2025-10-21T19:24:37Z',
      default_hourly_rate: null
    },
    {
      id: 25332851,
      name: 'CamelCase Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:23:06Z',
      updated_at: '2025-10-21T19:23:06Z',
      default_hourly_rate: null
    },
    {
      id: 25332729,
      name: 'Schema Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:08:47Z',
      updated_at: '2025-10-21T19:08:47Z',
      default_hourly_rate: null
    },
    {
      id: 25313466,
      name: 'Vacation',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313465,
      name: 'Business Development',
      billable_by_default: false,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313464,
      name: 'Project Management',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313463,
      name: 'Marketing',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313462,
      name: 'Programming',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313461,
      name: 'Design',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    }
  ],
  count: 14
}



Component's receive method finished in: 193 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/FindTasks/ -i '{"in":{"in":{"outputType":"first"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 25344620,
      name: 'Default Task',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-23T09:22:24Z',
      updated_at: '2025-10-23T09:22:24Z',
      default_hourly_rate: null
    },
    {
      id: 25344619,
      name: 'Inactive Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-23T09:22:20Z',
      updated_at: '2025-10-23T09:22:20Z',
      default_hourly_rate: 75.5
    },
    {
      id: 25344612,
      name: 'Simple Task',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:16Z',
      updated_at: '2025-10-23T09:22:16Z',
      default_hourly_rate: null
    },
    {
      id: 25344611,
      name: 'Development Work',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:12Z',
      updated_at: '2025-10-23T09:22:12Z',
      default_hourly_rate: 150
    },
    {
      id: 25332919,
      name: 'Final CamelCase Test',
      billable_by_default: true,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:30:27Z',
      updated_at: '2025-10-21T19:30:27Z',
      default_hourly_rate: null
    },
    {
      id: 25332864,
      name: 'CamelCase Test Task 2',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:24:37Z',
      updated_at: '2025-10-21T19:24:37Z',
      default_hourly_rate: null
    },
    {
      id: 25332851,
      name: 'CamelCase Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:23:06Z',
      updated_at: '2025-10-21T19:23:06Z',
      default_hourly_rate: null
    },
    {
      id: 25332729,
      name: 'Schema Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:08:47Z',
      updated_at: '2025-10-21T19:08:47Z',
      default_hourly_rate: null
    },
    {
      id: 25313466,
      name: 'Vacation',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313465,
      name: 'Business Development',
      billable_by_default: false,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313464,
      name: 'Project Management',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313463,
      name: 'Marketing',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313462,
      name: 'Programming',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313461,
      name: 'Design',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    }
  ],
  count: 14
}



Component's receive method finished in: 171 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/FindTasks/ -i '{"in":{"in":{"outputType":"object"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 25344620,
      name: 'Default Task',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-23T09:22:24Z',
      updated_at: '2025-10-23T09:22:24Z',
      default_hourly_rate: null
    },
    {
      id: 25344619,
      name: 'Inactive Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-23T09:22:20Z',
      updated_at: '2025-10-23T09:22:20Z',
      default_hourly_rate: 75.5
    },
    {
      id: 25344612,
      name: 'Simple Task',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:16Z',
      updated_at: '2025-10-23T09:22:16Z',
      default_hourly_rate: null
    },
    {
      id: 25344611,
      name: 'Development Work',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:12Z',
      updated_at: '2025-10-23T09:22:12Z',
      default_hourly_rate: 150
    },
    {
      id: 25332919,
      name: 'Final CamelCase Test',
      billable_by_default: true,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:30:27Z',
      updated_at: '2025-10-21T19:30:27Z',
      default_hourly_rate: null
    },
    {
      id: 25332864,
      name: 'CamelCase Test Task 2',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:24:37Z',
      updated_at: '2025-10-21T19:24:37Z',
      default_hourly_rate: null
    },
    {
      id: 25332851,
      name: 'CamelCase Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:23:06Z',
      updated_at: '2025-10-21T19:23:06Z',
      default_hourly_rate: null
    },
    {
      id: 25332729,
      name: 'Schema Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:08:47Z',
      updated_at: '2025-10-21T19:08:47Z',
      default_hourly_rate: null
    },
    {
      id: 25313466,
      name: 'Vacation',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313465,
      name: 'Business Development',
      billable_by_default: false,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313464,
      name: 'Project Management',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313463,
      name: 'Marketing',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313462,
      name: 'Programming',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313461,
      name: 'Design',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    }
  ],
  count: 14
}



Component's receive method finished in: 168 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/FindTasks/ -i '{"in":{"in":{"outputType":"file"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 25344620,
      name: 'Default Task',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-23T09:22:24Z',
      updated_at: '2025-10-23T09:22:24Z',
      default_hourly_rate: null
    },
    {
      id: 25344619,
      name: 'Inactive Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-23T09:22:20Z',
      updated_at: '2025-10-23T09:22:20Z',
      default_hourly_rate: 75.5
    },
    {
      id: 25344612,
      name: 'Simple Task',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:16Z',
      updated_at: '2025-10-23T09:22:16Z',
      default_hourly_rate: null
    },
    {
      id: 25344611,
      name: 'Development Work',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:12Z',
      updated_at: '2025-10-23T09:22:12Z',
      default_hourly_rate: 150
    },
    {
      id: 25332919,
      name: 'Final CamelCase Test',
      billable_by_default: true,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:30:27Z',
      updated_at: '2025-10-21T19:30:27Z',
      default_hourly_rate: null
    },
    {
      id: 25332864,
      name: 'CamelCase Test Task 2',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:24:37Z',
      updated_at: '2025-10-21T19:24:37Z',
      default_hourly_rate: null
    },
    {
      id: 25332851,
      name: 'CamelCase Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:23:06Z',
      updated_at: '2025-10-21T19:23:06Z',
      default_hourly_rate: null
    },
    {
      id: 25332729,
      name: 'Schema Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:08:47Z',
      updated_at: '2025-10-21T19:08:47Z',
      default_hourly_rate: null
    },
    {
      id: 25313466,
      name: 'Vacation',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313465,
      name: 'Business Development',
      billable_by_default: false,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313464,
      name: 'Project Management',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313463,
      name: 'Marketing',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313462,
      name: 'Programming',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313461,
      name: 'Design',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    }
  ],
  count: 14
}



Component's receive method finished in: 183 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/FindTasks/ -i '{"in":{"in":{"isActive":true,"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 25344620,
      name: 'Default Task',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-23T09:22:24Z',
      updated_at: '2025-10-23T09:22:24Z',
      default_hourly_rate: null
    },
    {
      id: 25344619,
      name: 'Inactive Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-23T09:22:20Z',
      updated_at: '2025-10-23T09:22:20Z',
      default_hourly_rate: 75.5
    },
    {
      id: 25344612,
      name: 'Simple Task',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:16Z',
      updated_at: '2025-10-23T09:22:16Z',
      default_hourly_rate: null
    },
    {
      id: 25344611,
      name: 'Development Work',
      billable_by_default: true,
      is_default: false,
      is_active: true,
      created_at: '2025-10-23T09:22:12Z',
      updated_at: '2025-10-23T09:22:12Z',
      default_hourly_rate: 150
    },
    {
      id: 25332919,
      name: 'Final CamelCase Test',
      billable_by_default: true,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:30:27Z',
      updated_at: '2025-10-21T19:30:27Z',
      default_hourly_rate: null
    },
    {
      id: 25332864,
      name: 'CamelCase Test Task 2',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:24:37Z',
      updated_at: '2025-10-21T19:24:37Z',
      default_hourly_rate: null
    },
    {
      id: 25332851,
      name: 'CamelCase Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-21T19:23:06Z',
      updated_at: '2025-10-21T19:23:06Z',
      default_hourly_rate: null
    },
    {
      id: 25332729,
      name: 'Schema Test Task',
      billable_by_default: false,
      is_default: false,
      is_active: false,
      created_at: '2025-10-21T19:08:47Z',
      updated_at: '2025-10-21T19:08:47Z',
      default_hourly_rate: null
    },
    {
      id: 25313466,
      name: 'Vacation',
      billable_by_default: false,
      is_default: false,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313465,
      name: 'Business Development',
      billable_by_default: false,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313464,
      name: 'Project Management',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313463,
      name: 'Marketing',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313462,
      name: 'Programming',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    },
    {
      id: 25313461,
      name: 'Design',
      billable_by_default: true,
      is_default: true,
      is_active: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      default_hourly_rate: null
    }
  ],
  count: 14
}



Component's receive method finished in: 175 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 7. GetTask
```
appmixer test component src/appmixer/harvest/task/GetTask/ -i '{"in":{"taskId":"25344620"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25344620,
  'Task Name': 'Default Task',
  'Is Active': true,
  'Billable By Default': true,
  'Is Default': true,
  'Default Hourly Rate': null,
  'Created At': '2025-10-23T09:22:24Z',
  'Updated At': '2025-10-23T09:22:24Z'
}

Component's receive method finished in: 172 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/GetTask/ -i '{"in":{"taskId":"25344619"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25344619,
  'Task Name': 'Inactive Task',
  'Is Active': false,
  'Billable By Default': false,
  'Is Default': false,
  'Default Hourly Rate': 75.5,
  'Created At': '2025-10-23T09:22:20Z',
  'Updated At': '2025-10-23T09:22:20Z'
}

Component's receive method finished in: 189 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/GetTask/ -i '{"in":{"taskId":"25313462"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Task ID': 25313462,
  'Task Name': 'Programming',
  'Is Active': true,
  'Billable By Default': true,
  'Is Default': true,
  'Default Hourly Rate': null,
  'Created At': '2025-10-18T14:34:19Z',
  'Updated At': '2025-10-18T14:34:19Z'
}

Component's receive method finished in: 168 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 8. UpdateTask
```
appmixer test component src/appmixer/harvest/task/UpdateTask/ -i '{"in":{"taskId":25344620,"name":"Updated Task Name"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\task\UpdateTask

[ERROR]:  Component manifest validation error for [ appmixer.harvest.task.UpdateTask ]
Stack trace:
Error: Component manifest validation error for [ appmixer.harvest.task.UpdateTask ]
    at new ComponentJSON (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:294986)
    at Factory.createDevComponent (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:314026)
    at Command.<anonymous> (D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:434:42)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
</details>

```
appmixer test component src/appmixer/harvest/task/UpdateTask/ -i '{"in":{"taskId":25344620,"name":"Updated Task Name"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 222 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/UpdateTask/ -i '{"in":{"taskId":25344620,"name":"Another Updated Name","isActive":false,"billableByDefault":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 213 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/UpdateTask/ -i '{"in":{"taskId":25344619,"defaultHourlyRate":200,"isDefault":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 195 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/UpdateTask/ -i '{"in":{"taskId":25313462,"name":"Programming - Updated"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 199 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 9. CreateProject
```
appmixer test component src/appmixer/harvest/project/CreateProject/ -i '{"in":{"in":{"clientId":"16978813","name":"Website Redesign Project","isActive":true,"billBy":"Project","hourlyRate":150,"budget":5000,"budgetIsMonthly":false,"notes":"Client website redesign project"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\project\CreateProject
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        clientId:        16978813
        name:            Website Redesign Project
        isActive:        true
        billBy:          Project
        hourlyRate:      150
        budget:          5000
        budgetIsMonthly: false
        notes:           Client website redesign project
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":2332,"level":50,"msg":"Validation error on port in {\n  componentId: '80114cc1-36e8-4933-b6e3-a4141304bbc5',\n  flowId: '9bfe1f61-5b26-4f61-9c6a-b9960718e06d',\n  userId: '68f9f44765b6aa091c59f280',\n  componentType: 'appmixer.harvest.project.CreateProject',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object], [Object] ],\n    data: [ [Object], [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-10-23T09:24:23.345Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: clientId
      message:      must have required property 'clientId'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: name
      message:      must have required property 'name'
</details>

```
appmixer test component src/appmixer/harvest/project/CreateProject/ -i '{"in":{"clientId":"16978813","name":"Website Redesign Project","isActive":true,"billBy":"Project","hourlyRate":150,"budget":5000,"budgetIsMonthly":false,"notes":"Client website redesign project"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 46282841,
  Name: 'Website Redesign Project',
  'Is Active': true,
  Client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' },
  Budget: null,
  'Hourly Rate': 150,
  'Created At': '2025-10-23T09:24:26Z',
  'Updated At': '2025-10-23T09:24:26Z'
}

Component's receive method finished in: 261 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/CreateProject/ -i '{"in":{"clientId":"16959641","name":"Simple Project"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 46282843,
  Name: 'Simple Project',
  'Is Active': true,
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  Budget: null,
  'Hourly Rate': null,
  'Created At': '2025-10-23T09:24:32Z',
  'Updated At': '2025-10-23T09:24:32Z'
}

Component's receive method finished in: 300 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/CreateProject/ -i '{"in":{"clientId":"16978813","name":"Monthly Budget Project","isActive":true,"budget":10000,"budgetIsMonthly":true,"billBy":"People"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 46282844,
  Name: 'Monthly Budget Project',
  'Is Active': true,
  Client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' },
  Budget: null,
  'Hourly Rate': null,
  'Created At': '2025-10-23T09:24:36Z',
  'Updated At': '2025-10-23T09:24:36Z'
}

Component's receive method finished in: 252 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/CreateProject/ -i '{"in":{"clientId":"16959641","name":"Archived Project","isActive":false,"notes":"This is an archived project"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 46282845,
  Name: 'Archived Project',
  'Is Active': false,
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  Budget: null,
  'Hourly Rate': null,
  'Created At': '2025-10-23T09:24:41Z',
  'Updated At': '2025-10-23T09:24:41Z'
}

Component's receive method finished in: 293 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 10. FindProjects
```
appmixer test component src/appmixer/harvest/project/FindProjects/ -i '{"in":{"in":{"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 46282845,
      name: 'Archived Project',
      code: null,
      is_active: false,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:41Z',
      updated_at: '2025-10-23T09:24:41Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an archived project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282844,
      name: 'Monthly Budget Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'People',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:36Z',
      updated_at: '2025-10-23T09:24:36Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46282843,
      name: 'Simple Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:32Z',
      updated_at: '2025-10-23T09:24:32Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282841,
      name: 'Website Redesign Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:26Z',
      updated_at: '2025-10-23T09:24:26Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'Client website redesign project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 150,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46239251,
      name: 'Example Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: 50,
      budget_by: 'project',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an example project to help you trial Harvest. You can track time to this project and see what insights you can get from our reports! Feel free to make any edits you want to this project or even delete it.',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 100,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    }
  ],
  count: 5
}



Component's receive method finished in: 179 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/FindProjects/ -i '{"in":{"in":{"isActive":true,"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 46282845,
      name: 'Archived Project',
      code: null,
      is_active: false,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:41Z',
      updated_at: '2025-10-23T09:24:41Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an archived project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282844,
      name: 'Monthly Budget Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'People',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:36Z',
      updated_at: '2025-10-23T09:24:36Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46282843,
      name: 'Simple Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:32Z',
      updated_at: '2025-10-23T09:24:32Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282841,
      name: 'Website Redesign Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:26Z',
      updated_at: '2025-10-23T09:24:26Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'Client website redesign project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 150,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46239251,
      name: 'Example Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: 50,
      budget_by: 'project',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an example project to help you trial Harvest. You can track time to this project and see what insights you can get from our reports! Feel free to make any edits you want to this project or even delete it.',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 100,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    }
  ],
  count: 5
}



Component's receive method finished in: 197 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/FindProjects/ -i '{"in":{"in":{"outputType":"first"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 46282845,
      name: 'Archived Project',
      code: null,
      is_active: false,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:41Z',
      updated_at: '2025-10-23T09:24:41Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an archived project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282844,
      name: 'Monthly Budget Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'People',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:36Z',
      updated_at: '2025-10-23T09:24:36Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46282843,
      name: 'Simple Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:32Z',
      updated_at: '2025-10-23T09:24:32Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282841,
      name: 'Website Redesign Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:26Z',
      updated_at: '2025-10-23T09:24:26Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'Client website redesign project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 150,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46239251,
      name: 'Example Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: 50,
      budget_by: 'project',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an example project to help you trial Harvest. You can track time to this project and see what insights you can get from our reports! Feel free to make any edits you want to this project or even delete it.',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 100,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    }
  ],
  count: 5
}



Component's receive method finished in: 171 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/FindProjects/ -i '{"in":{"in":{"outputType":"object"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 46282845,
      name: 'Archived Project',
      code: null,
      is_active: false,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:41Z',
      updated_at: '2025-10-23T09:24:41Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an archived project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282844,
      name: 'Monthly Budget Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'People',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:36Z',
      updated_at: '2025-10-23T09:24:36Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46282843,
      name: 'Simple Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:32Z',
      updated_at: '2025-10-23T09:24:32Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282841,
      name: 'Website Redesign Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:26Z',
      updated_at: '2025-10-23T09:24:26Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'Client website redesign project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 150,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46239251,
      name: 'Example Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: 50,
      budget_by: 'project',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an example project to help you trial Harvest. You can track time to this project and see what insights you can get from our reports! Feel free to make any edits you want to this project or even delete it.',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 100,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    }
  ],
  count: 5
}



Component's receive method finished in: 188 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/FindProjects/ -i '{"in":{"in":{"clientId":16978813,"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 46282845,
      name: 'Archived Project',
      code: null,
      is_active: false,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:41Z',
      updated_at: '2025-10-23T09:24:41Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an archived project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282844,
      name: 'Monthly Budget Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'People',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:36Z',
      updated_at: '2025-10-23T09:24:36Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46282843,
      name: 'Simple Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'none',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:32Z',
      updated_at: '2025-10-23T09:24:32Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: null,
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: null,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    },
    {
      id: 46282841,
      name: 'Website Redesign Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: null,
      budget_by: 'none',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: false,
      created_at: '2025-10-23T09:24:26Z',
      updated_at: '2025-10-23T09:24:26Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'Client website redesign project',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 150,
      fee: null,
      client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' }
    },
    {
      id: 46239251,
      name: 'Example Project',
      code: null,
      is_active: true,
      is_billable: true,
      is_fixed_fee: false,
      bill_by: 'Project',
      budget: 50,
      budget_by: 'project',
      budget_is_monthly: false,
      notify_when_over_budget: false,
      over_budget_notification_percentage: 80,
      show_budget_to_all: true,
      created_at: '2025-10-18T14:34:19Z',
      updated_at: '2025-10-18T14:34:19Z',
      starts_on: null,
      ends_on: null,
      over_budget_notification_date: null,
      notes: 'This is an example project to help you trial Harvest. You can track time to this project and see what insights you can get from our reports! Feel free to make any edits you want to this project or even delete it.',
      cost_budget: null,
      cost_budget_include_expenses: false,
      hourly_rate: 100,
      fee: null,
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' }
    }
  ],
  count: 5
}



Component's receive method finished in: 180 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 11. GetProject
```
appmixer test component src/appmixer/harvest/project/GetProject/ -i '{"in":{"in":{"projectId":46282841}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\project\GetProject
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        projectId: 46282841
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":37152,"level":50,"msg":"Validation error on port in {\n  componentId: '2835d4a0-cbb0-4549-82d3-0df0c867657f',\n  flowId: '0c160c01-c764-44ec-a41f-614ce389afaa',\n  userId: '68f9f48d9043d99120ed4bd0',\n  componentType: 'appmixer.harvest.project.GetProject',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-10-23T09:25:34.215Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: projectId
      message:      must have required property 'projectId'
</details>

```
appmixer test component src/appmixer/harvest/project/GetProject/ -i '{"in":{"projectId":46282841}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Project ID': 46282841,
  Name: 'Website Redesign Project',
  Code: null,
  'Is Active': true,
  'Bill By': 'Project',
  Budget: null,
  'Budget By': 'none',
  'Budget Is Monthly': false,
  'Notify When Over Budget': false,
  'Over Budget Notification Percentage': 80,
  'Over Budget Notification Date': null,
  'Show Budget To All': false,
  'Created At': '2025-10-23T09:24:26Z',
  'Updated At': '2025-10-23T09:24:26Z',
  'Starts On': null,
  'Ends On': null,
  'Is Billable': true,
  'Is Fixed Fee': false,
  Notes: 'Client website redesign project',
  Client: { id: 16978813, name: 'Another Updated Name', currency: 'GBP' },
  'Hourly Rate': 150
}

Component's receive method finished in: 189 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/GetProject/ -i '{"in":{"projectId":46282843}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Project ID': 46282843,
  Name: 'Simple Project',
  Code: null,
  'Is Active': true,
  'Bill By': 'none',
  Budget: null,
  'Budget By': 'none',
  'Budget Is Monthly': false,
  'Notify When Over Budget': false,
  'Over Budget Notification Percentage': 80,
  'Over Budget Notification Date': null,
  'Show Budget To All': false,
  'Created At': '2025-10-23T09:24:32Z',
  'Updated At': '2025-10-23T09:24:32Z',
  'Starts On': null,
  'Ends On': null,
  'Is Billable': true,
  'Is Fixed Fee': false,
  Notes: null,
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  'Hourly Rate': null
}

Component's receive method finished in: 168 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/GetProject/ -i '{"in":{"projectId":46239251}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Project ID': 46239251,
  Name: 'Example Project',
  Code: null,
  'Is Active': true,
  'Bill By': 'Project',
  Budget: 50,
  'Budget By': 'project',
  'Budget Is Monthly': false,
  'Notify When Over Budget': false,
  'Over Budget Notification Percentage': 80,
  'Over Budget Notification Date': null,
  'Show Budget To All': true,
  'Created At': '2025-10-18T14:34:19Z',
  'Updated At': '2025-10-18T14:34:19Z',
  'Starts On': null,
  'Ends On': null,
  'Is Billable': true,
  'Is Fixed Fee': false,
  Notes: 'This is an example project to help you trial Harvest. You can track time to this project and see what insights you can get from our reports! Feel free to make any edits you want to this project or even delete it.',
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  'Hourly Rate': 100
}

Component's receive method finished in: 176 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/GetProject/ -i '{"in":{"projectId":46282845}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Project ID': 46282845,
  Name: 'Archived Project',
  Code: null,
  'Is Active': false,
  'Bill By': 'none',
  Budget: null,
  'Budget By': 'none',
  'Budget Is Monthly': false,
  'Notify When Over Budget': false,
  'Over Budget Notification Percentage': 80,
  'Over Budget Notification Date': null,
  'Show Budget To All': false,
  'Created At': '2025-10-23T09:24:41Z',
  'Updated At': '2025-10-23T09:24:41Z',
  'Starts On': null,
  'Ends On': null,
  'Is Billable': true,
  'Is Fixed Fee': false,
  Notes: 'This is an archived project',
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  'Hourly Rate': null
}

Component's receive method finished in: 165 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 12. UpdateProject
```
appmixer test component src/appmixer/harvest/project/UpdateProject/ -i '{"in":{"in":{"projectId":46282841,"name":"Updated Website Redesign Project"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\project\UpdateProject
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        projectId: 46282841
        name:      Updated Website Redesign Project
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":32492,"level":50,"msg":"Validation error on port in {\n  componentId: '69a2d8bc-b952-43a0-98dc-ecbd5067816a',\n  flowId: 'f274cfaa-f4d1-4c9c-8a92-5f6bd9e88104',\n  userId: '68f9f6b4560d0d7eece1967a',\n  componentType: 'appmixer.harvest.project.UpdateProject',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-10-23T09:34:44.749Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: projectId
      message:      must have required property 'projectId'
</details>

```
appmixer test component src/appmixer/harvest/project/UpdateProject/ -i '{"in":{"projectId":46282841,"name":"Updated Website Redesign Project"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 264 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/UpdateProject/ -i '{"in":{"projectId":46282841,"name":"Website Redesign - Updated","isActive":false,"hourlyRate":200}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 296 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/UpdateProject/ -i '{"in":{"projectId":46282843,"budget":15000,"budgetIsMonthly":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 249 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/UpdateProject/ -i '{"in":{"projectId":46282844,"billBy":"Project","notes":"Updated project notes for billing"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 292 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 13. CreateTimeEntry
```
appmixer test component src/appmixer/harvest/timeEntry/CreateTimeEntry/ -i '{"in":{"in":{"projectId":46282841,"taskId":25344611,"spentDate":"2025-10-23","hours":8,"notes":"Development work on website redesign"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\timeEntry\CreateTimeEntry
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      in: 
        projectId: 46282841
        taskId:    25344611
        spentDate: 2025-10-23
        hours:     8
        notes:     Development work on website redesign
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":8120,"level":50,"msg":"Validation error on port in {\n  componentId: '4b2338bd-669f-4eee-87e2-3345a3a25969',\n  flowId: '9cdbd47f-39cf-45b8-b711-a2ea83d58a32',\n  userId: '68f9f6dd110d1b1fb8a12837',\n  componentType: 'appmixer.harvest.timeEntry.CreateTimeEntry',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object], [Object], [Object] ],\n    data: [ [Object], [Object], [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-10-23T09:35:25.564Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: projectId
      message:      must have required property 'projectId'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: taskId
      message:      must have required property 'taskId'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: spentDate
      message:      must have required property 'spentDate'
</details>

```
appmixer test component src/appmixer/harvest/timeEntry/CreateTimeEntry/ -i '{"in":{"projectId":46282841,"taskId":25344611,"spentDate":"2025-10-23","hours":8,"notes":"Development work on website redesign"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\timeEntry\CreateTimeEntry
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      projectId: 46282841
      taskId:    25344611
      spentDate: 2025-10-23
      hours:     8
      notes:     Development work on website redesign
    scope: 

[ERROR]: Request failed with status code 422
message: User isn't assigned to the project, Project isn't active, Task isn't assigned to the project
</details>

```
appmixer test component src/appmixer/harvest/timeEntry/CreateTimeEntry/ -i '{"in":{"projectId":46239251,"taskId":25313462,"spentDate":"2025-10-23","hours":5,"notes":"Programming work on example project"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 2778816586,
  'Spent Date': '2025-10-23',
  Hours: 5,
  'Rounded Hours': 5,
  Notes: 'Programming work on example project',
  User: { id: 5402173, name: 'John Doe' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313462, name: 'Programming - Updated' },
  Billable: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-23T09:35:38Z',
  'Updated At': '2025-10-23T09:35:38Z'
}

Component's receive method finished in: 317 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/CreateTimeEntry/ -i '{"in":{"projectId":46239251,"taskId":25313463,"spentDate":"2025-10-23","startedTime":"9:00am","endedTime":"12:00pm","notes":"Marketing campaign planning"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 2778816646,
  'Spent Date': '2025-10-23',
  Hours: 0,
  'Rounded Hours': 0,
  Notes: 'Marketing campaign planning',
  User: { id: 5402173, name: 'John Doe' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313463, name: 'Marketing' },
  Billable: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-23T09:35:44Z',
  'Updated At': '2025-10-23T09:35:44Z'
}

Component's receive method finished in: 363 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/CreateTimeEntry/ -i '{"in":{"projectId":46239251,"taskId":25313464,"spentDate":"2025-10-22"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 2778816682,
  'Spent Date': '2025-10-22',
  Hours: 0,
  'Rounded Hours': 0,
  Notes: null,
  User: { id: 5402173, name: 'John Doe' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313464, name: 'Project Management' },
  Billable: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-23T09:35:49Z',
  'Updated At': '2025-10-23T09:35:49Z'
}

Component's receive method finished in: 333 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 14. FindTimeEntries
```
appmixer test component src/appmixer/harvest/timeEntry/FindTimeEntries/ -i '{"in":{"in":{"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 2778619259,
      spent_date: '2025-10-26',
      hours: 99,
      hours_without_timer: 99,
      rounded_hours: 99,
      notes: 'agagag',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-22T23:42:32Z',
      updated_at: '2025-10-22T23:42:32Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816646,
      spent_date: '2025-10-23',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: 'Marketing campaign planning',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:44Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:44Z',
      updated_at: '2025-10-23T09:35:44Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313463, name: 'Marketing' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953818,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816586,
      spent_date: '2025-10-23',
      hours: 5,
      hours_without_timer: 5,
      rounded_hours: 5,
      notes: 'Programming work on example project',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:38Z',
      updated_at: '2025-10-23T09:35:38Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816682,
      spent_date: '2025-10-22',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: null,
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:49Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:49Z',
      updated_at: '2025-10-23T09:35:49Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313464, name: 'Project Management' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953820,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    }
  ],
  count: 4
}



Component's receive method finished in: 195 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/FindTimeEntries/ -i '{"in":{"in":{"outputType":"first"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 2778619259,
      spent_date: '2025-10-26',
      hours: 99,
      hours_without_timer: 99,
      rounded_hours: 99,
      notes: 'agagag',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-22T23:42:32Z',
      updated_at: '2025-10-22T23:42:32Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816646,
      spent_date: '2025-10-23',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: 'Marketing campaign planning',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:44Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:44Z',
      updated_at: '2025-10-23T09:35:44Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313463, name: 'Marketing' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953818,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816586,
      spent_date: '2025-10-23',
      hours: 5,
      hours_without_timer: 5,
      rounded_hours: 5,
      notes: 'Programming work on example project',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:38Z',
      updated_at: '2025-10-23T09:35:38Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816682,
      spent_date: '2025-10-22',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: null,
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:49Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:49Z',
      updated_at: '2025-10-23T09:35:49Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313464, name: 'Project Management' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953820,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    }
  ],
  count: 4
}



Component's receive method finished in: 212 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/FindTimeEntries/ -i '{"in":{"in":{"outputType":"object"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 2778619259,
      spent_date: '2025-10-26',
      hours: 99,
      hours_without_timer: 99,
      rounded_hours: 99,
      notes: 'agagag',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-22T23:42:32Z',
      updated_at: '2025-10-22T23:42:32Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816646,
      spent_date: '2025-10-23',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: 'Marketing campaign planning',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:44Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:44Z',
      updated_at: '2025-10-23T09:35:44Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313463, name: 'Marketing' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953818,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816586,
      spent_date: '2025-10-23',
      hours: 5,
      hours_without_timer: 5,
      rounded_hours: 5,
      notes: 'Programming work on example project',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:38Z',
      updated_at: '2025-10-23T09:35:38Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816682,
      spent_date: '2025-10-22',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: null,
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:49Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:49Z',
      updated_at: '2025-10-23T09:35:49Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313464, name: 'Project Management' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953820,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    }
  ],
  count: 4
}



Component's receive method finished in: 199 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/FindTimeEntries/ -i '{"in":{"in":{"outputType":"file"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 2778619259,
      spent_date: '2025-10-26',
      hours: 99,
      hours_without_timer: 99,
      rounded_hours: 99,
      notes: 'agagag',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-22T23:42:32Z',
      updated_at: '2025-10-22T23:42:32Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816646,
      spent_date: '2025-10-23',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: 'Marketing campaign planning',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:44Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:44Z',
      updated_at: '2025-10-23T09:35:44Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313463, name: 'Marketing' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953818,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816586,
      spent_date: '2025-10-23',
      hours: 5,
      hours_without_timer: 5,
      rounded_hours: 5,
      notes: 'Programming work on example project',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:38Z',
      updated_at: '2025-10-23T09:35:38Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816682,
      spent_date: '2025-10-22',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: null,
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:49Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:49Z',
      updated_at: '2025-10-23T09:35:49Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313464, name: 'Project Management' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953820,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    }
  ],
  count: 4
}



Component's receive method finished in: 193 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/FindTimeEntries/ -i '{"in":{"in":{"projectId":46239251,"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 2778619259,
      spent_date: '2025-10-26',
      hours: 99,
      hours_without_timer: 99,
      rounded_hours: 99,
      notes: 'agagag',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-22T23:42:32Z',
      updated_at: '2025-10-22T23:42:32Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816646,
      spent_date: '2025-10-23',
      hours: 0.02,
      hours_without_timer: 0,
      rounded_hours: 0.02,
      notes: 'Marketing campaign planning',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:44Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:44Z',
      updated_at: '2025-10-23T09:35:44Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313463, name: 'Marketing' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953818,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816586,
      spent_date: '2025-10-23',
      hours: 5,
      hours_without_timer: 5,
      rounded_hours: 5,
      notes: 'Programming work on example project',
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: null,
      started_time: null,
      ended_time: null,
      is_running: false,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:38Z',
      updated_at: '2025-10-23T09:35:38Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313462, name: 'Programming - Updated' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953819,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    },
    {
      id: 2778816682,
      spent_date: '2025-10-22',
      hours: 0.01,
      hours_without_timer: 0,
      rounded_hours: 0.01,
      notes: null,
      is_locked: false,
      locked_reason: null,
      approval_status: 'unsubmitted',
      is_closed: false,
      is_billed: false,
      timer_started_at: '2025-10-23T09:35:49Z',
      started_time: '11:35am',
      ended_time: null,
      is_running: true,
      billable: true,
      budgeted: true,
      billable_rate: 100,
      cost_rate: null,
      created_at: '2025-10-23T09:35:49Z',
      updated_at: '2025-10-23T09:35:49Z',
      user: { id: 5402173, name: 'John Doe' },
      client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
      project: { id: 46239251, name: 'Example Project', code: null },
      task: { id: 25313464, name: 'Project Management' },
      user_assignment: {
        id: 538554696,
        is_project_manager: true,
        is_active: true,
        use_default_rates: true,
        budget: null,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: null
      },
      task_assignment: {
        id: 511953820,
        billable: true,
        is_active: true,
        created_at: '2025-10-18T14:34:19Z',
        updated_at: '2025-10-18T14:34:19Z',
        hourly_rate: 100,
        budget: null
      },
      invoice: null,
      external_reference: null
    }
  ],
  count: 4
}



Component's receive method finished in: 194 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 15. GetTimeEntry
```
appmixer test component src/appmixer/harvest/timeEntry/GetTimeEntry/ -i '{"in":{"timeEntryId":2778816586}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\timeEntry\GetTimeEntry

[ERROR]:  Unexpected token ','
Stack trace:
D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\timeEntry\GetTimeEntry\GetTimeEntry.js:18
                'User-Agent': 'Appmixer (info@appmixer.ai)',,
                                                            ^

SyntaxError: Unexpected token ','
    at wrapSafe (node:internal/modules/cjs/loader:1281:20)
    at Module._compile (node:internal/modules/cjs/loader:1321:27)
    at Module._extensions..js (node:internal/modules/cjs/loader:1416:10)
    at Module.load (node:internal/modules/cjs/loader:1208:32)
    at Module._load (node:internal/modules/cjs/loader:1024:12)
    at Module.require (node:internal/modules/cjs/loader:1233:19)
    at require (node:internal/modules/helpers:179:18)
    at Command.<anonymous> (D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:370:35)
    at Command.listener (D:\Work\ClientIO\appmixer-cli\node_modules\commander\index.js:315:8)
    at Command.emit (node:events:519:28)
    at Command.parseArgs (D:\Work\ClientIO\appmixer-cli\node_modules\commander\index.js:653:12)
    at Command.parse (D:\Work\ClientIO\appmixer-cli\node_modules\commander\index.js:474:21)
    at Object.<anonymous> (D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:635:13)
    at Module._compile (node:internal/modules/cjs/loader:1358:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1416:10)
    at Module.load (node:internal/modules/cjs/loader:1208:32)
    at Module._load (node:internal/modules/cjs/loader:1024:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:174:12)
    at node:internal/main/run_main_module:28:49
</details>

```
appmixer test component src/appmixer/harvest/timeEntry/GetTimeEntry/ -i '{"in":{"timeEntryId":2778816586}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Time Entry ID': 2778816586,
  'Spent Date': '2025-10-23',
  User: { id: 5402173, name: 'John Doe' },
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313462, name: 'Programming - Updated' },
  Hours: 5,
  'Rounded Hours': 5,
  Notes: 'Programming work on example project',
  'Is Locked': false,
  'Locked Reason': null,
  'Approval Status': 'unsubmitted',
  'Is Billed': false,
  'Is Running': false,
  'Timer Started At': null,
  'Started Time': null,
  'Ended Time': null,
  Billable: true,
  Budgeted: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-23T09:35:38Z',
  'Updated At': '2025-10-23T09:35:38Z'
}

Component's receive method finished in: 186 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/GetTimeEntry/ -i '{"in":{"timeEntryId":2778816646}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Time Entry ID': 2778816646,
  'Spent Date': '2025-10-23',
  User: { id: 5402173, name: 'John Doe' },
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313463, name: 'Marketing' },
  Hours: 0.02,
  'Rounded Hours': 0.02,
  Notes: 'Marketing campaign planning',
  'Is Locked': false,
  'Locked Reason': null,
  'Approval Status': 'unsubmitted',
  'Is Billed': false,
  'Is Running': true,
  'Timer Started At': '2025-10-23T09:35:44Z',
  'Started Time': '11:35am',
  'Ended Time': null,
  Billable: true,
  Budgeted: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-23T09:35:44Z',
  'Updated At': '2025-10-23T09:35:44Z'
}

Component's receive method finished in: 207 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/GetTimeEntry/ -i '{"in":{"timeEntryId":2778816682}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Time Entry ID': 2778816682,
  'Spent Date': '2025-10-22',
  User: { id: 5402173, name: 'John Doe' },
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313464, name: 'Project Management' },
  Hours: 0.02,
  'Rounded Hours': 0.02,
  Notes: null,
  'Is Locked': false,
  'Locked Reason': null,
  'Approval Status': 'unsubmitted',
  'Is Billed': false,
  'Is Running': true,
  'Timer Started At': '2025-10-23T09:35:49Z',
  'Started Time': '11:35am',
  'Ended Time': null,
  Billable: true,
  Budgeted: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-23T09:35:49Z',
  'Updated At': '2025-10-23T09:35:49Z'
}

Component's receive method finished in: 191 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/GetTimeEntry/ -i '{"in":{"timeEntryId":2778619259}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Time Entry ID': 2778619259,
  'Spent Date': '2025-10-26',
  User: { id: 5402173, name: 'John Doe' },
  Client: { id: 16959641, name: 'Fully Updated Client', currency: 'EUR' },
  Project: { id: 46239251, name: 'Example Project', code: null },
  Task: { id: 25313462, name: 'Programming - Updated' },
  Hours: 99,
  'Rounded Hours': 99,
  Notes: 'agagag',
  'Is Locked': false,
  'Locked Reason': null,
  'Approval Status': 'unsubmitted',
  'Is Billed': false,
  'Is Running': false,
  'Timer Started At': null,
  'Started Time': null,
  'Ended Time': null,
  Billable: true,
  Budgeted: true,
  'Billable Rate': 100,
  'Cost Rate': null,
  'Created At': '2025-10-22T23:42:32Z',
  'Updated At': '2025-10-22T23:42:32Z'
}

Component's receive method finished in: 186 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 16. UpdateTimeEntry
```
appmixer test component src/appmixer/harvest/timeEntry/UpdateTimeEntry/ -i '{"in":{"timeEntryId":2778816586,"hours":6}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 264 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/UpdateTimeEntry/ -i '{"in":{"timeEntryId":2778816586,"notes":"Updated programming work - 6 hours"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 267 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/UpdateTimeEntry/ -i '{"in":{"timeEntryId":2778816646,"spentDate":"2025-10-24"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 276 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/UpdateTimeEntry/ -i '{"in":{"timeEntryId":2778816682,"hours":3.5,"notes":"Project management - updated","spentDate":"2025-10-23"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 329 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/UpdateTimeEntry/ -i '{"in":{"timeEntryId":2778619259,"startedTime":"9:00am","endedTime":"5:00pm"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 228 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 17. CreateInvoice
```
appmixer test component src/appmixer/harvest/invoice/CreateInvoice/ -i '{"in":{"clientId":16978813}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201884,
  Number: '1',
  State: 'draft',
  Amount: 0,
  Client: { id: 16978813, name: 'Another Updated Name' },
  'Created At': '2025-10-23T09:38:33Z'
}

Component's receive method finished in: 261 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/CreateInvoice/ -i '{"in":{"clientId":16959641,"subject":"Website Development Services","issueDate":"2025-10-23","dueDate":"2025-11-23","paymentTerm":"net 30","notes":"Invoice for website development project","currency":"EUR"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201886,
  Number: '2',
  State: 'draft',
  Amount: 0,
  Client: { id: 16959641, name: 'Fully Updated Client' },
  'Created At': '2025-10-23T09:38:39Z'
}

Component's receive method finished in: 279 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/CreateInvoice/ -i '{"in":{"clientId":16978813,"subject":"Consulting Services","issueDate":"2025-10-23","dueDate":"2025-11-06","paymentTerm":"net 15","tax":10,"discount":5,"notes":"Consulting work for Q4 2025"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201887,
  Number: '3',
  State: 'draft',
  Amount: 0,
  Client: { id: 16978813, name: 'Another Updated Name' },
  'Created At': '2025-10-23T09:38:44Z'
}

Component's receive method finished in: 258 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/CreateInvoice/ -i '{"in":{"clientId":16959641,"subject":"Design Services","number":"INV-2025-001","issueDate":"2025-10-23","dueDate":"2025-12-23","paymentTerm":"net 60","purchaseOrder":"PO-12345","tax":15,"tax2":5,"discount":10}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201888,
  Number: 'INV-2025-001',
  State: 'draft',
  Amount: 0,
  Client: { id: 16959641, name: 'Fully Updated Client' },
  'Created At': '2025-10-23T09:38:50Z'
}

Component's receive method finished in: 260 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/CreateInvoice/ -i '{"in":{"clientId":16978813,"subject":"Monthly Retainer","issueDate":"2025-10-23"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201891,
  Number: '4',
  State: 'draft',
  Amount: 0,
  Client: { id: 16978813, name: 'Another Updated Name' },
  'Created At': '2025-10-23T09:38:55Z'
}

Component's receive method finished in: 261 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 18. FindInvoices
```
appmixer test component src/appmixer/harvest/invoice/FindInvoices/ -i '{"in":{"in":{"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 49201891,
      client_key: '1567a5f2b33c164eeb4aa5dc0ecd568329d959a0',
      number: '4',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Monthly Retainer',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:55Z',
      updated_at: '2025-10-23T09:38:55Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201888,
      client_key: '9055ad2442478bfb0930183eeaab5fbcc021c42d',
      number: 'INV-2025-001',
      purchase_order: 'PO-12345',
      amount: 0,
      due_amount: 0,
      tax: 15,
      tax_amount: null,
      tax2: 5,
      tax2_amount: null,
      discount: 10,
      discount_amount: null,
      subject: 'Design Services',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-12-22',
      payment_term: 'net 60',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:50Z',
      updated_at: '2025-10-23T09:38:50Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201887,
      client_key: '5c28c1d52620f04af7a99481609000fd5266baa5',
      number: '3',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: 10,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: 5,
      discount_amount: null,
      subject: 'Consulting Services',
      notes: 'Consulting work for Q4 2025',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-07',
      payment_term: 'net 15',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:44Z',
      updated_at: '2025-10-23T09:38:44Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201886,
      client_key: 'b228deda5e1233e6bff493a28eb481172a3a6ef6',
      number: '2',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Website Development Services',
      notes: 'Invoice for website development project',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-22',
      payment_term: 'net 30',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:39Z',
      updated_at: '2025-10-23T09:38:39Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201884,
      client_key: 'ab808ddb9fa8ad62f7f11d171aebf81ee13f0b67',
      number: '1',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: null,
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:33Z',
      updated_at: '2025-10-23T09:38:33Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    }
  ],
  count: 5
}



Component's receive method finished in: 267 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/FindInvoices/ -i '{"in":{"in":{"clientId":16978813,"outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 49201891,
      client_key: '1567a5f2b33c164eeb4aa5dc0ecd568329d959a0',
      number: '4',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Monthly Retainer',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:55Z',
      updated_at: '2025-10-23T09:38:55Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201888,
      client_key: '9055ad2442478bfb0930183eeaab5fbcc021c42d',
      number: 'INV-2025-001',
      purchase_order: 'PO-12345',
      amount: 0,
      due_amount: 0,
      tax: 15,
      tax_amount: null,
      tax2: 5,
      tax2_amount: null,
      discount: 10,
      discount_amount: null,
      subject: 'Design Services',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-12-22',
      payment_term: 'net 60',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:50Z',
      updated_at: '2025-10-23T09:38:50Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201887,
      client_key: '5c28c1d52620f04af7a99481609000fd5266baa5',
      number: '3',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: 10,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: 5,
      discount_amount: null,
      subject: 'Consulting Services',
      notes: 'Consulting work for Q4 2025',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-07',
      payment_term: 'net 15',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:44Z',
      updated_at: '2025-10-23T09:38:44Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201886,
      client_key: 'b228deda5e1233e6bff493a28eb481172a3a6ef6',
      number: '2',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Website Development Services',
      notes: 'Invoice for website development project',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-22',
      payment_term: 'net 30',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:39Z',
      updated_at: '2025-10-23T09:38:39Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201884,
      client_key: 'ab808ddb9fa8ad62f7f11d171aebf81ee13f0b67',
      number: '1',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: null,
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:33Z',
      updated_at: '2025-10-23T09:38:33Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    }
  ],
  count: 5
}



Component's receive method finished in: 206 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/FindInvoices/ -i '{"in":{"in":{"state":"draft","outputType":"array"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 49201891,
      client_key: '1567a5f2b33c164eeb4aa5dc0ecd568329d959a0',
      number: '4',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Monthly Retainer',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:55Z',
      updated_at: '2025-10-23T09:38:55Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201888,
      client_key: '9055ad2442478bfb0930183eeaab5fbcc021c42d',
      number: 'INV-2025-001',
      purchase_order: 'PO-12345',
      amount: 0,
      due_amount: 0,
      tax: 15,
      tax_amount: null,
      tax2: 5,
      tax2_amount: null,
      discount: 10,
      discount_amount: null,
      subject: 'Design Services',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-12-22',
      payment_term: 'net 60',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:50Z',
      updated_at: '2025-10-23T09:38:50Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201887,
      client_key: '5c28c1d52620f04af7a99481609000fd5266baa5',
      number: '3',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: 10,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: 5,
      discount_amount: null,
      subject: 'Consulting Services',
      notes: 'Consulting work for Q4 2025',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-07',
      payment_term: 'net 15',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:44Z',
      updated_at: '2025-10-23T09:38:44Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201886,
      client_key: 'b228deda5e1233e6bff493a28eb481172a3a6ef6',
      number: '2',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Website Development Services',
      notes: 'Invoice for website development project',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-22',
      payment_term: 'net 30',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:39Z',
      updated_at: '2025-10-23T09:38:39Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201884,
      client_key: 'ab808ddb9fa8ad62f7f11d171aebf81ee13f0b67',
      number: '1',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: null,
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:33Z',
      updated_at: '2025-10-23T09:38:33Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    }
  ],
  count: 5
}



Component's receive method finished in: 217 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/FindInvoices/ -i '{"in":{"in":{"outputType":"first"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 49201891,
      client_key: '1567a5f2b33c164eeb4aa5dc0ecd568329d959a0',
      number: '4',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Monthly Retainer',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:55Z',
      updated_at: '2025-10-23T09:38:55Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201888,
      client_key: '9055ad2442478bfb0930183eeaab5fbcc021c42d',
      number: 'INV-2025-001',
      purchase_order: 'PO-12345',
      amount: 0,
      due_amount: 0,
      tax: 15,
      tax_amount: null,
      tax2: 5,
      tax2_amount: null,
      discount: 10,
      discount_amount: null,
      subject: 'Design Services',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-12-22',
      payment_term: 'net 60',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:50Z',
      updated_at: '2025-10-23T09:38:50Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201887,
      client_key: '5c28c1d52620f04af7a99481609000fd5266baa5',
      number: '3',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: 10,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: 5,
      discount_amount: null,
      subject: 'Consulting Services',
      notes: 'Consulting work for Q4 2025',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-07',
      payment_term: 'net 15',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:44Z',
      updated_at: '2025-10-23T09:38:44Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201886,
      client_key: 'b228deda5e1233e6bff493a28eb481172a3a6ef6',
      number: '2',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Website Development Services',
      notes: 'Invoice for website development project',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-22',
      payment_term: 'net 30',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:39Z',
      updated_at: '2025-10-23T09:38:39Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201884,
      client_key: 'ab808ddb9fa8ad62f7f11d171aebf81ee13f0b67',
      number: '1',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: null,
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:33Z',
      updated_at: '2025-10-23T09:38:33Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    }
  ],
  count: 5
}



Component's receive method finished in: 245 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/FindInvoices/ -i '{"in":{"in":{"outputType":"object"}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 49201891,
      client_key: '1567a5f2b33c164eeb4aa5dc0ecd568329d959a0',
      number: '4',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Monthly Retainer',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:55Z',
      updated_at: '2025-10-23T09:38:55Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201888,
      client_key: '9055ad2442478bfb0930183eeaab5fbcc021c42d',
      number: 'INV-2025-001',
      purchase_order: 'PO-12345',
      amount: 0,
      due_amount: 0,
      tax: 15,
      tax_amount: null,
      tax2: 5,
      tax2_amount: null,
      discount: 10,
      discount_amount: null,
      subject: 'Design Services',
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-12-22',
      payment_term: 'net 60',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:50Z',
      updated_at: '2025-10-23T09:38:50Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201887,
      client_key: '5c28c1d52620f04af7a99481609000fd5266baa5',
      number: '3',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: 10,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: 5,
      discount_amount: null,
      subject: 'Consulting Services',
      notes: 'Consulting work for Q4 2025',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-07',
      payment_term: 'net 15',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:44Z',
      updated_at: '2025-10-23T09:38:44Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201886,
      client_key: 'b228deda5e1233e6bff493a28eb481172a3a6ef6',
      number: '2',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: 'Website Development Services',
      notes: 'Invoice for website development project',
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-11-22',
      payment_term: 'net 30',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:39Z',
      updated_at: '2025-10-23T09:38:39Z',
      paid_date: null,
      currency: 'EUR',
      payment_options: [],
      client: { id: 16959641, name: 'Fully Updated Client' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    },
    {
      id: 49201884,
      client_key: 'ab808ddb9fa8ad62f7f11d171aebf81ee13f0b67',
      number: '1',
      purchase_order: null,
      amount: 0,
      due_amount: 0,
      tax: null,
      tax_amount: null,
      tax2: null,
      tax2_amount: null,
      discount: null,
      discount_amount: null,
      subject: null,
      notes: null,
      state: 'draft',
      period_start: null,
      period_end: null,
      issue_date: '2025-10-23',
      due_date: '2025-10-23',
      payment_term: 'custom',
      sent_at: null,
      paid_at: null,
      closed_at: null,
      recurring_invoice_id: null,
      created_at: '2025-10-23T09:38:33Z',
      updated_at: '2025-10-23T09:38:33Z',
      paid_date: null,
      currency: 'GBP',
      payment_options: [],
      client: { id: 16978813, name: 'Another Updated Name' },
      estimate: null,
      retainer: null,
      creator: { id: 5402173, name: 'John Doe' },
      line_items: []
    }
  ],
  count: 5
}



Component's receive method finished in: 194 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 19. GetInvoice
```
appmixer test component src/appmixer/harvest/invoice/GetInvoice/ -i '{"in":{"invoiceId":49201884}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201884,
  Number: '1',
  'Client ID': { id: 16978813, name: 'Another Updated Name' },
  State: 'draft',
  Amount: 0,
  'Due Amount': 0,
  Tax: null,
  'Tax Amount': null,
  Tax2: null,
  'Tax2 Amount': null,
  Discount: null,
  'Discount Amount': null,
  Subject: null,
  Notes: null,
  Currency: 'GBP',
  'Issue Date': '2025-10-23',
  'Due Date': '2025-10-23',
  'Period Start': null,
  'Period End': null,
  'Payment Term': 'custom',
  'Payment Options': [],
  'Purchase Order': null,
  'Sent At': null,
  'Paid At': null,
  'Paid Date': null,
  'Closed At': null,
  'Created At': '2025-10-23T09:38:33Z',
  'Updated At': '2025-10-23T09:38:33Z',
  'Client Key': 'ab808ddb9fa8ad62f7f11d171aebf81ee13f0b67',
  'Line Items': [],
  Creator: { id: 5402173, name: 'John Doe' }
}

Component's receive method finished in: 176 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/GetInvoice/ -i '{"in":{"invoiceId":49201886}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201886,
  Number: '2',
  'Client ID': { id: 16959641, name: 'Fully Updated Client' },
  State: 'draft',
  Amount: 0,
  'Due Amount': 0,
  Tax: null,
  'Tax Amount': null,
  Tax2: null,
  'Tax2 Amount': null,
  Discount: null,
  'Discount Amount': null,
  Subject: 'Website Development Services',
  Notes: 'Invoice for website development project',
  Currency: 'EUR',
  'Issue Date': '2025-10-23',
  'Due Date': '2025-11-22',
  'Period Start': null,
  'Period End': null,
  'Payment Term': 'net 30',
  'Payment Options': [],
  'Purchase Order': null,
  'Sent At': null,
  'Paid At': null,
  'Paid Date': null,
  'Closed At': null,
  'Created At': '2025-10-23T09:38:39Z',
  'Updated At': '2025-10-23T09:38:39Z',
  'Client Key': 'b228deda5e1233e6bff493a28eb481172a3a6ef6',
  'Line Items': [],
  Creator: { id: 5402173, name: 'John Doe' }
}

Component's receive method finished in: 178 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/GetInvoice/ -i '{"in":{"invoiceId":49201888}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201888,
  Number: 'INV-2025-001',
  'Client ID': { id: 16959641, name: 'Fully Updated Client' },
  State: 'draft',
  Amount: 0,
  'Due Amount': 0,
  Tax: 15,
  'Tax Amount': null,
  Tax2: 5,
  'Tax2 Amount': null,
  Discount: 10,
  'Discount Amount': null,
  Subject: 'Design Services',
  Notes: null,
  Currency: 'EUR',
  'Issue Date': '2025-10-23',
  'Due Date': '2025-12-22',
  'Period Start': null,
  'Period End': null,
  'Payment Term': 'net 60',
  'Payment Options': [],
  'Purchase Order': 'PO-12345',
  'Sent At': null,
  'Paid At': null,
  'Paid Date': null,
  'Closed At': null,
  'Created At': '2025-10-23T09:38:50Z',
  'Updated At': '2025-10-23T09:38:50Z',
  'Client Key': '9055ad2442478bfb0930183eeaab5fbcc021c42d',
  'Line Items': [],
  Creator: { id: 5402173, name: 'John Doe' }
}

Component's receive method finished in: 173 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/GetInvoice/ -i '{"in":{"invoiceId":49201891}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201891,
  Number: '4',
  'Client ID': { id: 16978813, name: 'Another Updated Name' },
  State: 'draft',
  Amount: 0,
  'Due Amount': 0,
  Tax: null,
  'Tax Amount': null,
  Tax2: null,
  'Tax2 Amount': null,
  Discount: null,
  'Discount Amount': null,
  Subject: 'Monthly Retainer',
  Notes: null,
  Currency: 'GBP',
  'Issue Date': '2025-10-23',
  'Due Date': '2025-10-23',
  'Period Start': null,
  'Period End': null,
  'Payment Term': 'custom',
  'Payment Options': [],
  'Purchase Order': null,
  'Sent At': null,
  'Paid At': null,
  'Paid Date': null,
  'Closed At': null,
  'Created At': '2025-10-23T09:38:55Z',
  'Updated At': '2025-10-23T09:38:55Z',
  'Client Key': '1567a5f2b33c164eeb4aa5dc0ecd568329d959a0',
  'Line Items': [],
  Creator: { id: 5402173, name: 'John Doe' }
}

Component's receive method finished in: 210 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/GetInvoice/ -i '{"in":{"invoiceId":49201887}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Invoice ID': 49201887,
  Number: '3',
  'Client ID': { id: 16978813, name: 'Another Updated Name' },
  State: 'draft',
  Amount: 0,
  'Due Amount': 0,
  Tax: 10,
  'Tax Amount': null,
  Tax2: null,
  'Tax2 Amount': null,
  Discount: 5,
  'Discount Amount': null,
  Subject: 'Consulting Services',
  Notes: 'Consulting work for Q4 2025',
  Currency: 'GBP',
  'Issue Date': '2025-10-23',
  'Due Date': '2025-11-07',
  'Period Start': null,
  'Period End': null,
  'Payment Term': 'net 15',
  'Payment Options': [],
  'Purchase Order': null,
  'Sent At': null,
  'Paid At': null,
  'Paid Date': null,
  'Closed At': null,
  'Created At': '2025-10-23T09:38:44Z',
  'Updated At': '2025-10-23T09:38:44Z',
  'Client Key': '5c28c1d52620f04af7a99481609000fd5266baa5',
  'Line Items': [],
  Creator: { id: 5402173, name: 'John Doe' }
}

Component's receive method finished in: 172 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 20. UpdateInvoice
```
appmixer test component src/appmixer/harvest/invoice/UpdateInvoice/ -i '{"in":{"invoiceId":49201884,"subject":"Updated Invoice Subject"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 252 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/UpdateInvoice/ -i '{"in":{"invoiceId":49201886,"subject":"Updated Website Development","notes":"Updated notes for invoice","paymentTerm":"net 45"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 274 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/UpdateInvoice/ -i '{"in":{"invoiceId":49201887,"tax":12.5,"discount":7.5}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 240 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/UpdateInvoice/ -i '{"in":{"invoiceId":49201888,"number":"INV-2025-002","issueDate":"2025-10-24","dueDate":"2025-12-24"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 316 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/UpdateInvoice/ -i '{"in":{"invoiceId":49201891,"purchaseOrder":"PO-2025-999","currency":"USD"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 230 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 21. DeleteInvoice
```
appmixer test component src/appmixer/harvest/invoice/DeleteInvoice/ -i '{"in":{"invoiceId":49201884}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 263 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/DeleteInvoice/ -i '{"in":{"invoiceId":49201886}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 262 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/DeleteInvoice/ -i '{"in":{"invoiceId":49201887}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 284 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/DeleteInvoice/ -i '{"in":{"invoiceId":49201888}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 271 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/invoice/DeleteInvoice/ -i '{"in":{"invoiceId":49201891}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 255 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 22. DeleteTimeEntry
```
appmixer test component src/appmixer/harvest/timeEntry/DeleteTimeEntry/ -i '{"in":{"timeEntryId":2778816586}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 254 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/DeleteTimeEntry/ -i '{"in":{"timeEntryId":2778816646}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 232 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/DeleteTimeEntry/ -i '{"in":{"timeEntryId":2778816682}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 236 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/timeEntry/DeleteTimeEntry/ -i '{"in":{"timeEntryId":2778619259}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 261 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 23. DeleteProject
```
appmixer test component src/appmixer/harvest/project/DeleteProject/ -i '{"in":{"projectId":46282844}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 245 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/DeleteProject/ -i '{"in":{"projectId":46282843}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 235 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/DeleteProject/ -i '{"in":{"projectId":46282841}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 224 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/project/DeleteProject/ -i '{"in":{"projectId":46282845}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 234 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 24. DeleteTask
```
appmixer test component src/appmixer/harvest/task/DeleteTask/ -i '{"in":{"taskId":"25344620"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 215 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/DeleteTask/ -i '{"in":{"taskId":"25344619"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 212 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/DeleteTask/ -i '{"in":{"taskId":"25344612"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 214 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/DeleteTask/ -i '{"in":{"taskId":"25344611"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 206 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/task/DeleteTask/ -i '{"in":{"taskId":"25332919"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 213 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 25. DeleteClient
```
appmixer test component src/appmixer/harvest/client/DeleteClient/ -i '{"in":{"clientId":16978813}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 195 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/harvest/client/DeleteClient/ -i '{"in":{"clientId":16959641}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\client\DeleteClient
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      clientId: 16959641
    scope: 

[ERROR]: Request failed with status code 422
message: This client is not removable. It still has projects and/or invoices.
</details>

```
appmixer test component src/appmixer/harvest/client/DeleteClient/ -i '{"in":{"clientId":99999999}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\client\DeleteClient
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      clientId: 99999999
    scope: 

[ERROR]: Request failed with status code 404
status: 404
error:  Not Found
</details>

