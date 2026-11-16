# Piloterr connector

This connector calls the [Piloterr](https://www.piloterr.com) API at `https://api.piloterr.com`. Fetch the HTML of any public web page, with JavaScript rendering or anti-bot unblocking, call any of the 300+ Piloterr endpoints, and read your credit usage.

Get an API key at [app.piloterr.com](https://app.piloterr.com) and enter it in the connector authentication field. The key is sent in the `x-api-key` header. The connector validates it with `GET /v2/usage`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Get Website HTML | `GET /v2/website/{engine}` | Fetch the HTML of a public web page with Piloterr. Choose the crawler (plain HTTP), rendering (headless browser for JavaScript pages) or web unlocker (anti-bot protection) engine. |
| Get Usage | `GET /v2/usage` | Get the credit usage of the connected Piloterr account: credits used and remaining, and the renewal date. |
| Make API Call | Any path on `https://api.piloterr.com` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use Piloterr credits on your account ([pricing](https://www.piloterr.com/pricing)).
- Piloterr allows 7 to 15 requests per second depending on the plan. The connector quota queues requests at 300 per minute per user.

## Tests

`artifacts/test/piloterr.test.js` has unit tests with the network mocked. The end-to-end flows in `artifacts/test-flows/` run against the live API and need an account with credits:

- `test-flow-piloterr-website-html.json`: Get Website HTML with the crawler engine (HTML output) and with the rendering engine and Save HTML as File (the file is loaded, checked and removed).
- `test-flow-piloterr-usage-api-call.json`: Get Usage, and Make API Call with a request header and with a query parameter.

A run uses one crawler request, one rendering request and one more crawler request through Make API Call.
