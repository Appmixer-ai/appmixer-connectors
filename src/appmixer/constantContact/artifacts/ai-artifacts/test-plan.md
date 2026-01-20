Based on my analysis of the constantContact connector components, here's a comprehensive **test plan** that follows natural user workflows and respects component dependencies:

## **Constant Contact Connector - Test Plan**

### **Phase 1: Foundation Setup (Create Resources)**
These components create the foundational resources needed by other operations.

1. **CreateContactList**
   - Create a test contact list (e.g., "Test List 1")
   - Output: `list_id` → Use in subsequent tests
   - Verify: List is created with correct name and metadata

2. **CreateContact**
   - Create a test contact with email and required fields
   - Optionally add to the list created in step 1 via `list_memberships`
   - Output: `contact_id` → Use in subsequent tests
   - Verify: Contact created with all provided attributes

---

### **Phase 2: Read & Verify Operations**
These components retrieve and validate the created resources.

3. **GetContact**
   - Retrieve the contact created in Phase 1, step 2
   - Input: Use `contact_id` from CreateContact output
   - Verify: All contact details match what was created

4. **FindContacts**
   - Search for contacts (can filter by email, status, list, etc.)
   - Verify: The contact created in Phase 1 appears in results
   - Test different filter scenarios (by email, by list membership, etc.)

5. **FindContactLists**
   - Search for contact lists
   - Verify: The list created in Phase 1 appears in results
   - Test filtering by name and favorite status

---

### **Phase 3: Update Operations**
These components modify existing resources.

6. **UpdateContact**
   - Update the contact created in Phase 1 (e.g., change name, add tags, update list memberships)
   - Input: Use `contact_id` from CreateContact output
   - Verify: Changes are reflected in GetContact or FindContacts

7. **UpdateContactList**
   - Update the contact list created in Phase 1 (e.g., rename, mark as favorite)
   - Input: Use `list_id` from CreateContactList output
   - Verify: Changes are reflected in FindContactLists

---

### **Phase 4: Campaign Operations**
These components work with email campaigns (typically depend on lists).

8. **CreateEmailCampaign**
   - Create an email campaign targeting the list from Phase 1
   - Input: Use `list_id` from CreateContactList output
   - Output: `campaign_id` → Use in subsequent tests
   - Verify: Campaign created with correct name, subject, and target list

9. **FindEmailCampaigns**
   - Search for email campaigns
   - Verify: The campaign created in Phase 4, step 8 appears in results
   - Test filtering by name and status

---

### **Phase 5: Cleanup (Delete Resources)**
These components remove test data in reverse dependency order.

10. **DeleteEmailCampaign**
    - Delete the campaign created in Phase 4, step 8
    - Input: Use `campaign_id` from CreateEmailCampaign output
    - Verify: Campaign is deleted (no longer appears in FindEmailCampaigns)

11. **DeleteContact**
    - Delete the contact created in Phase 1, step 2
    - Input: Use `contact_id` from CreateContact output
    - Verify: Contact is deleted (no longer appears in FindContacts)

12. **DeleteContactList**
    - Delete the contact list created in Phase 1, step 1
    - Input: Use `list_id` from CreateContactList output
    - Verify: List is deleted (no longer appears in FindContactLists)

---

## **Key Dependencies & Data Flow**

```
CreateContactList (list_id)
    ↓
CreateContact (contact_id) → uses list_id for list_memberships
    ↓
GetContact / FindContacts / UpdateContact (uses contact_id)
    ↓
CreateEmailCampaign (campaign_id) → uses list_id
    ↓
FindEmailCampaigns / DeleteEmailCampaign (uses campaign_id)
    ↓
Cleanup: DeleteContact → DeleteContactList
```

---

## **Test Data Reuse Strategy**

| Component Output | Used By | Purpose |
|---|---|---|
| `list_id` (CreateContactList) | CreateContact, UpdateContactList, CreateEmailCampaign, DeleteContactList | Reference for list operations |
| `contact_id` (CreateContact) | GetContact, UpdateContact, FindContacts, DeleteContact | Reference for contact operations |
| `campaign_id` (CreateEmailCampaign) | FindEmailCampaigns, DeleteEmailCampaign | Reference for campaign operations |

This test plan ensures all components are validated in a logical sequence that mirrors real-world usage patterns while maximizing test data reuse.