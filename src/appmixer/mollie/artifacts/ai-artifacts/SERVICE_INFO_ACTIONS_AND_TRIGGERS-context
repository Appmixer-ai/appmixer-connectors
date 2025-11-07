Mollie API Documentation URL: https://docs.mollie.com/reference/overview

IMPORTANT: Mollie API Response Format
All Mollie list endpoints return data in the following structure:
{
  "count": <number>,
  "_embedded": {
    "<resource_name>": [
      // Array of items here
    ]
  },
  "_links": { ... }
}

For example:
- List Payments returns data under "_embedded.payments"
- List Customers returns data under "_embedded.customers" 
- List Refunds returns data under "_embedded.refunds"
- List Orders returns data under "_embedded.orders"
- List Payment Links returns data under "_embedded.payment_links"
- List Mandates returns data under "_embedded.mandates"
- List Balances returns data under "_embedded.balances"
- List Transactions returns data under "_embedded.transactions"
- List Settlements returns data under "_embedded.settlements"
- List Invoices returns data under "_embedded.invoices"
- List Chargebacks returns data under "_embedded.chargebacks"

When generating components, always set arrayPropertyValue to "_embedded.<resource_name>" for list operations.

Mollie
Cancel Subscription
Cancel an existing subscription.

Action
Mollie
Create Customer
Creates a simple minimal representation of a customer.

Action
Mollie
Create Mandate
Create a mandate for a specific customer. Mandates allow you to charge a customer's card, PayPal account or bank account recurrently. It is only possible to create mandates for IBANs and PayPal billing agreements with this module. To create mandates for cards, your customers need to perform a 'first payment' with their card.

Action
Mollie
Create Subscription
With subscriptions, you can schedule recurring payments to take place at regular intervals. Please see the API Docs for examples: https://docs.mollie.com/reference/create-subscription.

Action
Mollie
Create Payment
Creates a new payment.

Action
Mollie
Create Payment Link
Creates a new payment link.

Action
Mollie
Create Payment Refund
Creates a refund for a specific payment.

Action
Mollie
Create Shipment
Creates a new shipment for specific order lines of order.

Action
Mollie
Create Order
Creates a new order.

Action
Mollie
Create Order Refund
Creates a refund for a specific order.

Action
Mollie
Get Balance
Retrieves balance by it's ID.

Action
Mollie
Get Customer
Retrieve a single customer by its ID.

Action
Mollie
Get Mandate
Retrieve a single mandate by its ID. Depending on the type of mandate, the object will contain the customer's bank account details, card details, or PayPal account details.

Action

Mollie
Get Subscription
Retrieve a single subscription by its ID and the ID of its parent customer.

Action
Mollie
Get Payment
Retrieves a specific payment by its payment token.

Action
Mollie
Get Payment Link
Retrieves a specific payment link by its token.

Action
Mollie
Get Payment Refund
Retrieves a specific payment refund by its ID and the payment ID.

Action
Mollie
Get Settlement
Retrieves a specific settlement by its ID.

Action
Mollie
Get Order
Retrieves a specific order by its ID.

Action
Mollie
List Balance Transactions
With the List balance transactions endpoint you can retrieve a list of all the movements on your balance. This includes payments, refunds, chargebacks, and settlements.

Search
Mollie
List Customers
Retrieve a list of all customers.

Search
Mollie
List Invoices
Retrieve a list of all your invoices, optionally filtered by year or by invoice reference.

Search
Mollie
List Mandates
Retrieve a list of all mandates.

Search
Mollie
List Order Refunds
Retrieves a list of all refunds created for a specific order.

Search
Mollie
List Orders
Retrieves all orders.

Search
Mollie
List Payment Links
Retrieves all payments links.

Search
Mollie
List Payment Refunds
Retrieves a list of all refunds created for a specific payment.

Search
Mollie
List Payments
Retrieves all payments.

Search
Mollie
List Refunds
Retrieves all refunds.

Search
Mollie
List Settlements
Retrieves all settlements.

Search
Mollie
List Subscription Payments
Retrieve all payments of a specific subscription.

Search
Mollie
List all chargebacks
Retrieve all chargebacks initiated for all your payments.

Search
Mollie
List balances
Retrieve all the organization’s balances, including the primary balance, ordered from newest to oldest.

Search
Mollie
Make API Call
Performs an arbitrary authorized API call.

Action
Mollie
Revoke Mandate
Revoke a customer's mandate. You will no longer be able to charge the customer's bank account or card with this mandate, and all connected subscriptions will be canceled.

Action
Mollie
Update Customer
Update an existing customer.

Action
Mollie
Update Subscription
Update an existing subscription. Canceled subscriptions cannot be updated.

Action
