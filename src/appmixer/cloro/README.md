# cloro connector

This connector calls the [cloro](https://cloro.dev?utm_source=appmixer&utm_medium=byok) API at `https://api.cloro.dev`. cloro loads the live page of a search engine or AI assistant for a query or prompt and a country, and returns the result as JSON.

Get an API key at [dashboard.cloro.dev](https://dashboard.cloro.dev?utm_source=appmixer&utm_medium=byok) and enter it in the connector authentication field. The connector validates the key with `GET /v1/credits`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Find Google Results | `POST /v1/monitor/google` | The organic results of the first results page: position, title, link, displayed link, snippet and date. Results that have no resolved link are skipped. |
| Get AI Answer | `POST /v1/monitor/aimode`, `/v1/monitor/bing/aimode`, `/v1/monitor/chatgpt` or `/v1/monitor/gemini` | The answer of Google AI Mode, Bing AI Mode, ChatGPT or Gemini as text and markdown, with the cited sources. |
| Get Credits | `GET /v1/credits` | The remaining credits, the credits per cycle and the date the cycle resets. |
| Make API Call | Any path on `https://api.cloro.dev` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each monitor request uses cloro credits on your account. The [API reference](https://cloro.dev/docs?utm_source=appmixer&utm_medium=byok) lists the credits for each endpoint.
- Bing AI Mode accepts prompts of up to 3,500 characters after URL encoding. Non-Latin scripts allow fewer characters. The component refuses a longer prompt before it sends the request.
- Your plan sets how many monitor requests can run at the same time. A request sent while all slots are busy gets a `429` (`CONCURRENCY_LIMIT_EXCEEDED`). The connector quota queues requests at 60 per minute per user.

## Tests

`artifacts/test/cloro.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-search-answer-credits.json` is an end-to-end flow that runs every component against the live API.
