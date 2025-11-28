# Test Plan Report

## 1. CreateCustomer
```
appmixer test component src/appmixer/paddle/core/CreateCustomer/ -i '{"in":{"email":"testcustomer@example.com","name":"Test Customer","locale":"en","marketingConsent":true,"addressLine1":"123 Main Street","addressCity":"San Francisco","addressPostalCode":"94105","addressCountryCode":"US"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/CreateCustomer/ -i '{"in":{"email":"testcustomer@example.com","name":"Test Customer","locale":"en","marketingConsent":true,"addressLine1":"123 Main Street","addressCity":"San Francisco","addressPostalCode":"94105","addressCountryCode":"US","metadata":{}}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/CreateCustomer/ -i '{"in":{"email":"testcustomer@example.com"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 2. GetCustomer
```
appmixer test component src/appmixer/paddle/core/GetCustomer/ -i '{"in":{"customerId":"cus_test123"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/GetCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/GetCustomer/ -i '{"in":{"customerId":"cus_01arjg6e43a1gr8dgh5gsgm9a4"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/GetCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 3. UpdateCustomer
```
appmixer test component src/appmixer/paddle/core/UpdateCustomer/ -i '{"in":{"customerId":"cus_01arjg6e43a1gr8dgh5gsgm9a4","email":"updated@example.com","name":"Updated Customer Name"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/UpdateCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 4. FindCustomers
```
appmixer test component src/appmixer/paddle/core/FindCustomers/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindCustomers
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 5. CreateProduct
```
appmixer test component src/appmixer/paddle/core/CreateProduct/ -i '{"in":{"name":"Test Product","description":"A test product for validation","taxCategory":"standard","metadata":{}}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateProduct
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 6. GetProduct
```
appmixer test component src/appmixer/paddle/core/GetProduct/ -i '{"in":{"product_id":"pro_01arjg6e43a1gr8dgh5gsgm9a4"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/GetProduct
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 7. UpdateProduct
```
appmixer test component src/appmixer/paddle/core/UpdateProduct/ -i '{"in":{"product_id":"pro_01arjg6e43a1gr8dgh5gsgm9a4","name":"Updated Product Name","description":"Updated product description","status":"active"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/UpdateProduct
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 8. FindProducts
```
appmixer test component src/appmixer/paddle/core/FindProducts/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindProducts
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/FindProducts/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindProducts
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/FindProducts/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindProducts
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 9. CreateTransaction
```
appmixer test component src/appmixer/paddle/core/CreateTransaction/ -i '{"in":{"customer_id":"cus_01arjg6e43a1gr8dgh5gsgm9a4","price_id":"pri_01arjg6e43a1gr8dgh5gsgm9a4","quantity":1,"currency_code":"USD","metadata":{}}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/CreateTransaction/ -i '{"in":{"customer_id":"cus_01arjg6e43a1gr8dgh5gsgm9a4","price_id":"pri_01arjg6e43a1gr8dgh5gsgm9a4","quantity":1,"currency_code":"USD"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/CreateTransaction/ -i '{"in":{"customer_id":"cus_01arjg6e43a1gr8dgh5gsgm9a4","price_id":"pri_01arjg6e43a1gr8dgh5gsgm9a4","quantity":1,"currency_code":"USD"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/CreateTransaction/ -i '{"in":{"customer_id":"cus_01arjg6e43a1gr8dgh5gsgm9a4","price_id":"pri_01arjg6e43a1gr8dgh5gsgm9a4","quantity":1,"currency_code":"USD"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/CreateTransaction/ -i '{"in":{"customer_id":"cus_01arjg6e43a1gr8dgh5gsgm9a4","price_id":"pri_01arjg6e43a1gr8dgh5gsgm9a4","quantity":1,"currency_code":"USD"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/CreateTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 10. GetTransaction
```
appmixer test component src/appmixer/paddle/core/GetTransaction/ -i '{"in":{"transaction_id":"txn_01arjg6e43a1gr8dgh5gsgm9a4"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/GetTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 11. UpdateTransaction
```
appmixer test component src/appmixer/paddle/core/UpdateTransaction/ -i '{"in":{"transaction_id":"txn_01arjg6e43a1gr8dgh5gsgm9a4","metadata":{"order_id":"12345","customer_ref":"CUST-001"},"status":"completed"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/UpdateTransaction
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

## 12. FindTransactions
```
appmixer test component src/appmixer/paddle/core/FindTransactions/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindTransactions
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/FindTransactions/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindTransactions
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/FindTransactions/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindTransactions
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

```
appmixer test component src/appmixer/paddle/core/FindTransactions/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/paddle/core/FindTransactions
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

[ERROR]: Invalid messages object.
TypeError: Invalid messages object.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Object.createDefaultInputObjects (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:361032)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:595:44
    at tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Object.gotValue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:166:18)
    at Object.gotAccum (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/reduce.js:155:25)
    at Object.tryCatcher (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:547:31)
    at Promise._settlePromise (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:604:18)
    at Promise._settlePromiseCtx (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/promise.js:641:10)
    at _drainQueueStep (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:97:12)
    at _drainQueue (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:86:9)
    at Async._drainQueues (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:102:5)
    at Async.drainQueues [as _onImmediate] (/Users/sayamnasir/Documents/GitHub/appmixer-cli/node_modules/bluebird/js/release/async.js:15:14)
    at process.processImmediate (node:internal/timers:505:21)
</details>

