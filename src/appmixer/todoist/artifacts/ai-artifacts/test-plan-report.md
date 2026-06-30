# Test Plan Report

## 1. CreateLabel
```
appmixer test component src/appmixer/todoist/core/CreateLabel/ -i '{"in":{"name":"E2E Test Label","order":1,"color":"blue","isFavorite":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'E2E Test Label',
  Color: 'blue',
  Order: 1,
  'Is Favorite': true
}

Component's receive method finished in: 307 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateLabel/ -i '{"in":{"name":"E2E Test Label 2","order":2,"color":"green","isFavorite":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  Name: undefined,
  Color: undefined,
  Order: undefined,
  'Is Favorite': undefined
}

Component's receive method finished in: 363 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateLabel/ -i '{"in":{"name":"E2E Test Label 3","order":3,"color":"red","isFavorite":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738510',
  Name: 'E2E Test Label 3',
  Color: 'red',
  Order: 3,
  'Is Favorite': true
}

Component's receive method finished in: 274 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateLabel/ -i '{"in":{"name":"E2E Test Label 4","order":4,"color":"orange","isFavorite":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  Name: undefined,
  Color: undefined,
  Order: undefined,
  'Is Favorite': undefined
}

Component's receive method finished in: 272 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateLabel/ -i '{"in":{"name":"E2E Test Label 5"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  Name: undefined,
  Color: undefined,
  Order: undefined,
  'Is Favorite': undefined
}

Component's receive method finished in: 306 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 2. CreateProject
```
appmixer test component src/appmixer/todoist/core/CreateProject/ -i '{"in":{"name":"E2E Test Project","color":"blue","isFavorite":true,"viewStyle":"list"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437921',
  Name: 'E2E Test Project',
  Color: 'blue',
  'Parent ID': null,
  Order: 1,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFGrHMwMQPCRh'
}

Component's receive method finished in: 592 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateProject/ -i '{"in":{"name":"E2E Test Project 2","color":"red","isFavorite":false,"viewStyle":"board"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437925',
  Name: 'E2E Test Project 2',
  Color: 'red',
  'Parent ID': null,
  Order: 2,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFJ76CgFwXJG6'
}

Component's receive method finished in: 2718 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateProject/ -i '{"in":{"name":"E2E Test Project 3","color":"green","isFavorite":true,"viewStyle":"list"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '2365437940',
  parent_id: null,
  order: 3,
  color: 'green',
  name: 'E2E Test Project 3',
  is_shared: false,
  is_favorite: true,
  is_inbox_project: false,
  is_team_inbox: false,
  url: 'https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3',
  view_style: 'list',
  description: '',
  comment_count: 0
}



Component's receive method finished in: 617 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateProject/ -i '{"in":{"name":"E2E Test Project Final","color":"violet","isFavorite":false,"viewStyle":"board"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437950',
  Name: 'E2E Test Project Final',
  Color: 'violet',
  'Parent ID': null,
  Order: 4,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFQm5XCW6p535',
  Description: ''
}

Component's receive method finished in: 581 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateProject/ -i '{"in":{"name":"E2E Test Project Validation","color":"orange","isFavorite":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'E2E Test Project Validation',
  Color: 'orange',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV',
  Description: ''
}

Component's receive method finished in: 659 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 3. CreateSection
```
appmixer test component src/appmixer/todoist/core/CreateSection/ -i '{"in":{"name":"E2E Test Section","projectId":"2365437969","order":1}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068467',
  'Project ID': '2365437969',
  Order: 1,
  Name: 'E2E Test Section'
}

Component's receive method finished in: 373 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateSection/ -i '{"in":{"name":"E2E Test Section 2","projectId":"2365437969","order":2}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068479',
  'Project ID': '2365437969',
  Order: 2,
  Name: 'E2E Test Section 2'
}

Component's receive method finished in: 393 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateSection/ -i '{"in":{"name":"E2E Test Section 3","projectId":"2365437969","order":3}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068495',
  'Project ID': '2365437969',
  Order: 3,
  Name: 'E2E Test Section 3'
}

Component's receive method finished in: 308 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateSection/ -i '{"in":{"name":"E2E Test Section 4","projectId":"2365437969","order":4}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068530',
  'Project ID': '2365437969',
  Order: 4,
  Name: 'E2E Test Section 4'
}

Component's receive method finished in: 384 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateSection/ -i '{"in":{"name":"E2E Test Section 5","projectId":"2365437969","order":5}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/CreateSection
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

[ERROR]:  listen EADDRINUSE: address already in use :::2300
Stack trace:
Error: listen EADDRINUSE: address already in use :::2300
    at Server.setupListenHandle [as _listen2] (node:net:1940:16)
    at listenInCluster (node:net:1997:12)
    at Server.listen (node:net:2102:7)
    at /Users/vladimir/Projects/appmixer-cli/node_modules/@hapi/hapi/lib/core.js:340:31
    at new Promise (<anonymous>)
    at module.exports.internals.Core._listen (/Users/vladimir/Projects/appmixer-cli/node_modules/@hapi/hapi/lib/core.js:312:16)
    at module.exports.internals.Core._start (/Users/vladimir/Projects/appmixer-cli/node_modules/@hapi/hapi/lib/core.js:286:24)
    at async startServer (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:109:5)
    at async Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:549:17)
</details>

## 4. CreateTask
```
appmixer test component src/appmixer/todoist/core/CreateTask/ -i '{"in":{"content":"Test Task - E2E Validation"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907445074',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 1,
  Content: 'Test Task - E2E Validation',
  Description: '',
  'Is Completed': false,
  Labels: [],
  Priority: 1,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T07:57:25.446701Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907445074'
}

Component's receive method finished in: 606 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateTask/ -i '{"in":{"content":"Test Task - Validate Component","description":"This is a test task created for component validation","priority":2}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907454175',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 2,
  Content: 'Test Task - Validate Component',
  Description: 'This is a test task created for component validation',
  'Is Completed': false,
  Labels: [],
  Priority: 2,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:00:58.436225Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907454175'
}

Component's receive method finished in: 444 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 5. CreateReminder
```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"relative","minuteOffset":30}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 276 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"absolute","dueString":"tomorrow at 10am"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 289 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"relative","minuteOffset":30}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 313 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"absolute","dueDatetime":"2026-01-15T10:00:00"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 271 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907454175',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 2,
  Content: 'Test Task - Validate Component',
  Description: 'This is a test task created for component validation',
  'Is Completed': false,
  Labels: [],
  Priority: 2,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:00:58.436225Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907454175'
}

Component's receive method finished in: 301 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"relative","minuteOffset":30}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/CreateReminder
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

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
      taskId:       9907454175
      type:         relative
      minuteOffset: 30
    scope: 

[ERROR]: Item not found
ContextCancelError: Item not found
    at Object.receive (/Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/CreateReminder/CreateReminder.js:62:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/todoist/core/CreateTask/ -i '{"in":{"content":"Test Task for Reminder - CreateReminder Validation"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9916526119',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 4,
  Content: 'Test Task for Reminder - CreateReminder Validation',
  Description: '',
  'Is Completed': false,
  Labels: [],
  Priority: 1,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-14T12:53:30.310198Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9916526119'
}

Component's receive method finished in: 1099 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9916526119","type":"relative","minuteOffset":30}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/CreateReminder
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

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
      taskId:       9916526119
      type:         relative
      minuteOffset: 30
    scope: 

[ERROR]: Bad Request
ContextCancelError: Bad Request
    at Object.receive (/Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/CreateReminder/CreateReminder.js:62:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5) {
  error: undefined,
  data: undefined,
  code: 500
}
</details>

```
appmixer test component src/appmixer/todoist/core/CreateTask/ -i '{"in":{"content":"Test Task with Due Date for Reminder","dueString":"tomorrow at 10am"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9916527204',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 5,
  Content: 'Test Task with Due Date for Reminder',
  Description: '',
  'Is Completed': false,
  Labels: [],
  Priority: 1,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-14T12:53:50.604428Z',
  'Due Date': '2026-01-15',
  'Due String': 'tomorrow at 10am',
  'Due Is Recurring': false,
  'Due Datetime': '2026-01-15T10:00:00',
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9916527204'
}

Component's receive method finished in: 978 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9916527204","type":"relative","minuteOffset":30}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2719296753',
  'Task ID': '9916527204',
  Type: 'relative',
  'Due String': '2026-01-15 09:30',
  'Due Date': '2026-01-15T09:30:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 30
}

Component's receive method finished in: 1211 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 6. CreateComment
```
appmixer test component src/appmixer/todoist/core/CreateComment/ -i '{"in":{"content":"This is a test comment for validation","taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947969952',
  'Task ID': '9907454175',
  'Project ID': null,
  'Posted At': '2026-01-12T08:02:29.229522Z',
  Content: 'This is a test comment for validation',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 527 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateComment/ -i '{"in":{"content":"This is a test comment on a project","projectId":"2365436060"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947970002',
  'Task ID': null,
  'Project ID': '2365436060',
  'Posted At': '2026-01-12T08:02:37.769440Z',
  Content: 'This is a test comment on a project',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 386 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 7. UpdateTask
```
appmixer test component src/appmixer/todoist/core/UpdateTask/ -i '{"in":{"taskId":"9907454175","content":"Updated Task Content - Test","description":"Updated description for the task","priority":3,"labels":"work, important"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907454175',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 2,
  Content: 'Updated Task Content - Test',
  Description: 'Updated description for the task',
  'Is Completed': false,
  Labels: [ 'important', 'work' ],
  Priority: 3,
  'Comment Count': 1,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:00:58.436225Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907454175'
}

Component's receive method finished in: 410 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 8. UpdateLabel
```
appmixer test component src/appmixer/todoist/core/UpdateLabel/ -i '{"in":{"labelId":"2182738508","name":"Updated Test Label","order":5,"color":"green","isFavorite":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Updated Test Label',
  Color: 'green',
  Order: 5,
  'Is Favorite': false
}

Component's receive method finished in: 455 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateLabel/ -i '{"in":{"labelId":"2182738508","name":"Updated Test Label v2","order":6,"color":"orange","isFavorite":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Updated Test Label v2',
  Color: 'orange',
  Order: 6,
  'Is Favorite': true
}

Component's receive method finished in: 507 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateLabel/ -i '{"in":{"labelId":"2182738508","name":"Final Test Label","order":7,"color":"blue","isFavorite":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Test Label',
  Color: 'blue',
  Order: 7,
  'Is Favorite': false
}

Component's receive method finished in: 791 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateLabel/ -i '{"in":{"labelId":"2182738508","name":"Schema Test Label","order":8,"color":"violet","isFavorite":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  Name: undefined,
  Color: undefined,
  Order: undefined,
  'Is Favorite': undefined
}

Component's receive method finished in: 520 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateLabel/ -i '{"in":{"labelId":"2182738508","name":"Final Validation Test","order":9,"color":"red","isFavorite":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Validation Test',
  Color: 'red',
  Order: 9,
  'Is Favorite': false
}

Component's receive method finished in: 520 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 9. UpdateSection
```
appmixer test component src/appmixer/todoist/core/UpdateSection/ -i '{"in":{"sectionId":"212068467","name":"Updated Section Name"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068467',
  'Project ID': '2365437969',
  Order: 1,
  Name: 'Updated Section Name'
}

Component's receive method finished in: 1748 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetSection/ -i '{"in":{"sectionId":"212068467"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068467',
  'Project ID': '2365437969',
  Order: 1,
  Name: 'Updated Section Name'
}

Component's receive method finished in: 241 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateSection/ -i '{"in":{"sectionId":"212068479","name":"Updated Section Name 2"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068479',
  'Project ID': '2365437969',
  Order: 2,
  Name: 'Updated Section Name 2'
}

Component's receive method finished in: 356 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateSection/ -i '{"in":{"sectionId":"212068495","name":"Updated Section Name 3"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068495',
  'Project ID': '2365437969',
  Order: 3,
  Name: 'Updated Section Name 3'
}

Component's receive method finished in: 268 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateSection/ -i '{"in":{"sectionId":"212068530","name":"Updated Section Name 4"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068530',
  'Project ID': '2365437969',
  Order: 4,
  Name: 'Updated Section Name 4'
}

Component's receive method finished in: 585 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 10. UpdateProject
```
appmixer test component src/appmixer/todoist/core/UpdateProject/ -i '{"in":{"projectId":"2365437969","name":"Updated Project Name","color":"violet","isFavorite":false,"viewStyle":"board"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Updated Project Name',
  Color: 'violet',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 556 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateProject/ -i '{"in":{"projectId":"2365437969","name":"Another Updated Name"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'violet',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 382 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateProject/ -i '{"in":{"projectId":"2365437969","color":"red"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 419 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateProject/ -i '{"in":{"projectId":"2365437969","isFavorite":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 307 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateProject/ -i '{"in":{"projectId":"2365437969","viewStyle":"list"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 379 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 11. UpdateComment
```
appmixer test component src/appmixer/todoist/core/UpdateComment/ -i '{"in":{"commentId":"3947969952","content":"This is the updated comment content"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947969952',
  'Task ID': '9907454175',
  'Project ID': null,
  'Posted At': '2026-01-12T08:02:29.229522Z',
  Content: 'This is the updated comment content',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 345 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateComment/ -i '{"in":{"commentId":"3947970002","content":"Updated comment content - second test"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947970002',
  'Task ID': null,
  'Project ID': '2365436060',
  'Posted At': '2026-01-12T08:02:37.769440Z',
  Content: 'Updated comment content - second test',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 408 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateComment/ -i '{"in":{"commentId":"3947969952","content":"Final test update"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947969952',
  'Task ID': '9907454175',
  'Project ID': null,
  'Posted At': '2026-01-12T08:02:29.229522Z',
  Content: 'Final test update',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 386 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateComment/ -i '{"in":{"commentId":"3947970002","content":"Updated with schema validation"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947970002',
  'Task ID': null,
  'Project ID': '2365436060',
  'Posted At': '2026-01-12T08:02:37.769440Z',
  Content: 'Updated with schema validation',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 372 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/UpdateComment/ -i '{"in":{"commentId":"3947969952","content":"Final validation test"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947969952',
  'Task ID': '9907454175',
  'Project ID': null,
  'Posted At': '2026-01-12T08:02:29.229522Z',
  Content: 'Final validation test',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 376 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 12. UpdateReminder
```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListReminders
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

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

Component's receive method finished in: 608 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"relative","minuteOffset":30}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 319 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: [],
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined,
  'File ID': undefined
}

Component's receive method finished in: 506 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListTasks/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '9907445074',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 1,
  Content: 'Test Task - E2E Validation',
  Description: '',
  'Is Completed': false,
  Labels: [],
  Priority: 1,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T07:57:25.446701Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907445074',
  'File ID': undefined
}

Component's receive method finished in: 1096 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907445074","type":"relative","minuteOffset":30}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 264 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 13. MoveTask
```
appmixer test component src/appmixer/todoist/core/MoveTask/ -i '{"in":{"taskId":"9907454175","projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 846 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/MoveTask/ -i '{"in":{"taskId":"9907445074","sectionId":"212068467"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 945 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/MoveTask/ -i '{"in":{"taskId":"9907454175","parentId":"9907445074"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 495 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 14. QuickAddTask
```
appmixer test component src/appmixer/todoist/core/QuickAddTask/ -i '{"in":{"text":"Buy groceries tomorrow #Personal p1","note":"Remember to check for organic options","reminder":"tomorrow at 10am","autoReminder":false}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/QuickAddTask
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

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
      text:         Buy groceries tomorrow #Personal p1
      note:         Remember to check for organic options
      reminder:     tomorrow at 10am
      autoReminder: false
    scope: 

[ERROR]: Request failed with status code 400
error:       Required argument is missing
error_code:  19
error_extra: 
  argument:    content
  event_id:    1927d53411804bc7b214ad24dd30bd70
  retry_after: 3
error_tag:   ARGUMENT_MISSING
http_code:   400
</details>

```
appmixer test component src/appmixer/todoist/core/QuickAddTask/ -i '{"in":{"text":"Buy groceries tomorrow #Personal p1","note":"Remember to check for organic options","reminder":"tomorrow at 10am","autoReminder":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907602558',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365436060',
  'Section ID': null,
  'Parent ID': null,
  Order: 1,
  Content: 'Buy groceries tomorrow #Personal p1',
  Description: 'Remember to check for organic options',
  'Is Completed': false,
  Labels: [],
  Priority: 1,
  'Comment Count': 0,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:45:36.166666Z',
  'Due Date': '2026-01-13',
  'Due String': 'tomorrow at 10am',
  'Due Is Recurring': false,
  'Due Datetime': '2026-01-13T10:00:00',
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907602558'
}

Component's receive method finished in: 649 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 15. CloseTask
```
appmixer test component src/appmixer/todoist/core/CloseTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 708 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907454175',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365437969',
  'Section ID': '212068467',
  'Parent ID': '9907445074',
  Order: 1,
  Content: 'Updated Task Content - Test',
  Description: 'Updated description for the task',
  'Is Completed': true,
  Labels: [ 'important', 'work' ],
  Priority: 3,
  'Comment Count': 1,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:00:58.436225Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907454175'
}

Component's receive method finished in: 292 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 16. ReopenTask
```
appmixer test component src/appmixer/todoist/core/ReopenTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 559 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907454175',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365437969',
  'Section ID': '212068467',
  'Parent ID': '9907445074',
  Order: 1,
  Content: 'Updated Task Content - Test',
  Description: 'Updated description for the task',
  'Is Completed': false,
  Labels: [ 'important', 'work' ],
  Priority: 3,
  'Comment Count': 1,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:00:58.436225Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907454175'
}

Component's receive method finished in: 293 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 17. GetProject
```
appmixer test component src/appmixer/todoist/core/GetProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 240 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  Name: undefined,
  Color: undefined,
  'Parent ID': undefined,
  Order: undefined,
  'Comment Count': undefined,
  'Is Shared': undefined,
  'Is Favorite': undefined,
  'Is Inbox Project': undefined,
  'Is Team Inbox': undefined,
  'View Style': undefined,
  URL: undefined
}

Component's receive method finished in: 285 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListProjects/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '2365436060',
  parent_id: null,
  order: 0,
  color: 'charcoal',
  name: 'Inbox',
  is_shared: false,
  is_favorite: false,
  is_inbox_project: true,
  is_team_inbox: false,
  url: 'https://app.todoist.com/app/project/6fjh4Hc7PHw7Jgrm',
  view_style: 'list',
  description: '',
  comment_count: 1
}



Component's receive method finished in: 336 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 281 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV'
}

Component's receive method finished in: 265 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/GetProject
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

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
      projectId: 2365437969
    scope: 

[ERROR]: Request failed with status code 404
Project not found
</details>

```
appmixer test component src/appmixer/todoist/core/GetProject/ -i '{"in":{"projectId":"2365437940"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '2365437940',
  parent_id: null,
  order: 3,
  color: 'green',
  name: 'E2E Test Project 3',
  is_shared: false,
  is_favorite: true,
  is_inbox_project: false,
  is_team_inbox: false,
  url: 'https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3',
  view_style: 'list',
  description: '',
  comment_count: 0
}



Component's receive method finished in: 489 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 18. GetSection
```
appmixer test component src/appmixer/todoist/core/GetSection/ -i '{"in":{"sectionId":"212068467"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068467',
  'Project ID': '2365437969',
  Order: 1,
  Name: 'Updated Section Name'
}

Component's receive method finished in: 232 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetSection/ -i '{"in":{"sectionId":"212068467"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068467',
  'Project ID': '2365437969',
  Order: 1,
  Name: 'Updated Section Name'
}

Component's receive method finished in: 246 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetSection/ -i '{"in":{"sectionId":"212068479"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068479',
  'Project ID': '2365437969',
  Order: 2,
  Name: 'Updated Section Name 2'
}

Component's receive method finished in: 221 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetSection/ -i '{"in":{"sectionId":"212068467"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068467',
  'Project ID': '2365437969',
  Order: 1,
  Name: 'Updated Section Name'
}

Component's receive method finished in: 298 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetSection/ -i '{"in":{"sectionId":"212068495"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '212068495',
  'Project ID': '2365437969',
  Order: 3,
  Name: 'Updated Section Name 3'
}

Component's receive method finished in: 240 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 19. GetTask
```
appmixer test component src/appmixer/todoist/core/GetTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '9907454175',
  'Assigner ID': null,
  'Assignee ID': null,
  'Project ID': '2365437969',
  'Section ID': '212068467',
  'Parent ID': '9907445074',
  Order: 1,
  Content: 'Updated Task Content - Test',
  Description: 'Updated description for the task',
  'Is Completed': false,
  Labels: [ 'important', 'work' ],
  Priority: 3,
  'Comment Count': 1,
  'Creator ID': '57023438',
  'Created At': '2026-01-12T08:00:58.436225Z',
  'Due Date': undefined,
  'Due String': undefined,
  'Due Is Recurring': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Duration Amount': undefined,
  'Duration Unit': undefined,
  URL: 'https://app.todoist.com/app/task/9907454175'
}

Component's receive method finished in: 247 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 20. GetLabel
```
appmixer test component src/appmixer/todoist/core/GetLabel/ -i '{"in":{"labelId":"2182738508"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Validation Test',
  Color: 'red',
  Order: 9,
  'Is Favorite': false
}

Component's receive method finished in: 200 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetLabel/ -i '{"in":{"labelId":"2182738508"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Validation Test',
  Color: 'red',
  Order: 9,
  'Is Favorite': false
}

Component's receive method finished in: 208 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetLabel/ -i '{"in":{"labelId":"2182738508"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Validation Test',
  Color: 'red',
  Order: 9,
  'Is Favorite': false
}

Component's receive method finished in: 183 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetLabel/ -i '{"in":{"labelId":"2182738508"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Validation Test',
  Color: 'red',
  Order: 9,
  'Is Favorite': false
}

Component's receive method finished in: 197 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetLabel/ -i '{"in":{"labelId":"2182738508"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '2182738508',
  Name: 'Final Validation Test',
  Color: 'red',
  Order: 9,
  'Is Favorite': false
}

Component's receive method finished in: 234 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 21. GetComment
```
appmixer test component src/appmixer/todoist/core/GetComment/ -i '{"in":{"commentId":"3947969952"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947969952',
  'Task ID': '9907454175',
  'Project ID': null,
  'Posted At': '2026-01-12T08:02:29.229522Z',
  Content: 'Final validation test',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 323 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetComment/ -i '{"in":{"commentId":"3947969952"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/GetComment

[ERROR]:  /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/GetComment/component.json: Expected ',' or '}' after property value in JSON at position 1594 (line 1 column 1595)
Stack trace:
SyntaxError: /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/GetComment/component.json: Expected ',' or '}' after property value in JSON at position 1594 (line 1 column 1595)
    at parse (<anonymous>)
    at Object..json (node:internal/modules/cjs/loader:1905:39)
    at Module.load (node:internal/modules/cjs/loader:1481:32)
    at Module._load (node:internal/modules/cjs/loader:1300:12)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:245:24)
    at Module.require (node:internal/modules/cjs/loader:1504:12)
    at require (node:internal/modules/helpers:152:16)
    at Command.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:360:35)
    at Command.listener (/Users/vladimir/Projects/appmixer-cli/node_modules/commander/index.js:315:8)
    at Command.emit (node:events:508:28)
    at Command.parseArgs (/Users/vladimir/Projects/appmixer-cli/node_modules/commander/index.js:653:12)
    at Command.parse (/Users/vladimir/Projects/appmixer-cli/node_modules/commander/index.js:474:21)
    at Object.<anonymous> (/Users/vladimir/Projects/appmixer-cli/appmixer-test-component.js:699:13)
    at Module._compile (node:internal/modules/cjs/loader:1761:14)
    at Object..js (node:internal/modules/cjs/loader:1893:10)
    at Module.load (node:internal/modules/cjs/loader:1481:32)
    at Module._load (node:internal/modules/cjs/loader:1300:12)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:245:24)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47
</details>

```
appmixer test component src/appmixer/todoist/core/GetComment/ -i '{"in":{"commentId":"3947969952"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947969952',
  'Task ID': '9907454175',
  'Project ID': null,
  'Posted At': '2026-01-12T08:02:29.229522Z',
  Content: 'Final validation test',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 287 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetComment/ -i '{"in":{"commentId":"3947970002"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947970002',
  'Task ID': null,
  'Project ID': '2365436060',
  'Posted At': '2026-01-12T08:02:37.769440Z',
  Content: 'Updated with schema validation',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined
}

Component's receive method finished in: 228 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 22. GetProjectCollaborators
```
appmixer test component src/appmixer/todoist/core/GetProjectCollaborators/ -i '{"in":{"projectId":"2365437969","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  records: [ { id: '57023438', name: 'Auth Admin', email: 'auth@appmixer.ai' } ]
}



Component's receive method finished in: 242 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProjectCollaborators/ -i '{"in":{"projectId":"2365437969","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ id: '57023438', name: 'Auth Admin', email: 'auth@appmixer.ai' }



Component's receive method finished in: 296 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProjectCollaborators/ -i '{"in":{"projectId":"2365437969","outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ id: '57023438', name: 'Auth Admin', email: 'auth@appmixer.ai' }



Component's receive method finished in: 263 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/GetProjectCollaborators/ -i '{"in":{"projectId":"2365437969","outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '6964b7dc11d129313b97550f' }



Component's receive method finished in: 258 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 23. ListProjects
```
appmixer test component src/appmixer/todoist/core/ListProjects/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: [
    {
      id: '2365436060',
      parent_id: null,
      order: 0,
      color: 'charcoal',
      name: 'Inbox',
      is_shared: false,
      is_favorite: false,
      is_inbox_project: true,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjh4Hc7PHw7Jgrm',
      view_style: 'list',
      description: '',
      comment_count: 1
    },
    {
      id: '2365437921',
      parent_id: null,
      order: 1,
      color: 'blue',
      name: 'E2E Test Project',
      is_shared: false,
      is_favorite: true,
      is_inbox_project: false,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjhFGrHMwMQPCRh',
      view_style: 'list',
      description: '',
      comment_count: 0
    },
    {
      id: '2365437925',
      parent_id: null,
      order: 2,
      color: 'red',
      name: 'E2E Test Project 2',
      is_shared: false,
      is_favorite: false,
      is_inbox_project: false,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjhFJ76CgFwXJG6',
      view_style: 'board',
      description: '',
      comment_count: 0
    },
    {
      id: '2365437940',
      parent_id: null,
      order: 3,
      color: 'green',
      name: 'E2E Test Project 3',
      is_shared: false,
      is_favorite: true,
      is_inbox_project: false,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3',
      view_style: 'list',
      description: '',
      comment_count: 0
    },
    {
      id: '2365437950',
      parent_id: null,
      order: 4,
      color: 'violet',
      name: 'E2E Test Project Final',
      is_shared: false,
      is_favorite: false,
      is_inbox_project: false,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjhFQm5XCW6p535',
      view_style: 'board',
      description: '',
      comment_count: 0
    },
    {
      id: '2365437969',
      parent_id: null,
      order: 5,
      color: 'red',
      name: 'Another Updated Name',
      is_shared: false,
      is_favorite: true,
      is_inbox_project: false,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV',
      view_style: 'list',
      description: '',
      comment_count: 0
    },
    {
      id: '2365438049',
      parent_id: null,
      order: 6,
      color: 'blue',
      name: 'E2E Test Project',
      is_shared: false,
      is_favorite: true,
      is_inbox_project: false,
      is_team_inbox: false,
      url: 'https://app.todoist.com/app/project/6fjhFrRCwj3xJcV7',
      view_style: 'list',
      description: '',
      comment_count: 0
    }
  ],
  ID: undefined,
  Name: undefined,
  Color: undefined,
  'Parent ID': undefined,
  Order: undefined,
  'Comment Count': undefined,
  'Is Shared': undefined,
  'Is Favorite': undefined,
  'Is Inbox Project': undefined,
  'Is Team Inbox': undefined,
  'View Style': undefined,
  URL: undefined,
  'File ID': undefined
}

Component's receive method finished in: 387 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListProjects/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365436060',
  Name: 'Inbox',
  Color: 'charcoal',
  'Parent ID': null,
  Order: 0,
  'Comment Count': 1,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': true,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjh4Hc7PHw7Jgrm',
  'File ID': undefined
}

Component's receive method finished in: 356 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListProjects/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365436060',
  Name: 'Inbox',
  Color: 'charcoal',
  'Parent ID': null,
  Order: 0,
  'Comment Count': 1,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': true,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjh4Hc7PHw7Jgrm',
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"id":"2365437921","parent_id":null,"order":1,"color":"blue","name":"E2E Test Project","is_shared":false,"is_favorite":true,"is_inbox_project":false,"is_team_inbox":false,"url":"https://app.todoist.com/app/project/6fjhFGrHMwMQPCRh","view_style":"list","description":"","comment_count":0}
gridTimestamp: 2026-01-12T08:12:53.312Z
id:            component
type:          data
portType:      out
port:          out
senderId:      a09dfe75-e8b3-44a6-adde-b57117255109
senderType:    appmixer.todoist.core.ListProjects
userId:        6964ad04cbaebb25a5abdaa7
componentType: appmixer.todoist.core.ListProjects
componentId:   a09dfe75-e8b3-44a6-adde-b57117255109
flowId:        309b1ac5-2fa6-433b-b0cc-d22f77371e8a
flowName:      
correlationId: 3ee5b58c-239f-461e-bd8d-f746937b8b3c
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-4ea5932d-c666-4602-a37b-661d119d0fd0"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:                2365437921
  string-name:              E2E Test Project
  string-color:             blue
  string-parent_id:         null
  number-order:             1
  number-comment_count:     0
  boolean-is_shared:        false
  boolean-is_favorite:      true
  boolean-is_inbox_project: false
  boolean-is_team_inbox:    false
  string-view_style:        list
  string-url:               https://app.todoist.com/app/project/6fjhFGrHMwMQPCRh

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365437921',
  Name: 'E2E Test Project',
  Color: 'blue',
  'Parent ID': null,
  Order: 1,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFGrHMwMQPCRh',
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"id":"2365437925","parent_id":null,"order":2,"color":"red","name":"E2E Test Project 2","is_shared":false,"is_favorite":false,"is_inbox_project":false,"is_team_inbox":false,"url":"https://app.todoist.com/app/project/6fjhFJ76CgFwXJG6","view_style":"board","description":"","comment_count":0}
gridTimestamp: 2026-01-12T08:12:53.312Z
id:            component
type:          data
portType:      out
port:          out
senderId:      a09dfe75-e8b3-44a6-adde-b57117255109
senderType:    appmixer.todoist.core.ListProjects
userId:        6964ad04cbaebb25a5abdaa7
componentType: appmixer.todoist.core.ListProjects
componentId:   a09dfe75-e8b3-44a6-adde-b57117255109
flowId:        309b1ac5-2fa6-433b-b0cc-d22f77371e8a
flowName:      
correlationId: 8f40649f-c0b5-431e-aa0e-93bd13a9a7f5
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-4ea5932d-c666-4602-a37b-661d119d0fd0"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:                2365437925
  string-name:              E2E Test Project 2
  string-color:             red
  string-parent_id:         null
  number-order:             2
  number-comment_count:     0
  boolean-is_shared:        false
  boolean-is_favorite:      false
  boolean-is_inbox_project: false
  boolean-is_team_inbox:    false
  string-view_style:        board
  string-url:               https://app.todoist.com/app/project/6fjhFJ76CgFwXJG6

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365437925',
  Name: 'E2E Test Project 2',
  Color: 'red',
  'Parent ID': null,
  Order: 2,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFJ76CgFwXJG6',
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"id":"2365437940","parent_id":null,"order":3,"color":"green","name":"E2E Test Project 3","is_shared":false,"is_favorite":true,"is_inbox_project":false,"is_team_inbox":false,"url":"https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3","view_style":"list","description":"","comment_count":0}
gridTimestamp: 2026-01-12T08:12:53.313Z
id:            component
type:          data
portType:      out
port:          out
senderId:      a09dfe75-e8b3-44a6-adde-b57117255109
senderType:    appmixer.todoist.core.ListProjects
userId:        6964ad04cbaebb25a5abdaa7
componentType: appmixer.todoist.core.ListProjects
componentId:   a09dfe75-e8b3-44a6-adde-b57117255109
flowId:        309b1ac5-2fa6-433b-b0cc-d22f77371e8a
flowName:      
correlationId: c568a559-4250-46da-a28e-7b4f0fc2a9a9
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-4ea5932d-c666-4602-a37b-661d119d0fd0"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:                2365437940
  string-name:              E2E Test Project 3
  string-color:             green
  string-parent_id:         null
  number-order:             3
  number-comment_count:     0
  boolean-is_shared:        false
  boolean-is_favorite:      true
  boolean-is_inbox_project: false
  boolean-is_team_inbox:    false
  string-view_style:        list
  string-url:               https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365437940',
  Name: 'E2E Test Project 3',
  Color: 'green',
  'Parent ID': null,
  Order: 3,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3',
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"id":"2365437950","parent_id":null,"order":4,"color":"violet","name":"E2E Test Project Final","is_shared":false,"is_favorite":false,"is_inbox_project":false,"is_team_inbox":false,"url":"https://app.todoist.com/app/project/6fjhFQm5XCW6p535","view_style":"board","description":"","comment_count":0}
gridTimestamp: 2026-01-12T08:12:53.313Z
id:            component
type:          data
portType:      out
port:          out
senderId:      a09dfe75-e8b3-44a6-adde-b57117255109
senderType:    appmixer.todoist.core.ListProjects
userId:        6964ad04cbaebb25a5abdaa7
componentType: appmixer.todoist.core.ListProjects
componentId:   a09dfe75-e8b3-44a6-adde-b57117255109
flowId:        309b1ac5-2fa6-433b-b0cc-d22f77371e8a
flowName:      
correlationId: 71676ee8-6b64-41b8-8e31-85ac53e30f10
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-4ea5932d-c666-4602-a37b-661d119d0fd0"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:                2365437950
  string-name:              E2E Test Project Final
  string-color:             violet
  string-parent_id:         null
  number-order:             4
  number-comment_count:     0
  boolean-is_shared:        false
  boolean-is_favorite:      false
  boolean-is_inbox_project: false
  boolean-is_team_inbox:    false
  string-view_style:        board
  string-url:               https://app.todoist.com/app/project/6fjhFQm5XCW6p535

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365437950',
  Name: 'E2E Test Project Final',
  Color: 'violet',
  'Parent ID': null,
  Order: 4,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': false,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'board',
  URL: 'https://app.todoist.com/app/project/6fjhFQm5XCW6p535',
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"id":"2365437969","parent_id":null,"order":5,"color":"red","name":"Another Updated Name","is_shared":false,"is_favorite":true,"is_inbox_project":false,"is_team_inbox":false,"url":"https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV","view_style":"list","description":"","comment_count":0}
gridTimestamp: 2026-01-12T08:12:53.313Z
id:            component
type:          data
portType:      out
port:          out
senderId:      a09dfe75-e8b3-44a6-adde-b57117255109
senderType:    appmixer.todoist.core.ListProjects
userId:        6964ad04cbaebb25a5abdaa7
componentType: appmixer.todoist.core.ListProjects
componentId:   a09dfe75-e8b3-44a6-adde-b57117255109
flowId:        309b1ac5-2fa6-433b-b0cc-d22f77371e8a
flowName:      
correlationId: 5a1fbc2b-3de0-4cbf-8c86-a2d97c4e66e9
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-4ea5932d-c666-4602-a37b-661d119d0fd0"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:                2365437969
  string-name:              Another Updated Name
  string-color:             red
  string-parent_id:         null
  number-order:             5
  number-comment_count:     0
  boolean-is_shared:        false
  boolean-is_favorite:      true
  boolean-is_inbox_project: false
  boolean-is_team_inbox:    false
  string-view_style:        list
  string-url:               https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365437969',
  Name: 'Another Updated Name',
  Color: 'red',
  'Parent ID': null,
  Order: 5,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV',
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"id":"2365438049","parent_id":null,"order":6,"color":"blue","name":"E2E Test Project","is_shared":false,"is_favorite":true,"is_inbox_project":false,"is_team_inbox":false,"url":"https://app.todoist.com/app/project/6fjhFrRCwj3xJcV7","view_style":"list","description":"","comment_count":0}
gridTimestamp: 2026-01-12T08:12:53.313Z
id:            component
type:          data
portType:      out
port:          out
senderId:      a09dfe75-e8b3-44a6-adde-b57117255109
senderType:    appmixer.todoist.core.ListProjects
userId:        6964ad04cbaebb25a5abdaa7
componentType: appmixer.todoist.core.ListProjects
componentId:   a09dfe75-e8b3-44a6-adde-b57117255109
flowId:        309b1ac5-2fa6-433b-b0cc-d22f77371e8a
flowName:      
correlationId: 765585f0-b023-4833-8966-45a97a9b904b
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-4ea5932d-c666-4602-a37b-661d119d0fd0"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:                2365438049
  string-name:              E2E Test Project
  string-color:             blue
  string-parent_id:         null
  number-order:             6
  number-comment_count:     0
  boolean-is_shared:        false
  boolean-is_favorite:      true
  boolean-is_inbox_project: false
  boolean-is_team_inbox:    false
  string-view_style:        list
  string-url:               https://app.todoist.com/app/project/6fjhFrRCwj3xJcV7

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2365438049',
  Name: 'E2E Test Project',
  Color: 'blue',
  'Parent ID': null,
  Order: 6,
  'Comment Count': 0,
  'Is Shared': false,
  'Is Favorite': true,
  'Is Inbox Project': false,
  'Is Team Inbox': false,
  'View Style': 'list',
  URL: 'https://app.todoist.com/app/project/6fjhFrRCwj3xJcV7',
  'File ID': undefined
}

Component's receive method finished in: 345 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListProjects/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: undefined,
  Name: undefined,
  Color: undefined,
  'Parent ID': undefined,
  Order: undefined,
  'Comment Count': undefined,
  'Is Shared': undefined,
  'Is Favorite': undefined,
  'Is Inbox Project': undefined,
  'Is Team Inbox': undefined,
  'View Style': undefined,
  URL: undefined,
  'File ID': '6964ad0897916b25ab7b68a6'
}

Component's receive method finished in: 372 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 24. ListSections
```
appmixer test component src/appmixer/todoist/core/ListSections/ -i '{"in":{"projectId":"2365437969","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  records: [
    {
      id: '212068467',
      v2_id: '6fjhFWqRcQ26v8VV',
      project_id: '2365437969',
      v2_project_id: '6fjhFW2gPFWP5mQV',
      order: 1,
      name: 'Updated Section Name'
    },
    {
      id: '212068479',
      v2_id: '6fjhFc4pVrf9qJGV',
      project_id: '2365437969',
      v2_project_id: '6fjhFW2gPFWP5mQV',
      order: 2,
      name: 'Updated Section Name 2'
    },
    {
      id: '212068495',
      v2_id: '6fjhFcW237Vcqjx3',
      project_id: '2365437969',
      v2_project_id: '6fjhFW2gPFWP5mQV',
      order: 3,
      name: 'Updated Section Name 3'
    },
    {
      id: '212068530',
      v2_id: '6fjhFgGcVH2XVHw3',
      project_id: '2365437969',
      v2_project_id: '6fjhFW2gPFWP5mQV',
      order: 4,
      name: 'Updated Section Name 4'
    }
  ]
}



Component's receive method finished in: 237 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListSections/ -i '{"in":{"projectId":"2365437969","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '212068467',
  v2_id: '6fjhFWqRcQ26v8VV',
  project_id: '2365437969',
  v2_project_id: '6fjhFW2gPFWP5mQV',
  order: 1,
  name: 'Updated Section Name'
}



Component's receive method finished in: 256 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListSections/ -i '{"in":{"projectId":"2365437969","outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '212068467',
  v2_id: '6fjhFWqRcQ26v8VV',
  project_id: '2365437969',
  v2_project_id: '6fjhFW2gPFWP5mQV',
  order: 1,
  name: 'Updated Section Name'
}



In/Out Message logged: 
severity:      info
msg:           {"id":"212068479","v2_id":"6fjhFc4pVrf9qJGV","project_id":"2365437969","v2_project_id":"6fjhFW2gPFWP5mQV","order":2,"name":"Updated Section Name 2"}
gridTimestamp: 2026-01-12T08:59:34.082Z
id:            component
type:          data
portType:      out
port:          out
senderId:      441a0161-793c-46ce-aaf1-ff9ed3a96f72
senderType:    appmixer.todoist.core.ListSections
userId:        6964b7f5057d11315bf44a03
componentType: appmixer.todoist.core.ListSections
componentId:   441a0161-793c-46ce-aaf1-ff9ed3a96f72
flowId:        4575b33d-2b2a-492e-afa4-bbd7fe35bc93
flowName:      
correlationId: 4dbd1ba5-59ae-433b-9df2-5cada9ca910b
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-6a7d90af-5f43-430f-aa60-34ea6dfded4f"},"content":{"projectId":"2365437969","outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '212068479',
  v2_id: '6fjhFc4pVrf9qJGV',
  project_id: '2365437969',
  v2_project_id: '6fjhFW2gPFWP5mQV',
  order: 2,
  name: 'Updated Section Name 2'
}



In/Out Message logged: 
severity:      info
msg:           {"id":"212068495","v2_id":"6fjhFcW237Vcqjx3","project_id":"2365437969","v2_project_id":"6fjhFW2gPFWP5mQV","order":3,"name":"Updated Section Name 3"}
gridTimestamp: 2026-01-12T08:59:34.083Z
id:            component
type:          data
portType:      out
port:          out
senderId:      441a0161-793c-46ce-aaf1-ff9ed3a96f72
senderType:    appmixer.todoist.core.ListSections
userId:        6964b7f5057d11315bf44a03
componentType: appmixer.todoist.core.ListSections
componentId:   441a0161-793c-46ce-aaf1-ff9ed3a96f72
flowId:        4575b33d-2b2a-492e-afa4-bbd7fe35bc93
flowName:      
correlationId: faba54cb-d553-470e-97f9-d82bba6294b9
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-6a7d90af-5f43-430f-aa60-34ea6dfded4f"},"content":{"projectId":"2365437969","outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '212068495',
  v2_id: '6fjhFcW237Vcqjx3',
  project_id: '2365437969',
  v2_project_id: '6fjhFW2gPFWP5mQV',
  order: 3,
  name: 'Updated Section Name 3'
}



In/Out Message logged: 
severity:      info
msg:           {"id":"212068530","v2_id":"6fjhFgGcVH2XVHw3","project_id":"2365437969","v2_project_id":"6fjhFW2gPFWP5mQV","order":4,"name":"Updated Section Name 4"}
gridTimestamp: 2026-01-12T08:59:34.083Z
id:            component
type:          data
portType:      out
port:          out
senderId:      441a0161-793c-46ce-aaf1-ff9ed3a96f72
senderType:    appmixer.todoist.core.ListSections
userId:        6964b7f5057d11315bf44a03
componentType: appmixer.todoist.core.ListSections
componentId:   441a0161-793c-46ce-aaf1-ff9ed3a96f72
flowId:        4575b33d-2b2a-492e-afa4-bbd7fe35bc93
flowName:      
correlationId: 8f520b4f-2661-495d-83fc-983f03599a4c
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-6a7d90af-5f43-430f-aa60-34ea6dfded4f"},"content":{"projectId":"2365437969","outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '212068530',
  v2_id: '6fjhFgGcVH2XVHw3',
  project_id: '2365437969',
  v2_project_id: '6fjhFW2gPFWP5mQV',
  order: 4,
  name: 'Updated Section Name 4'
}



Component's receive method finished in: 237 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListSections/ -i '{"in":{"projectId":"2365437969","outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '6964b7f86d25e73161392e65' }



Component's receive method finished in: 217 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 25. ListTasks
```
appmixer test component src/appmixer/todoist/core/ListTasks/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  records: [
    {
      id: '9907445074',
      assigner_id: null,
      assignee_id: null,
      project_id: '2365437969',
      section_id: '212068467',
      parent_id: null,
      order: 1,
      content: 'Test Task - E2E Validation',
      description: '',
      is_completed: false,
      labels: [],
      priority: 1,
      comment_count: 0,
      creator_id: '57023438',
      created_at: '2026-01-12T07:57:25.446701Z',
      due: null,
      url: 'https://app.todoist.com/app/task/9907445074',
      duration: null,
      deadline: null
    },
    {
      id: '9907454175',
      assigner_id: null,
      assignee_id: null,
      project_id: '2365437969',
      section_id: '212068467',
      parent_id: '9907445074',
      order: 1,
      content: 'Updated Task Content - Test',
      description: 'Updated description for the task',
      is_completed: false,
      labels: [ 'important', 'work' ],
      priority: 3,
      comment_count: 1,
      creator_id: '57023438',
      created_at: '2026-01-12T08:00:58.436225Z',
      due: null,
      url: 'https://app.todoist.com/app/task/9907454175',
      duration: null,
      deadline: null
    },
    {
      id: '9907602558',
      assigner_id: null,
      assignee_id: null,
      project_id: '2365436060',
      section_id: null,
      parent_id: null,
      order: 1,
      content: 'Buy groceries tomorrow #Personal p1',
      description: 'Remember to check for organic options',
      is_completed: false,
      labels: [],
      priority: 1,
      comment_count: 0,
      creator_id: '57023438',
      created_at: '2026-01-12T08:45:36.166666Z',
      due: {
        date: '2026-01-13',
        string: 'tomorrow at 10am',
        lang: 'en',
        is_recurring: false,
        datetime: '2026-01-13T10:00:00'
      },
      url: 'https://app.todoist.com/app/task/9907602558',
      duration: null,
      deadline: null
    }
  ]
}



Component's receive method finished in: 534 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListTasks/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '9907445074',
  assigner_id: null,
  assignee_id: null,
  project_id: '2365437969',
  section_id: '212068467',
  parent_id: null,
  order: 1,
  content: 'Test Task - E2E Validation',
  description: '',
  is_completed: false,
  labels: [],
  priority: 1,
  comment_count: 0,
  creator_id: '57023438',
  created_at: '2026-01-12T07:57:25.446701Z',
  due: null,
  url: 'https://app.todoist.com/app/task/9907445074',
  duration: null,
  deadline: null
}



Component's receive method finished in: 3158 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListTasks/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '9907445074',
  assigner_id: null,
  assignee_id: null,
  project_id: '2365437969',
  section_id: '212068467',
  parent_id: null,
  order: 1,
  content: 'Test Task - E2E Validation',
  description: '',
  is_completed: false,
  labels: [],
  priority: 1,
  comment_count: 0,
  creator_id: '57023438',
  created_at: '2026-01-12T07:57:25.446701Z',
  due: null,
  url: 'https://app.todoist.com/app/task/9907445074',
  duration: null,
  deadline: null
}



In/Out Message logged: 
severity:      info
msg:           {"id":"9907454175","assigner_id":null,"assignee_id":null,"project_id":"2365437969","section_id":"212068467","parent_id":"9907445074","order":1,"content":"Updated Task Content - Test","description":"Updated description for the task","is_completed":false,"labels":["important","work"],"priority":3,"comment_count":1,"creator_id":"57023438","created_at":"2026-01-12T08:00:58.436225Z","due":null,"url":"https://app.todoist.com/app/task/9907454175","duration":null,"deadline":null}
gridTimestamp: 2026-01-12T09:00:09.597Z
id:            component
type:          data
portType:      out
port:          out
senderId:      0dea2137-1eb9-4aaa-8a46-19b58c8e031f
senderType:    appmixer.todoist.core.ListTasks
userId:        6964b816f39a233180b484a2
componentType: appmixer.todoist.core.ListTasks
componentId:   0dea2137-1eb9-4aaa-8a46-19b58c8e031f
flowId:        1bef715f-7e7f-4e01-b56d-db744bd5b6cd
flowName:      
correlationId: b47f2d62-0ed0-451a-b8b5-77c5b2604601
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-109e2776-900d-476d-8ebc-3d793823facb"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '9907454175',
  assigner_id: null,
  assignee_id: null,
  project_id: '2365437969',
  section_id: '212068467',
  parent_id: '9907445074',
  order: 1,
  content: 'Updated Task Content - Test',
  description: 'Updated description for the task',
  is_completed: false,
  labels: [ 'important', 'work' ],
  priority: 3,
  comment_count: 1,
  creator_id: '57023438',
  created_at: '2026-01-12T08:00:58.436225Z',
  due: null,
  url: 'https://app.todoist.com/app/task/9907454175',
  duration: null,
  deadline: null
}



In/Out Message logged: 
severity:      info
msg:           {"id":"9907602558","assigner_id":null,"assignee_id":null,"project_id":"2365436060","section_id":null,"parent_id":null,"order":1,"content":"Buy groceries tomorrow #Personal p1","description":"Remember to check for organic options","is_completed":false,"labels":[],"priority":1,"comment_count":0,"creator_id":"57023438","created_at":"2026-01-12T08:45:36.166666Z","due":{"date":"2026-01-13","string":"tomorrow at 10am","lang":"en","is_recurring":false,"datetime":"2026-01-13T10:00:00"},"url":"https://app.todoist.com/app/task/9907602558","duration":null,"deadline":null}
gridTimestamp: 2026-01-12T09:00:09.598Z
id:            component
type:          data
portType:      out
port:          out
senderId:      0dea2137-1eb9-4aaa-8a46-19b58c8e031f
senderType:    appmixer.todoist.core.ListTasks
userId:        6964b816f39a233180b484a2
componentType: appmixer.todoist.core.ListTasks
componentId:   0dea2137-1eb9-4aaa-8a46-19b58c8e031f
flowId:        1bef715f-7e7f-4e01-b56d-db744bd5b6cd
flowName:      
correlationId: 32e1d3f0-3b7f-4e51-806c-fecaf37b7035
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-109e2776-900d-476d-8ebc-3d793823facb"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '9907602558',
  assigner_id: null,
  assignee_id: null,
  project_id: '2365436060',
  section_id: null,
  parent_id: null,
  order: 1,
  content: 'Buy groceries tomorrow #Personal p1',
  description: 'Remember to check for organic options',
  is_completed: false,
  labels: [],
  priority: 1,
  comment_count: 0,
  creator_id: '57023438',
  created_at: '2026-01-12T08:45:36.166666Z',
  due: {
    date: '2026-01-13',
    string: 'tomorrow at 10am',
    lang: 'en',
    is_recurring: false,
    datetime: '2026-01-13T10:00:00'
  },
  url: 'https://app.todoist.com/app/task/9907602558',
  duration: null,
  deadline: null
}



Component's receive method finished in: 3197 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListTasks/ -i '{"in":{"filter":"today","lang":"en","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ records: [] }



Component's receive method finished in: 419 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListTasks/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '6964b81f573634318d579b62' }



Component's receive method finished in: 365 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 26. ListLabels
```
appmixer test component src/appmixer/todoist/core/ListLabels/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  records: [
    {
      id: '2182738509',
      name: 'E2E Test Label 2',
      color: 'green',
      order: 2,
      is_favorite: false
    },
    {
      id: '2182738510',
      name: 'E2E Test Label 3',
      color: 'red',
      order: 3,
      is_favorite: true
    },
    {
      id: '2182738514',
      name: 'E2E Test Label 4',
      color: 'orange',
      order: 4,
      is_favorite: false
    },
    {
      id: '2182738516',
      name: 'E2E Test Label 5',
      color: 'charcoal',
      order: 5,
      is_favorite: false
    },
    {
      id: '2182738508',
      name: 'Final Validation Test',
      color: 'red',
      order: 9,
      is_favorite: false
    }
  ]
}



Component's receive method finished in: 227 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListLabels/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '2182738509',
  name: 'E2E Test Label 2',
  color: 'green',
  order: 2,
  is_favorite: false
}



Component's receive method finished in: 224 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListLabels/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '2182738509',
  name: 'E2E Test Label 2',
  color: 'green',
  order: 2,
  is_favorite: false
}



In/Out Message logged: 
severity:      info
msg:           {"id":"2182738510","name":"E2E Test Label 3","color":"red","order":3,"is_favorite":true}
gridTimestamp: 2026-01-12T09:06:53.606Z
id:            component
type:          data
portType:      out
port:          out
senderId:      50aec22c-eaaf-42a3-87ae-c30d1deb74e6
senderType:    appmixer.todoist.core.ListLabels
userId:        6964b9ada040b932e1fe36c3
componentType: appmixer.todoist.core.ListLabels
componentId:   50aec22c-eaaf-42a3-87ae-c30d1deb74e6
flowId:        ac114782-15f5-4a5e-9721-865293ed537a
flowName:      
correlationId: 1233af0d-c0b1-4459-9ec8-f692710538e2
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-768f9a20-445a-4314-bac6-387c626a3771"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '2182738510',
  name: 'E2E Test Label 3',
  color: 'red',
  order: 3,
  is_favorite: true
}



In/Out Message logged: 
severity:      info
msg:           {"id":"2182738514","name":"E2E Test Label 4","color":"orange","order":4,"is_favorite":false}
gridTimestamp: 2026-01-12T09:06:53.606Z
id:            component
type:          data
portType:      out
port:          out
senderId:      50aec22c-eaaf-42a3-87ae-c30d1deb74e6
senderType:    appmixer.todoist.core.ListLabels
userId:        6964b9ada040b932e1fe36c3
componentType: appmixer.todoist.core.ListLabels
componentId:   50aec22c-eaaf-42a3-87ae-c30d1deb74e6
flowId:        ac114782-15f5-4a5e-9721-865293ed537a
flowName:      
correlationId: 70233f5f-2c39-4709-a273-437731650c5d
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-768f9a20-445a-4314-bac6-387c626a3771"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '2182738514',
  name: 'E2E Test Label 4',
  color: 'orange',
  order: 4,
  is_favorite: false
}



In/Out Message logged: 
severity:      info
msg:           {"id":"2182738516","name":"E2E Test Label 5","color":"charcoal","order":5,"is_favorite":false}
gridTimestamp: 2026-01-12T09:06:53.606Z
id:            component
type:          data
portType:      out
port:          out
senderId:      50aec22c-eaaf-42a3-87ae-c30d1deb74e6
senderType:    appmixer.todoist.core.ListLabels
userId:        6964b9ada040b932e1fe36c3
componentType: appmixer.todoist.core.ListLabels
componentId:   50aec22c-eaaf-42a3-87ae-c30d1deb74e6
flowId:        ac114782-15f5-4a5e-9721-865293ed537a
flowName:      
correlationId: 9d7faf86-8d53-41fc-89c4-ef8fee360c28
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-768f9a20-445a-4314-bac6-387c626a3771"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '2182738516',
  name: 'E2E Test Label 5',
  color: 'charcoal',
  order: 5,
  is_favorite: false
}



In/Out Message logged: 
severity:      info
msg:           {"id":"2182738508","name":"Final Validation Test","color":"red","order":9,"is_favorite":false}
gridTimestamp: 2026-01-12T09:06:53.606Z
id:            component
type:          data
portType:      out
port:          out
senderId:      50aec22c-eaaf-42a3-87ae-c30d1deb74e6
senderType:    appmixer.todoist.core.ListLabels
userId:        6964b9ada040b932e1fe36c3
componentType: appmixer.todoist.core.ListLabels
componentId:   50aec22c-eaaf-42a3-87ae-c30d1deb74e6
flowId:        ac114782-15f5-4a5e-9721-865293ed537a
flowName:      
correlationId: 759036d0-3e1b-402a-8dc9-5617ab5b642e
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-768f9a20-445a-4314-bac6-387c626a3771"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  id: '2182738508',
  name: 'Final Validation Test',
  color: 'red',
  order: 9,
  is_favorite: false
}



Component's receive method finished in: 211 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListLabels/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '6964b9b1fe0e3b32e9fcc3c2' }



Component's receive method finished in: 197 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 27. ListComments
```
appmixer test component src/appmixer/todoist/core/ListComments/ -i '{"in":{"taskId":"9907445074","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  'Project ID': undefined,
  'Posted At': undefined,
  Content: undefined,
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined,
  'File ID': undefined
}

Component's receive method finished in: 239 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListComments/ -i '{"in":{"projectId":"2365436060","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  'Project ID': undefined,
  'Posted At': undefined,
  Content: undefined,
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined,
  'File ID': undefined
}

Component's receive method finished in: 239 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListComments/ -i '{"in":{"projectId":"2365436060","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: '3947970002',
  'Task ID': null,
  'Project ID': '2365436060',
  'Posted At': '2026-01-12T08:02:37.769440Z',
  Content: 'Updated with schema validation',
  'Attachment File Name': undefined,
  'Attachment File Type': undefined,
  'Attachment File URL': undefined,
  'Attachment Resource Type': undefined,
  'File ID': undefined
}

Component's receive method finished in: 210 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListComments/ -i '{"in":{"projectId":"2365436060","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '3947970002',
  task_id: null,
  project_id: '2365436060',
  content: 'Updated with schema validation',
  posted_at: '2026-01-12T08:02:37.769440Z',
  posted_by_id: '57023438',
  updated_at: '2026-01-12T08:10:11.408907Z',
  attachment: null,
  upload_id: null,
  reactions: {},
  uids_to_notify: []
}



Component's receive method finished in: 242 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListComments/ -i '{"in":{"projectId":"2365436060","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: '3947970002',
  task_id: null,
  project_id: '2365436060',
  content: 'Updated with schema validation',
  posted_at: '2026-01-12T08:02:37.769440Z',
  posted_by_id: '57023438',
  updated_at: '2026-01-12T08:10:11.408907Z',
  attachment: null,
  upload_id: null,
  reactions: {},
  uids_to_notify: []
}



Component's receive method finished in: 266 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 28. ListReminders
```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: [
    {
      due: [Object],
      id: '2718367750',
      is_deleted: false,
      item_id: '9907602558',
      minute_offset: 0,
      notify_uid: '57023438',
      sync_id: null,
      type: 'relative',
      v2_id: '6fjhVmVwjfcjc8PF',
      v2_item_id: '6fjhVmRccPPh5wvF'
    }
  ],
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined,
  'File ID': undefined
}

Component's receive method finished in: 372 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2718367750',
  'Task ID': '9907602558',
  Type: 'relative',
  'Due String': '2026-01-13 10:00',
  'Due Date': '2026-01-13T10:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 0,
  'File ID': undefined
}

Component's receive method finished in: 360 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2718367750',
  'Task ID': '9907602558',
  Type: 'relative',
  'Due String': '2026-01-13 10:00',
  'Due Date': '2026-01-13T10:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 0,
  'File ID': undefined
}

Component's receive method finished in: 368 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined,
  'File ID': '6964ba10f30ff133b49d9e29'
}

Component's receive method finished in: 406 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: [
    {
      due: [Object],
      id: '2719292513',
      is_deleted: false,
      item_id: '9907602558',
      minute_offset: null,
      notify_uid: '57023438',
      sync_id: null,
      type: 'absolute',
      v2_id: '6fm9jMQX5HQ2P2PF',
      v2_item_id: '6fjhVmRccPPh5wvF'
    },
    {
      due: [Object],
      id: '2719292925',
      is_deleted: false,
      item_id: '9907602558',
      minute_offset: null,
      notify_uid: '57023438',
      sync_id: null,
      type: 'absolute',
      v2_id: '6fm9jgGW4Px6cXJF',
      v2_item_id: '6fjhVmRccPPh5wvF'
    },
    {
      due: [Object],
      id: '2719285968',
      is_deleted: false,
      item_id: '9916417347',
      minute_offset: 0,
      notify_uid: '57023438',
      sync_id: null,
      type: 'relative',
      v2_id: '6fm9cfw8QMVwW4XF',
      v2_item_id: '6fm9cfrMHCmVWhwF'
    }
  ],
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined,
  'File ID': undefined
}

Component's receive method finished in: 525 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2719292513',
  'Task ID': '9907602558',
  Type: 'absolute',
  'Due String': 'tomorrow at 3pm',
  'Due Date': '2026-01-15T15:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': null,
  'File ID': undefined
}

Component's receive method finished in: 1146 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2719292513',
  'Task ID': '9907602558',
  Type: 'absolute',
  'Due String': 'tomorrow at 3pm',
  'Due Date': '2026-01-15T15:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': null,
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"due":{"date":"2026-01-20T14:00:00","is_recurring":false,"lang":"en","string":"2026-01-20 14:00","timezone":null},"id":"2719292925","is_deleted":false,"item_id":"9907602558","minute_offset":null,"notify_uid":"57023438","sync_id":null,"type":"absolute","v2_id":"6fm9jgGW4Px6cXJF","v2_item_id":"6fjhVmRccPPh5wvF"}
gridTimestamp: 2026-01-14T12:42:58.271Z
id:            component
type:          data
portType:      out
port:          out
senderId:      ce8b48d3-f36d-42aa-9c14-dd20e8bd2530
senderType:    appmixer.todoist.core.ListReminders
userId:        69678f51443e45078db63471
componentType: appmixer.todoist.core.ListReminders
componentId:   ce8b48d3-f36d-42aa-9c14-dd20e8bd2530
flowId:        d5914b2b-ceeb-4f3d-88ad-d6f140534db2
flowName:      
correlationId: e5cdf797-bcb8-4ea3-a0af-9f73ab79b5d0
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-67aa03d2-3271-4884-a1f5-d06a74661f35"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:            2719292925
  number-item_id:       9907602558
  string-type:          absolute
  due: 
    date-string:     2026-01-20T13:00:00.000Z
    date-date:       2026-01-20T13:00:00.000Z
    string-timezone: null
  string-minute_offset: null

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2719292925',
  'Task ID': '9907602558',
  Type: 'absolute',
  'Due String': '2026-01-20 14:00',
  'Due Date': '2026-01-20T14:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': null,
  'File ID': undefined
}

In/Out Message logged: 
severity:      info
msg:           {"due":{"date":"2026-01-15T14:00:00","is_recurring":false,"lang":"en","string":"2026-01-15 14:00","timezone":null},"id":"2719285968","is_deleted":false,"item_id":"9916417347","minute_offset":0,"notify_uid":"57023438","sync_id":null,"type":"relative","v2_id":"6fm9cfw8QMVwW4XF","v2_item_id":"6fm9cfrMHCmVWhwF"}
gridTimestamp: 2026-01-14T12:42:58.272Z
id:            component
type:          data
portType:      out
port:          out
senderId:      ce8b48d3-f36d-42aa-9c14-dd20e8bd2530
senderType:    appmixer.todoist.core.ListReminders
userId:        69678f51443e45078db63471
componentType: appmixer.todoist.core.ListReminders
componentId:   ce8b48d3-f36d-42aa-9c14-dd20e8bd2530
flowId:        d5914b2b-ceeb-4f3d-88ad-d6f140534db2
flowName:      
correlationId: 6574c96a-20bf-4052-98dd-a45a0c3a6f8d
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-67aa03d2-3271-4884-a1f5-d06a74661f35"},"content":{"outputType":"object"},"scope":{}}]}
annotatedMsg: 
  number-id:            2719285968
  number-item_id:       9916417347
  string-type:          relative
  due: 
    date-string:     2026-01-15T13:00:00.000Z
    date-date:       2026-01-15T13:00:00.000Z
    string-timezone: null
  number-minute_offset: 0

Component has send a message to output port: out
{
  Records: undefined,
  ID: '2719285968',
  'Task ID': '9916417347',
  Type: 'relative',
  'Due String': '2026-01-15 14:00',
  'Due Date': '2026-01-15T14:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 0,
  'File ID': undefined
}

Component's receive method finished in: 614 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined,
  'File ID': '69678f581ae4b407963b055f'
}

Component's receive method finished in: 1122 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  records: [
    {
      due: {
        date: '2026-01-15T15:00:00',
        is_recurring: false,
        lang: 'en',
        string: 'tomorrow at 3pm',
        timezone: null
      },
      id: '2719292513',
      is_deleted: false,
      item_id: '9907602558',
      minute_offset: null,
      notify_uid: '57023438',
      sync_id: null,
      type: 'absolute',
      v2_id: '6fm9jMQX5HQ2P2PF',
      v2_item_id: '6fjhVmRccPPh5wvF'
    },
    {
      due: {
        date: '2026-01-20T14:00:00',
        is_recurring: false,
        lang: 'en',
        string: '2026-01-20 14:00',
        timezone: null
      },
      id: '2719292925',
      is_deleted: false,
      item_id: '9907602558',
      minute_offset: null,
      notify_uid: '57023438',
      sync_id: null,
      type: 'absolute',
      v2_id: '6fm9jgGW4Px6cXJF',
      v2_item_id: '6fjhVmRccPPh5wvF'
    },
    {
      due: {
        date: '2026-01-15T14:00:00',
        is_recurring: false,
        lang: 'en',
        string: '2026-01-15 14:00',
        timezone: null
      },
      id: '2719285968',
      is_deleted: false,
      item_id: '9916417347',
      minute_offset: 0,
      notify_uid: '57023438',
      sync_id: null,
      type: 'relative',
      v2_id: '6fm9cfw8QMVwW4XF',
      v2_item_id: '6fm9cfrMHCmVWhwF'
    }
  ]
}



Component's receive method finished in: 1025 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  due: {
    date: '2026-01-15T15:00:00',
    is_recurring: false,
    lang: 'en',
    string: 'tomorrow at 3pm',
    timezone: null
  },
  id: '2719292513',
  is_deleted: false,
  item_id: '9907602558',
  minute_offset: null,
  notify_uid: '57023438',
  sync_id: null,
  type: 'absolute',
  v2_id: '6fm9jMQX5HQ2P2PF',
  v2_item_id: '6fjhVmRccPPh5wvF'
}



Component's receive method finished in: 968 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  due: {
    date: '2026-01-15T15:00:00',
    is_recurring: false,
    lang: 'en',
    string: 'tomorrow at 3pm',
    timezone: null
  },
  id: '2719292513',
  is_deleted: false,
  item_id: '9907602558',
  minute_offset: null,
  notify_uid: '57023438',
  sync_id: null,
  type: 'absolute',
  v2_id: '6fm9jMQX5HQ2P2PF',
  v2_item_id: '6fjhVmRccPPh5wvF'
}



In/Out Message logged: 
severity:      info
msg:           {"due":{"date":"2026-01-20T14:00:00","is_recurring":false,"lang":"en","string":"2026-01-20 14:00","timezone":null},"id":"2719292925","is_deleted":false,"item_id":"9907602558","minute_offset":null,"notify_uid":"57023438","sync_id":null,"type":"absolute","v2_id":"6fm9jgGW4Px6cXJF","v2_item_id":"6fjhVmRccPPh5wvF"}
gridTimestamp: 2026-01-14T12:46:34.545Z
id:            component
type:          data
portType:      out
port:          out
senderId:      09e67cee-77db-415a-ba71-48a7942fb1db
senderType:    appmixer.todoist.core.ListReminders
userId:        69679029c5d09109346f5e9e
componentType: appmixer.todoist.core.ListReminders
componentId:   09e67cee-77db-415a-ba71-48a7942fb1db
flowId:        3cc6eb7f-2708-49aa-a446-01eb3eab66fa
flowName:      
correlationId: dfe96d92-94e7-4a0b-b6d6-cf955d46e203
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-20001203-e02f-43aa-bc36-4c4b1f41ba3a"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  due: {
    date: '2026-01-20T14:00:00',
    is_recurring: false,
    lang: 'en',
    string: '2026-01-20 14:00',
    timezone: null
  },
  id: '2719292925',
  is_deleted: false,
  item_id: '9907602558',
  minute_offset: null,
  notify_uid: '57023438',
  sync_id: null,
  type: 'absolute',
  v2_id: '6fm9jgGW4Px6cXJF',
  v2_item_id: '6fjhVmRccPPh5wvF'
}



In/Out Message logged: 
severity:      info
msg:           {"due":{"date":"2026-01-15T14:00:00","is_recurring":false,"lang":"en","string":"2026-01-15 14:00","timezone":null},"id":"2719285968","is_deleted":false,"item_id":"9916417347","minute_offset":0,"notify_uid":"57023438","sync_id":null,"type":"relative","v2_id":"6fm9cfw8QMVwW4XF","v2_item_id":"6fm9cfrMHCmVWhwF"}
gridTimestamp: 2026-01-14T12:46:34.545Z
id:            component
type:          data
portType:      out
port:          out
senderId:      09e67cee-77db-415a-ba71-48a7942fb1db
senderType:    appmixer.todoist.core.ListReminders
userId:        69679029c5d09109346f5e9e
componentType: appmixer.todoist.core.ListReminders
componentId:   09e67cee-77db-415a-ba71-48a7942fb1db
flowId:        3cc6eb7f-2708-49aa-a446-01eb3eab66fa
flowName:      
correlationId: 3458639b-8121-42a2-8514-e0f6f9f16666
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-20001203-e02f-43aa-bc36-4c4b1f41ba3a"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  due: {
    date: '2026-01-15T14:00:00',
    is_recurring: false,
    lang: 'en',
    string: '2026-01-15 14:00',
    timezone: null
  },
  id: '2719285968',
  is_deleted: false,
  item_id: '9916417347',
  minute_offset: 0,
  notify_uid: '57023438',
  sync_id: null,
  type: 'relative',
  v2_id: '6fm9cfw8QMVwW4XF',
  v2_item_id: '6fm9cfrMHCmVWhwF'
}



Component's receive method finished in: 1062 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ fileId: '6967902ee4d89d093b348f9a' }



Component's receive method finished in: 724 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 29. ListProjectsSelect
```
appmixer test component src/appmixer/todoist/core/ListProjectsSelect/
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListProjectsSelect
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/ListProjectsSelect/
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListProjectsSelect
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/ListProjectsSelect/ -p '{"variableFetch":true}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListProjectsSelect
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/ListProjectsSelect/ -p '{"variableFetch":true}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListProjectsSelect
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/ListProjectsSelect/
```
<details><summary>✅ output</summary>Component has send a message to output port: out
[
  {
    id: '2365436060',
    parent_id: null,
    order: 0,
    color: 'charcoal',
    name: 'Inbox',
    is_shared: false,
    is_favorite: false,
    is_inbox_project: true,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjh4Hc7PHw7Jgrm',
    view_style: 'list',
    description: '',
    comment_count: 1
  },
  {
    id: '2365437921',
    parent_id: null,
    order: 1,
    color: 'blue',
    name: 'E2E Test Project',
    is_shared: false,
    is_favorite: true,
    is_inbox_project: false,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjhFGrHMwMQPCRh',
    view_style: 'list',
    description: '',
    comment_count: 0
  },
  {
    id: '2365437925',
    parent_id: null,
    order: 2,
    color: 'red',
    name: 'E2E Test Project 2',
    is_shared: false,
    is_favorite: false,
    is_inbox_project: false,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjhFJ76CgFwXJG6',
    view_style: 'board',
    description: '',
    comment_count: 0
  },
  {
    id: '2365437940',
    parent_id: null,
    order: 3,
    color: 'green',
    name: 'E2E Test Project 3',
    is_shared: false,
    is_favorite: true,
    is_inbox_project: false,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjhFPFjQM2HPcP3',
    view_style: 'list',
    description: '',
    comment_count: 0
  },
  {
    id: '2365437950',
    parent_id: null,
    order: 4,
    color: 'violet',
    name: 'E2E Test Project Final',
    is_shared: false,
    is_favorite: false,
    is_inbox_project: false,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjhFQm5XCW6p535',
    view_style: 'board',
    description: '',
    comment_count: 0
  },
  {
    id: '2365437969',
    parent_id: null,
    order: 5,
    color: 'red',
    name: 'Another Updated Name',
    is_shared: false,
    is_favorite: true,
    is_inbox_project: false,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjhFW2gPFWP5mQV',
    view_style: 'list',
    description: '',
    comment_count: 0
  },
  {
    id: '2365438049',
    parent_id: null,
    order: 6,
    color: 'blue',
    name: 'E2E Test Project',
    is_shared: false,
    is_favorite: true,
    is_inbox_project: false,
    is_team_inbox: false,
    url: 'https://app.todoist.com/app/project/6fjhFrRCwj3xJcV7',
    view_style: 'list',
    description: '',
    comment_count: 0
  }
]



Component's receive method finished in: 375 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 30. ListSectionsSelect
```
appmixer test component src/appmixer/todoist/core/ListSectionsSelect/ -p '{"projectId":"2365437921"}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListSectionsSelect
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/ListSectionsSelect/ -p '{"projectId":"2365437921"}'
```
<details><summary>✅ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/ListSectionsSelect
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/todoist/core/ListSectionsSelect/ -i '{"in":{"projectId":"2365437921"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
[]



Component's receive method finished in: 230 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListSectionsSelect/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
[
  {
    id: '212068467',
    v2_id: '6fjhFWqRcQ26v8VV',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 1,
    name: 'Updated Section Name'
  },
  {
    id: '212068479',
    v2_id: '6fjhFc4pVrf9qJGV',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 2,
    name: 'Updated Section Name 2'
  },
  {
    id: '212068495',
    v2_id: '6fjhFcW237Vcqjx3',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 3,
    name: 'Updated Section Name 3'
  },
  {
    id: '212068530',
    v2_id: '6fjhFgGcVH2XVHw3',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 4,
    name: 'Updated Section Name 4'
  }
]



Component's receive method finished in: 238 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListSectionsSelect/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
[
  {
    id: '212068467',
    v2_id: '6fjhFWqRcQ26v8VV',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 1,
    name: 'Updated Section Name'
  },
  {
    id: '212068479',
    v2_id: '6fjhFc4pVrf9qJGV',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 2,
    name: 'Updated Section Name 2'
  },
  {
    id: '212068495',
    v2_id: '6fjhFcW237Vcqjx3',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 3,
    name: 'Updated Section Name 3'
  },
  {
    id: '212068530',
    v2_id: '6fjhFgGcVH2XVHw3',
    project_id: '2365437969',
    v2_project_id: '6fjhFW2gPFWP5mQV',
    order: 4,
    name: 'Updated Section Name 4'
  }
]



Component's receive method finished in: 326 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 31. DeleteComment
```
appmixer test component src/appmixer/todoist/core/DeleteComment/ -i '{"in":{"commentId":"3947969952"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 1212 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/DeleteComment/ -i '{"in":{"commentId":"3947970002"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 329 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 32. DeleteReminder
```
appmixer test component src/appmixer/todoist/core/CreateReminder/ -i '{"in":{"taskId":"9907454175","type":"relative","minuteOffset":30}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: undefined,
  'Task ID': undefined,
  Type: undefined,
  'Due String': undefined,
  'Due Date': undefined,
  'Due Datetime': undefined,
  'Due Timezone': undefined,
  'Minute Offset': undefined
}

Component's receive method finished in: 292 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2718367750',
  'Task ID': '9907602558',
  Type: 'relative',
  'Due String': '2026-01-13 10:00',
  'Due Date': '2026-01-13T10:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 0,
  'File ID': undefined
}

Component's receive method finished in: 317 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/DeleteReminder/ -i '{"in":{"reminderId":"2718367750"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 246 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2718367750',
  'Task ID': '9907602558',
  Type: 'relative',
  'Due String': '2026-01-13 10:00',
  'Due Date': '2026-01-13T10:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 0,
  'File ID': undefined
}

Component's receive method finished in: 367 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/todoist/core/ListReminders/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Records: undefined,
  ID: '2718367750',
  'Task ID': '9907602558',
  Type: 'relative',
  'Due String': '2026-01-13 10:00',
  'Due Date': '2026-01-13T10:00:00',
  'Due Datetime': undefined,
  'Due Timezone': null,
  'Minute Offset': 0,
  'File ID': undefined
}

Component's receive method finished in: 333 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 33. DeleteTask
```
appmixer test component src/appmixer/todoist/core/DeleteTask/ -i '{"in":{"taskId":"9907454175"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 504 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 34. DeleteSection
```
appmixer test component src/appmixer/todoist/core/DeleteSection/ -i '{"in":{"sectionId":"212068467"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 646 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 35. DeleteLabel
```
appmixer test component src/appmixer/todoist/core/DeleteLabel/ -i '{"in":{"labelId":"2182738508"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 483 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 36. ArchiveProject
```
appmixer test component src/appmixer/todoist/core/ArchiveProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 547 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 37. UnarchiveProject
```
appmixer test component src/appmixer/todoist/core/UnarchiveProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>❌ output</summary>
Testing /Users/vladimir/Projects/appmixer-connectors/src/appmixer/todoist/core/UnarchiveProject
https://api.appmixer.com

Validating properties.
{ path: '/Users/vladimir/.config/configstore/appmixer.json' }
program.url undefined
Using client ID (from local storage): 30d04a08e7434f8b8f3a454c806b4489
Using client secret (from local storage): df827dbc1ec8405ab292a3cbf0823f21
Using access token (from local storage): 34ac806ec2c61ced6d1d4caf5c3b02ef7ca0531a

Creating authentication module.

Setting access token.

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
      projectId: 2365437969
    scope: 

[ERROR]: Request failed with status code 400
At least one of name, description, color, is_favorite or view_style fields should be set
</details>

```
appmixer test component src/appmixer/todoist/core/UnarchiveProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 600 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 38. DeleteProject
```
appmixer test component src/appmixer/todoist/core/DeleteProject/ -i '{"in":{"projectId":"2365437969"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 441 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

