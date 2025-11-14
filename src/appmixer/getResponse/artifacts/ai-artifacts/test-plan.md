Perfect! Now I have all the component information. Let me create a comprehensive test plan for the getResponse connector.

## **GetResponse Connector - Test Plan**

Based on the component analysis, here's the logical test sequence that mimics real user workflows:

### **Recommended Test Sequence:**

```
1. CreateTag
   ├─ Creates a tag to be used in contact operations
   └─ Output: tagId (used in steps 3, 5, 6)

2. ListTags
   ├─ Verifies the tag was created
   └─ Validates tag listing and filtering capabilities

3. CreateContact
   ├─ Creates a contact with the tag from step 1
   ├─ Requires: campaignId (from user), email, tagId (from step 1)
   └─ Output: contactId (used in steps 4, 5, 6, 8)

4. GetContact
   ├─ Retrieves the contact created in step 3
   ├─ Requires: contactId (from step 3)
   └─ Validates contact data and tag association

5. UpdateContact
   ├─ Updates the contact with new information
   ├─ Requires: contactId (from step 3)
   └─ Validates modifications (name, scoring, notes, etc.)

6. ListContacts
   ├─ Lists contacts with optional filters
   ├─ Can filter by email, name, campaignId, state, etc.
   └─ Verifies the updated contact appears in results

7. UpdateTag
   ├─ Renames or updates the tag from step 1
   ├─ Requires: tagId (from step 1)
   └─ Validates tag modification

8. DeleteContact
   ├─ Deletes the contact created in step 3
   ├─ Requires: contactId (from step 3)
   └─ Validates deletion (irreversible operation)

9. DeleteTag
   ├─ Deletes the tag created in step 1
   ├─ Requires: tagId (from step 1)
   └─ Final cleanup operation
```

---

### **Key Dependencies & Data Flow:**

| Step | Component | Requires | Produces | Purpose |
|------|-----------|----------|----------|---------|
| 1 | **CreateTag** | tag name | `tagId` | Create test tag |
| 2 | **ListTags** | (optional filters) | tag list | Verify tag creation |
| 3 | **CreateContact** | `campaignId`, email, `tagId` | `contactId` | Create test contact |
| 4 | **GetContact** | `contactId` | contact details | Verify contact creation |
| 5 | **UpdateContact** | `contactId` | updated contact | Modify contact data |
| 6 | **ListContacts** | (optional filters) | contact list | Verify updates |
| 7 | **UpdateTag** | `tagId`, new name | updated tag | Modify tag |
| 8 | **DeleteContact** | `contactId` | - | Clean up contact |
| 9 | **DeleteTag** | `tagId` | - | Clean up tag |

---

### **Why This Order?**

✅ **Create before Read/Update/Delete** - Tags and contacts must exist before operations on them  
✅ **Reuse IDs** - Each creation step produces IDs used in subsequent steps  
✅ **Natural workflow** - Mirrors how users actually manage contacts and tags  
✅ **Cleanup last** - Deletion operations come at the end to avoid breaking dependent tests  
✅ **Verification steps** - List and Get operations validate that Create/Update operations worked correctly

---

### **Test Data Requirements:**

- **campaignId**: Must be provided (from getResponse account setup)
- **email**: Valid email address for contact creation
- **tag name**: Any string for tag creation
- **contact name**: Optional but recommended for testing

This test plan ensures comprehensive coverage while maintaining logical dependencies and data reusability.