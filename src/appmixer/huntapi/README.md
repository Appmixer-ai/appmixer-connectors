# HuntAPI connector

This connector calls the [HuntAPI](https://www.huntapi.com) API at `https://api.huntapi.com`. Read the metadata of public videos (YouTube, TikTok, Instagram, Vimeo, X and more), start video or audio downloads and follow the download jobs.

Get an API key at [app.huntapi.com](https://app.huntapi.com) and enter it in the connector authentication field. The key is sent in the `x-api-key` header. The connector validates it with `GET /v1/usage`, which uses no credits.

## Components

| Component | Endpoint | Output |
| -- | -- | -- |
| Get Media Metadata | `GET /v1/media/metadata` | Get the metadata of a public video or audio URL: title, channel, duration, views, likes, upload date, thumbnail and formats. |
| Start Video Download | `GET /v1/video/download` | Start downloading a public video. Returns a job ID: use Get Download Job until the job completes to get the download link. |
| Start Audio Download | `GET /v1/audio/download` | Start extracting the audio of a public media URL. Returns a job ID: use Get Download Job until the job completes to get the download link. |
| Get Download Job | `GET /v1/jobs/{jobId}` | Get the status, progress and result of a HuntAPI download job. |
| Get Usage | `GET /v1/usage` | Get the credit usage of the connected HuntAPI account: credits used and remaining, and the renewal date. |
| Make API Call | Any path on `https://api.huntapi.com` | The status code, headers and body. Other hosts are refused, so the key is not sent elsewhere. |

## Limits

- Each request can use HuntAPI credits on your account ([pricing](https://www.huntapi.com/pricing)).
- HuntAPI downloads run as background jobs. The connector quota queues requests at 120 per minute per user.

## Tests

`artifacts/test/huntapi.test.js` has unit tests with the network mocked. `artifacts/test-flows/test-flow-huntapi.json` is an end-to-end flow that runs the main components against the live API.
