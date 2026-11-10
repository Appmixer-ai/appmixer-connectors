# ChartQuery connector

This connector calls the [ChartQuery](https://www.chartquery.com) API at `https://api.chartquery.com`. Render Chart.js charts from a config or a plain-language prompt, QR codes and barcodes, and get a public link to each image.

Get an API key at [app.chartquery.com](https://app.chartquery.com) and enter it in the connector authentication field. The key is sent in the `x-api-key` header. The connector validates it with `GET /v1/usage`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Create Chart | `GET /v1/chart` | Render a Chart.js v4 chart from its JSON config and return a public link to the image. |
| Create Chart From Prompt | `GET /v1/chart/ai` | Describe a chart in plain English, optionally with raw data as CSV or JSON. ChartQuery builds the chart and returns a public link to the image. |
| Create QR Code | `GET /v1/qrcode` | Generate a QR code and return a public link to the image. |
| Create Barcode | `GET /v1/barcode` | Generate a barcode and return a public link to the image. |
| Get Usage | `GET /v1/usage` | Get the credit usage of the connected ChartQuery account: credits used and remaining, and the renewal date. |
| Make API Call | Any path on `https://api.chartquery.com` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use ChartQuery credits on your account ([pricing](https://www.chartquery.com/pricing)).
- ChartQuery renders images on demand. The connector quota queues requests at 300 per minute per user.

## Tests

`artifacts/test/chartquery.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-chartquery.json` is an end-to-end flow that runs the main components against the live API.
