# Square Connector Context

## Service Overview
Square is a comprehensive financial services platform that provides payment processing, point-of-sale systems, and business management tools. The platform serves businesses of all sizes with tools for accepting payments, managing customers, tracking inventory, processing orders, and handling various business operations.

## API Documentation
- Main API Reference: https://developer.squareup.com/reference/square
- OAuth Documentation: https://developer.squareup.com/docs/oauth-api/overview
- API Base URLs:
  - Production: https://connect.squareup.com/
  - Sandbox: https://connect.squareupsandbox.com/

## Authentication Method
Square uses **OAuth 2.0** for authentication with two supported flows:

### 1. OAuth Code Flow (Recommended for server applications)
- Uses `client_id` and `client_secret`
- For confidential client applications that run on a server
- Refresh tokens don't expire (until revoked)
- Requires HTTPS redirect URLs (localhost allowed for testing)

### 2. OAuth PKCE Flow (For public clients)
- Uses `client_id` and `code_verifier` (no client_secret)
- For mobile apps, single-page apps, and native desktop applications
- Refresh tokens are single-use and expire after 90 days

### OAuth Process
1. **Authorization**: Direct seller to Square authorization page with requested permissions
2. **Callback**: Square redirects back with authorization code
3. **Token Exchange**: Exchange authorization code for access token and refresh token

### Key Details
- Access tokens expire after 30 days
- Authorization codes expire after 5 minutes
- Requires specific OAuth scopes/permissions
- Supports webhook notifications for token revocation

### How to Obtain Credentials
1. Visit the Square Developer Console: https://developer.squareup.com/apps
2. Create a new application or use an existing one
3. Note the Application ID (client_id) and Application Secret (client_secret)
4. Configure redirect URLs for OAuth flow
5. Set appropriate OAuth permissions/scopes

## Proposed Components

Based on the Square API documentation and comprehensive analysis of popular Square integrations, the connector should implement the following essential components:

### Core Business Operations

#### 1. **ListLocations**
- **Description**: Retrieve all business locations for a Square account
- **API Endpoint**: GET /v2/locations
- **Purpose**: Foundation component for location-based operations

### Customer Management

#### 2. **ListCustomers**
- **Description**: Retrieve customer profiles with filtering and pagination
- **API Endpoint**: GET /v2/customers
- **Purpose**: Access customer database for CRM integration

#### 3. **CreateCustomer**
- **Description**: Create a new customer profile
- **API Endpoint**: POST /v2/customers
- **Purpose**: Add new customers to the Square system

#### 4. **GetCustomer**
- **Description**: Get detailed information for a specific customer
- **API Endpoint**: GET /v2/customers/{customer_id}
- **Purpose**: Access individual customer details and history

#### 5. **FindCustomer**
- **Description**: Find a customer based on email, phone number, or reference ID
- **API Endpoint**: POST /v2/customers/search
- **Purpose**: Search for existing customers using various identifiers

#### 6. **UpdateCustomer**
- **Description**: Update existing customer information
- **API Endpoint**: PUT /v2/customers/{customer_id}
- **Purpose**: Maintain accurate customer records

### Payment Processing

#### 7. **ListPayments**
- **Description**: Retrieve payment transactions with filtering
- **API Endpoint**: GET /v2/payments
- **Purpose**: Access payment history and transaction data

#### 8. **CreatePayment**
- **Description**: Process a new payment transaction
- **API Endpoint**: POST /v2/payments
- **Purpose**: Accept payments through the API

#### 9. **GetPayment**
- **Description**: Get details for a specific payment
- **API Endpoint**: GET /v2/payments/{payment_id}
- **Purpose**: Access individual payment transaction details

#### 10. **RefundPayment**
- **Description**: Create a refund for a completed payment
- **API Endpoint**: POST /v2/refunds
- **Purpose**: Process payment refunds for customer satisfaction

### Order Management

#### 11. **CreateOrder**
- **Description**: Create a new order with line items
- **API Endpoint**: POST /v2/orders
- **Purpose**: Create itemized orders for payment processing

#### 12. **SearchOrders**
- **Description**: Search orders across locations with filtering
- **API Endpoint**: POST /v2/orders/search
- **Purpose**: Find orders based on various criteria

#### 13. **GetOrder**
- **Description**: Get details for a specific order
- **API Endpoint**: GET /v2/orders/{order_id}
- **Purpose**: Access individual order information

#### 14. **UpdateOrder**
- **Description**: Update an existing order
- **API Endpoint**: PUT /v2/orders/{order_id}
- **Purpose**: Modify order details before fulfillment

### Catalog Management

#### 15. **ListCatalogObjects**
- **Description**: Retrieve catalog items (products, services, variations)
- **API Endpoint**: GET /v2/catalog/list
- **Purpose**: Access product and service catalog

#### 16. **GetCatalogObject**
- **Description**: Get details for a specific catalog item
- **API Endpoint**: GET /v2/catalog/object/{object_id}
- **Purpose**: Access individual product/service details

#### 17. **SearchCatalogObjects**
- **Description**: Search catalog items with filtering
- **API Endpoint**: POST /v2/catalog/search
- **Purpose**: Find products/services based on various criteria

### Inventory Management

#### 18. **GetInventoryCount**
- **Description**: Get current inventory levels for catalog items
- **API Endpoint**: GET /v2/inventory/{catalog_object_id}
- **Purpose**: Track product inventory levels

#### 19. **ChangeInventory**
- **Description**: Adjust inventory or change physical count
- **API Endpoint**: POST /v2/inventory/changes/batch-create
- **Purpose**: Update inventory levels for stock management

### Advanced Components

#### 20. **CreateWebhookSubscription**
- **Description**: Subscribe to Square webhook events
- **API Endpoint**: POST /v2/webhooks/subscriptions
- **Purpose**: Set up real-time event notifications

#### 21. **ApiRequest**
- **Description**: Make custom API requests to Square endpoints
- **API Endpoint**: Any Square API endpoint
- **Purpose**: Provide flexibility for advanced use cases and custom integrations

## API Features and Capabilities

### Supported Operations
- **Payments**: Accept, process, refund, and track payments
- **Orders**: Create, update, search, and fulfill orders
- **Customers**: Manage customer profiles and relationships
- **Catalog**: Manage products, services, and pricing
- **Inventory**: Track stock levels and changes
- **Locations**: Manage multiple business locations
- **Webhooks**: Real-time event notifications

### Key Benefits
- Comprehensive payment processing
- Multi-location support
- Rich customer management
- Detailed transaction reporting
- Real-time inventory tracking
- Flexible order management
- Extensive webhook events

### Rate Limits and Quotas
- API calls are subject to rate limiting
- Different endpoints may have different limits
- Should implement proper quota management in connector

## Notes for Implementation
1. **OAuth Implementation**: Use OAuth 2.0 Code flow for server-side applications
2. **Error Handling**: Implement proper error handling for API responses
3. **Pagination**: Many list endpoints support pagination - implement accordingly
4. **Webhooks**: Consider implementing webhook components for real-time updates
5. **Environments**: Support both Sandbox (testing) and Production environments
6. **Permissions**: Request only necessary OAuth scopes for required functionality
7. **Rate Limiting**: Implement appropriate quotas to respect API limits

## Priority Implementation Order
1. **Authentication Setup** (OAuth 2.0)
2. **Core Business** (ListLocations)  
3. **Customer Management** (ListCustomers, CreateCustomer, GetCustomer, FindCustomer, UpdateCustomer)
4. **Payment Processing** (ListPayments, CreatePayment, GetPayment, RefundPayment)
5. **Order Management** (CreateOrder, SearchOrders, GetOrder, UpdateOrder)
6. **Catalog Management** (ListCatalogObjects, GetCatalogObject, SearchCatalogObjects)
7. **Inventory Management** (GetInventoryCount, ChangeInventory)
8. **Advanced Features** (CreateWebhookSubscription, ApiRequest)