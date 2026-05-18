# FindCustomerByEmail

Finds a Salesforce **Contact** by email address. Returns the contact's key fields via the `out` port, or fires `notFound` when no matching Contact exists — making it easy to branch your flow into a "create new contact" path.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | Email address to look up. Case-insensitive match. |

## Output Ports

### `out` — Contact found

| Field | Type | Example |
|-------|------|---------|
| `Id` | string | `0032w00000AbCdEAAV` |
| `FirstName` | string | `Jane` |
| `LastName` | string | `Doe` |
| `Email` | string | `jane.doe@example.com` |
| `Phone` | string | `+1-555-0100` |
| `AccountId` | string | `0012w00000XyZaBAAV` |
| `OwnerId` | string | `0052w00000GhIjKAAV` |
| `CreatedDate` | string (ISO 8601) | `2024-01-15T09:00:00.000Z` |
| `LastModifiedDate` | string (ISO 8601) | `2024-06-01T14:30:00.000Z` |

### `notFound` — No match

Fires when no Contact with the given email exists. Carries the original `email` value so downstream components can use it to create a new Contact.

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | The email that was looked up |

## Behaviour

- Input email is normalized to lowercase before the SOQL query.
- SOQL used: `SELECT Id, FirstName, LastName, Email, Phone, AccountId, OwnerId, CreatedDate, LastModifiedDate FROM Contact WHERE Email = :email ORDER BY LastModifiedDate DESC LIMIT 1`
- If multiple Contacts share the same email, the most recently modified one is returned and a warning is logged.

---

## Example: Conversation-to-CRM Handoff

This component is the entry point for a **CRM handoff flow** — when a chat/voice bot conversation ends, automatically create a Salesforce Case and Task linked to the customer.

### Flow design

```
[Webhook] conversation_ended
   └─▶ FindCustomerByEmail
         ├── out (contact found)
         │    └─▶ CreateObjectRecord (Case)
         │              └─▶ CreateObjectRecord (Task — full transcript)
         └── notFound
              └─▶ CreateContact (from conversation payload)
                        └─▶ CreateObjectRecord (Case)
                                  └─▶ CreateObjectRecord (Task)
```

### Step-by-step

**Trigger:** An external system (chat platform, voice bot, AI agent) sends a `conversation_ended` webhook payload:

```json
{
  "email": "customer@example.com",
  "transcript": "...",
  "summary": "Customer asked about pricing",
  "channel": "Chat",
  "sentiment": "neutral"
}
```

**Step 1 — FindCustomerByEmail**
- Input: `email` → `{{webhook.email}}`
- `out` port → proceed to create Case
- `notFound` port → proceed to create Contact first

**Step 2 (fallback) — CreateContact**
- Only needed on the `notFound` branch
- Fields: `firstName`, `lastName`, `email`, `phone` from webhook payload
- Output: new `ContactId`

**Step 3 — CreateObjectRecord (Case)**
```
objectName:  Case
ContactId:   {{FindCustomerByEmail.Id}}   (or {{CreateContact.contactId}})
Subject:     {{webhook.summary}}
Origin:      Chat
Status:      New
Description: {{webhook.summary}}
Priority:    (optional, from sentiment)
```

**Step 4 — CreateObjectRecord (Task)**
```
objectName:    Task
WhoId:         {{ContactId}}
WhatId:        {{CreateObjectRecord_Case.recordId}}
Subject:       Conversation transcript
Description:   {{webhook.transcript}}
Status:        Completed
ActivityDate:  {{today}}
Type:          Call
```

### Result in Salesforce

A human support agent opens Salesforce and sees:
- A new **Case** for the Contact, with origin and description pre-filled
- A **Task** on that Case containing the full conversation transcript

No copy-pasting. No lost context.

---

## E2E Test Flows

Two test flow JSONs are provided under `artifacts/test-flows/`:

| File | Description |
|------|-------------|
| `test-flow-find-customer.json` | Creates a temporary Contact, finds it by email (verifies `out` port and `notFound` → create path), then cleans up. |
| `test-flow-crm-handoff-*.json` | Full handoff: FindCustomerByEmail → CreateObjectRecord (Case) → CreateObjectRecord (Task), with assertions and cleanup. |
