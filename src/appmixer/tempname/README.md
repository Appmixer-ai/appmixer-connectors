# LemonSqueezy Connector Validation

## Overview

This document contains validation results for all LemonSqueezy connector components. Each component has been tested with real API calls to ensure proper functionality.

## Validation Date

Last validated: July 23, 2025

## Environment Variables Required

```bash
LEMONSQUEEZY_ACCESS_TOKEN=<your_access_token>
LEMONSQUEEZY_PRODUCT_ID=586152
LEMONSQUEEZY_CUSTOMER_ID=6386100
LEMONSQUEEZY_SUBSCRIPTION_ID=1360511
LEMONSQUEEZY_ORDER_ID=6014346
LEMONSQUEEZY_STORE_ID=203063
LEMONSQUEEZY_VARIANT_ID=914847
```

## Validated Components

### ✅ Discovery/Find Components

#### FindStores - Retrieves list of stores
```bash
appmixer test component src/appmixer/lemonsqueezy/core/FindStores -i '{"in":{"outputType":"array"}}'
```
**Status**: ✅ PASSED - Successfully retrieves store data with proper output structure

#### FindProducts - Retrieves list of products
```bash
appmixer test component src/appmixer/lemonsqueezy/core/FindProducts -i '{"in":{"outputType":"array"}}'
```
**Status**: ✅ PASSED - Successfully retrieves product data with proper output structure

#### FindCustomers - Retrieves list of customers
```bash
appmixer test component src/appmixer/lemonsqueezy/core/FindCustomers -i '{"in":{"outputType":"array"}}'
```
**Status**: ✅ PASSED - Successfully retrieves customer data with proper output structure

#### FindOrders - Retrieves list of orders
```bash
appmixer test component src/appmixer/lemonsqueezy/core/FindOrders -i '{"in":{"outputType":"array","storeId":"203063"}}'
```
**Status**: ✅ PASSED - Successfully retrieves order data with store filtering

#### FindSubscriptions - Retrieves list of subscriptions
```bash
appmixer test component src/appmixer/lemonsqueezy/core/FindSubscriptions -i '{"in":{"outputType":"array","storeId":"203063"}}'
```
**Status**: ✅ PASSED - Successfully retrieves subscription data with store filtering

### ✅ Detail/Get Components

#### GetProductDetails - Retrieves specific product details
```bash
appmixer test component src/appmixer/lemonsqueezy/core/GetProductDetails -i '{"in":{"id":"586152"}}'
```
**Status**: ✅ PASSED - Successfully retrieves detailed product information

#### GetOrderDetails - Retrieves specific order details
```bash
appmixer test component src/appmixer/lemonsqueezy/core/GetOrderDetails -i '{"in":{"id":"6014346"}}'
```
**Status**: ✅ PASSED - Successfully retrieves detailed order information

#### GetSubscriptionDetails - Retrieves specific subscription details
```bash
appmixer test component src/appmixer/lemonsqueezy/core/GetSubscriptionDetails -i '{"in":{"id":"1360511"}}'
```
**Status**: ✅ PASSED - Successfully retrieves detailed subscription information

### ✅ Action Components

#### CreateCustomer - Creates a new customer
```bash
appmixer test component src/appmixer/lemonsqueezy/core/CreateCustomer -i '{"in":{"storeId":"203063","name":"Test Customer CLI","email":"test-cli-validation@example.com","city":"Test City","region":"Test Region","country":"US"}}'
```
**Status**: ✅ PASSED - Successfully creates customer with proper validation

#### GenerateOrderInvoice - Generates invoice for an order
```bash
appmixer test component src/appmixer/lemonsqueezy/core/GenerateOrderInvoice -i '{"in":{"orderId":"6014346","name":"Test Customer","address":"123 Main St","city":"Test City","state":"Test State","zipCode":"12345","country":"US"}}'
```
**Status**: ✅ PASSED - Successfully generates invoice URL

#### UpdateCustomer - Updates existing customer information
```bash
appmixer test component src/appmixer/lemonsqueezy/core/UpdateCustomer -i '{"in":{"customerId":"6386100","name":"Updated Customer Name","city":"Updated City"}}'
```
**Status**: ✅ PASSED - Successfully updates customer information

#### CancelSubscription - Cancels a subscription
```bash
appmixer test component src/appmixer/lemonsqueezy/core/CancelSubscription -i '{"in":{"subscriptionId":"1360511"}}'
```
**Status**: ✅ PASSED - Successfully cancels subscription

#### UpdateSubscription - Updates subscription settings
```bash
appmixer test component src/appmixer/lemonsqueezy/core/UpdateSubscription -i '{"in":{"subscriptionId":"1360511","pauseMode":"void"}}'
```
**Status**: ✅ PASSED - Successfully updates subscription with pause mode

#### IssueRefund - Issues refund for an order
```bash
appmixer test component src/appmixer/lemonsqueezy/core/IssueRefund -i '{"in":{"orderId":"6014346"}}'
```
**Status**: ✅ PASSED - Successfully processes refund for order

## Test Results Summary

- **Total Components**: 14
- **Validated**: 14
- **Passing**: 14
- **Failed**: 0
- **Pending**: 0

## Notes

All tested components successfully connect to the LemonSqueezy API and return properly structured data. The components properly handle authentication through the configured auth service and respect the defined input/output schemas.

### Key Validation Points Confirmed:

1. **Authentication**: All components correctly use `context.auth.apiKey` for API authentication
2. **Input Structure**: Components properly receive data through `context.messages.in.content`
3. **Output Handling**: All components send properly formatted JSON responses
4. **API Integration**: Real API calls successfully interact with LemonSqueezy services
5. **Error Handling**: Components handle API errors and validation appropriately
6. **Schema Compliance**: All input/output data follows defined component schemas

### Specific Findings:

- **FindStores, FindProducts, FindCustomers**: Support array output types for list operations
- **FindOrders, FindSubscriptions**: Properly handle store filtering parameters
- **Detail Components**: Successfully retrieve specific resource information by ID
- **CreateCustomer**: Validates required fields and creates customers with proper data structure
- **UpdateCustomer**: Successfully modifies existing customer information
- **GenerateOrderInvoice**: Generates proper invoice URLs with all required billing information
- **Subscription Management**: Both cancel and update operations work correctly
- **Refund Processing**: Successfully processes refunds (note: reason field has minor API limitation)

## Complete Validation Summary

✅ **ALL 14 LEMONSQUEEZY COMPONENTS SUCCESSFULLY VALIDATED**

The LemonSqueezy connector is fully functional and ready for production use. All components pass real API validation tests and demonstrate proper integration with the LemonSqueezy API.
