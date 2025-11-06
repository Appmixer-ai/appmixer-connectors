# Test Plan Report

## 1. ListModels
```
appmixer test component src/appmixer/grok/core/ListModels/ -i '{"outputType":"array"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
outputType: 
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
    content:    array
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
{"name":"component","hostname":"Zbynek-MainPC","pid":10972,"level":50,"msg":"Validation error on port in {\n  componentId: '8daf7f82-fdf8-474a-893c-d2f89f55b949',\n  flowId: 'fec04af3-738b-4f30-99a4-3895d89ffa7a',\n  userId: '690c7edc3857e32adc5367a5',\n  componentType: 'appmixer.grok.core.ListModels',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-06T10:56:44.383Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: outputType
      message:      must have required property 'outputType'
</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 'grok-2-1212',
      created: 1737331200,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-2-vision-1212',
      created: 1733961600,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-3',
      created: 1743724800,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-3-mini',
      created: 1743724800,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-4-0709',
      created: 1752019200,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-4-fast-non-reasoning',
      created: 1756944000,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-4-fast-reasoning',
      created: 1756944000,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-code-fast-1',
      created: 1755993600,
      object: 'model',
      owned_by: 'xai'
    },
    {
      id: 'grok-2-image-1212',
      created: 1736726400,
      object: 'model',
      owned_by: 'xai'
    }
  ],
  count: 9
}



Component's receive method finished in: 380 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: 'grok-2-1212',
  created: 1737331200,
  object: 'model',
  owned_by: 'xai',
  index: 0,
  count: 9
}



Component's receive method finished in: 339 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: 'grok-2-1212',
  created: 1737331200,
  object: 'model',
  owned_by: 'xai',
  index: 0,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-2-vision-1212","created":1733961600,"object":"model","owned_by":"xai","index":1,"count":9}
gridTimestamp: 2025-11-06T10:57:13.346Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: 125ff038-18a0-4b21-8c61-53ae1e38d13f
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-2-vision-1212',
  created: 1733961600,
  object: 'model',
  owned_by: 'xai',
  index: 1,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-3","created":1743724800,"object":"model","owned_by":"xai","index":2,"count":9}
gridTimestamp: 2025-11-06T10:57:13.347Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: d0a5c0cc-a129-43f6-8192-51d01f3e0c22
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-3',
  created: 1743724800,
  object: 'model',
  owned_by: 'xai',
  index: 2,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-3-mini","created":1743724800,"object":"model","owned_by":"xai","index":3,"count":9}
gridTimestamp: 2025-11-06T10:57:13.347Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: be977242-27c3-4c8a-a74d-6e54a7357dbe
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-3-mini',
  created: 1743724800,
  object: 'model',
  owned_by: 'xai',
  index: 3,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-4-0709","created":1752019200,"object":"model","owned_by":"xai","index":4,"count":9}
gridTimestamp: 2025-11-06T10:57:13.347Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: 60fd93ce-9aa1-4ece-8aee-f09b8ce80edd
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-4-0709',
  created: 1752019200,
  object: 'model',
  owned_by: 'xai',
  index: 4,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-4-fast-non-reasoning","created":1756944000,"object":"model","owned_by":"xai","index":5,"count":9}
gridTimestamp: 2025-11-06T10:57:13.348Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: 14698a5d-15e9-4065-8fc1-b0370014f01f
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-4-fast-non-reasoning',
  created: 1756944000,
  object: 'model',
  owned_by: 'xai',
  index: 5,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-4-fast-reasoning","created":1756944000,"object":"model","owned_by":"xai","index":6,"count":9}
gridTimestamp: 2025-11-06T10:57:13.348Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: 4c7d5838-7696-4867-a896-ec7722f62636
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-4-fast-reasoning',
  created: 1756944000,
  object: 'model',
  owned_by: 'xai',
  index: 6,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-code-fast-1","created":1755993600,"object":"model","owned_by":"xai","index":7,"count":9}
gridTimestamp: 2025-11-06T10:57:13.348Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: 75266f2b-4040-4d71-b2d6-feebb1a76038
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-code-fast-1',
  created: 1755993600,
  object: 'model',
  owned_by: 'xai',
  index: 7,
  count: 9
}



In/Out Message logged: 
severity:      info
msg:           {"id":"grok-2-image-1212","created":1736726400,"object":"model","owned_by":"xai","index":8,"count":9}
gridTimestamp: 2025-11-06T10:57:13.348Z
id:            component
type:          data
portType:      out
port:          out
senderId:      3511d30f-a337-4c06-82bb-28a8e855f262
senderType:    appmixer.grok.core.ListModels
userId:        690c7f080715719c24a31225
componentType: appmixer.grok.core.ListModels
componentId:   3511d30f-a337-4c06-82bb-28a8e855f262
flowId:        2ab1a6d0-3da6-470a-90c9-cf12b50ea095
flowName:      
correlationId: 4dc66b79-f685-40ec-82f4-47c1bb0f41e5
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-8ba640d1-08c9-4121-b504-f709528bb684"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: 'grok-2-image-1212',
  created: 1736726400,
  object: 'model',
  owned_by: 'xai',
  index: 8,
  count: 9
}



Component's receive method finished in: 172 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
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
      outputType: file
    scope: 

[ERROR]: ENOENT: no such file or directory, open 'D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels\<SERVICE>-objects-export-7869280b-212f-4175-9eff-38090c1606e8.csv'
Error: ENOENT: no such file or directory, open 'D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels\<SERVICE>-objects-export-7869280b-212f-4175-9eff-38090c1606e8.csv'
    at Object.openSync (node:fs:573:18)
    at Object.writeFileSync (node:fs:2359:35)
    at actualCtx.saveFileStream (D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:462:40)
    at Object.sendArrayOutput (D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\lib.js:42:45)
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels\ListModels.js:30:20)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'D:\\Work\\ClientIO\\appmixer-connectors\\src\\appmixer\\grok\\core\\ListModels\\<SERVICE>-objects-export-7869280b-212f-4175-9eff-38090c1606e8.csv'
}
</details>

## 2. ChatCompletion
```
appmixer test component src/appmixer/grok/core/ChatCompletion/ -i '{"model":"grok-3-latest","messagesRole":"user","messagesContent":"What is the capital of France?"}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ChatCompletion
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
model: 
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
    content:    grok-3-latest
    scope: 
messagesRole: 
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
    content:    user
    scope: 
messagesContent: 
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
    content:    What is the capital of France?
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
stream: 
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
{"name":"component","hostname":"Zbynek-MainPC","pid":39404,"level":50,"msg":"Validation error on port in {\n  componentId: 'ee6616f4-1181-43ef-868f-1cad6b39a31b',\n  flowId: '1f1dfc0d-12bc-442b-b1e5-7fe261caf33e',\n  userId: '690c7f1628173b99ecf787df',\n  componentType: 'appmixer.grok.core.ChatCompletion',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object], [Object], [Object] ],\n    data: [ [Object], [Object], [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-06T10:57:26.852Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: model
      message:      must have required property 'model'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: messagesRole
      message:      must have required property 'messagesRole'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: messagesContent
      message:      must have required property 'messagesContent'
</details>

```
appmixer test component src/appmixer/grok/core/ChatCompletion/ -i '{"in":{"model":"grok-3-latest","messagesRole":"user","messagesContent":"What is the capital of France?"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'd39d683c-8983-0360-a31f-9c10494d7000',
  Object: 'chat.completion',
  Created: 1762426643,
  Model: 'grok-3',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 13,
    completion_tokens: 7,
    total_tokens: 20,
    prompt_tokens_details: {
      text_tokens: 13,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  },
  'System Fingerprint': 'fp_301fb74d4b'
}

Component's receive method finished in: 1012 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ChatCompletion/ -i '{"in":{"model":"grok-3-mini-latest","messagesRole":"user","messagesContent":"Explain quantum computing in simple terms","temperature":0.7,"maxTokens":150}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '51243ca6-4160-d535-33b8-0646446df119',
  Object: 'chat.completion',
  Created: 1762426649,
  Model: 'grok-3-mini',
  Choices: [ { index: 0, message: [Object], finish_reason: 'length' } ],
  Usage: {
    prompt_tokens: 13,
    completion_tokens: 150,
    total_tokens: 509,
    prompt_tokens_details: {
      text_tokens: 13,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 346,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  },
  'System Fingerprint': 'fp_4fae27f477'
}

Component's receive method finished in: 4398 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ChatCompletion/ -i '{"in":{"model":"grok-2-latest","messagesRole":"system","messagesContent":"You are a helpful assistant that provides concise answers."}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'd260c896-f66c-9ef7-2e06-f05161d9ec40',
  Object: 'chat.completion',
  Created: 1762426657,
  Model: 'grok-2-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 16,
    completion_tokens: 9,
    total_tokens: 25,
    prompt_tokens_details: {
      text_tokens: 16,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  },
  'System Fingerprint': 'fp_fced99f24f'
}

Component's receive method finished in: 421 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ChatCompletion/ -i '{"in":{"model":"grok-3-fast-latest","messagesRole":"user","messagesContent":"Write a creative story about a robot","topP":0.9,"frequencyPenalty":0.5,"temperature":0.8}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'be2866c8-1aae-81d7-be36-3e98462e47e5',
  Object: 'chat.completion',
  Created: 1762426662,
  Model: 'grok-3',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 13,
    completion_tokens: 1160,
    total_tokens: 1173,
    prompt_tokens_details: {
      text_tokens: 13,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  },
  'System Fingerprint': 'fp_301fb74d4b'
}

Component's receive method finished in: 53236 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 3. StreamingResponse
```
appmixer test component src/appmixer/grok/core/StreamingResponse/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"What is the capital of France?","stream":true}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StreamingResponse
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
      model:   grok-3-latest
      role:    user
      content: What is the capital of France?
      stream:  true
    scope: 

[ERROR]: Invalid obj param.
TypeError: Invalid obj param.
    at assertImpl (D:\Work\ClientIO\appmixer-cli\dist\index.js:154:52127)
    at assertPredicate (D:\Work\ClientIO\appmixer-cli\dist\index.js:154:52004)
    at Function.object (D:\Work\ClientIO\appmixer-cli\dist\index.js:154:51896)
    at n.exports.getByPath (D:\Work\ClientIO\appmixer-cli\dist\index.js:100:26455)
    at D:\Work\ClientIO\appmixer-cli\dist\index.js:92:320824
    at arrayEach (D:\Work\ClientIO\appmixer-cli\dist\index.js:14:7351)
    at Function.forEach (D:\Work\ClientIO\appmixer-cli\dist\index.js:14:58122)
    at MessageLogger.createAnnotatedOutputMsg (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:320668)
    at DevMessageLogger.logOutput (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:323154)
    at DevComponent.send (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:284519)
    at a.send (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:384282)
    at a.sendJson (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:384455)
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StreamingResponse\StreamingResponse.js:55:24)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
</details>

```
appmixer test component src/appmixer/grok/core/StreamingResponse/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"What is the capital of France?","stream":true}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StreamingResponse
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
      model:   grok-3-latest
      role:    user
      content: What is the capital of France?
      stream:  true
    scope: 

[ERROR]: Invalid obj param.
TypeError: Invalid obj param.
    at assertImpl (D:\Work\ClientIO\appmixer-cli\dist\index.js:154:52127)
    at assertPredicate (D:\Work\ClientIO\appmixer-cli\dist\index.js:154:52004)
    at Function.object (D:\Work\ClientIO\appmixer-cli\dist\index.js:154:51896)
    at n.exports.getByPath (D:\Work\ClientIO\appmixer-cli\dist\index.js:100:26455)
    at D:\Work\ClientIO\appmixer-cli\dist\index.js:92:320824
    at arrayEach (D:\Work\ClientIO\appmixer-cli\dist\index.js:14:7351)
    at Function.forEach (D:\Work\ClientIO\appmixer-cli\dist\index.js:14:58122)
    at MessageLogger.createAnnotatedOutputMsg (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:320668)
    at DevMessageLogger.logOutput (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:323154)
    at DevComponent.send (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:284519)
    at a.send (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:384282)
    at a.sendJson (D:\Work\ClientIO\appmixer-cli\dist\index.js:92:384455)
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StreamingResponse\StreamingResponse.js:67:28)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
</details>

```
appmixer test component src/appmixer/grok/core/StreamingResponse/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"What is the capital of France?","stream":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":"The","role":"assistant"}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":" capital"}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":" of"}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":" France"}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":" is"}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":" Paris"}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{"content":"."}}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: {"id":"156a9f79-a9ad-6c5f-4e18-1d345ea33e74","object":"chat.completion.chunk","created":1762426763,"model":"grok-3","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"system_fingerprint":"fp_301fb74d4b"}\n' +
  '\n' +
  'data: [DONE]\n' +
  '\n'



Component's receive method finished in: 636 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/StreamingResponse/ -i '{"in":{"model":"grok-3-mini-latest","role":"user","content":"Explain quantum computing","stream":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
`{"id":"e49dd9c2-fb16-0cf5-1682-eed4651a4800","object":"chat.completion","created":1762426769,"model":"grok-3-mini","choices":[{"index":0,"message":{"role":"assistant","content":"Sure, I'd be happy to explain quantum computing! It's a fascinating and cutting-edge field that builds on the principles of quantum mechanics to perform computations in ways that classical computers can't. I'll break this down step by step, starting from the basics, so it's easier to follow. If you're new to this, don't worry—I'll use simple analogies where possible.\\n\\n### 1. **What is Quantum Computing?**\\nQuantum computing is a type of computing that uses the principles of quantum physics to process information. While classical computers (like the one you're using now) use bits to store and process data, quantum computers use quantum bits, or \\"qubits,\\" which can exist in multiple states at once. This allows quantum computers to solve certain problems much faster than classical ones, especially for complex tasks like factoring large numbers, optimizing logistics, or simulating molecular structures.\\n\\nIn essence, quantum computing harnesses the weird and wonderful behaviors of particles at the atomic and subatomic levels to perform calculations. It's not meant to replace your everyday laptop; it's more like a specialized tool for tackling problems that are practically impossible for classical computers.\\n\\n### 2. **How Does It Differ from Classical Computing?**\\nTo understand quantum computing, it's helpful to compare it to classical computing:\\n\\n- **Classical Computers**: These use bits, which are like tiny switches that can be either 0 or 1. For example, think of a light bulb that's either on (1) or off (0). Everything a classical computer does—running apps, browsing the web—is based on manipulating these bits through logical operations. It's straightforward and reliable, but it can get bogged down with very large or complex datasets because it processes one possibility at a time.\\n\\n- **Quantum Computers**: Instead of bits, they use qubits. A qubit can be a 0, a 1, or both at the same time (thanks to a quantum principle called superposition). Imagine a coin that's not just heads or tails, but spinning and representing both until you look at it. This means a quantum computer can explore multiple solutions simultaneously, which gives it a massive speed advantage for certain problems.\\n\\nThe key difference is efficiency: Classical computers are great for everyday tasks, but quantum computers excel at problems involving vast amounts of data or probabilities, like cryptography or drug discovery.\\n\\n### 3. **The Core Principles of Quantum Computing**\\nQuantum computing relies on a few fundamental concepts from quantum mechanics. Let's break them down:\\n\\n- **Qubits**: These are the building blocks. Unlike a classical bit, a qubit can be in a \\"superposition\\" state, meaning it represents 0 and 1 at the same time. If you have two qubits, they can represent four possibilities (00, 01, 10, 11) simultaneously, and with three qubits, it's eight possibilities. This grows exponentially, so a quantum computer with just 50 qubits could theoretically handle more combinations than there are atoms in the universe!\\n\\n- **Superposition**: This is like having a qubit in multiple states until it's measured. A great analogy is Schrodinger's cat: The cat is both alive and dead until you open the box and check. In computing, this allows qubits to process multiple scenarios at once.\\n\\n- **Entanglement**: This is a phenomenon where two or more qubits become linked, so the state of one instantly influences the other, no matter how far apart they are. It's like having two coins that always land on the same side when flipped together. Entanglement lets quantum computers perform operations on multiple qubits in a coordinated way, enabling complex calculations.\\n\\n- **Quantum Gates**: These are the equivalent of logic gates in classical computers (like AND or OR gates). Quantum gates manipulate qubits by changing their states. For example, a gate might put a qubit into superposition or entangle it with another. The sequence of gates forms a quantum algorithm.\\n\\nWhen you run a quantum program, the qubits are manipulated through these gates, and then the system is \\"measured\\" to collapse the superposition into a definite result. However, measurement introduces randomness, so quantum algorithms are designed to amplify the correct answer through probability.\\n\\n### 4. **How Does Quantum Computing Work in Practice?**\\nA quantum computer operates in three main stages:\\n- **Initialization**: Qubits are set to a starting state.\\n- **Processing**: Quantum gates apply operations, leveraging superposition and entanglement to explore possibilities.\\n- **Measurement**: The qubits are measured, and the results are output.\\n\\nFamous algorithms showcase its power:\\n- **Shor's Algorithm**: Can factor large numbers exponentially faster than classical methods, threatening current encryption systems.\\n- **Grover's Algorithm**: Speeds up searching unsorted databases.\\n- **Quantum Simulation**: Models quantum systems, like chemical reactions, which is huge for fields like pharmaceuticals.\\n\\nHowever, quantum computers aren't plug-and-play yet. They require extreme conditions, like near-absolute zero temperatures, to maintain qubit stability, and they suffer from errors due to environmental interference (called \\"decoherence\\").\\n\\n### 5. **Applications and the Future**\\nQuantum computing has enormous potential:\\n- **Cryptography**: Breaking and creating unbreakable codes.\\n- **Drug Discovery**: Simulating molecular interactions to design new medicines faster.\\n- **Optimization**: Solving problems like traffic flow, supply chain logistics, or financial modeling.\\n- **AI and Machine Learning**: Enhancing pattern recognition and data analysis.\\n\\nCompanies like IBM, Google, and Microsoft are investing heavily, and we're seeing early quantum computers with around 100-1,000 qubits. But we're still in the \\"NISQ\\" era (Noisy Intermediate-Scale Quantum), meaning current systems are error-prone and limited.\\n\\n### 6. **Limitations and Challenges**\\nQuantum computing isn't a silver bullet:\\n- **Error Rates**: Qubits are fragile and can lose their quantum state easily, leading to inaccuracies.\\n- **Scalability**: Building reliable quantum computers with thousands of qubits is a huge engineering challenge.\\n- **Practical Use**: Most problems don't benefit from quantum computing; it's only advantageous for specific, complex tasks.\\n- **Accessibility**: Quantum computers are expensive and require specialized knowledge, so they're not yet available for everyday use.\\n\\nIn short, quantum computing is complementary to classical computing—think of it as a supercharged tool for niche applications.\\n\\n### Wrapping Up\\nQuantum computing is revolutionizing how we think about problem-solving by tapping into the counterintuitive world of quantum physics. It's an exciting field with the potential to solve global challenges, but it's still developing. If you'd like me to dive deeper into any part—like specific algorithms, real-world examples, or how to get started with quantum programming—just let me know! 😊","reasoning_content":"First, the user asked to \\"Explain quantum computing.\\" I need to provide a clear, accurate, and accessible explanation. Since this is a complex topic, I should start from the basics and build up without overwhelming the user.\\n\\nKey elements to cover:\\n- What is quantum computing?\\n- How does it differ from classical computing?\\n- Basic principles like superposition, entanglement, and qubits.\\n- Potential applications and limitations.\\n- Keep it simple; avoid jargon or explain it when used.\\n\\nStructure the response:\\n1. **Introduction**: Define quantum computing in simple terms.\\n2. **Comparison to Classical Computing**: Explain how classical computers work briefly, then contrast with quantum.\\n3. **Core Concepts**:\\n   - Qubits vs. Bits.\\n   - Superposition.\\n   - Entanglement.\\n   - Quantum Gates.\\n4. **How it Works**: A high-level overview of quantum algorithms.\\n5. **Applications and Future**: Real-world uses and current status.\\n6. **Limitations**: Things like error rates, scalability, and that it's not a replacement for classical computing.\\n7. **Conclusion**: Wrap up with why it's exciting.\\n\\nEnsure the explanation is neutral and accurate. I'm an AI, so base this on general knowledge up to my last training data.\\n\\nMake it engaging: Use analogies to make concepts relatable, like comparing bits to coins and qubits to spinning coins.\\n\\nLength: Aim for comprehensive but concise. Since this is a response, keep it under 1000 words.\\n\\nFinally, end with an invitation for more questions to encourage interaction.","refusal":null},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":1328,"total_tokens":1645,"prompt_tokens_details":{"text_tokens":10,"audio_tokens":0,"image_tokens":0,"cached_tokens":2},"completion_tokens_details":{"reasoning_tokens":307,"audio_tokens":0,"accepted_prediction_tokens":0,"rejected_prediction_tokens":0},"num_sources_used":0},"system_fingerprint":"fp_4fae27f477"}`



Component's receive method finished in: 13232 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/StreamingResponse/ -i '{"in":{"model":"grok-2-latest","role":"system","content":"You are a helpful assistant","temperature":0.5,"max_tokens":100}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":"Hello","role":"assistant"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":"!"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":" How"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":" can"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":" I"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":" assist"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":" you"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":" today"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{"content":"?"}}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: {"id":"cf3b24e7-e902-6279-1332-d14a4f8684de","object":"chat.completion.chunk","created":1762426789,"model":"grok-2-1212","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"system_fingerprint":"fp_fced99f24f"}\n' +
  '\n' +
  'data: [DONE]\n' +
  '\n'



Component's receive method finished in: 846 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 4. ReasoningCompletion
```
appmixer test component src/appmixer/grok/core/ReasoningCompletion/ -i '{"in":{"model":"grok-3-mini-latest","messages":[{"role":"user","content":"What is 2+2? Think step by step."}],"reasoning_effort":"medium","stream":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '5de89827-fbc5-2372-0a0a-c11e689a2f7d',
  Object: 'chat.completion',
  Created: 1762426804,
  Model: 'grok-3-mini-high',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 19,
    completion_tokens: 281,
    total_tokens: 878,
    prompt_tokens_details: {
      text_tokens: 19,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 578,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 7351 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ReasoningCompletion/ -i '{"in":{"model":"grok-3-mini-fast-latest","messages":[{"role":"user","content":"Solve this problem: If a train travels at 60 mph for 2 hours, how far does it travel?"}],"reasoning_effort":"high","temperature":0.7,"max_tokens":200}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'f117058b-66a0-5c02-2092-903fbaf35a3f',
  Object: 'chat.completion',
  Created: 1762426816,
  Model: 'grok-3-mini-high',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 30,
    completion_tokens: 42,
    total_tokens: 353,
    prompt_tokens_details: {
      text_tokens: 30,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 281,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 3574 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ReasoningCompletion/ -i '{"in":{"model":"grok-3-mini-latest","messages":[{"role":"system","content":"You are a helpful math tutor."},{"role":"user","content":"What is the square root of 144?"},{"role":"assistant","content":"The square root of 144 is 12, because 12 × 12 = 144."},{"role":"user","content":"Can you explain why?"}],"reasoning_effort":"low","top_p":0.9}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '8fdb5faa-8f97-b652-e29e-03876eedfc08',
  Object: 'chat.completion',
  Created: 1762426827,
  Model: 'grok-3-mini',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 60,
    completion_tokens: 458,
    total_tokens: 958,
    prompt_tokens_details: {
      text_tokens: 60,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 6
    },
    completion_tokens_details: {
      reasoning_tokens: 440,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 8497 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ReasoningCompletion/ -i '{"in":{"model":"grok-3-mini-latest","messages":[{"role":"user","content":"Explain the concept of recursion in programming."}],"reasoning_effort":"medium","stream":true,"max_tokens":300}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: undefined,
  Object: undefined,
  Created: undefined,
  Model: undefined,
  Choices: undefined,
  Usage: undefined
}

Component's receive method finished in: 7857 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ReasoningCompletion/ -i '{"in":{"model":"grok-3-mini-latest","messages":[{"role":"user","content":"Explain the concept of recursion in programming."}],"reasoning_effort":"medium","stream":true,"max_tokens":300}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: undefined,
  Object: undefined,
  Created: undefined,
  Model: undefined,
  Choices: undefined,
  Usage: undefined
}

Component's receive method finished in: 6810 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 5. StructuredOutput
```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"model":"grok-3-latest","role":"user","content":"Extract the name and age from this text: John is 30 years old.","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"name":{"type":"string","description":"The person's name"},"age":{"type":"integer","description":"The person's age"}},"required":["name","age"]}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StructuredOutput
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
model: 
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
    content:    grok-3-latest
    scope: 
role: 
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
    content:    user
    scope: 
content: 
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
    content:    Extract the name and age from this text: John is 30 years old.
    scope: 
responseFormatType: 
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
    content:    json_schema
    scope: 
jsonSchema: 
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
      type:       object
      properties: 
        name: 
          type:        string
          description: The person's name
        age: 
          type:        integer
          description: The person's age
      required: 
        - name
        - age
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
{"name":"component","hostname":"Zbynek-MainPC","pid":17936,"level":50,"msg":"Validation error on port in {\n  componentId: '38110187-d533-48d1-bf4b-2497e35a2df5',\n  flowId: 'c54307f8-03bc-4338-a266-38e3153f8ee4',\n  userId: '690c8010ea792846104a2614',\n  componentType: 'appmixer.grok.core.StructuredOutput',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object], [Object], [Object], [Object], [Object] ],\n    data: [ [Object], [Object], [Object], [Object], [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-06T11:01:36.539Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: model
      message:      must have required property 'model'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: role
      message:      must have required property 'role'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: content
      message:      must have required property 'content'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: responseFormatType
      message:      must have required property 'responseFormatType'
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: jsonSchema
      message:      must have required property 'jsonSchema'
</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"Extract the name and age from this text: John is 30 years old.","responseFormatType":"json_schema","jsonSchema":'{\\"type\\": \\"object\\", \\"properties\\": {\\"name\\": {\\"type\\": \\"string\\", \\"description\\": \\"The person's name\\"}, \\"age\\": {\\"type\\": \\"integer\\", \\"description\\": \\"The person's age\\"}}, \\"required\\": [\\"name\\", \\"age\\"]}'}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StructuredOutput
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
      model:              grok-3-latest
      role:               user
      content:            Extract the name and age from this text: John is 30 years old.
      responseFormatType: json_schema
      jsonSchema:         {"type": "object", "properties": {"name": {"type": "string", "description": "The person's name"}, "age": {"type": "integer", "description": "The person's age"}}, "required": ["name", "age"]}
    scope: 
{"name":"component","hostname":"Zbynek-MainPC","pid":38064,"level":50,"msg":"Validation error on port in {\n  componentId: '58e96518-9dc5-4100-b043-25da9bb45be7',\n  flowId: '05687c90-a2fa-4386-b092-7140060fbdd5',\n  userId: '690c80159655f094b02a91c5',\n  componentType: 'appmixer.grok.core.StructuredOutput',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:402115)\n      at InputPortProcessor.validate (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:401902)\n      at InputPortProcessor.processMessage (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:400667)\n      at D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399867\n      at arrayEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:7351)\n      at Function.forEach (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:14:58122)\n      at InputPortProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:399833)\n      at MessagesProcessor.process (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:412375)\n      at Context.prepare (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:380878)\n      at ContextHandler.createContext (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n      at async DevComponent.devCall (D:\\Work\\ClientIO\\appmixer-cli\\dist\\index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2025-11-06T11:01:42.014Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: /jsonSchema
      schemaPath:   #/properties/jsonSchema/type
      keyword:      type
      params: 
        type: object
      message:      must be object
</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"Extract the name and age from this text: John is 30 years old.","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"name":{"type":"string","description":"The person's name"},"age":{"type":"integer","description":"The person's age"}},"required":["name","age"]}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\StructuredOutput
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
      model:              grok-3-latest
      role:               user
      content:            Extract the name and age from this text: John is 30 years old.
      responseFormatType: json_schema
      jsonSchema: 
        type:       object
        properties: 
          name: 
            type:        string
            description: The person's name
          age: 
            type:        integer
            description: The person's age
        required: 
          - name
          - age
    scope: 

[ERROR]: Request failed with status code 400
code:  Client specified an invalid argument
error: Missing required parameter: 'response_format.json_schema.schema'.
</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"Extract the name and age from this text: John is 30 years old.","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"name":{"type":"string","description":"The person's name"},"age":{"type":"integer","description":"The person's age"}},"required":["name","age"]}}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '04b0c0a1-d3ce-fcc6-30df-453208fc904c',
  Object: 'chat.completion',
  Created: 1762426913,
  Model: 'grok-3',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 96,
    completion_tokens: 12,
    total_tokens: 108,
    prompt_tokens_details: {
      text_tokens: 96,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 3
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 778 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-mini-latest","role":"user","content":"Generate a product review with rating","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"product":{"type":"string"},"rating":{"type":"integer","minimum":1,"maximum":5},"review":{"type":"string"}},"required":["product","rating","review"]},"strict":true,"maxTokens":200}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '45ffa6d5-9c03-5544-ff79-a7e29c3e4f4f',
  Object: 'chat.completion',
  Created: 1762426919,
  Model: 'grok-3-mini',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 91,
    completion_tokens: 28,
    total_tokens: 519,
    prompt_tokens_details: {
      text_tokens: 91,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 14
    },
    completion_tokens_details: {
      reasoning_tokens: 400,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 15364 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 6. ImageGeneration
```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A serene landscape with mountains and a lake at sunset","n":1,"size":"1024x1024","response_format":"b64_json","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ImageGeneration
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
      model:           grok-2-image-latest
      prompt:          A serene landscape with mountains and a lake at sunset
      n:               1
      size:            1024x1024
      response_format: b64_json
      outputType:      array
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Argument not supported: size
</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A serene landscape with mountains and a lake at sunset","n":1,"response_format":"b64_json","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ImageGeneration
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
      model:           grok-2-image-latest
      prompt:          A serene landscape with mountains and a lake at sunset
      n:               1
      response_format: b64_json
      outputType:      array
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Argument not supported: size
</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A serene landscape with mountains and a lake at sunset","n":1,"response_format":"b64_json","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      b64_json: '/9j/4AAQSkZJRgABAgAAAQABAAD/wAARCAPAAtADAREAAhEBAxEB/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/9sAQwEJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDBzXQeiLmgYtAC0gsJQMXtQFhKVihDQFhDQFgxSHyhimFhcUh2FxSuOwYpXGoi4pFco7FA+UTFK47C4pDsFK4+UMUrj5Q20rjURdtK4+UULSuPlF20rlKI/bSuVyhtpXK5RdlLmDlDZU3Hyjghpcw+UUIaXMPlHbKm5XKLspXHyhsouOwFaLisG2ncVhCuKAsNIpiENUJjaYmMaqsZsSmhCVSJGk0yRpNUSJTsJjTTsIaaqxAlOwgNMkSgLCGmSJQACgQUDQ4UAFFhhQAooAKADNABmgAzQCFoAKQxaBjgamxQoNKw0PBpWLTHg1Nix2amxQ7NKxQ7NFguFFhNgaLAmJRYLi4osFxDTsTcSnYkUUWHcUCiwC7aVgF207AJiiwgxTsIMU7CuGKdhXCiwri4p2C44CnYQ4IaLCMmtznFFAxelK4C5ouOw4UrlWFxU3K5Q25o5h8opSp5iuQPLpcwcgeUaOYr2Y7yvap5x8geXS5x8guz2pc41AXb7UucrkE2GjnDkF8s0c5XIAiJqecOQXyTS5yuQd5VDkVyCiKp5h8gvl0uYaiKI6XMHKKI6nmHyi+WKOYaiLs9qXMVyhsqeYOUds9qXMVyjhH7UuYfKKI6XMOw7ZS5gsLtFFx2Exii4WEIouIaRTuITpTuSxrGqENPSmA01RDGGmmSNIq0ITGKshjCapEMYTTJEqiRuaAA0xCYp3EGKdyRMUwsG2gVg20XHYTbTuKwbaVwsLtFFwSDbRcLBincVhdtArBtoCwbaAsG2mKwm2gQbaAF20wDFIYY5oC4uaLDuGaVguKGpWK5iRXFLlKUx/mLS5SuYXzVpco+cTzRRyi5wMtPlE5iedT5Rc4edS5Q9oL5tHKHtAMmafKHOJuo5Rc4oc0coc4oc0co+YcJDS5Q5xfMNPlDnDeTRyi5hcmnyhzDgCTRyi5h+00+UOYUIfSiwuYesRPanYXMTLb5osLmJ1tqLC5jmOaLhYUZouOwoJ9KVx8ouTSuVYdmi47DgTUNlJDgaTZokSKalspIeOakpIeAKRVhQmaVx2Qvl1JVhfLobDlDy6m5XKHl0rgoi7KLj5Q20rhYXbSuFg2ZouVYXbSCwbaBBtzQMdtqR2HBKVy0hfKqXILDhH7VHMOxIIvalzFqIvlUuYfKBjp3DlGFMUXFYQrincljCKdwY00EoSqQDT1pktDD/SmTYQ1aYDTVWIY0mqsSMJqkibjGatEiGyMmqIEpiEoCwYobCwYoTBoNtO5NhSvFO4NCYp3JsGKLhYMUwsLigLAFqR2F8ugqwvl07k2DZjtSuHKO8uncOUXy6fMLlHeX7UXDlGmOi4uUPLxTuRYb5dMGgKe1MiwmygBCnNMTGFaYhMUBcTFAXHYosFwxRYdwpWFzBRYHIWqsFwosFxaVhXFxRYLigU7DuLjFFguKCKkLjgRQO4oxTsK44baLDuOG0UWFckBSiwXJEkRTQHMSmeLHTmmFwEqelFhXATL2osFyRbiglseLs0Cuc/trC512DbRcqwbDSuOw7ZSuOwoSlcaiOCUrl8ou3FK47C4NIdheaAAFqQ9RQzetSOw4SMKLDHCVqllDhKxpWHqOEzZ6Uikxwk9qkq47zR6UhB5ntRYYm/2osMXdntSATBNK4WHKhzSuOxIENS2WkSqprNyKSJVUVLkXYkCdeKjmHYUJSuNC+XSuMQx07gMaOquIiaOnchojZMVSYmiMrTRNhpFUhMYTVolkbGrRDI2brVWJIy9aJEsYWNVYm4hJqkQN5pisGKdxWDFO4hQOaVx2H7aTZVg2UJhYNtO4rAVp3E0JtqrkWE20XCwbaLhYXbRcLDglK40iQRUrlWHiA1PMPlJltcjmlzFKAhtTS9oLkD7OaPaByCGArT5g5Bvl89KrmM5QEMftV3I5RPKNWmQxDHVEMYVqkRcYVpkMbspiDyzQAeX7UAHl+1ACeXQMPLoBB5dAMQpQINtAC4oAMUALTADQIbjmiwhQKLDFwaBDsGgY7BpiQDNAC80hXF5oGOGaYXJFXJoC5KqN6UxNjxGT2qRGXtrkuelYXbmlcdh3l0rlJDhFSuVyi+XSuPlHCOk2Owvl0XHYPLqbhYPLp3GkHl0rjsGz2pORNhRH7UORoojvKqbjsKI6m47DxGKVykh3lilcqwhjqeYmwCKjmKUR4h9qlzDlHiHnpU85SgSCH2qXItQJBB7VDmVyjhBS5h8o7ysUmx2F24pAJuxRyiGmUinyi5hpuCKfKHMN+1GnyhzDftWafKTzDDc5o5Q5hvm+tXYXMML5osK4xnqkhEZbnpVEDCrE1VxWEMLHtVcwco0wPQqgnEQwv/dqucXIN8p/7tP2hLpsTy2/u0/aInkDy29KpTQcgeWfSjnE4ChCD0pc4KA4I3pQ5jUR6xse1T7QvkHi2kPbFDqCVMetix6nil7Ur2Q7+zx/e5o9sL2Qn9nH1o9sDoh/Z7in7YXsmH2Fh1pOsL2THC0I7U/alKkPFuR2pOqP2ZIsR9KzdQXISCJjRzlxiSCE0nIHEPIoTHZDWgHNaJktELhVzxWsTnkVXnCkgCt4mEmQmcmtUjByG7yaohsXGaoi4m2mIXbmgB4UGgB2wCgBjbR3oBEZdc0DELigBN3tQAnWgQ5Y80AP8od6CRCnoKB3E8sntTBi+SfSgVxwtz6UwHC2PpQK5MlmT2oEmP8AsZH8NANh9kP93imJMUWZPRaAbHfYT6UWAX7A3pRYLjhYt2WgLjhaMnVaBXLUcH95aAuTrbIfQUibnL4rguezYcBilcdh4FK5aQ7FK5QoFK4xcVLYC0uYqwoHtS5h2HbaXMUkKEpcwWHCPnpUuQKIvl0ORdhNlTzBYUJ7UuYVhdhpXKUR4jpXK5R4iqOYLEggpcxqojxCajmFYeIqVykO2gUx3E3AUcomxpko5BcwxpD601AXMQvMwq1ATkV2uXrRQM3Mha5ar5CPaDDOe9VyEuoIJxT9mL2ov2hKfIL2gC5SlyD5w+0IelLlHziiRWPFTylXJAm7tUvQpDli9qi5ViVYx6VPMPlJBEPSk5lco8Q57VPMNRF8gf3aOcOUX7OP7tHtAcBDbZ/hpqoyVAT7Jn+Gq9qynBB9hz1FHtSfZjl09aPasPZkgskH8IpOsNUxwtQO1L2gciHfZ+KfOwUUOFqDSux6Dvsv0o1EH2dR6UahdCeWi9SKauDaGnyvUU9RXQn7s9KabDQMJ7U9ROw0tGvpTUSW0QPeRoTtHNbRgZOpYha/61fszF1RgvSaaph7UR7rIrRUyXVK7z5rWMDGUyq75NbKJhJiZq7GTAHmmSPD0CDzKYDfMOaADzWoAQu570AN5zQCDaaBjguaBDgnNAD1jOelAEoib0oESrbEmmImW1ANArkq26d6Ymx3lRCgVx4EIphckVoB1oFckWe3X+EGgTENxCegoAXzYj2pgJ5qDtQAvmBugoBl2CIOMkUE3LAhUGkK4jwR0BcjYKq/d5oAiOPpQBy4iFeVc9+wvl0XHYNlFx2HBKVxi7KVxihaQ7DwMVJQ4AVI7igUikKKQxcVIIWgYUDuGRRYLihlqbDuPVlosVzEglQVPIw5kO+0RjvS5GHONa9jHSn7Jg6iIW1Ac1SpEe1Ijek1apC9qRm6Y1fsiPaEZnkPej2YvaDDNJ61XsyfaDTO5qlATmRmRjVqJDmRkmq5SecaTVcorje9FibhilYdxQlDRSHhBUNF3JFO2p5S7kq3Lr0FZyiUmSpfsOqZqOQvmJ11EDrFUuBXOPXUk/55VDpsrmJF1GMn/V4qeRlKZYjnjYdhUODK5kSiWIdXFTyMOZDGvbVf+WmafIxcyIxqdqTjBp8jHzD/AO0Lb1puDE5iHUrehQYOZG2qwjomafsiecibVieFStVTIcyvJfzOeDiq9mRziC9m/vmqVMTqCfa5j1kNV7JC9oN89z/G1HskHOAmP940KmJyFEuD1p+zByHifHejkF7QDc/7VNUxOqQvcbu9aRpkOoV3fJrZQMJTIi9XymLY3earlJ5g3mqsHMJmnYiTDvVE3FFMQtMkUKaAHrEWNAiVbRj2oFclFgxPSgVx405j0FAXJP7MJ7c0wuL/AGWwoHcBp2PagVyRLFc/NikO5bSxhC9cmmJsa0Kr0FArjCuD0oGIQaBEZODTEIxpiGUwFCk0ASLCTQId5BWgYmwg0CY4KaARNGuDSBmhHNtXGQKCbDzcoDywoFYje9iA460BYrvdhqBkRm5oAy/LryrHv3F8uiwXDZRYdxNpFKwXDBpWC4u32osXcTaaXKHMFLlC4Zo5RqQpfFHKPmDzBS5RcwnmijlDmE80U+QXOJ5vNPkDnDzKOQOcYZD2p+zF7QQyE0/Zi9oM3H1p+zJ9oJnmq9mT7Ri5p8ouYbuoUQuKWNPlHcbvNKwXGliaAuMJNAhMGi4WEIPpTuHKFLmKsJj2ouKwbTRcfKLg0mxpDgDUNlWFC5pcxaRII+ahstIeIfalzD5RTCxpcwconlNS5kPlYvlN70roaixwjfscUroqzF8knrmldBZjltiO2aXMg5WPFt7UuZFcov2fHajnQnEPs/tRzobiNMGO1Upk8oCDnoafOQ4gbaq5w9mJ9nb0o9oS6YLbMe1HtA9kP+xP6Ue0H7MRrRlpqZLgV3iYZrWLuTJFZmYEjNbRRyyY3ea05TNyG7qaiS5Buq7ENjc0ybi1RIUxC4oAULTJJFjzTEPEJoESCLFAyzAgzQS2acSoOuKZDJ0MXtTJuSjymPG2gLkvlx4OMUgK03yE4pjKbzdeaRSK5l560DHrPz96gSHi4Hegdh4uoh1AoEMkuozwBTEVWlBPFMYwvQIQPTAlRlzzQBZWeNeaQhr3ikYFAEJuc0DD7SaAF+0tSGL9oc96BWEDsx60CsPUc5JphYeWAoCw3zRSCxX3muPkPT9oKGpcg/aDgaTgP2g4YpchXOO+X0pcgc4YFHKUpibAaXKHMMMdLlHzDTHS5Q5hrR0+UfMM8qlYVwEQz1ppBcCiiq5RcwmBRyk8w0gZp8pPOIfpVcoucbRYOYQ07BcCPaiwXDBqRiYPpU3KSF2+1LmLsGz2qHMpQHCLPaocyuRjhb57Uc5fsx4tQe1S6g+QkFkppe0KVMQ2QqfaFezGmwNHtAdIb9iPpS9oCpi/Y8dqftB+yD7NjtU84ezDyefu1PONRHiH2pc5aiPEFS5D5SUQ+1TzjURwg/2aXOVyi+R7UucfKBh9qXOLlFWH2o5gsOEOKXMVYfsA60riY35BnpVK5LYARsetVysLoc6ooycU1FkuSGxNC/A60+VkqSJRGoPzYxU2ZfMhW8hRkkU0mHMgSS3b7uM0crEpIZNdJFkVSgyXNFKW68xTit402ZSqIqNcYyDiuiEDnnMou25s10KJzSYyrsZXEJqiQzTEFMVwFMkeFoEPCUCuSLHzVCJ0iY0xEoifHSkSKRjtTC4ofaelMLimV+1ITE8x/U0ByirI470Bykq3Ug/ioY+Qa1w7daLjUCIsxNJj5RuGouOwhOKBWG+ZQFhpkNMmwwSGgTE30wHb80wDfQAm8igA3mkFhN9AWF8ygBwkoGAkoEL5lAx4lxQSL5xoHYPNJoCwu/NK47E3ktXNzHZyh5LU7hYcInFFyRfLIoRVwIIoFzDCWFIakJ5jClYfMKJaLBzDg4NLlLUxDSsVzDTSsHMNwc00hXGlTTJuJtNBNw2UxXDbVBcaVoC43ZUjArimx3AHFQ0WiRXA6rUNFqRKjRN1Ws2jaMkWUjhbvzWTRopIf5UQrNml0OESsPlqWzQXyKzbGAhwam5SHBQO4ouO4uU/GlcBDj0qbhYTZmjmLsKLcGlzisL9kpc47B9jajnAcLR/SlzCHLalaVxof5WBQO4hUUWFcYwC5p8oXIvPRc1XKS2NNylPkFzEL3CnNaRpkuZTln9GreNMxnMrfaZFzg1sqaMXVZG91KwwWJrRUkZ+1YwSuuccU/ZIXtWOF3cY27zij2KD2zA3Dt97Jpqihe2YR3DRnij2KH7ZjpLp3pqmifasj81/WtFBGcqjIySevWqUSHITBzVIi4uCaZNwx7UwuGw56UxXHCJj2pkkgt29KCbkiwH0piuTJasaBXHmArTAcm4Hg0xFqIyEYI4pElxbZH5K4piHGyjPQUXAYbJB/DSuUiJ7ULngVNy1EgaEClzGigM8tRUSmWqY0rilzl+zIycU+YTgRMzGqTIcSMk1ZmxtMQhpiEoIaEoEhcUygoELQAYoAXFAC7aAFC5oGLsoELsoGLsoFYAvNAxQtAD8UrCuaO1hXle1PY9kGw56U/aj9kBVqftCXSIyGq1UJdIaSe9Uqhk6bGE5qucHBjSBT5rk8gwpTTDlGgFTTuTYcGzQgHdaGFxcUh3DNMm4m6gBpamAwtQSxhJNA0OUmgdx20HqaAuLsWkUmBT3FS0VzCiOo5TRMcikHiocS1IkCMeKhxLUixGrr34rKcDaMy2i/wB7msXBmymh5gVgfm/Ws+VlcyE+yRn+PmlZhzIUWiA9QanUq6Dy416kVPKx8yHDyv7wzRyMfOhcxj+IVPs2HOhDMi9xQqbDnRG18FPGDVqkyeZELam3OFq/Yk85EdRkbg9KfsgUiM3bk5zVeyDnE+0s1HILmDzWb3p8iHzMjcEnpTSQnciZDVWRnJsiMbVpFIh3I2iJ7VqjNjTbk9q0Rk0H2Yn+GquZqIfZG9KpMTQfYzTJD7JTC4n2VvSmS2IbVvSqsQ5Ci0Y9qdhcw8WLf3adieYctg3cUrE8xOumZqkg5iQ6Sw7Uxcwg03FMXMSJaKh5pE8w2RNvamBAWKnpQNjTK3rgUCGmRj1NAAJCKAHrcOOlAWJBfTf3qB8ov9oXHZqVyuUQ3ly33npFKIwzSt1epdy0gD88tUNM1TQu9f71TylqSEMgpqIOaGNLVKJm5EZfNWkZuRGTmqsZtiUyRKYhaYWGmgVg5oCwUBYWgBaYxaBWFpAKGoAXzMUxIXzaBh5tAhPMoAN9Amw8z3oFc6LGP4a+dufTWGk+1O7AaXHpVJsl2GF0q0yXYaWiPaqUiGkMPlGqUhNIjKx1akRyoaVSr5iHEjIzVqRDgMKYqrkuIgJBouTyjvNppisIZM07isN3UXCwhNO4WE25NO5LQ4R0APEVAmh3k/SgLEbRkd6BjD8ppDQnmkUirgboilYFIPtbUuUbmH2yT+9S5LlKowF9KOj0vZIr2zA30x/jNT7FB7djfts3980ewQ/bsQX9wOjml9XQ/rDEa8mbq5p+wQfWGMFxL/fNL2CB4hi/apf75o9ggWIYv2lu7Gl7BB7dircc0/ZIr27JBODR7IPbDhODU+zLVYXzBnk0vZj9oSI65zUumP2hOksY61m6bNVURKGiI6il7Nle1QYQ9xRyMh1EJiM1agyXNCFYxWigZOYmYwa0UTNzGmRB/DzWiiZOY3f7VViHMazMTwtVYz5hAkhP3adhc5KsLZ+YGqsS5FiOCM/WmQ2WktV9BQTckW1B7UCuTLZ7uigUMi48WDDnihMdxHhRPvEfnQMgza5+9zTAaYY3B2lefegLFCe2Y89fpQMqPDQUQOmM0AiBqCrDM0Byhk0DsG4jvQMN7etILBuNAw3mmF2G40tAuw3GiwXYu6mkGoZNACUCsJTCwUXE0JQKwUx2CkKwUBYXFMLBQFhc0CFoAKAsFAWEphYKBNBQCQlAmhM0yGFAjoDOa+fUT6XmGGUmtFElyGFsmqUSbjc1XKIOKLEjcinyiELAU7BcZvWmDE3rVIkC1O4rCZzRcnlEIp8wco0rRzi5BNpo9oDgLt9qXtAVNihWFV7UfsmKN3pS9qL2TDL0vaj9iwO/3o9qgVFjCH75o9qg9iyNlY0/aIPZMYUNPnRLpMYUPpVc6JdNjdpp8yE4MNtUpIjlYm007oXKw20XQkmAU07oLMNnNO4rMd5RxRcLAImPagB4tJW6KaAHiwn/ALhpDuSJpk7fwmkJstJoM70yecsL4auD1I/Ok0UqhOnhW5Iznj61Nh+0H/8ACLzDvRYPair4ZnHUmlyh7UePDknY0+VCdYmXw4R1JzRyB7Yf/wAI76vQog6of2Co6uPzp2J52DaPCo+8CfrVEubKs1lGuQmKaQlJlX7MoPNMd2WY44UGcZalcVhHnC8CMD3p3CxE0ofquBTuKxXdtrEg4oCwi3joeuaBcpKusOnQCgXKKdbn7cUD5CBtWuX6yHFAchC14x+85NO4JEJn96Lj5Rn2lwchjTDlH/2hMON3FAWIjdO3WgXKRmVjQykhu7NLmsVyh1qHMpQYu00udGipsTy39Kl1EUqTDy29DS9sivYsURse1T7ZB7Bh5T/3TR7ZFewYvkv6Gj26D6uw8ph2NHt0T7BieWw7VXtUL2LDY1P2iF7JhsPpR7QXs2Gw0/aIPZMNh9KPaIHSYbD6U/aIn2TDY3pT9og9mw2EdqXtCfZSE2n0qvaIHBhg+lPmRPIxOfSjnQODFwfSk5oXIxcGjnQ3BihT6U+dByMXYfSl7RFezYvkse1L2qKVJiiBv7tS6onRYfZ39KpTuDo2GNEy9a0TMpQGlasyaAigkuG4ryVE9vmGm4NXyi5hpuGosK7Dzn9adg1De570aDswBaldBZigE0uYagOCn0pc6HyDhGx7VPtEV7MeIW9Kh1R+zHiAntU+2H7IeLVj2NR7Yv2RILJvSk6w1SHiyPpUOuP2Q4WJ7il7cpU0SDT/AGpe3ZXIhw07Pap9uLlQ4aaKXtmOyHf2avpT9qxWQn9mA0/aMGkIdLX2qlNishp0pPatVNktIhbS19q0UmZySIW0wVsmzGViM6cBWiuZOw3+zl/vVVmQ2hf7LyOop6hoNOmNT1Jdhv8AZknYZqrk3Qf2ZcDsaohyHrYTg/dNMm5bgiuYjjZQS2aUMkp4eEbfpQTzF1CD1ixQJyHsO6A5qkS2QnzScgmiwKRYhkkVjmX8KkXMXEuAv3mGaLBcRr6Mfek4o5QTK7alDn5WpWKsQyamzD5OtBSRXN3cN/HxSZXKRbZnJO4/gaVy1ERopx1/WlzByFZiFzvXNNSHyDDdRqMbfzqrhykDXq5+WlcOUja968c07i5Subs07isRPcFjzTHYhaTNFx8owtzRcOUaWNLmDkDdRzByCGnzCUBKfMPlEo5xcghFHOHIHNHMHIKBzUOZSgWI'... 82236 more characters,
      revised_prompt: 'A high-resolution photograph of a serene landscape at sunset, featuring a calm lake reflecting the vibrant colors of the sky and surrounding mountains. The mountains are silhouetted against a backdrop of deep oranges and purples in the sky. The lake is still, with no visible ripples, enhancing the peaceful atmosphere. The scene is viewed from a slightly elevated perspective, focusing on the natural beauty without any distracting foreground elements. The overall composition emphasizes the tranquility of the setting, with the sunset providing a dramatic yet calming focal point.'
    }
  ],
  count: 1
}



Component's receive method finished in: 10063 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A futuristic city with flying cars and neon lights","n":2,"response_format":"url","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  url: 'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-fc974703-b4f7-400a-b1da-018ce0f8d3bd.jpeg',
  revised_prompt: 'A high-resolution photograph of a futuristic city at night, featuring tall skyscrapers illuminated by vibrant neon lights. The scene includes several flying cars moving between the buildings, adding a dynamic element to the urban landscape. The streets are wet, reflecting the colorful lights and enhancing the nighttime atmosphere. The focus is on a central area of the city, with the architecture and lighting creating a visually striking composition without any distracting foreground elements. The overall mood is vibrant and energetic, emphasizing the futuristic setting without overwhelming details.',
  index: 0,
  count: 2
}



Component's receive method finished in: 10933 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A peaceful forest with sunlight filtering through the trees","n":1,"response_format":"b64_json","outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  b64_json: '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'... 194496 more characters,
  revised_prompt: 'A high-resolution photograph of a serene forest during the golden hour, with sunlight filtering through the dense canopy of various trees, including oaks and pines. The forest floor is covered with a carpet of fallen leaves and moss, with a gentle stream visible in the background, adding to the tranquil atmosphere. The scene captures the warm, inviting light of the late afternoon, creating a peaceful and natural setting without any distracting elements or human presence. The composition focuses on the interplay of light and shadow, emphasizing the depth and richness of the forest environment.',
  index: 0,
  count: 1
}



Component's receive method finished in: 10123 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 7. ImageUnderstanding
```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/1200px-Good_Food_Display_-_NCI_Visuals_Online.jpg","text":"What foods are shown in this image? Please describe them.","imageDetail":"auto"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '988dbf70-e344-b132-6ee5-05cd9ff6ba68',
  Object: 'chat.completion',
  Created: 1762427028,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 275,
    completion_tokens: 166,
    total_tokens: 441,
    prompt_tokens_details: {
      text_tokens: 19,
      audio_tokens: 0,
      image_tokens: 256,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 2222 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg","text":"Analyze this painting. What artistic techniques and colors are used?","imageDetail":"high","maxTokens":300}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '56e70a9d-6117-0886-489b-a031e88172b0',
  Object: 'chat.completion',
  Created: 1762427035,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'length' } ],
  Usage: {
    prompt_tokens: 1811,
    completion_tokens: 300,
    total_tokens: 2111,
    prompt_tokens_details: {
      text_tokens: 19,
      audio_tokens: 0,
      image_tokens: 1792,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 3709 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-vision-beta","role":"user","contentType":"image_url","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg","text":"What animal is in this image and describe its characteristics.","imageDetail":"low"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ImageUnderstanding
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
      model:       grok-vision-beta
      role:        user
      contentType: image_url
      imageUrl:    https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg
      text:        What animal is in this image and describe its characteristics.
      imageDetail: low
    scope: 

[ERROR]: Request failed with status code 404
code:  Some requested entity was not found
error: The model grok-vision-beta does not exist or your team c732a16f-e8ae-4fba-8e05-eb8a8f6aba39 does not have access to it. Please ensure you're using the correct API key. If you believe this is a mistake, please contact support and quote your team ID and the model name.
</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"system","contentType":"image_url","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg","text":"You are an expert animal biologist. Analyze this image.","imageDetail":"auto"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '3af38ea5-963e-cb81-afa7-f3e227ac6050',
  Object: 'chat.completion',
  Created: 1762427053,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 274,
    completion_tokens: 407,
    total_tokens: 681,
    prompt_tokens_details: {
      text_tokens: 18,
      audio_tokens: 0,
      image_tokens: 256,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 4622 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/1200px-Good_Food_Display_-_NCI_Visuals_Online.jpg"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'e7f1ee0f-a3ec-2d53-c228-0c5d7a6fa777',
  Object: 'chat.completion',
  Created: 1762427064,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 263,
    completion_tokens: 226,
    total_tokens: 489,
    prompt_tokens_details: {
      text_tokens: 7,
      audio_tokens: 0,
      image_tokens: 256,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 2816 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

