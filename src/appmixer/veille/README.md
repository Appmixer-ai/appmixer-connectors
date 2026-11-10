# Veille connector

This connector calls the [Veille](https://www.veille.io) API at `https://api.veille.io`. Check emails, domains, IP addresses and phone numbers, and validate VAT numbers and IBANs, to block fake sign-ups and fraud.

Get an API key at [app.veille.io](https://app.veille.io) and enter it in the connector authentication field. The key is sent in the `x-api-key` header. The connector validates it with `GET /v1/usage`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Check Email | `GET /v1/intelligence/email` | Check an email address: MX and SPF/DMARC records, disposable or temporary provider, role account, alias, typo suggestion and a 0-100 risk score. |
| Check Domain | `GET /v1/intelligence/domain` | Check a domain: MX records and mail provider, disposable or temporary domain, and risk signals. |
| Check IP Address | `GET /v1/intelligence/ip` | Check an IP address: country, network owner, and whether it is a VPN, proxy, Tor exit node or data center. |
| Check Phone Number | `GET /v1/intelligence/phone` | Check a phone number: validity, country, line type, carrier and risk score. |
| Validate VAT Number | `GET /v1/vat` | Validate a European VAT number and return the registered company name and address. |
| Validate IBAN | `GET /v1/vat/iban` | Validate an IBAN and return its country, bank and BIC. |
| Get Usage | `GET /v1/usage` | Get the credit usage of the connected Veille account: credits used and remaining, and the renewal date. |
| Make API Call | Any path on `https://api.veille.io` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use Veille credits on your account ([pricing](https://www.veille.io/pricing)).
- Veille answers in milliseconds. The connector quota queues requests at 600 per minute per user.

## Tests

`artifacts/test/veille.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-veille.json` is an end-to-end flow that runs the main components against the live API.
