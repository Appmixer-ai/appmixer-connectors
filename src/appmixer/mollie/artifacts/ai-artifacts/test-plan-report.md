# Test Plan Report

## 1. CreateCustomer
```
appmixer test component src/appmixer/mollie/core/CreateCustomer/ -i '{"name":"John Doe","email":"john.doe@example.com","locale":"en_US"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreateCustomer
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
appmixer test component src/appmixer/mollie/core/CreateCustomer/ -i '{"in":{"name":"John Doe","email":"john.doe@example.com","locale":"en_US"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreateCustomer
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
appmixer test component src/appmixer/mollie/core/CreateCustomer/ -i '{"name":"John Doe","email":"john.doe@example.com","locale":"en_US"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreateCustomer
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
appmixer test component src/appmixer/mollie/core/CreateCustomer/ -i '{"name":"Test Customer GetCustomer","email":"testcustomer.getcustomer@example.com","locale":"en_US"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreateCustomer
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
appmixer test component src/appmixer/mollie/core/GetCustomer/ -i '{"customerId":"cst_4qqhO89gsT"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/GetCustomer
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
appmixer test component src/appmixer/mollie/core/GetCustomer/ -p '{"customerId":"cst_4qqhO89gsT"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/GetCustomer
https://api.appmixer.com

Validating properties.
{ path: '/Users/sayamnasir/.config/configstore/appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

[ERROR]:  Invalid input object: {"customerId":"cst_4qqhO89gsT"}.
Stack trace:
TypeError: Invalid input object: {"customerId":"cst_4qqhO89gsT"}.
    at assertImpl (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261217)
    at assertPredicate (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:261081)
    at assertImpl.object (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:6:260973)
    at Transformer.applyModifiers (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:227520)
    at DevComponent.onConfig (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/index.js:92:287270)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Command.<anonymous> (/Users/sayamnasir/Documents/GitHub/appmixer-cli/appmixer-test-component.js:552:13)
</details>

## 3. ListCustomers
```
appmixer test component src/appmixer/mollie/core/ListCustomers/ -i '{"outputType":"array"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListCustomers
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
appmixer test component src/appmixer/mollie/core/ListCustomers/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListCustomers
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

## 5. GetPayment
```
appmixer test component src/appmixer/mollie/core/GetPayment/ -i '{"paymentId":"tr_7UhSN1zuXS"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/GetPayment
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

## 6. ListPayments
```
appmixer test component src/appmixer/mollie/core/ListPayments/ -i '{"outputType":"array"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListPayments
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
appmixer test component src/appmixer/mollie/core/ListPayments/ -i '{"in":{"outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListPayments
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

## 7. CreatePaymentRefund
```
appmixer test component src/appmixer/mollie/core/CreatePaymentRefund/ -i '{"paymentId":"tr_7UhSN1zuXS","amount_value":"5.00","amount_currency":"EUR","description":"Test refund"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreatePaymentRefund
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
appmixer test component src/appmixer/mollie/core/CreatePaymentRefund/ -i '{"in":{"paymentId":"tr_7UhSN1zuXS","amount_value":"5.00","amount_currency":"EUR","description":"Test refund"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreatePaymentRefund
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

## 8. MakeAPICall
```
appmixer test component src/appmixer/mollie/core/MakeAPICall/ -i '{"method":"GET","path":"/v2/organizations/me"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/MakeAPICall
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
appmixer test component src/appmixer/mollie/core/MakeAPICall/ -i '{"in":{"method":"GET","path":"/v2/organizations/me"}}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/MakeAPICall
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

