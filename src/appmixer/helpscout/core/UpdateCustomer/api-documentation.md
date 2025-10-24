Here’s a nicely-formatted Markdown version of the Help Scout Mailbox API “**Update Customer**” endpoint documentation:

---

# Update Customer

This endpoint can be used to update a customer profile with additional information after creation (name, email address, phone number, etc.).
If you need to update user-defined customer properties, use the “Update Customer Properties” endpoint. If you want to fully overwrite a customer record, use the “PUT Customer” endpoint. ([developer.helpscout.com][1])

---

## Request

```
PATCH /v2/customers/{customerId} HTTP/1.1  
Authorization: Bearer oauth_token  
Content-Type: application/json

[
  {
    "op": "replace",
    "path": "/firstName",
    "value": "Karl"
  }
]
```

([developer.helpscout.com][1])

---

## Path Parameters

`/v2/customers/{customerId}`

* `customerId` — The ID of the customer record to update. ([developer.helpscout.com][1])

---

## Request Fields (JSON Patch)

| Field      | Type   | Required | Description                                                                                              |
| ---------- | ------ | -------- | -------------------------------------------------------------------------------------------------------- |
| `[].op`    | String | Yes      | The patch operation: one of `add`, `remove`, `replace`. ([developer.helpscout.com][1])                   |
| `[].path`  | String | Yes      | JSON-Pointer path to the field to update. Supports top level and entries. ([developer.helpscout.com][1]) |
| `[].value` | Varies | No       | The value to apply for the patch operation. Format depends on the field. ([developer.helpscout.com][1])  |

### Supported Paths

Here are some of the supported `path` values you can patch:

* `/address/city`
* `/address/country`
* `/address/lines`
* `/address/postalCode`
* `/address/state`
* `/age`
* `/background`
* `/chats`
* `/chats/{chatId}`
* `/chats/{chatId}/type`
* `/chats/{chatId}/value`
* `/emails`
* `/emails/{emailId}`
* `/emails/{emailId}/type`
* `/emails/{emailId}/value`
* `/firstName`
* `/gender`
* `/jobTitle`
* `/lastName`
* `/location`
* `/organization`
* `/phones`
* `/phones/{phoneId}`
* `/phones/{phoneId}/type`
* `/phones/{phoneId}/value`
* `/photoType`
* `/photoUrl`
* `/social-profiles`
* `/social-profiles/{socialProfileId}`
* `/social-profiles/{socialProfileId}/type`
* `/social-profiles/{socialProfileId}/value`
* `/websites`
* `/websites/{websiteId}`
* `/websites/{websiteId}/value`
  ([developer.helpscout.com][1])

---

## Notes & Constraints

* The request body **must** be an array (i.e., enclosed in square brackets). Failing to do so will cause a validation error. ([developer.helpscout.com][1])
* You *can* remove individual values, but you cannot delete an entire entry collection. For example, removing the whole `/emails` array like `[{"op": "remove", "path": "/emails"}]` is **not allowed**. ([developer.helpscout.com][1])
* Fields of type `type` only accept predefined values (for example in the “emails”, “phones”, “social-profiles”, etc). ([developer.helpscout.com][1])

---

## Example Payloads

### Add a new email

```json
[
  {
    "op": "add",
    "path": "/emails",
    "value": {
      "type": "other",
      "value": "bear@acme.com"
    }
  }
]
```

([developer.helpscout.com][1])

### Delete an email

```json
[
  {
    "op": "remove",
    "path": "/emails/1001"
  }
]
```

([developer.helpscout.com][1])

### Update a chat handle value

```json
[
  {
    "op": "replace",
    "path": "/chats/1002/value",
    "value": "aim"
  }
]
```

([developer.helpscout.com][1])

### Update multiple fields

```json
[
  {
    "op": "replace",
    "path": "/firstName",
    "value": "Vernon"
  },
  {
    "op": "replace",
    "path": "/lastName",
    "value": "Bear"
  },
  {
    "op": "add",
    "path": "/emails",
    "value": {
      "type": "other",
      "value": "bear@acme.com"
    }
  }
]
```

([developer.helpscout.com][1])

---

## Response

```
HTTP/1.1 204 No Content
```

(On success, no content is returned.) ([developer.helpscout.com][1])

---

### Back to top

---

© Help Scout 2025
([developer.helpscout.com][1])

---

If you like, I can also pull in the **error codes**, **rate limiting details**, and **field-value constraints** and format them in Markdown too. Would you like that?

[1]: https://developer.helpscout.com/mailbox-api/endpoints/customers/update/ "
    
      
        Update Customer
      
      \| Help Scout Developers
    
  "
