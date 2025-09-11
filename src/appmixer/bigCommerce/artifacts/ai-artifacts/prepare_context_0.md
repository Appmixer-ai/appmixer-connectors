# BigCommerce Connector — Context and Plan

File path: appmixer-connectors/src/appmixer/bigCommerce/context.md

## Overview
This document defines the initial scope, authentication strategy, and the essential components (actions and triggers) for the Appmixer BigCommerce connector. It follows Appmixer component standards, emphasizing Find components for ID discoverability and robust webhook-based triggers when available.

- Target service: BigCommerce
- API docs: https://developer.bigcommerce.com/api-docs
- Base API URL: https://api.bigcommerce.com/stores/{store_hash}/
- API versions used:
  - Products: v3 (Catalog)
  - Customers: v3
  - Orders: v2 (primary order listing and details)
  - Webhooks: v3

Notes:
- Find components must return a maximum of one page of results without pagination. We will use the maximum page sizes supported by BigCommerce for these endpoints (generally up to 250 items per request for list/find endpoints where supported) and clearly document these limits in the component descriptions.
- For any action that requires an ID, a corresponding Find component is included to surface IDs in prior workflow steps.

## Authentication
Preferred method: OAuth 2.0 (Authorization Code) for installed apps. This is the most secure and scalable option for multi-store usage.

BigCommerce also supports server-to-server API Accounts (API token). We document both; however, OAuth2 is the default for this connector.

### OAuth 2.0 (Recommended)
- Overview: https://developer.bigcommerce.com/api-docs/getting-started/authentication
- Scopes reference: https://developer.bigcommerce.com/api-docs/getting-started/authentication/oauth-scopes
- Webhooks overview: https://developer.bigcommerce.com/api-docs/store-management/webhooks/overview

Key concepts:
- You register an app in the BigCommerce Developer Portal to receive a Client ID and Client Secret and set your Redirect URL.
- During connection, the user authorizes your app. You exchange an authorization code for an access token and receive the store context (stores/{store_hash}).
- Use the returned access_token in API requests.

Endpoints involved in OAuth:
- Authorization URL: https://login.bigcommerce.com/oauth2/authorize
- Token URL: https://login.bigcommerce.com/oauth2/token

High-level steps to obtain OAuth credentials and connect:
1. Create a BigCommerce developer account and register an app:
   - Go to https://developer.bigcommerce.com and sign in.
   - Create a new App. Configure:
     - App name, description, icon.
     - Redirect URL (must match your Appmixer OAuth redirect endpoint).
     - Scopes (see Recommended Scopes below).
   - Retrieve Client ID and Client Secret.
2. In Appmixer, configure the BigCommerce connector’s OAuth settings:
   - Client ID
   - Client Secret
   - Redirect URL (the same as configured in the app settings)
3. During user connection:
   - Redirect the user to the Authorization URL with parameters:
     - client_id
     - scope (space-delimited list)
     - redirect_uri
     - response_type=code
     - state (recommended)
   - After consent/installation, exchange the code for tokens (POST to token URL) with JSON body including:
     - client_id
     - client_secret
     - code
     - scope
     - grant_type=authorization_code
     - redirect_uri
     - context (provided by BigCommerce; contains stores/{store_hash})
   - Store:
     - access_token (use as X-Auth-Token)
     - context (extract store_hash)
     - optionally user/owner identifiers returned
4. Use the access token for API calls:
   - Headers (typical):
     - X-Auth-Token: {access_token}
     - X-Auth-Client: {client_id}
     - Accept: application/json
     - Content-Type: application/json

Recommended scopes (choose the minimum required for our planned features; consult the scopes reference for exact names and read/write variants):
- Products: read/write
- Customers: read/write
- Orders: read (we only read orders in initial scope)
- Webhooks: manage webhooks (required for webhook triggers)

Note: Scope identifiers and available read-only/write variants are documented in the official scopes reference. Ensure the selected scopes cover Catalog (Products), Customers, Orders (read), and Webhooks management.

### API Account (API Token) — Alternative (if OAuth is not feasible)
- Overview: https://developer.bigcommerce.com/api-docs/getting-started/authentication#api-accounts
- Use when integrating with a single store under your control.

How to obtain an API account (token):
1. In the BigCommerce store control panel, go to: Settings → API → API Accounts.
2. Create API Account → choose a name and select required permissions (read/write as needed for Products, Customers, Orders; Webhooks if needed).
3. After creation, you’ll receive:
   - Access Token
   - Client ID
   - (Also an API Path showing your store hash)
4. Use headers on requests:
   - X-Auth-Token: {access_token}
   - X-Auth-Client: {client_id}

Note: While API Accounts are secure for server-to-server access on a single store, OAuth is preferred for multi-tenant/user connections and for managing webhooks programmatically.

## Component Plan
Max 10 actions and max 3 triggers are included below. All components adhere to Appmixer standards (Find components with outputType and notFound port; no pagination beyond the first page; IDs retrievable via corresponding Find components).

### Actions (10)
1) FindProducts (Find)
- Purpose: Search products by common filters; return matching products.
- API: GET /v3/catalog/products
- Max records returned: up to 250 (maximum supported page size) in one call.
- Filters (examples): name (contains), sku, id list, is_visible, date_modified range.
- Output: Supports outputType (first, array, object, file). Has notFound port when zero matches.
- Notes: Use fields/parameters supported by v3 product list filters; ignore pagination beyond first page.
- Link: https://developer.bigcommerce.com/api-reference/store-management/catalog/products/getproducts

2) GetProduct (Get)
- Purpose: Retrieve a single product by productId.
- API: GET /v3/catalog/products/{product_id}
- Input: productId (string/number).
- Output: Single product object; throw error if not found.
- Requires ID? Yes. Obtainable via FindProducts.
- Link: https://developer.bigcommerce.com/api-reference/store-management/catalog/products/getproductbyid

3) CreateProduct (Create)
- Purpose: Create a new product.
- API: POST /v3/catalog/products
- Input (common fields): name, type (physical/digital), price, sku, weight, categories, description, is_visible.
- Output: Created product object (including id).
- Link: https://developer.bigcommerce.com/api-reference/store-management/catalog/products/createproduct

4) UpdateProduct (Update)
- Purpose: Update an existing product by productId.
- API: PUT/PATCH /v3/catalog/products/{product_id}
- Input: productId + fields to update (e.g., name, price, is_visible, etc.).
- Output: Empty object or updated entity as appropriate; follows Appmixer "Update" pattern (generally no payload on success), but may return updated entity if useful.
- Requires ID? Yes. Obtain via FindProducts.
- Link: https://developer.bigcommerce.com/api-reference/store-management/catalog/products/updateproduct

5) DeleteProduct (Delete)
- Purpose: Delete a product by productId.
- API: DELETE /v3/catalog/products/{product_id}
- Input: productId.
- Output: Empty object on success.
- Requires ID? Yes. Obtain via FindProducts.
- Link: https://developer.bigcommerce.com/api-reference/store-management/catalog/products/deleteproduct

6) FindCustomers (Find)
- Purpose: Search customers by common filters; return matching customers.
- API: GET /v3/customers
- Max records returned: up to 250 per request.
- Filters (examples): email, name (first/last), id list, date_created range.
- Output: Supports outputType; has notFound port.
- Link: https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/getcustomers

7) GetCustomer (Get)
- Purpose: Retrieve a single customer by customerId.
- API: GET /v3/customers/{customer_id}
- Input: customerId.
- Output: Single customer object; throw error if not found.
- Requires ID? Yes. Obtain via FindCustomers.
- Link: https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/getacustomer

8) CreateCustomer (Create)
- Purpose: Create a new customer.
- API: POST /v3/customers
- Input (common fields): email, first_name, last_name, phone; optionally addresses and company.
- Output: Created customer object(s) including id(s).
- Link: https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/createcustomers

9) UpdateCustomer (Update)
- Purpose: Update an existing customer by customerId.
- API: PUT/PATCH /v3/customers/{customer_id}
- Input: customerId + fields to update (e.g., email, first_name, last_name, phone).
- Output: Empty object on success (or updated entity if preferred); follows Update pattern.
- Requires ID? Yes. Obtain via FindCustomers.
- Link: https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/updateacustomer

10) FindOrders (Find)
- Purpose: Search orders and return matches.
- API: GET /v2/orders
- Max records returned: up to 250 per request.
- Filters (examples): status_id, min_date_created, max_date_created, customer_id, email, min_total, max_total.
- Output: Supports outputType; has notFound port.
- Link: https://developer.bigcommerce.com/api-reference/store-management/orders/orders/getorders

Component relationships to satisfy ID principle:
- Get/Update/Delete Product consume productId — supplied by FindProducts.
- Get/Update Customer consume customerId — supplied by FindCustomers.
- Order-related IDs can be obtained from FindOrders for downstream steps.

### Triggers (3)
All triggers will prefer webhooks and fall back to polling when webhook creation is not possible. Webhooks are created via: POST /v3/hooks

1) NewOrder (Trigger)
- Event: store/order/created
- Behavior: Fires when a new order is created. On webhook delivery, fetch full order details as needed and emit the event payload.
- Webhook docs: https://developer.bigcommerce.com/api-docs/store-management/webhooks/overview
- Related API for details: GET /v2/orders/{order_id}

2) OrderStatusChanged (Trigger)
- Event: store/order/statusUpdated
- Behavior: Fires when an order’s status changes. Can include previous/new status in payload; fetch full order if necessary.
- Related API: GET /v2/orders/{order_id}

3) ProductCreated (Trigger)
- Event: store/product/created
- Behavior: Fires when a new product is created.
- Related API: GET /v3/catalog/products/{product_id}

Webhook management:
- On trigger activation: create webhook(s) scoped to the selected event for the store (requires webhook scope).
- On deactivation: delete created webhook(s).
- Security: validate webhook signatures if provided and verify origin per BigCommerce guidance.

Polling fallback (if webhooks not available):
- Store last seen timestamp/ID in state.
- On each tick, query recent items (orders/products) filtered by date_created/date_modified; emit new/changed items.

## Implementation Notes
- Max page size:
  - Products (v3): up to 250 per request.
  - Customers (v3): up to 250 per request.
  - Orders (v2): up to 250 per request.
  Specify these maxima in descriptions; ignore pagination beyond first page per Find/List standards.
- OutputType support in Find components: first, array, object, file; include notFound port.
- Headers: X-Auth-Token and X-Auth-Client; Accept/Content-Type application/json.
- Rate limits: Respect rate-limiting headers (e.g., X-Rate-Limit-Requests-Left, X-Rate-Limit-Time-Reset-MS). Implement retries/backoff in the runtime as needed.
- Store Hash: Extract from OAuth token response context (stores/{store_hash}) or from the API Path shown in API accounts.
- IDs vs Codes: Some filters support exact/partial matches; ensure we document which filters are exact vs substring where applicable and rely on the BigCommerce API behavior.

## References
- API Docs Home: https://developer.bigcommerce.com/api-docs
- Authentication (OAuth): https://developer.bigcommerce.com/api-docs/getting-started/authentication
- OAuth Scopes: https://developer.bigcommerce.com/api-docs/getting-started/authentication/oauth-scopes
- Webhooks: https://developer.bigcommerce.com/api-docs/store-management/webhooks/overview
- Products (v3): https://developer.bigcommerce.com/api-reference/store-management/catalog/products/getproducts
- Customers (v3): https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/getcustomers
- Orders (v2): https://developer.bigcommerce.com/api-reference/store-management/orders/orders/getorders
