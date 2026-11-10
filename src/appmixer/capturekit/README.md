# CaptureKit connector

This connector calls the [CaptureKit](https://www.capturekit.dev) API at `https://api.capturekit.dev`. Get any web page as Markdown with its metadata and links, and read your credit usage.

Get an API key at [app.capturekit.dev](https://app.capturekit.dev) and enter it in the connector authentication field. The key is sent in the `x-api-key` header. The connector validates it with `GET /v1/usage`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Get Page Content | `GET /v1/content` | Render a web page with CaptureKit and return its content as Markdown, with its title, description and links. |
| Get Usage | `GET /v1/usage` | Get the credit usage of the connected CaptureKit account: credits used and remaining, and the renewal date. |
| Make API Call | Any path on `https://api.capturekit.dev` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use CaptureKit credits on your account ([pricing](https://www.capturekit.dev/pricing)).
- CaptureKit renders each page in a browser. The connector quota queues requests at 120 per minute per user.

## Tests

`artifacts/test/capturekit.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-capturekit.json` is an end-to-end flow that runs the main components against the live API.
