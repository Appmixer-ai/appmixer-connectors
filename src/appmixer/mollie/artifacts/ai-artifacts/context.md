# Mollie API Connector Context

## API Documentation
**Base URL**: https://docs.mollie.com/reference/overview

## Important: Mollie API Response Format

All Mollie list endpoints return data in the following structure:
```json
{
  "count": <number>,
  "_embedded": {
    "<resource_name>": [
      // Array of items here
    ]
  },
  "_links": { ... }
}
```

### Resource Mapping
When generating components, always set `arrayPropertyValue` to `_embedded.<resource_name>` for list operations:

- **List Payments** → `_embedded.payments`
- **List Customers** → `_embedded.customers`
- **List Refunds** → `_embedded.refunds`
- **List Payment Links** → `_embedded.payment_links`

---

## 8 Most Important Components

### 1. Create Payment
**Type**: Action  
**Description**: Creates a new payment with Mollie. This is the core functionality for processing payments.

### 2. Get Payment
**Type**: Action  
**Description**: Retrieves a specific payment by its payment token. Essential for checking payment status and details.

### 3. List Payments
**Type**: Search  
**Description**: Retrieves all payments created with the current website profile. Supports pagination and sorting.

### 4. Create Payment Refund
**Type**: Action  
**Description**: Creates a refund for a specific payment. Critical for handling returns and customer service.

### 5. Create Customer
**Type**: Action  
**Description**: Creates a simple minimal representation of a customer. Required for managing customer accounts and recurring payments.

### 6. Get Customer
**Type**: Action  
**Description**: Retrieve a single customer by its ID. Essential for customer management workflows.

### 7. List Customers
**Type**: Search  
**Description**: Retrieve a list of all customers. Supports pagination and basic filtering.

### 8. Make API Call
**Type**: Action  
**Description**: Performs an arbitrary authorized API call. Provides flexibility for advanced integrations and accessing any Mollie API endpoint not covered by other components.