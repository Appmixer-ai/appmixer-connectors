# Asin connector

This connector calls the [Asin](https://www.asin.dev) API at `https://www.asin.dev`. Search Amazon stores, and read a product's price history and offers.

Get an API key at [www.asin.dev/app](https://www.asin.dev/app) and enter it in the connector authentication field. The key is sent in a `Bearer` token in the `Authorization` header. The connector validates it with `GET /api/v1/account`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Search Amazon | `GET /api/v1/search` | Search an Amazon store and return products with their ASIN, title, price, rating and review count. |
| Get Price History | `GET /api/v1/history` | Get the price history Asin has recorded for a product: lowest, highest and average price, and the dated price points. Empty when Asin has no history for the product yet. |
| Get Offers | `GET /api/v1/offers` | Get the offers Asin has already collected for a product: Amazon's price, the lowest new and used prices, and each seller's offer. |
| Get Account | `GET /api/v1/account` | Get the connected Asin account: plan, remaining credits, renewal date and tracked products. |
| Make API Call | Any path on `https://www.asin.dev` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use Asin credits on your account ([pricing](https://www.asin.dev/pricing)).
- Asin reads Amazon data through its own tracking. The connector quota queues requests at 120 per minute per user.

## Tests

`artifacts/test/asin.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-asin.json` is an end-to-end flow that runs the main components against the live API.
