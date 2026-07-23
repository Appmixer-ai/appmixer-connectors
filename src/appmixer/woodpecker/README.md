# Woodpecker Connector

Woodpecker.co is a cold-email and sales-outreach platform. The connector authenticates
with an API key and covers campaigns, prospects, mailboxes and real-time outreach events
(webhook triggers via the connector plugin).

## Authentication — where to find your API key

Woodpecker uses API-key authentication only (no OAuth2). The key is sent in the
`x-api-key` header on every request.

1. Log in at [app.woodpecker.co](https://app.woodpecker.co).
2. In the top-right corner open **Add-ons** (Marketplace).
3. Go to **API & INTEGRATIONS → API keys**.
4. Click the green **CREATE A KEY** button and copy the generated key
   (use the copy icon; you can label each key with the integration it belongs to).
5. Paste the key into the connector's **API Key** field in Appmixer.

Notes:

- API keys are part of the **"API Key and Integrations"** add-on — included during the
  trial, a paid add-on on regular plans. If you don't see the API keys view, the add-on
  is not active on your account.
- You can create multiple keys; revoke a key in the same view to cut off an integration.
- Credentials are validated against `GET /v1/me`.

Official guide: [Generating API Key](https://woodpecker.co/help-center/en/articles/5223172-generating-api-key)
