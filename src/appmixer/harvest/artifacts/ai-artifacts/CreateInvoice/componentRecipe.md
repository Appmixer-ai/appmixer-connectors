Based on my knowledge of the Harvest API, here's comprehensive information about the CreateInvoice endpoint:

## CreateInvoice Component Information

### API Documentation
- **Documentation Link**: https://developer.harvest.com/api-v2/invoices-api/invoices/create-an-invoice/

### Endpoint Details
- **HTTP Method**: `POST`
- **Endpoint URL**: `/invoices`
- **API Base URL**: `https://api.harvestapp.com/v2`
- **Full URL**: `https://api.harvestapp.com/v2/invoices`

### Input Schema (JSON Schema Format)

```json
{
  "type": "object",
  "properties": {
    "client_id": {
      "type": "integer",
      "title": "Client ID",
      "description": "The ID of the client to invoice. Required."
    },
    "number": {
      "type": "string",
      "title": "Invoice Number",
      "description": "If no value is set, the number will be automatically generated."
    },
    "purchase_order": {
      "type": "string",
      "title": "Purchase Order",
      "description": "The purchase order number."
    },
    "status": {
      "type": "string",
      "enum": ["draft", "sent", "viewed", "accepted", "declined", "approved", "disputed", "paid"],
      "title": "Status",
      "description": "The invoice's status. Defaults to 'draft'."
    },
    "issue_date": {
      "type": "string",
      "format": "date",
      "title": "Issue Date",
      "description": "The date the invoice was issued. Defaults to today's date."
    },
    "due_date": {
      "type": "string",
      "format": "date",
      "title": "Due Date",
      "description": "The date the invoice is due."
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "description": "The currency used by the invoice. If not provided, the client's currency will be used."
    },
    "tax": {
      "type": "number",
      "title": "Tax",
      "description": "This percentage is applied to the subtotal, including line items and discounts."
    },
    "tax2": {
      "type": "number",
      "title": "Tax 2",
      "description": "This percentage is applied to the subtotal, including line items and discounts."
    },
    "discount": {
      "type": "number",
      "title": "Discount",
      "description": "This percentage is applied to the subtotal, including line items and discounts."
    },
    "subject": {
      "type": "string",
      "title": "Subject",
      "description": "The invoice subject."
    },
    "notes": {
      "type": "string",
      "title": "Notes",
      "description": "Notes about the invoice."
    },
    "terms": {
      "type": "string",
      "title": "Terms",
      "description": "The invoice terms."
    },
    "line_items": {
      "type": "array",
      "title": "Line Items",
      "description": "Array of line items for the invoice.",
      "items": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string",
            "enum": ["service", "product"],
            "description": "The type of line item."
          },
          "description": {
            "type": "string",
            "description": "The line item description."
          },
          "quantity": {
            "type": "number",
            "description": "The line item quantity."
          },
          "unit_price": {
            "type": "number",
            "description": "The line item unit price."
          },
          "taxed": {
            "type": "boolean",
            "description": "Whether the line item is taxed."
          },
          "taxed2": {
            "type": "boolean",
            "description": "Whether the line item is subject to the second tax."
          }
        },
        "required": ["kind", "description", "quantity", "unit_price"]
      }
    }
  },
  "required": ["client_id"]
}
```

### Sample Response

```json
{
  "id": 13150403,
  "number": "1001",
  "organization": "Acme Corp",
  "line_items": [
    {
      "id": 240360,
      "kind": "service",
      "description": "Monthly retainer",
      "quantity": 1.0,
      "unit_price": 5000.0,
      "amount": 5000.0,
      "taxed": false,
      "taxed2": false,
      "project": null
    }
  ],
  "estimate": null,
  "client": {
    "id": 5735776,
    "name": "ABC Corp"
  },
  "invoice_item_categories": [
    {
      "id": 4,
      "name": "Product"
    }
  ],
  "created_at": "2017-06-27T16:38:27Z",
  "updated_at": "2017-06-27T16:38:27Z",
  "issued_at": "2017-06-27",
  "sent_at": null,
  "paid_at": null,
  "closed_at": null,
  "due_date": "2017-07-27",
  "period_start": null,
  "period_end": null,
  "purchase_order": "PO-2017-001",
  "amount": 5000.0,
  "due_amount": 5000.0,
  "tax": 0.0,
  "tax_amount": 0.0,
  "tax2": null,
  "tax2_amount": 0.0,
  "discount": 0.0,
  "discount_amount": 0.0,
  "subject": "Invoice for services rendered",
  "notes": "Thank you for your business!",
  "currency": "USD",
  "status": "draft",
  "payment_term": "net30",
  "sent_by_email": false,
  "viewed_by_client": false,
  "recurring": false,
  "last_sent_date": null,
  "last_sent_by": null,
  "reminder_will_be_sent_on": null
}
```

### Authentication
- **Type**: OAuth 2.0
- **Required Scopes**: `invoices:write`
- **Header**: `Authorization: Bearer {access_token}`
- **Additional Header**: `Harvest-Account-ID: {account_id}` (required for all Harvest API requests)

### Rate Limiting
- **Rate Limit**: 100 requests per 15 seconds per access token
- **Headers**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error_description": "Invalid request body"
}
```

**401 Unauthorized** - Missing or invalid authentication
```json
{
  "error_description": "Unauthorized"
}
```

**422 Unprocessable Entity** - Validation error
```json
{
  "error_description": "Validation failed",
  "errors": [
    {
      "field": "client_id",
      "message": "Client not found"
    }
  ]
}
```

### Key Notes
1. **Required Field**: Only `client_id` is required
2. **Auto-generation**: Invoice number is auto-generated if not provided
3. **Line Items**: At least one line item is typically required for a valid invoice
4. **Currency**: Defaults to client's currency if not specified
5. **Status**: Defaults to 'draft' if not specified
6. **Dates**: Issue date defaults to today if not provided

This information provides a complete specification for creating a CreateInvoice component in Appmixer for the Harvest service.