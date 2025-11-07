# Test Plan Report

## 1. CreateCustomer
```
appmixer test component src/appmixer/mollie/core/CreateCustomer/ -i '{"name":"John Doe","email":"john.doe@example.com","locale":"en_US","testmode":true}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreateCustomer

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 2. GetCustomer
```
appmixer test component src/appmixer/mollie/core/GetCustomer/ -i '{"customerId":"cst_8wmqcHMN4U"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/GetCustomer

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 3. ListCustomers
```
appmixer test component src/appmixer/mollie/core/ListCustomers/ -i '{"testmode":true,"outputType":"array"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListCustomers

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 4. UpdateCustomer
```
appmixer test component src/appmixer/mollie/core/UpdateCustomer/ -i '{"customerId":"cst_8wmqcHMN4U","name":"Jane Doe Updated","email":"jane.doe.updated@example.com","locale":"nl_NL","testmode":true}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/UpdateCustomer

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 5. CreateMandate
```
appmixer test component src/appmixer/mollie/core/CreateMandate/ -i '{"customerId":"cst_8wmqcHMN4U","method":"directdebit","consumerName":"John Doe","consumerAccount":"NL91ABNA0417164300","consumerBic":"ABNANL2A","signatureDate":"2024-01-15","mandateReference":"mandate-ref-001","testmode":true}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreateMandate

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 6. GetMandate
```
appmixer test component src/appmixer/mollie/core/GetMandate/ -i '{"customerId":"cst_8wmqcHMN4U","mandateId":"mdt_test001"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/GetMandate

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 7. ListMandates
```
appmixer test component src/appmixer/mollie/core/ListMandates/ -i '{"customerId":"cst_8wmqcHMN4U","testmode":true,"outputType":"array"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListMandates

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 8. RevokeMandate
```
appmixer test component src/appmixer/mollie/core/RevokeMandate/ -i '{"customerId":"cst_8wmqcHMN4U","mandateId":"mdt_test001","testmode":true}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/RevokeMandate

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 9. CreatePayment
```
appmixer test component src/appmixer/mollie/core/CreatePayment/ -i '{"amount":"10.00","currency":"EUR","description":"Test Payment","redirectUrl":"https://example.com/return","method":"ideal","testmode":true}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreatePayment

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 10. GetPayment
```
appmixer test component src/appmixer/mollie/core/GetPayment/ -i '{"paymentId":"tr_WDqYK6vllg"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/GetPayment

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 11. ListPayments
```
appmixer test component src/appmixer/mollie/core/ListPayments/ -i '{"testmode":true,"outputType":"array"}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/ListPayments

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

## 12. CreatePaymentRefund
```
appmixer test component src/appmixer/mollie/core/CreatePaymentRefund/ -i '{"paymentId":"tr_WDqYK6vllg","amount":{"currency":"EUR","value":"5.00"},"description":"Test refund","testmode":true}'
```
<details><summary>❌ output</summary>
Testing /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mollie/core/CreatePaymentRefund

[ERROR]:  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

Stack trace:
Error: <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style type="text/css">
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.66666667;
        font-size: 16px;
        color: #333;
        background-color: #fff;
        margin: 2em 1em;
      }
      h1 {
        font-size: 28px;
        font-weight: 400;
      }
      p {
        margin: 0 0 10px;
      }
      .alert.alert-info {
        background-color: #F0F0F0;
        margin-top: 30px;
        padding: 30px;
      }
      .alert p {
        padding-left: 35px;
      }
      ul {
        padding-left: 51px;
        position: relative;
      }
      li {
        font-size: 14px;
        margin-bottom: 1em;
      }
      p.info {
        position: relative;
        font-size: 20px;
      }
      p.info:before, p.info:after {
        content: "";
        left: 0;
        position: absolute;
        top: 0;
      }
      p.info:before {
        background: #0066CC;
        border-radius: 16px;
        color: #fff;
        content: "i";
        font: bold 16px/24px serif;
        height: 24px;
        left: 0px;
        text-align: center;
        top: 4px;
        width: 24px;
      }

      @media (min-width: 768px) {
        body {
          margin: 6em;
        }
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Application is not available</h1>
      <p>The application is currently not serving requests at this endpoint. It may not have been started or is still starting.</p>

      <div class="alert alert-info">
        <p class="info">
          Possible reasons you are seeing this page:
        </p>
        <ul>
          <li>
            <strong>The host doesn't exist.</strong>
            Make sure the hostname was typed correctly and that a route matching this hostname exists.
          </li>
          <li>
            <strong>The host exists, but doesn't have a matching path.</strong>
            Check if the URL path was typed correctly and that the route was created using the desired path.
          </li>
          <li>
            <strong>Route and path matches, but all pods are down.</strong>
            Make sure that the resources exposed by this route (pods, services, deployment configs, etc) have at least one pod running.
          </li>
        </ul>
      </div>
    </div>
  </body>
</html>

    at maybeWrapAsError (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:120051)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:74089
    at safeCallback (/Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:261)
    at /Users/sayamnasir/Documents/GitHub/appmixer-cli/dist/lib/index.js:1:4126
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
</details>

