# Test Plan Report

## 1. IdentifyUser
```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","deviceId":"device_abc123","userPropertiesSet":{"email":"user@example.com","name":"John Doe","plan":"premium"},"userPropertiesSetOnce":{"signup_date":"2024-01-15"}}}'
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

[ERROR]: Expected property name or '}' in JSON at position 1 (line 1 column 2)
SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
    at JSON.parse (<anonymous>)
    at D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:590:45
    at tryCatcher (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\util.js:16:23)
    at Object.gotValue (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\reduce.js:166:18)
    at Object.gotAccum (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\reduce.js:155:25)
    at Object.tryCatcher (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\util.js:16:23)
    at Promise._settlePromiseFromHandler (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:547:31)
    at Promise._settlePromise (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:604:18)
    at Promise._settlePromiseCtx (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:641:10)
    at _drainQueueStep (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:97:12)
    at _drainQueue (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:86:9)
    at Async._drainQueues (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:102:5)
    at Async.drainQueues [as _onImmediate] (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","deviceId":"device_abc123","userPropertiesSet":"{"email": "user@example.com", "name": "John Doe", "plan": "premium"}","userPropertiesSetOnce":"{"signup_date": "2024-01-15"}"}}'
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

[ERROR]: Expected property name or '}' in JSON at position 1 (line 1 column 2)
SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
    at JSON.parse (<anonymous>)
    at D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:590:45
    at tryCatcher (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\util.js:16:23)
    at Object.gotValue (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\reduce.js:166:18)
    at Object.gotAccum (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\reduce.js:155:25)
    at Object.tryCatcher (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\util.js:16:23)
    at Promise._settlePromiseFromHandler (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:547:31)
    at Promise._settlePromise (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:604:18)
    at Promise._settlePromiseCtx (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:641:10)
    at _drainQueueStep (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:97:12)
    at _drainQueue (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:86:9)
    at Async._drainQueues (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:102:5)
    at Async.drainQueues [as _onImmediate] (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345"}}'
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

[ERROR]: Expected property name or '}' in JSON at position 1 (line 1 column 2)
SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
    at JSON.parse (<anonymous>)
    at D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:590:45
    at tryCatcher (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\util.js:16:23)
    at Object.gotValue (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\reduce.js:166:18)
    at Object.gotAccum (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\reduce.js:155:25)
    at Object.tryCatcher (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\util.js:16:23)
    at Promise._settlePromiseFromHandler (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:547:31)
    at Promise._settlePromise (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:604:18)
    at Promise._settlePromiseCtx (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\promise.js:641:10)
    at _drainQueueStep (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:97:12)
    at _drainQueue (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:86:9)
    at Async._drainQueues (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:102:5)
    at Async.drainQueues [as _onImmediate] (D:\Work\ClientIO\appmixer-cli\node_modules\bluebird\js\release\async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","deviceId":"device_abc123"}}'
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
      userId:   user_12345
      deviceId: device_abc123
    scope: 

[ERROR]: Request failed with status code 400
missing_event
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","userPropertiesSet":"{\\"email\\": \\"test@example.com\\", \\"name\\": \\"Test User\\"}',"userPropertiesSetOnce":"{\\"signup_date\\": \\"2024-01-15\\"}"}}"
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
      userId:                user_12345
      userPropertiesSet:     {"email": "test@example.com", "name": "Test User"}
      userPropertiesSetOnce: {"signup_date": "2024-01-15"}
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":15932,"level":50,"msg":"Validation error on port in {\n  componentId: '36e93676-07f0-47ad-9257-075d84594720',\n  flowId: '37ff2a1a-35f7-4431-b2e9-872b56664ea3',\n  userId: '6915d0416fe72b3e3c79f81a',\n  componentType: 'appmixer.amplitude.core.IdentifyUser',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at lodash.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object], [Object] ],\n    data: [ [Object], [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-13T12:34:09.136Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: /userPropertiesSet
      schemaPath:   #/properties/userPropertiesSet/type
      keyword:      type
      params: 
        type: object
      message:      must be object
    - 
      instancePath: /userPropertiesSetOnce
      schemaPath:   #/properties/userPropertiesSetOnce/type
      keyword:      type
      params: 
        type: object
      message:      must be object
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","userPropertiesSet":"{\\"email\\": \\"test@example.com\\", \\"name\\": \\"Test User\\"}',"userPropertiesSetOnce":"{\\"signup_date\\": \\"2024-01-15\\"}"}}"
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
      userId:                user_12345
      userPropertiesSet:     {"email": "test@example.com", "name": "Test User"}
      userPropertiesSetOnce: {"signup_date": "2024-01-15"}
    scope: 

[ERROR]: Request failed with status code 400
missing_event
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","userPropertiesSet":"{\\"email\\": \\"test@example.com\\", \\"name\\": \\"Test User\\"}',"userPropertiesSetOnce":"{\\"signup_date\\": \\"2024-01-15\\"}"}}"
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
      userId:                user_12345
      userPropertiesSet:     {"email": "test@example.com", "name": "Test User"}
      userPropertiesSetOnce: {"signup_date": "2024-01-15"}
    scope: 

[ERROR]: Request failed with status code 400
missing_event
</details>

```
appmixer test component src/appmixer/amplitude/core/IdentifyUser/ -i '{"in":{"userId":"user_12345","userPropertiesSet":"{\\"email\\": \\"test@example.com\\", \\"name\\": \\"Test User\\"}',"userPropertiesSetOnce":"{\\"signup_date\\": \\"2024-01-15\\"}"}}"
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
      userId:                user_12345
      userPropertiesSet:     {"email": "test@example.com", "name": "Test User"}
      userPropertiesSetOnce: {"signup_date": "2024-01-15"}
    scope: 

[ERROR]: Request failed with status code 404
invalid_request_path
</details>

## 2. SendEvent
```
appmixer test component src/appmixer/amplitude/core/SendEvent/ -i '{"in":{"eventType":"Button Clicked","userId":"user_12345","deviceId":"device_abc123","eventProperties":{"button_name":"submit","page":"checkout"},"userProperties":{"email":"user@example.com","plan":"premium"},"platform":"Web","country":"US","city":"San Francisco"}}'
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
      eventType:       Button Clicked
      userId:          user_12345
      deviceId:        device_abc123
      eventProperties: 
        button_name: submit
        page:        checkout
      userProperties: 
        email: user@example.com
        plan:  premium
      platform:        Web
      country:         US
      city:            San Francisco
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Invalid API key: 8a2f80868a9f987f58feb307ba426809
</details>

## 3. BatchUploadEvents
```
appmixer test component src/appmixer/amplitude/core/BatchUploadEvents/ -i '{"in":{"events":[{"user_id":"user_12345","device_id":"device_abc123","event_type":"Button Clicked","event_properties":{"button_name":"submit","page":"checkout"},"user_properties":{"email":"user@example.com","plan":"premium"},"timestamp":1704067200000},{"user_id":"user_67890","device_id":"device_def456","event_type":"Page Viewed","event_properties":{"page_name":"home","referrer":"google"},"user_properties":{"email":"another@example.com","plan":"free"},"timestamp":1704067300000}],"options_min_id_length":5}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\BatchUploadEvents
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      events: 
        - 
          user_id:          user_12345
          device_id:        device_abc123
          event_type:       Button Clicked
          event_properties: 
            button_name: submit
            page:        checkout
          user_properties: 
            email: user@example.com
            plan:  premium
          timestamp:        1704067200000
        - 
          user_id:          user_67890
          device_id:        device_def456
          event_type:       Page Viewed
          event_properties: 
            page_name: home
            referrer:  google
          user_properties: 
            email: another@example.com
            plan:  free
          timestamp:        1704067300000
      options_min_id_length: 5
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Invalid API key: 8a2f80868a9f987f58feb307ba426809
</details>

## 4. UpdateUserProperties
```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"userId":"user_12345","userPropertiesSet":"{\\"email\\": \\"user@example.com\\", \\"name\\": \\"John Doe\\", \\"plan\\": \\"premium\\"}'}}"
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      userId:            user_12345
      userPropertiesSet: {"email": "user@example.com", "name": "John Doe", "plan": "premium"}
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":35488,"level":50,"msg":"Validation error on port in {\n  componentId: '04666457-a18d-45e6-9781-1acf6586c991',\n  flowId: '9174b24e-0da9-4067-b119-b33a23d81114',\n  userId: '6915d0a032f7458aa053d942',\n  componentType: 'appmixer.amplitude.core.UpdateUserProperties',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at lodash.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-13T12:35:44.853Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: /userPropertiesSet
      schemaPath:   #/properties/userPropertiesSet/type
      keyword:      type
      params: 
        type: object
      message:      must be object
</details>

```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"userId":"user_12345","userPropertiesSet":{"email":"user@example.com","name":"John Doe","plan":"premium"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      userId:            user_12345
      userPropertiesSet: 
        email: user@example.com
        name:  John Doe
        plan:  premium
    scope: 

[ERROR]: Request failed with status code 400
missing_event
</details>

```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"userId":"user_12345","userPropertiesSet":"{\\"email\\": \\"user@example.com\\", \\"name\\": \\"John Doe\\", \\"plan\\": \\"premium\\"}'}}"
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      userId:            user_12345
      userPropertiesSet: {"email": "user@example.com", "name": "John Doe", "plan": "premium"}
    scope: 

[ERROR]: Request failed with status code 400
missing_event
</details>

```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"userId":"user_12345","userPropertiesSet":{"email":"user@example.com","name":"John Doe","plan":"premium"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      userId:            user_12345
      userPropertiesSet: 
        email: user@example.com
        name:  John Doe
        plan:  premium
    scope: 

[ERROR]: Request failed with status code 400
missing_event
</details>

```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"userId":"user_12345","userPropertiesSet":{"email":"user@example.com","name":"John Doe","plan":"premium"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      userId:            user_12345
      userPropertiesSet: 
        email: user@example.com
        name:  John Doe
        plan:  premium
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Invalid API key: 8a2f80868a9f987f58feb307ba426809
</details>

```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"deviceId":"device_abc123","userPropertiesSetOnce":{"signup_date":"2024-01-15"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      deviceId:              device_abc123
      userPropertiesSetOnce: 
        signup_date: 2024-01-15
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Invalid API key: 8a2f80868a9f987f58feb307ba426809
</details>

```
appmixer test component src/appmixer/amplitude/core/UpdateUserProperties/ -i '{"in":{"userId":"user_67890","userPropertiesSet":{"status":"active"},"userPropertiesAdd":{"login_count":1},"groups":{"company":"acme"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\amplitude\core\UpdateUserProperties
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

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
      userId:            user_67890
      userPropertiesSet: 
        status: active
      userPropertiesAdd: 
        login_count: 1
      groups: 
        company: acme
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Invalid API key: 8a2f80868a9f987f58feb307ba426809
</details>

