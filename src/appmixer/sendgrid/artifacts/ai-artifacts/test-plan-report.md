# Test Plan Report

## 1. CreateTemplate
```
appmixer test component src/appmixer/sendgrid/core/CreateTemplate/ -i '{"in":{"name":"Test Email Template","generation":"dynamic"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'd-b90d290d333c4259a5638a5ba922b602',
  Name: 'Test Email Template',
  Generation: 'dynamic',
  Versions: []
}

Component's receive method finished in: 324 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/CreateTemplate/ -i '{"in":{"name":"Legacy Email Template","generation":"legacy"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'bafbe210-7bdc-44d5-ab7f-9471cd1b94bd',
  Name: 'Legacy Email Template',
  Generation: 'legacy',
  Versions: []
}

Component's receive method finished in: 315 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 2. GetTemplate
```
appmixer test component src/appmixer/sendgrid/core/GetTemplate/ -i '{"in":{"template_id":"d-b90d290d333c4259a5638a5ba922b602"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'd-b90d290d333c4259a5638a5ba922b602',
  Name: 'Test Email Template',
  Generation: 'dynamic',
  Versions: []
}

Component's receive method finished in: 301 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/GetTemplate/ -i '{"in":{"template_id":"bafbe210-7bdc-44d5-ab7f-9471cd1b94bd"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'bafbe210-7bdc-44d5-ab7f-9471cd1b94bd',
  Name: 'Legacy Email Template',
  Generation: 'legacy',
  Versions: []
}

Component's receive method finished in: 564 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 3. ListTemplates
```
appmixer test component src/appmixer/sendgrid/core/ListTemplates/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      id: 'bafbe210-7bdc-44d5-ab7f-9471cd1b94bd',
      name: 'Legacy Email Template',
      generation: 'legacy',
      updated_at: '2025-11-18 14:48:32',
      versions: []
    }
  ],
  count: 1
}



Component's receive method finished in: 296 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListTemplates/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: 'bafbe210-7bdc-44d5-ab7f-9471cd1b94bd',
  name: 'Legacy Email Template',
  generation: 'legacy',
  updated_at: '2025-11-18 14:48:32',
  versions: [],
  index: 0,
  count: 1
}



Component's receive method finished in: 279 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListTemplates/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  id: 'bafbe210-7bdc-44d5-ab7f-9471cd1b94bd',
  name: 'Legacy Email Template',
  generation: 'legacy',
  updated_at: '2025-11-18 14:48:32',
  versions: [],
  index: 0,
  count: 1
}



Component's receive method finished in: 299 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListTemplates/ -i '{"in":{"outputType":"file"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\ListTemplates
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

[ERROR]: ENOENT: no such file or directory, open 'D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\ListTemplates\<SERVICE>-objects-export-f8afcde8-40b8-4675-a526-4e11d4c824ff.csv'
Error: ENOENT: no such file or directory, open 'D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\ListTemplates\<SERVICE>-objects-export-f8afcde8-40b8-4675-a526-4e11d4c824ff.csv'
    at Object.openSync (node:fs:560:18)
    at Object.writeFileSync (node:fs:2429:35)
    at actualCtx.saveFileStream (D:\Work\ClientIO\appmixer-cli\appmixer-test-component.js:462:40)
    at Object.sendArrayOutput (D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\lib.js:42:45)
    at Object.receive (D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\ListTemplates\ListTemplates.js:39:20)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'D:\\Work\\ClientIO\\appmixer-connectors\\src\\appmixer\\sendgrid\\core\\ListTemplates\\<SERVICE>-objects-export-f8afcde8-40b8-4675-a526-4e11d4c824ff.csv'
}
</details>

## 4. CreateorUpdateContact
```
appmixer test component src/appmixer/sendgrid/core/CreateorUpdateContact/ -i '{"in":{"email":"testcontact@example.com","first_name":"John","last_name":"Doe","address_line_1":"123 Main Street","city":"San Francisco","state_province_region":"CA","postal_code":"94105","country":"USA"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Job ID': 'a850e2b1-346f-4128-8a95-042bebbb6267' }

Component's receive method finished in: 724 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/CreateorUpdateContact/ -i '{"in":{"email":"minimal@example.com"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Job ID': '0fc8f573-fcb5-49c9-9bd5-0a2335c09f84' }

Component's receive method finished in: 632 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/CreateorUpdateContact/ -i '{"in":{"email":"customfields@example.com","first_name":"Jane","last_name":"Smith","custom_fields":{"e1_T":"Custom Value 1","e2_T":"Custom Value 2"}}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\CreateorUpdateContact
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
      email:         customfields@example.com
      first_name:    Jane
      last_name:     Smith
      custom_fields: 
        e1_T: Custom Value 1
        e2_T: Custom Value 2
    scope: 

[ERROR]: Request failed with status code 400
errors: 
  - 
    field:   contacts[0].custom_fields
    message: invalid custom field names or ID's supplied - e1_T,e2_T
</details>

```
appmixer test component src/appmixer/sendgrid/core/CreateorUpdateContact/ -i '{"in":{"email":"withlist@example.com","first_name":"Bob","last_name":"Johnson","list_ids":["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\CreateorUpdateContact
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
      email:      withlist@example.com
      first_name: Bob
      last_name:  Johnson
      list_ids: 
        - a1b2c3d4-e5f6-7890-abcd-ef1234567890
    scope: 

[ERROR]: Request failed with status code 400
errors: 
  - 
    field:   list_ids
    message: invalid list id 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
</details>

```
appmixer test component src/appmixer/sendgrid/core/CreateorUpdateContact/ -i '{"in":{"email":"update.test@example.com","first_name":"Alice","last_name":"Williams","address_line_1":"456 Oak Avenue","address_line_2":"Suite 200","city":"New York","state_province_region":"NY","postal_code":"10001","country":"United States"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Job ID': 'a2741e87-6f19-4d70-b554-360452d5c9cb' }

Component's receive method finished in: 449 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 5. GetContact
```
appmixer test component src/appmixer/sendgrid/core/GetContact/ -i '{"in":{"contact_id":"testcontact@example.com"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\GetContact
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
      contact_id: testcontact@example.com
    scope: 

[ERROR]: Request failed with status code 404

</details>

```
appmixer test component src/appmixer/sendgrid/core/GetContact/ -i '{"in":{"contact_id":"a850e2b1-346f-4128-8a95-042bebbb6267"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\GetContact
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
      contact_id: a850e2b1-346f-4128-8a95-042bebbb6267
    scope: 

[ERROR]: Request failed with status code 404

</details>

```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  address_line_1: '',
  address_line_2: '',
  alternate_emails: null,
  city: '',
  country: '',
  email: 'minimal@example.com',
  first_name: '',
  id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
  last_name: '',
  list_ids: [],
  postal_code: '',
  state_province_region: '',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:24Z',
  updated_at: '2025-11-18T14:50:54.186828001Z',
  index: 0,
  count: 2
}



Component's receive method finished in: 628 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/GetContact/ -i '{"in":{"contact_id":"fe5a2bed-b659-4c18-b60d-e94d1544b82d"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  ID: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
  Email: 'minimal@example.com',
  'First Name': '',
  'Last Name': '',
  'Created At': '2025-11-18T14:50:24Z',
  'Updated At': '2025-11-18T14:50:54Z',
  'Custom Fields': {},
  'List IDs': []
}

Component's receive method finished in: 328 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  address_line_1: '',
  address_line_2: '',
  alternate_emails: null,
  city: '',
  country: '',
  email: 'minimal@example.com',
  first_name: '',
  id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
  last_name: '',
  list_ids: [],
  postal_code: '',
  state_province_region: '',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:24Z',
  updated_at: '2025-11-18T14:50:54.186828001Z',
  index: 0,
  count: 3
}



In/Out Message logged: 
severity:      info
msg:           {"address_line_1":"123 Main Street","address_line_2":"","alternate_emails":null,"city":"San Francisco","country":"USA","email":"testcontact@example.com","first_name":"John","id":"d8eefb9b-96a4-40f9-9a94-ebfcf555891c","last_name":"Doe","list_ids":[],"postal_code":"94105","state_province_region":"CA","phone_number":"","whatsapp":"","line":"","facebook":"","unique_name":"","_metadata":{"self":"https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c"},"custom_fields":{},"created_at":"2025-11-18T14:50:19Z","updated_at":"2025-11-18T14:50:49.763607433Z","index":1,"count":3}
gridTimestamp: 2025-11-18T14:51:19.935Z
id:            component
type:          data
portType:      out
port:          out
senderId:      53725132-cde9-4fcc-9a27-1bd43d5e52e4
senderType:    appmixer.sendgrid.core.ListContacts
userId:        691c87e733d6ad4efc57760d
componentType: appmixer.sendgrid.core.ListContacts
componentId:   53725132-cde9-4fcc-9a27-1bd43d5e52e4
flowId:        1e1aed6b-f6a9-4be5-90bb-76fd0a0b3998
flowName:      
correlationId: 991d81f9-11fd-4f1e-ac6e-e06c480ab49e
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-60888d13-a2c1-4142-bad6-c90a94c7b884"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  address_line_1: '123 Main Street',
  address_line_2: '',
  alternate_emails: null,
  city: 'San Francisco',
  country: 'USA',
  email: 'testcontact@example.com',
  first_name: 'John',
  id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
  last_name: 'Doe',
  list_ids: [],
  postal_code: '94105',
  state_province_region: 'CA',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:19Z',
  updated_at: '2025-11-18T14:50:49.763607433Z',
  index: 1,
  count: 3
}



In/Out Message logged: 
severity:      info
msg:           {"address_line_1":"456 Oak Avenue","address_line_2":"Suite 200","alternate_emails":null,"city":"New York","country":"United States","email":"update.test@example.com","first_name":"Alice","id":"ff77ce18-686e-4102-980a-218133a361ea","last_name":"Williams","list_ids":[],"postal_code":"10001","state_province_region":"NY","phone_number":"","whatsapp":"","line":"","facebook":"","unique_name":"","_metadata":{"self":"https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea"},"custom_fields":{},"created_at":"2025-11-18T14:50:42Z","updated_at":"2025-11-18T14:51:12.847065022Z","index":2,"count":3}
gridTimestamp: 2025-11-18T14:51:19.935Z
id:            component
type:          data
portType:      out
port:          out
senderId:      53725132-cde9-4fcc-9a27-1bd43d5e52e4
senderType:    appmixer.sendgrid.core.ListContacts
userId:        691c87e733d6ad4efc57760d
componentType: appmixer.sendgrid.core.ListContacts
componentId:   53725132-cde9-4fcc-9a27-1bd43d5e52e4
flowId:        1e1aed6b-f6a9-4be5-90bb-76fd0a0b3998
flowName:      
correlationId: 5cc0c416-6fe0-4fb7-92e9-2cd6e658f994
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-60888d13-a2c1-4142-bad6-c90a94c7b884"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  address_line_1: '456 Oak Avenue',
  address_line_2: 'Suite 200',
  alternate_emails: null,
  city: 'New York',
  country: 'United States',
  email: 'update.test@example.com',
  first_name: 'Alice',
  id: 'ff77ce18-686e-4102-980a-218133a361ea',
  last_name: 'Williams',
  list_ids: [],
  postal_code: '10001',
  state_province_region: 'NY',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:42Z',
  updated_at: '2025-11-18T14:51:12.847065022Z',
  index: 2,
  count: 3
}



Component's receive method finished in: 487 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 6. ListContacts
```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      address_line_1: '',
      address_line_2: '',
      alternate_emails: null,
      city: '',
      country: '',
      email: 'minimal@example.com',
      first_name: '',
      id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
      last_name: '',
      list_ids: [],
      postal_code: '',
      state_province_region: '',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:24Z',
      updated_at: '2025-11-18T14:50:54.186828001Z'
    },
    {
      address_line_1: '123 Main Street',
      address_line_2: '',
      alternate_emails: null,
      city: 'San Francisco',
      country: 'USA',
      email: 'testcontact@example.com',
      first_name: 'John',
      id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
      last_name: 'Doe',
      list_ids: [],
      postal_code: '94105',
      state_province_region: 'CA',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:19Z',
      updated_at: '2025-11-18T14:50:49.763607433Z'
    },
    {
      address_line_1: '456 Oak Avenue',
      address_line_2: 'Suite 200',
      alternate_emails: null,
      city: 'New York',
      country: 'United States',
      email: 'update.test@example.com',
      first_name: 'Alice',
      id: 'ff77ce18-686e-4102-980a-218133a361ea',
      last_name: 'Williams',
      list_ids: [],
      postal_code: '10001',
      state_province_region: 'NY',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:42Z',
      updated_at: '2025-11-18T14:51:12.847065022Z'
    }
  ],
  count: 3
}



Component's receive method finished in: 503 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{"outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  address_line_1: '',
  address_line_2: '',
  alternate_emails: null,
  city: '',
  country: '',
  email: 'minimal@example.com',
  first_name: '',
  id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
  last_name: '',
  list_ids: [],
  postal_code: '',
  state_province_region: '',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:24Z',
  updated_at: '2025-11-18T14:50:54.186828001Z',
  index: 0,
  count: 3
}



Component's receive method finished in: 650 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{"outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  address_line_1: '',
  address_line_2: '',
  alternate_emails: null,
  city: '',
  country: '',
  email: 'minimal@example.com',
  first_name: '',
  id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
  last_name: '',
  list_ids: [],
  postal_code: '',
  state_province_region: '',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:24Z',
  updated_at: '2025-11-18T14:50:54.186828001Z',
  index: 0,
  count: 3
}



In/Out Message logged: 
severity:      info
msg:           {"address_line_1":"123 Main Street","address_line_2":"","alternate_emails":null,"city":"San Francisco","country":"USA","email":"testcontact@example.com","first_name":"John","id":"d8eefb9b-96a4-40f9-9a94-ebfcf555891c","last_name":"Doe","list_ids":[],"postal_code":"94105","state_province_region":"CA","phone_number":"","whatsapp":"","line":"","facebook":"","unique_name":"","_metadata":{"self":"https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c"},"custom_fields":{},"created_at":"2025-11-18T14:50:19Z","updated_at":"2025-11-18T14:50:49.763607433Z","index":1,"count":3}
gridTimestamp: 2025-11-18T14:51:40.270Z
id:            component
type:          data
portType:      out
port:          out
senderId:      2a44a658-53f7-44db-a7e2-f964ba74207b
senderType:    appmixer.sendgrid.core.ListContacts
userId:        691c87fb58de484b4837e5ed
componentType: appmixer.sendgrid.core.ListContacts
componentId:   2a44a658-53f7-44db-a7e2-f964ba74207b
flowId:        1865f554-4087-4551-b29b-e95e1a857fbe
flowName:      
correlationId: 7248218d-c89d-4038-b017-0d0097355599
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-cb40ed02-3006-42de-a99c-2d9b3f3d6918"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  address_line_1: '123 Main Street',
  address_line_2: '',
  alternate_emails: null,
  city: 'San Francisco',
  country: 'USA',
  email: 'testcontact@example.com',
  first_name: 'John',
  id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
  last_name: 'Doe',
  list_ids: [],
  postal_code: '94105',
  state_province_region: 'CA',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:19Z',
  updated_at: '2025-11-18T14:50:49.763607433Z',
  index: 1,
  count: 3
}



In/Out Message logged: 
severity:      info
msg:           {"address_line_1":"456 Oak Avenue","address_line_2":"Suite 200","alternate_emails":null,"city":"New York","country":"United States","email":"update.test@example.com","first_name":"Alice","id":"ff77ce18-686e-4102-980a-218133a361ea","last_name":"Williams","list_ids":[],"postal_code":"10001","state_province_region":"NY","phone_number":"","whatsapp":"","line":"","facebook":"","unique_name":"","_metadata":{"self":"https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea"},"custom_fields":{},"created_at":"2025-11-18T14:50:42Z","updated_at":"2025-11-18T14:51:12.847065022Z","index":2,"count":3}
gridTimestamp: 2025-11-18T14:51:40.271Z
id:            component
type:          data
portType:      out
port:          out
senderId:      2a44a658-53f7-44db-a7e2-f964ba74207b
senderType:    appmixer.sendgrid.core.ListContacts
userId:        691c87fb58de484b4837e5ed
componentType: appmixer.sendgrid.core.ListContacts
componentId:   2a44a658-53f7-44db-a7e2-f964ba74207b
flowId:        1865f554-4087-4551-b29b-e95e1a857fbe
flowName:      
correlationId: 1c11405f-71c3-4094-b7cf-d9b32ac7dc40
inputMessages: {"in":[{"properties":{"correlationId":null,"gridInstanceId":null,"contentType":"application/json","contentEncoding":"utf8","sender":null,"destination":null,"correlationInPort":null,"componentHeaders":{},"signal":false,"flowId":null,"quotaId":"qs-cb40ed02-3006-42de-a99c-2d9b3f3d6918"},"content":{"outputType":"object"},"scope":{}}]}

Component has send a message to output port: out
{
  address_line_1: '456 Oak Avenue',
  address_line_2: 'Suite 200',
  alternate_emails: null,
  city: 'New York',
  country: 'United States',
  email: 'update.test@example.com',
  first_name: 'Alice',
  id: 'ff77ce18-686e-4102-980a-218133a361ea',
  last_name: 'Williams',
  list_ids: [],
  postal_code: '10001',
  state_province_region: 'NY',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea'
  },
  custom_fields: {},
  created_at: '2025-11-18T14:50:42Z',
  updated_at: '2025-11-18T14:51:12.847065022Z',
  index: 2,
  count: 3
}



Component's receive method finished in: 628 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{"query":"email = '\''minimal@example.com'\''","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      address_line_1: '',
      address_line_2: '',
      alternate_emails: null,
      city: '',
      country: '',
      email: 'minimal@example.com',
      first_name: '',
      id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
      last_name: '',
      list_ids: [],
      postal_code: '',
      state_province_region: '',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:24Z',
      updated_at: '2025-11-18T14:50:54.186828001Z'
    },
    {
      address_line_1: '123 Main Street',
      address_line_2: '',
      alternate_emails: null,
      city: 'San Francisco',
      country: 'USA',
      email: 'testcontact@example.com',
      first_name: 'John',
      id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
      last_name: 'Doe',
      list_ids: [],
      postal_code: '94105',
      state_province_region: 'CA',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:19Z',
      updated_at: '2025-11-18T14:50:49.763607433Z'
    },
    {
      address_line_1: '456 Oak Avenue',
      address_line_2: 'Suite 200',
      alternate_emails: null,
      city: 'New York',
      country: 'United States',
      email: 'update.test@example.com',
      first_name: 'Alice',
      id: 'ff77ce18-686e-4102-980a-218133a361ea',
      last_name: 'Williams',
      list_ids: [],
      postal_code: '10001',
      state_province_region: 'NY',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:42Z',
      updated_at: '2025-11-18T14:51:12.847065022Z'
    }
  ],
  count: 3
}



Component's receive method finished in: 664 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/ListContacts/ -i '{"in":{}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      address_line_1: '',
      address_line_2: '',
      alternate_emails: null,
      city: '',
      country: '',
      email: 'minimal@example.com',
      first_name: '',
      id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
      last_name: '',
      list_ids: [],
      postal_code: '',
      state_province_region: '',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:24Z',
      updated_at: '2025-11-18T14:50:54.186828001Z'
    },
    {
      address_line_1: '123 Main Street',
      address_line_2: '',
      alternate_emails: null,
      city: 'San Francisco',
      country: 'USA',
      email: 'testcontact@example.com',
      first_name: 'John',
      id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
      last_name: 'Doe',
      list_ids: [],
      postal_code: '94105',
      state_province_region: 'CA',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:19Z',
      updated_at: '2025-11-18T14:50:49.763607433Z'
    },
    {
      address_line_1: '456 Oak Avenue',
      address_line_2: 'Suite 200',
      alternate_emails: null,
      city: 'New York',
      country: 'United States',
      email: 'update.test@example.com',
      first_name: 'Alice',
      id: 'ff77ce18-686e-4102-980a-218133a361ea',
      last_name: 'Williams',
      list_ids: [],
      postal_code: '10001',
      state_province_region: 'NY',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contact/ff77ce18-686e-4102-980a-218133a361ea'
      },
      custom_fields: {},
      created_at: '2025-11-18T14:50:42Z',
      updated_at: '2025-11-18T14:51:12.847065022Z'
    }
  ],
  count: 3
}



Component's receive method finished in: 572 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 7. SearchContacts
```
appmixer test component src/appmixer/sendgrid/core/SearchContacts/ -i '{"in":{"query":"email LIKE \\"*@example.com\\"","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ result: [], count: 0 }



Component's receive method finished in: 1638 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/SearchContacts/ -i '{"in":{"query":"email = \\"minimal@example.com\\"","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      address_line_1: '',
      address_line_2: '',
      alternate_emails: [],
      city: '',
      country: '',
      email: 'minimal@example.com',
      first_name: '',
      id: 'fe5a2bed-b659-4c18-b60d-e94d1544b82d',
      last_name: '',
      list_ids: [],
      postal_code: '',
      segment_ids: null,
      state_province_region: '',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      custom_fields: {},
      created_at: '2025-11-18T14:50:24Z',
      updated_at: '2025-11-18T14:50:54Z',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contacts/fe5a2bed-b659-4c18-b60d-e94d1544b82d'
      }
    }
  ],
  count: 1
}



Component's receive method finished in: 399 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/SearchContacts/ -i '{"in":{"query":"email = \\"testcontact@example.com\\"","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  address_line_1: '123 Main Street',
  address_line_2: '',
  alternate_emails: [],
  city: 'San Francisco',
  country: 'USA',
  email: 'testcontact@example.com',
  first_name: 'John',
  id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
  last_name: 'Doe',
  list_ids: [],
  postal_code: '94105',
  segment_ids: null,
  state_province_region: 'CA',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  custom_fields: {},
  created_at: '2025-11-18T14:50:19Z',
  updated_at: '2025-11-18T14:50:49Z',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contacts/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
  },
  index: 0,
  count: 1
}



Component's receive method finished in: 518 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/SearchContacts/ -i '{"in":{"query":"first_name = \\"John\\"","outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  address_line_1: '123 Main Street',
  address_line_2: '',
  alternate_emails: null,
  city: 'San Francisco',
  country: 'USA',
  email: 'testcontact@example.com',
  first_name: 'John',
  id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
  last_name: 'Doe',
  list_ids: [],
  postal_code: '94105',
  segment_ids: null,
  state_province_region: 'CA',
  phone_number: '',
  whatsapp: '',
  line: '',
  facebook: '',
  unique_name: '',
  custom_fields: null,
  created_at: '2025-11-18 14:50:19 +0000 UTC',
  updated_at: '2025-11-18 14:50:49 +0000 UTC',
  _metadata: {
    self: 'https://api.sendgrid.com/v3/marketing/contacts/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
  },
  index: 0,
  count: 1
}



Component's receive method finished in: 1462 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/SearchContacts/ -i '{"in":{"query":"first_name = \\"John\\" AND last_name = \\"Doe\\"","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      address_line_1: '123 Main Street',
      address_line_2: '',
      alternate_emails: null,
      city: 'San Francisco',
      country: 'USA',
      email: 'testcontact@example.com',
      first_name: 'John',
      id: 'd8eefb9b-96a4-40f9-9a94-ebfcf555891c',
      last_name: 'Doe',
      list_ids: [],
      postal_code: '94105',
      segment_ids: null,
      state_province_region: 'CA',
      phone_number: '',
      whatsapp: '',
      line: '',
      facebook: '',
      unique_name: '',
      custom_fields: null,
      created_at: '2025-11-18 14:50:19 +0000 UTC',
      updated_at: '2025-11-18 14:50:49 +0000 UTC',
      _metadata: {
        self: 'https://api.sendgrid.com/v3/marketing/contacts/d8eefb9b-96a4-40f9-9a94-ebfcf555891c'
      }
    }
  ],
  count: 1
}



Component's receive method finished in: 1266 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 8. SendEmail
```
appmixer test component src/appmixer/sendgrid/core/SendEmail/ -i '{"in":{"fromEmail":"noreply@appmixer.com","toEmail":"test@example.com","subject":"Test Email","contentType":"text/plain","contentValue":"This is a test email from Appmixer."}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\SendEmail
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
      fromEmail:    noreply@appmixer.com
      toEmail:      test@example.com
      subject:      Test Email
      contentType:  text/plain
      contentValue: This is a test email from Appmixer.
    scope: 

[ERROR]: Request failed with status code 401
errors: 
  - 
    message: The provided authorization grant is invalid, expired, or revoked
    field:   null
    help:    null
</details>

```
appmixer test component src/appmixer/sendgrid/core/SendEmail/ -i '{"in":{"fromEmail":"noreply@appmixer.com","toEmail":"test@example.com","subject":"Test Email","contentType":"text/plain","contentValue":"This is a test email from Appmixer."}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\SendEmail
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
      fromEmail:    noreply@appmixer.com
      toEmail:      test@example.com
      subject:      Test Email
      contentType:  text/plain
      contentValue: This is a test email from Appmixer.
    scope: 

[ERROR]: Request failed with status code 403
errors: 
  - 
    message: The from address does not match a verified Sender Identity. Mail cannot be sent until this error is resolved. Visit https://sendgrid.com/docs/for-developers/sending-email/sender-identity/ to see the Sender Identity requirements
    field:   from
    help:    null
</details>

```
appmixer test component src/appmixer/sendgrid/core/SendEmail/ -i '{"in":{"fromEmail":"noreply@appmixer.com","toEmail":"test@example.com","subject":"Test Email","contentType":"text/plain","contentValue":"This is a test email from Appmixer.","sandboxModeEnable":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ Success: true }

Component's receive method finished in: 83 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/SendEmail/ -i '{"in":{"fromEmail":"noreply@appmixer.com","fromName":"Appmixer","toEmail":"test@example.com","toName":"Test User","subject":"HTML Email Test","contentType":"text/html","contentValue":"<h1>Hello Test User!</h1><p>This is an HTML email from Appmixer.</p>","sandboxModeEnable":true}}'
```
<details><summary>❌ output</summary></details>

```
appmixer test component src/appmixer/sendgrid/core/SendEmail/ -i '{"in":{"fromEmail":"noreply@appmixer.com","fromName":"Appmixer","toEmail":"test@example.com","toName":"Test User","ccEmail":"cc@example.com","ccName":"CC User","bccEmail":"bcc@example.com","subject":"Email with CC and BCC","contentType":"text/plain","contentValue":"This email has CC and BCC recipients.","sandboxModeEnable":true}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ Success: true }

Component's receive method finished in: 88 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 9. DeleteContacts
```
appmixer test component src/appmixer/sendgrid/core/DeleteContacts/ -i '{"in":{"ids":["fe5a2bed-b659-4c18-b60d-e94d1544b82d","d8eefb9b-96a4-40f9-9a94-ebfcf555891c"]}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\DeleteContacts
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
      ids: 
        - fe5a2bed-b659-4c18-b60d-e94d1544b82d
        - d8eefb9b-96a4-40f9-9a94-ebfcf555891c
    scope: 

[ERROR]: Request failed with status code 400
message:   either 'ids' OR 'delete_all_contacts' should be supplied as query param
parameter: ids/delete_all_contacts
</details>

```
appmixer test component src/appmixer/sendgrid/core/DeleteContacts/ -i '{"in":{"ids":["fe5a2bed-b659-4c18-b60d-e94d1544b82d","d8eefb9b-96a4-40f9-9a94-ebfcf555891c"]}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\sendgrid\core\DeleteContacts
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
      ids: 
        - fe5a2bed-b659-4c18-b60d-e94d1544b82d
        - d8eefb9b-96a4-40f9-9a94-ebfcf555891c
    scope: 

[ERROR]: Request failed with status code 400
message:   either 'ids' OR 'delete_all_contacts' should be supplied as query param
parameter: ids/delete_all_contacts
</details>

```
appmixer test component src/appmixer/sendgrid/core/DeleteContacts/ -i '{"in":{"ids":["fe5a2bed-b659-4c18-b60d-e94d1544b82d","d8eefb9b-96a4-40f9-9a94-ebfcf555891c"]}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Job Id': 'cf5e5d2f-cbbf-4577-9aec-102a70f220f2' }

Component's receive method finished in: 515 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/DeleteContacts/ -i '{"in":{"ids":["ff77ce18-686e-4102-980a-218133a361ea"]}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Job Id': '7f0cd1bf-11bd-4eb9-8434-c5e3494259d3' }

Component's receive method finished in: 607 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/DeleteContacts/ -i '{"in":{"ids":["fe5a2bed-b659-4c18-b60d-e94d1544b82d","d8eefb9b-96a4-40f9-9a94-ebfcf555891c","ff77ce18-686e-4102-980a-218133a361ea"]}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{ 'Job Id': '08133a1d-dd9e-4e8a-905f-4a7ffd8b4990' }

Component's receive method finished in: 419 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 10. DeleteTemplate
```
appmixer test component src/appmixer/sendgrid/core/DeleteTemplate/ -i '{"in":{"template_id":"d-b90d290d333c4259a5638a5ba922b602"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 321 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/sendgrid/core/DeleteTemplate/ -i '{"in":{"template_id":"bafbe210-7bdc-44d5-ab7f-9471cd1b94bd"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{}



Component's receive method finished in: 267 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

