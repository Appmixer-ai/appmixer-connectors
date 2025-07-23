# Lemon Squeezy Connector - Context and Research

## Service Overview

Lemon Squeezy is a digital product platform that helps creators sell digital products, courses, and subscriptions. As your merchant of record, they handle the tax compliance burden so you can focus on more revenue and less headache. The platform includes payment processing, checkout flows, customer management, analytics, and subscription management.

Key features:
- Digital product sales and SaaS software subscriptions
- Merchant of record services (handles payments, merchant fees, fraud and sales tax)
- Global payment acceptance from 135+ countries
- 20+ payment methods support
- License key management
- Subscription management with dunning
- Email marketing features

## API Documentation

**Base URL:** `https://api.lemonsqueezy.com/v1/`
**Documentation:** https://docs.lemonsqueezy.com/api

The Lemon Squeezy API is a REST API that has predictable resource-oriented URLs, returns valid JSON:API encoded responses and uses standard HTTP response codes, authentication, and verbs.

### API Features
- JSON:API specification compliant
- Rate limiting: 300 API calls per minute
- Page-based pagination for all "list" endpoints
- Filtering support using query parameters
- Related resource inclusion using include parameter
- Test mode support for development

## Authentication Method

**Type:** API Key Authentication (Bearer Token)

The Lemon Squeezy API uses API keys to authenticate requests. You can view and manage your API keys in your Lemon Squeezy account settings.

### How to obtain API Key:
1. Navigate to Settings » API in your Lemon Squeezy dashboard
2. Create a new API key and give it a clear name
3. Copy the API key and save it somewhere safe (you'll only see this key once)

### Authentication Usage:
API keys can be created in both live and test modes:
- Live mode - Use this API key in your production application
- Test mode - Use this API key in your development and testing environments

**Required Headers:**
- `Authorization: Bearer {api_key}`
- `Accept: application/vnd.api+json`
- `Content-Type: application/vnd.api+json`

**API Key Validity:** Generated API keys are valid for a year.

## Available API Endpoints and Components

Based on the API documentation research, the following components should be implemented:

### 1. **ListStores** - List all stores
- **Description:** Returns a paginated list of Store objects ordered by name field in ascending order
- **Endpoint:** `GET /v1/stores`
- **Use case:** Get store information, required for filtering other resources

### 2. **ListProducts** - List all products
- **Description:** Returns a paginated list of Product objects ordered by name field in ascending order
- **Endpoint:** `GET /v1/products`
- **Filters:** store_id
- **Use case:** Retrieve product catalog for management and sales

### 3. **GetProduct** - Get single product
- **Description:** Retrieve detailed information about a specific product
- **Endpoint:** `GET /v1/products/{id}`
- **Use case:** Get detailed product information including relationships

### 4. **ListVariants** - List all product variants
- **Description:** Returns a paginated list of Variant objects ordered by the sort field
- **Endpoint:** `GET /v1/variants`
- **Filters:** product_id, status
- **Use case:** Essential for subscription plan management and variant data storage

### 5. **ListCustomers** - List all customers
- **Description:** Retrieve customer information from the store
- **Endpoint:** `GET /v1/customers`
- **Use case:** Customer management and relationship tracking

### 6. **GetCustomer** - Get single customer
- **Description:** A customer object represents a customer of your store. It is created when they purchase a product for the first time.
- **Endpoint:** `GET /v1/customers/{id}`
- **Use case:** Detailed customer information and analytics

### 7. **ListOrders** - List all orders
- **Description:** Returns a paginated list of Order objects. An order is created when a customer purchases a product.
- **Endpoint:** `GET /v1/orders`
- **Filters:** user_email, store_id, customer_id
- **Use case:** Order management and sales tracking

### 8. **GetOrder** - Get single order
- **Description:** An order belongs to a Store, is associated with a Customer and can have many Order Items, Subscriptions, License Keys and Discount Redemptions.
- **Endpoint:** `GET /v1/orders/{id}`
- **Use case:** Detailed order information and processing

### 9. **ListSubscriptions** - List all subscriptions
- **Description:** A subscription is created when a subscription product is purchased. Bills the customer on a recurring basis.
- **Endpoint:** `GET /v1/subscriptions`
- **Filters:** store_id, customer_id, order_id, product_id, variant_id, status
- **Use case:** Subscription management and monitoring

### 10. **GetSubscription** - Get single subscription
- **Description:** Retrieve detailed subscription information including billing details
- **Endpoint:** `GET /v1/subscriptions/{id}`
- **Use case:** Individual subscription management and customer portal URLs

### 11. **UpdateSubscription** - Update subscription
- **Description:** Manage subscription modifications including plan changes, cancellation, pausing, and billing anchor updates
- **Endpoint:** `PATCH /v1/subscriptions/{id}`
- **Use case:** Change subscription plans, cancel, pause, resume subscriptions, and update billing cycles

### 12. **CancelSubscription** - Cancel subscription
- **Description:** Cancel a subscription (enters grace period until next renewal date)
- **Endpoint:** `DELETE /v1/subscriptions/{id}`
- **Use case:** Subscription cancellation management

### 13. **NewOrder** - Webhook trigger for new orders
- **Description:** Trigger component that fires when a new order is created
- **Use case:** Real-time order processing and notifications

### 14. **NewSubscription** - Webhook trigger for new subscriptions
- **Description:** Trigger component that fires when a new subscription is created
- **Use case:** Automated subscription onboarding and processing

### 15. **SubscriptionUpdated** - Webhook trigger for subscription updates
- **Description:** Trigger component that fires when subscription status changes
- **Use case:** Real-time subscription status monitoring and customer communication

## Priority Implementation Order

**Phase 1 (Core Management):**
1. ListStores
2. ListProducts
3. ListCustomers
4. ListOrders
5. ListSubscriptions

**Phase 2 (Individual Resource Access):**
6. GetProduct
7. GetCustomer
8. GetOrder
9. GetSubscription

**Phase 3 (Management Actions):**
10. UpdateSubscription
11. CancelSubscription

**Phase 4 (Real-time Events):**
12. NewOrder (webhook)
13. NewSubscription (webhook)
14. SubscriptionUpdated (webhook)

## Common Use Cases

1. **E-commerce Management:** Product and order management for digital stores
2. **Subscription Business:** SaaS subscription lifecycle management
3. **Customer Analytics:** Customer behavior and revenue tracking
4. **Automated Workflows:** Order fulfillment and subscription management automation
5. **Marketing Automation:** Customer segmentation and targeted communications
6. **Revenue Operations:** Financial reporting and subscription metrics

## Additional Notes

- Webhooks are available for real-time event notifications
- Customer portal URLs are available for self-service subscription management
- API supports including related resources to reduce multiple requests
- Test mode allows full API integration testing without affecting live data
- Official SDKs available for JavaScript/TypeScript and other languages
