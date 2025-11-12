# Test Plan Report

## 1. IdentifyUser
```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"userId":"user_123","deviceId":"device_456","userPropertiesSet":{"email":"user@example.com","name":"John Doe","plan":"premium"},"userPropertiesSetOnce":{"signup_date":"2024-01-15"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\IdentifyUser
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
userId: 
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
    content:    user_123
    scope: 
deviceId: 
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
    content:    device_456
    scope: 
userPropertiesSet: 
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
      email: user@example.com
      name:  John Doe
      plan:  premium
    scope: 
userPropertiesSetOnce: 
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
      signup_date: 2024-01-15
    scope: 
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
    scope: 

[ERROR]: Either User ID or Device ID is required!
ContextCancelError: Either User ID or Device ID is required!
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\IdentifyUser\IdentifyUser.js:9:19)
    at Local.performCommand (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:328961)
    at Local.call (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:326956)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async DevComponent.callProxy (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:289043) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"userId":"user_123","deviceId":"device_456","userPropertiesSet":'{\\"email\\": \\"user@example.com\\", \\"name\\": \\"John Doe\\", \\"plan\\": \\"premium\\"}',"userPropertiesSetOnce":'{\\"signup_date\\": \\"2024-01-15\\"}'}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\IdentifyUser
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
userId: 
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
    content:    user_123
    scope: 
deviceId: 
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
    content:    device_456
    scope: 
userPropertiesSet: 
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
    content:    {"email": "user@example.com", "name": "John Doe", "plan": "premium"}
    scope: 
userPropertiesSetOnce: 
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
    content:    {"signup_date": "2024-01-15"}
    scope: 
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
    scope: 

[ERROR]: Either User ID or Device ID is required!
ContextCancelError: Either User ID or Device ID is required!
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\IdentifyUser\IdentifyUser.js:9:19)
    at Local.performCommand (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:328961)
    at Local.call (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:326956)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async DevComponent.callProxy (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:289043) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

## 2. SendEvent
```
appmixer test component src/appmixer/amplitude/core/SendEvent/ -i '{"eventType":"Button Clicked","userId":"user_12345","deviceId":"device_67890","time":1704067200000,"eventProperties":'{\\"button_name\\": \\"submit\\", \\"page\\": \\"checkout\\"}',"userProperties":'{\\"plan\\": \\"premium\\", \\"signup_date\\": \\"2024-01-01\\"}',"platform":"Web","country":"US","city":"San Francisco","revenue":99.99,"productId":"PROD_001"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
eventType: 
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
    content:    Button Clicked
    scope: 
userId: 
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
    content:    user_12345
    scope: 
deviceId: 
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
    content:    device_67890
    scope: 
time: 
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
    content:    1704067200000
    scope: 
eventProperties: 
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
    content:    {"button_name": "submit", "page": "checkout"}
    scope: 
userProperties: 
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
    content:    {"plan": "premium", "signup_date": "2024-01-01"}
    scope: 
platform: 
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
    content:    Web
    scope: 
country: 
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
    content:    US
    scope: 
city: 
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
    content:    San Francisco
    scope: 
revenue: 
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
    content:    99.99
    scope: 
productId: 
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
    content:    PROD_001
    scope: 
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
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":27824,"level":50,"msg":"Validation error on port in {\n  componentId: '0d709596-46f5-4c8f-a959-d2ad02e1f95d',\n  flowId: '26c33a97-1051-4ec6-856f-dbc23fb91c8a',\n  userId: '691463d09926006cb072d191',\n  componentType: 'appmixer.amplitude.core.SendEvent',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at lodash.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-12T10:39:13.001Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: eventType
      message:      must have required property 'eventType'
</details>

```
appmixer test component src/appmixer/amplitude/core/SendEvent/ -i '{"eventType":"Purchase","userId":"user_abc123"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
eventType: 
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
    content:    Purchase
    scope: 
userId: 
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
    content:    user_abc123
    scope: 
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
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":552,"level":50,"msg":"Validation error on port in {\n  componentId: 'a95ebed0-c3e9-4ad5-bd54-9c87cffa26ff',\n  flowId: 'c7343431-9506-427e-bc6d-d1d7ec1e4e63',\n  userId: '691463d57594260228864587',\n  componentType: 'appmixer.amplitude.core.SendEvent',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at lodash.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-12T10:39:17.440Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: eventType
      message:      must have required property 'eventType'
</details>

```
appmixer test component src/appmixer/amplitude/core/SendEvent/ -i '{"eventType":"Purchase","userId":"user_abc123"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
eventType: 
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
    content:    Purchase
    scope: 
userId: 
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
    content:    user_abc123
    scope: 
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
    scope: 

[ERROR]: Event Type is required!
ContextCancelError: Event Type is required!
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent\SendEvent.js:52:19)
    at Local.performCommand (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:328961)
    at Local.call (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:326956)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async DevComponent.callProxy (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:289043) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/amplitude/core/SendEvent/ -i '{"eventType":"Purchase","userId":"user_abc123"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
eventType: 
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
    content:    Purchase
    scope: 
userId: 
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
    content:    user_abc123
    scope: 
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
    scope: 

[ERROR]: Event Type is required!
ContextCancelError: Event Type is required!
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent\SendEvent.js:52:19)
    at Local.performCommand (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:328961)
    at Local.call (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:326956)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async DevComponent.callProxy (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:289043) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/amplitude/core/SendEvent/ -i '{"eventType":"Purchase","userId":"user_abc123"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
eventType: 
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
    content:    Purchase
    scope: 
userId: 
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
    content:    user_abc123
    scope: 
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
    scope: 

[ERROR]: Event Type is required!
ContextCancelError: Event Type is required!
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\SendEvent\SendEvent.js:52:19)
    at Local.performCommand (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:328961)
    at Local.call (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:326956)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async DevComponent.callProxy (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:289043) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

