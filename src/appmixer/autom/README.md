# Autom connector

This connector calls the [Autom](https://www.autom.dev) API at `https://api.autom.dev`. Run live Google searches and Google News searches for a query, country and language, and read your credit usage.

Get an API key at [app.autom.dev](https://app.autom.dev) and enter it in the connector authentication field. The key is sent in the `x-api-key` header. The connector validates it with `GET /v1/usage`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Search Google | `GET /v1/google/search` | Run a live Google search with Autom and return the organic results of the first results page. |
| Search Google News | `GET /v1/google/news` | Search Google News with Autom and return the articles of the first results page. |
| Get Usage | `GET /v1/usage` | Get the credit usage of the connected Autom account: credits used and remaining, and the renewal date. |
| Make API Call | Any path on `https://api.autom.dev` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use Autom credits on your account ([pricing](https://www.autom.dev/pricing)).
- Autom allows up to 50 requests per second on the smallest plan. The connector quota queues requests at 600 per minute per user.

## Tests

`artifacts/test/autom.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-autom.json` is an end-to-end flow that runs the main components against the live API.
