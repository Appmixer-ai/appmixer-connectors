# Test Plan Report

## 1. CreateTag
```
appmixer test component src/appmixer/getresponse/core/CreateTag/ -i '{"in":{"name":"Test Tag"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/CreateTag
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      name: Test Tag
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            1003
codeDescription: Bad format of one or more parameters.
message:         Tag name is invalid. Please see context for valid regex.
moreInfo:        https://apidocs.getresponse.com/en/v3/errors/1003
context: 
  regex: /^[A-Za-z0-9_]*$/
uuid:            b8108117-198b-4d4a-b1fd-6169009400df
</details>

```
appmixer test component src/appmixer/getresponse/core/CreateTag/ -i '{"in":{"name":"TestTag_123"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcSZD', Name: 'TestTag_123', 'Created On': undefined }

Component's receive method finished in: 748 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/CreateTag/ -i '{"in":{"name":"AnotherTestTag"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcSLj', Name: 'AnotherTestTag', 'Created On': undefined }

Component's receive method finished in: 563 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/CreateTag/ -i '{"in":{"name":"ValidatedTag"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcSfd', Name: 'ValidatedTag' }

Component's receive method finished in: 952 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/CreateTag/ -i '{"in":{"name":"FinalTest_Tag"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcSXf', Name: 'FinalTest_Tag' }

Component's receive method finished in: 582 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 2. ListTags
```
appmixer test component src/appmixer/getresponse/core/ListTags/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ result: [], count: 0 }



Component's receive method finished in: 604 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/ListTags/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/ListTags
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      outputType: first
    scope: 

[ERROR]: No records available for first output type
ContextCancelError: No records available for first output type
    at Object.sendArrayOutput (/Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/lib.js:16:23)
    at Object.receive (/Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/ListTags/ListTags.js:40:20)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/getresponse/core/ListTags/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/ListTags
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      outputType: object
    scope: 

Component's receive method finished in: 527 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/getresponse/core/ListTags/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '696a1c7c188654e31685b7f8' }



Component's receive method finished in: 554 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/ListTags/ -i '{"in":{"queryName":"test","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ result: [], count: 0 }



Component's receive method finished in: 503 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 3. CreateContact
```
appmixer test component src/appmixer/getresponse/core/CreateContact/ -i '{"in":{"email":"testcontact@example.com","name":"Test Contact","campaignId":"test-campaign-id-123","dayOfCycle":0,"ipAddress":"192.168.1.1","note":"Test contact for validation","scoring":50}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/CreateContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      email:      testcontact@example.com
      name:       Test Contact
      campaignId: test-campaign-id-123
      dayOfCycle: 0
      ipAddress:  192.168.1.1
      note:       Test contact for validation
      scoring:    50
    scope: 

[ERROR]: Request failed with status code 401
httpStatus:      401
code:            1014
codeDescription: Problem during authentication process, check headers!
message:         Unable to authenticate request. Check credentials or authentication method details
moreInfo:        https://apidocs.getresponse.com/v3/errors#1014
context: 
  (empty array)
uuid:            2517db28-d578-4eb9-868b-889b36fb3cbc
</details>

## 4. GetContact
```
appmixer test component src/appmixer/getresponse/core/GetContact/ -i '{"in":{"contactId":"test-contact-id-12345"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/GetContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      contactId: test-contact-id-12345
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            1013
codeDescription: The requested resource was not found
message:         Resource identifier is invalid.
moreInfo:        https://apidocs.getresponse.com/v3/errors#1013
context: 
  (empty array)
uuid:            2cd2e48d-3541-47e8-95db-c725213e55b3
</details>

```
appmixer test component src/appmixer/getresponse/core/CreateContact/ -i '{"in":{"email":"test-contact-001@example.com","campaignId":"test-campaign-id"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/CreateContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      email:      test-contact-001@example.com
      campaignId: test-campaign-id
    scope: 

[ERROR]: Request failed with status code 401
httpStatus:      401
code:            1014
codeDescription: Problem during authentication process, check headers!
message:         Unable to authenticate request. Check credentials or authentication method details
moreInfo:        https://apidocs.getresponse.com/v3/errors#1014
context: 
  (empty array)
uuid:            7ccf8d73-a9e0-49eb-abae-2a4193d378c7
</details>

## 5. ListContacts
```
appmixer test component src/appmixer/getresponse/core/ListContacts/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: notFound
{}



Component's receive method finished in: 587 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/ListContacts/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: notFound
{}



Component's receive method finished in: 468 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/ListContacts/ -i '{"in":{"outputType":"array"}}' -p '{"generateOutputPortOptions":true}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
[
  { label: 'Items Count', value: 'count', schema: { type: 'integer' } },
  {
    label: 'Contacts',
    value: 'result',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contactId: { type: 'string', title: 'Contact Id' },
          name: { type: 'string', title: 'Name' },
          email: { type: 'string', title: 'Email' },
          state: { type: 'string', title: 'State' },
          dayOfCycle: { type: 'number', title: 'Day Of Cycle' },
          campaign: {
            type: 'object',
            properties: {
              campaignId: { type: 'string', title: 'Campaign.Campaign Id' }
            },
            title: 'Campaign'
          },
          ipAddress: { type: 'string', title: 'Ip Address' },
          createdOn: { type: 'string', title: 'Created On' },
          origin: { type: 'string', title: 'Origin' },
          scoring: { type: 'number', title: 'Scoring' },
          customFieldValues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                customFieldId: {
                  type: 'string',
                  title: 'Custom Field Values.Custom Field Id'
                },
                value: {
                  type: 'array',
                  items: { type: 'string' },
                  title: 'Custom Field Values.Value'
                }
              }
            },
            title: 'Custom Field Values'
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tagId: { type: 'string', title: 'Tags.Tag Id' },
                name: { type: 'string', title: 'Tags.Name' }
              }
            },
            title: 'Tags'
          }
        }
      }
    }
  }
]



Component's receive method finished in: 19 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/ListContacts/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: notFound
{}



Component's receive method finished in: 733 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getresponse/core/ListContacts/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: notFound
{}



Component's receive method finished in: 472 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 6. UpdateContact
```
appmixer test component src/appmixer/getresponse/core/CreateContact/ -i '{"in":{"email":"test-update-contact@example.com","name":"Test Contact for Update"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/CreateContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      email: test-update-contact@example.com
      name:  Test Contact for Update
    scope: 
{"name":"component","hostname":"vladimirs-MacBook-Air.local","pid":58573,"level":50,"msg":"Validation error on port in {\n  componentId: 'bf4522eb-f07b-4674-829f-6f6b209402d0',\n  flowId: '8d96d3d3-5dd3-4bea-a8dc-8c0986d9ee20',\n  userId: '696a1cfc2591bee4cd0fd5f3',\n  componentType: 'appmixer.getResponse.core.CreateContact',\n  err: ValidationFlowError: Validation error on port in\n      at InputPortProcessor.logValidationError (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:402115)\n      at InputPortProcessor.validate (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:401902)\n      at InputPortProcessor.processMessage (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:400667)\n      at /Users/vladimir/Projects/appmixer-cli/dist/index.js:92:399867\n      at arrayEach (/Users/vladimir/Projects/appmixer-cli/dist/index.js:14:7351)\n      at lodash.forEach (/Users/vladimir/Projects/appmixer-cli/dist/index.js:14:58122)\n      at InputPortProcessor.process (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:399833)\n      at MessagesProcessor.process (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:412375)\n      at Context.prepare (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:380878)\n      at ContextHandler.createContext (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:398443)\n      at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n      at async DevComponent.devCall (/Users/vladimir/Projects/appmixer-cli/dist/index.js:92:310425) {\n    error: [ [Object] ],\n    data: [ [Object] ],\n    code: 'GRID_ERR_VAL_PORTS'\n  },\n  inputMessages: { in: [ [Object] ] },\n  senderId: null,\n  senderType: undefined,\n  correlationId: null\n}","time":"2026-01-16T11:11:56.475Z","v":0}

[ERROR]: Validation error on ports: in
in: 
  - 
    - 
      instancePath: 
      schemaPath:   #/required
      keyword:      required
      params: 
        missingProperty: campaignId
      message:      must have required property 'campaignId'
</details>

```
appmixer test component src/appmixer/getresponse/core/CreateContact/ -i '{"in":{"email":"test-update-contact@example.com","name":"Test Contact for Update","campaignId":"test-campaign-id"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/CreateContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      email:      test-update-contact@example.com
      name:       Test Contact for Update
      campaignId: test-campaign-id
    scope: 

[ERROR]: Request failed with status code 401
httpStatus:      401
code:            1014
codeDescription: Problem during authentication process, check headers!
message:         Unable to authenticate request. Check credentials or authentication method details
moreInfo:        https://apidocs.getresponse.com/v3/errors#1014
context: 
  (empty array)
uuid:            3328b181-19f9-43e5-900b-39d844c71825
</details>

```
appmixer test component src/appmixer/getresponse/core/UpdateContact/ -i '{"in":{"contactId":"test-contact-id-123","name":"Updated Contact Name","note":"Updated note","scoring":50}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/UpdateContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      contactId: test-contact-id-123
      name:      Updated Contact Name
      note:      Updated note
      scoring:   50
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            1013
codeDescription: The requested resource was not found
message:         Resource identifier is invalid.
moreInfo:        https://apidocs.getresponse.com/v3/errors#1013
context: 
  (empty array)
uuid:            fcbafb3a-26df-40e4-ab76-9b9df6638cc0
</details>

## 7. UpdateTag
```
appmixer test component src/appmixer/getResponse/core/UpdateTag/ -i '{"in":{"tagId":"TcSXf","name":"UpdatedTag_NewName"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/UpdateTag
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      tagId: TcSXf
      name:  UpdatedTag_NewName
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            100002
codeDescription: Method not allowed, please check for allowed methods in context
message:         Request method not allowed
moreInfo:        https://apidocs.getresponse.com/v3/errors#100002
context: 
  requestMethod: patch
uuid:            b3dddc27-1ac6-41fc-bf3c-dda0da54c61d
</details>

```
appmixer test component src/appmixer/getResponse/core/UpdateTag/ -i '{"in":{"tagId":"TcSXf","name":"UpdatedTag_NewName"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcSXf', Name: 'FinalTest_Tag', 'Created On': undefined }

Component's receive method finished in: 477 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/UpdateTag/ -i '{"in":{"tagId":"TcSfd","name":"UpdatedValidatedTag"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcSfd', Name: 'ValidatedTag', 'Created On': undefined }

Component's receive method finished in: 476 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/CreateTag/ -i '{"in":{"name":"TestUpdateTag"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcNd6', Name: 'TestUpdateTag' }

Component's receive method finished in: 743 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/UpdateTag/ -i '{"in":{"tagId":"TcNd6","name":"UpdatedTestTag"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Tag ID': 'TcNd6', Name: 'TestUpdateTag', 'Created On': undefined }

Component's receive method finished in: 613 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 8. DeleteContact
```
appmixer test component src/appmixer/getResponse/core/CreateCampaign/ -i '{"in":{"name":"Test Campaign for DeleteContact"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Campaign ID': 'fzuQW',
  Name: 'Test Campaign for DeleteContact',
  'Language Code': 'CS',
  'Is Default': 'false',
  'Created On': '2026-01-16T11:55:41+0000',
  Href: 'https://api.getresponse.com/v3/campaigns/fzuQW'
}

Component's receive method finished in: 1082 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/CreateContact/ -i '{"in":{"email":"test-delete-contact@example.com","campaignId":"fzuQW","name":"Test Contact for Deletion"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/CreateContact
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      email:      test-delete-contact@example.com
      campaignId: fzuQW
      name:       Test Contact for Deletion
    scope: 

[ERROR]: Request failed with status code 401
httpStatus:      401
code:            1014
codeDescription: Problem during authentication process, check headers!
message:         Unable to authenticate request. Check credentials or authentication method details
moreInfo:        https://apidocs.getresponse.com/v3/errors#1014
context: 
  (empty array)
uuid:            1d426d44-3a90-41be-b2a3-a9c681600e96
</details>

## 9. DeleteTag
```
appmixer test component src/appmixer/getResponse/core/DeleteTag/ -i '{"in":{"tagId":"TcSXf"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 592 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 10. ListCampaigns
```
appmixer test component src/appmixer/getresponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"name","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }

[ERROR]:  No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
Stack trace:
Error: No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
    at Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:531:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
</details>

```
appmixer test component src/appmixer/getresponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"name","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getresponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }

[ERROR]:  No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
Stack trace:
Error: No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
    at Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:531:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }

[ERROR]:  No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
Stack trace:
Error: No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
    at Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:531:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }

[ERROR]:  No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
Stack trace:
Error: No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
    at Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:531:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"name","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }

[ERROR]:  No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
Stack trace:
Error: No authentication data stored for appmixer:getresponse. Run 'appmixer test auth login [auth-module-file]' command with your auth module first.
    at Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:531:27)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ result: [], count: 0 }



Component's receive method finished in: 1242 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"first"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      status:     
      sort:       
      outputType: first
    scope: 

[ERROR]: No records available for first output type
ContextCancelError: No records available for first output type
    at Object.sendArrayOutput (/Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/lib.js:16:23)
    at Object.receive (/Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/ListCampaigns/ListCampaigns.js:68:20)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"object"}}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/ListCampaigns
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      status:     
      sort:       
      outputType: object
    scope: 

Component's receive method finished in: 531 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"active","sort":"name","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ result: [], count: 0 }



Component's receive method finished in: 479 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '696a27c92debf5f0117715cd' }



Component's receive method finished in: 445 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      campaignId: 'fzuQW',
      href: 'https://api.getresponse.com/v3/campaigns/fzuQW',
      name: 'Test Campaign for DeleteContact',
      techName: '26071668077b4a1bb9de9b6d8cb6d41f',
      description: 'Test Campaign for DeleteContact',
      languageCode: 'CS',
      isDefault: 'false',
      createdOn: '2026-01-16T11:55:41+0000'
    },
    {
      campaignId: 'fzuqS',
      href: 'https://api.getresponse.com/v3/campaigns/fzuqS',
      name: 'Test Campaign Simple',
      techName: '2a4140f833d8f96596839974d21f01de',
      description: 'Test Campaign Simple',
      languageCode: 'CS',
      isDefault: 'false',
      createdOn: '2026-01-16T11:56:19+0000'
    },
    {
      campaignId: 'fzuZc',
      href: 'https://api.getresponse.com/v3/campaigns/fzuZc',
      name: 'Test Campaign Validation',
      techName: '37c0d7c7350f9589e84c6daf17e8d046',
      description: 'Test Campaign Validation',
      languageCode: 'CS',
      isDefault: 'false',
      createdOn: '2026-01-16T11:56:35+0000'
    },
    {
      campaignId: 'fzPUe',
      href: 'https://api.getresponse.com/v3/campaigns/fzPUe',
      name: 'vladimirtalas',
      techName: 'c645403c59d24c382c6e877dd7e04af5',
      description: 'vladimirtalas',
      languageCode: 'CS',
      isDefault: 'true',
      createdOn: '2026-01-16T11:01:07+0000'
    }
  ],
  count: 4
}



Component's receive method finished in: 495 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  campaignId: 'fzuQW',
  href: 'https://api.getresponse.com/v3/campaigns/fzuQW',
  name: 'Test Campaign for DeleteContact',
  techName: '26071668077b4a1bb9de9b6d8cb6d41f',
  description: 'Test Campaign for DeleteContact',
  languageCode: 'CS',
  isDefault: 'false',
  createdOn: '2026-01-16T11:55:41+0000',
  index: 0,
  count: 4
}



Component's receive method finished in: 491 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  campaignId: 'fzuQW',
  href: 'https://api.getresponse.com/v3/campaigns/fzuQW',
  name: 'Test Campaign for DeleteContact',
  techName: '26071668077b4a1bb9de9b6d8cb6d41f',
  description: 'Test Campaign for DeleteContact',
  languageCode: 'CS',
  isDefault: 'false',
  createdOn: '2026-01-16T11:55:41+0000',
  index: 0,
  count: 4
}



In/Out Message logged: 
severity:      info
msg:           {"campaignId":"fzuqS","href":"https://api.getresponse.com/v3/campaigns/fzuqS","name":"Test Campaign Simple","techName":"2a4140f833d8f96596839974d21f01de","description":"Test Campaign Simple","languageCode":"CS","isDefault":"false","createdOn":"2026-01-16T11:56:19+0000","index":1,"count":4}
gridTimestamp: 2026-01-16T12:00:04.228Z
id:            component
type:          data
portType:      out
port:          out
senderId:      b9e4efd8-7ae4-4bd6-9b6e-4b4c0d200ef1
senderType:    appmixer.getresponse.core.ListCampaigns
userId:        696a28438f21e2f1170240a4
componentType: appmixer.getresponse.core.ListCampaigns
componentId:   b9e4efd8-7ae4-4bd6-9b6e-4b4c0d200ef1
flowId:        21c4c69e-d6c5-4aec-ad68-57b2ae08aa0e
flowName:      
correlationId: f8bfeeb0-4e91-45d8-a0f3-e10add3a9d1b
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-06b593cc-efd2-48bb-998e-0f2d18f46191"},"content":{"status":"","sort":"","outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  campaignId: 'fzuqS',
  href: 'https://api.getresponse.com/v3/campaigns/fzuqS',
  name: 'Test Campaign Simple',
  techName: '2a4140f833d8f96596839974d21f01de',
  description: 'Test Campaign Simple',
  languageCode: 'CS',
  isDefault: 'false',
  createdOn: '2026-01-16T11:56:19+0000',
  index: 1,
  count: 4
}



In/Out Message logged: 
severity:      info
msg:           {"campaignId":"fzuZc","href":"https://api.getresponse.com/v3/campaigns/fzuZc","name":"Test Campaign Validation","techName":"37c0d7c7350f9589e84c6daf17e8d046","description":"Test Campaign Validation","languageCode":"CS","isDefault":"false","createdOn":"2026-01-16T11:56:35+0000","index":2,"count":4}
gridTimestamp: 2026-01-16T12:00:04.228Z
id:            component
type:          data
portType:      out
port:          out
senderId:      b9e4efd8-7ae4-4bd6-9b6e-4b4c0d200ef1
senderType:    appmixer.getresponse.core.ListCampaigns
userId:        696a28438f21e2f1170240a4
componentType: appmixer.getresponse.core.ListCampaigns
componentId:   b9e4efd8-7ae4-4bd6-9b6e-4b4c0d200ef1
flowId:        21c4c69e-d6c5-4aec-ad68-57b2ae08aa0e
flowName:      
correlationId: 6bdd0fe1-c899-4a41-b1f7-e9bdd4748798
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-06b593cc-efd2-48bb-998e-0f2d18f46191"},"content":{"status":"","sort":"","outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  campaignId: 'fzuZc',
  href: 'https://api.getresponse.com/v3/campaigns/fzuZc',
  name: 'Test Campaign Validation',
  techName: '37c0d7c7350f9589e84c6daf17e8d046',
  description: 'Test Campaign Validation',
  languageCode: 'CS',
  isDefault: 'false',
  createdOn: '2026-01-16T11:56:35+0000',
  index: 2,
  count: 4
}



In/Out Message logged: 
severity:      info
msg:           {"campaignId":"fzPUe","href":"https://api.getresponse.com/v3/campaigns/fzPUe","name":"vladimirtalas","techName":"c645403c59d24c382c6e877dd7e04af5","description":"vladimirtalas","languageCode":"CS","isDefault":"true","createdOn":"2026-01-16T11:01:07+0000","index":3,"count":4}
gridTimestamp: 2026-01-16T12:00:04.229Z
id:            component
type:          data
portType:      out
port:          out
senderId:      b9e4efd8-7ae4-4bd6-9b6e-4b4c0d200ef1
senderType:    appmixer.getresponse.core.ListCampaigns
userId:        696a28438f21e2f1170240a4
componentType: appmixer.getresponse.core.ListCampaigns
componentId:   b9e4efd8-7ae4-4bd6-9b6e-4b4c0d200ef1
flowId:        21c4c69e-d6c5-4aec-ad68-57b2ae08aa0e
flowName:      
correlationId: d5997caa-f6a5-429f-b77f-3691fdc7607b
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-06b593cc-efd2-48bb-998e-0f2d18f46191"},"content":{"status":"","sort":"","outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  campaignId: 'fzPUe',
  href: 'https://api.getresponse.com/v3/campaigns/fzPUe',
  name: 'vladimirtalas',
  techName: 'c645403c59d24c382c6e877dd7e04af5',
  description: 'vladimirtalas',
  languageCode: 'CS',
  isDefault: 'true',
  createdOn: '2026-01-16T11:01:07+0000',
  index: 3,
  count: 4
}



Component's receive method finished in: 477 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"active","sort":"name","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      campaignId: 'fzuQW',
      href: 'https://api.getresponse.com/v3/campaigns/fzuQW',
      name: 'Test Campaign for DeleteContact',
      techName: '26071668077b4a1bb9de9b6d8cb6d41f',
      description: 'Test Campaign for DeleteContact',
      languageCode: 'CS',
      isDefault: 'false',
      createdOn: '2026-01-16T11:55:41+0000'
    },
    {
      campaignId: 'fzuqS',
      href: 'https://api.getresponse.com/v3/campaigns/fzuqS',
      name: 'Test Campaign Simple',
      techName: '2a4140f833d8f96596839974d21f01de',
      description: 'Test Campaign Simple',
      languageCode: 'CS',
      isDefault: 'false',
      createdOn: '2026-01-16T11:56:19+0000'
    },
    {
      campaignId: 'fzuZc',
      href: 'https://api.getresponse.com/v3/campaigns/fzuZc',
      name: 'Test Campaign Validation',
      techName: '37c0d7c7350f9589e84c6daf17e8d046',
      description: 'Test Campaign Validation',
      languageCode: 'CS',
      isDefault: 'false',
      createdOn: '2026-01-16T11:56:35+0000'
    },
    {
      campaignId: 'fzPUe',
      href: 'https://api.getresponse.com/v3/campaigns/fzPUe',
      name: 'vladimirtalas',
      techName: 'c645403c59d24c382c6e877dd7e04af5',
      description: 'vladimirtalas',
      languageCode: 'CS',
      isDefault: 'true',
      createdOn: '2026-01-16T11:01:07+0000'
    }
  ],
  count: 4
}



Component's receive method finished in: 967 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/ListCampaigns/ -i '{"in":{"status":"","sort":"","outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '696a284b37ce23f12699c05a' }



Component's receive method finished in: 1042 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 11. CreateCampaign
```
appmixer test component src/appmixer/getResponse/core/CreateCampaign/ -i '{"in":{"name":"Test Campaign","languageCode":"EN","isDefault":false,"confirmationSubject":"Please confirm your subscription","confirmationFromName":"Test Sender","confirmationFromEmail":"noreply@example.com","confirmationReplyToEmail":"support@example.com","confirmationRedirectUrl":"https://example.com/confirmed"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/CreateCampaign
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      name:                     Test Campaign
      languageCode:             EN
      isDefault:                false
      confirmationSubject:      Please confirm your subscription
      confirmationFromName:     Test Sender
      confirmationFromEmail:    noreply@example.com
      confirmationReplyToEmail: support@example.com
      confirmationRedirectUrl:  https://example.com/confirmed
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            1000
codeDescription: General error of validation process, more details should be in context section
message:         Validation error, see context section for more information
moreInfo:        https://apidocs.getresponse.com/v3/errors#1000
context: 
  - 
    validationType:   body
    fieldName: 
      - confirmation
      - fromField
      - fromFieldId
    originalValue:    noreply@example.com
    errorDescription: Provided ID is not valid
  - 
    validationType:   body
    fieldName: 
      - confirmation
      - replyTo
      - fromFieldId
    originalValue:    support@example.com
    errorDescription: Provided ID is not valid
  - 
    validationType:   body
    fieldName: 
      - confirmation
      - subscriptionConfirmationBodyId
    originalValue:    null
    errorDescription: Provided resource ID has wrong format - `string` expected.
uuid:            dde5abc9-b75a-4a9d-aea7-94a40cdfbb8b
</details>

```
appmixer test component src/appmixer/getResponse/core/CreateCampaign/ -i '{"in":{"name":"Test Campaign Simple"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Campaign ID': 'fzuqS',
  Name: 'Test Campaign Simple',
  'Language Code': 'CS',
  'Is Default': 'false',
  'Created On': '2026-01-16T11:56:19+0000',
  Href: 'https://api.getresponse.com/v3/campaigns/fzuqS'
}

Component's receive method finished in: 816 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/CreateCampaign/ -i '{"in":{"name":"Test Campaign With Language","languageCode":"EN","isDefault":false}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/CreateCampaign
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      name:         Test Campaign With Language
      languageCode: EN
      isDefault:    false
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            1
codeDescription: We're experiencing an internal server problem. We've logged the issue. Our ops team is fixing the problem now.
message:         Could not create campaign: Exactly one campaign can be default. Set isDefault on other campaign to disable.
moreInfo:        https://apidocs.getresponse.com/v3/errors#1
context: 
  (empty array)
uuid:            185cd821-b546-46ce-9272-66d7520e0b31
</details>

```
appmixer test component src/appmixer/getResponse/core/CreateCampaign/ -i '{"in":{"name":"Test Campaign Validation"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Campaign ID': 'fzuZc',
  Name: 'Test Campaign Validation',
  'Language Code': 'CS',
  'Is Default': 'false',
  'Created On': '2026-01-16T11:56:35+0000',
  Href: 'https://api.getresponse.com/v3/campaigns/fzuZc'
}

Component's receive method finished in: 662 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 12. UpdateCampaign
```
appmixer test component src/appmixer/getResponse/core/UpdateCampaign/ -i '{"in":{"campaignId":"fzuqS","name":"Updated Campaign Name","languageCode":"EN","isDefault":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Campaign ID': 'fzuqS',
  Name: 'Updated Campaign Name',
  'Language Code': 'EN',
  'Is Default': 'true',
  'Created On': '2026-01-16T11:56:19+0000',
  Href: 'https://api.getresponse.com/v3/campaigns/fzuqS'
}

Component's receive method finished in: 655 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/UpdateCampaign/ -i '{"in":{"campaignId":"fzuZc","name":"Campaign with Confirmation","confirmationSubject":"Please confirm your subscription","confirmationRedirectUrl":"https://example.com/confirmed"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  'Campaign ID': 'fzuZc',
  Name: 'Campaign with Confirmation',
  'Language Code': 'CS',
  'Is Default': 'false',
  'Created On': '2026-01-16T11:56:35+0000',
  Href: 'https://api.getresponse.com/v3/campaigns/fzuZc'
}

Component's receive method finished in: 542 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/getResponse/core/UpdateCampaign/ -i '{"in":{"campaignId":"fzuqS"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors-02/src/appmixer/getResponse/core/UpdateCampaign
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
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
      campaignId: fzuqS
    scope: 

[ERROR]: Request failed with status code 400
httpStatus:      400
code:            1000
codeDescription: General error of validation process, more details should be in context section
message:         Validation error, see context section for more information
moreInfo:        https://apidocs.getresponse.com/v3/errors#1000
context: 
  - 
    validationType:   body
    fieldName:        
    originalValue:    
    errorDescription: Empty payload
uuid:            4b2580ad-8900-4d7d-bcf4-1dc8bcf2b2ee
</details>

## 13. DeleteCampaign
```
appmixer test component src/appmixer/getResponse/core/DeleteCampaign/ -i '{"in":{"campaignId":"fzuZc"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 1055 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

