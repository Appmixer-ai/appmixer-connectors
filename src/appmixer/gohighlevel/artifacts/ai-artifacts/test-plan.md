Here's the structured test plan for the **GoHighLevel** connector:

---

## 🗺️ GoHighLevel Test Plan

| # | Component | Reason / Dependencies |
|---|-----------|----------------------|
| 1 | **CreateContact** | Foundation — produces `contactId` & `locationId` used by all other components |
| 2 | **GetContact** | Verifies contact was created correctly; uses `contactId` from step 1 |
| 3 | **FindContacts** | Search by the known email; uses `locationId` from step 1 |
| 4 | **UpdateContact** | Modifies the existing contact; uses `contactId` from step 1 |
| 5 | **CreateOpportunity** | Creates a deal linked to the contact; uses `contactId` + `locationId` from step 1 |
| 6 | **FindOpportunities** | Searches for the created opportunity; uses `locationId` + `pipelineId` from step 5 |
| 7 | **UpdateOpportunity** | Modifies the opportunity; uses `opportunityId` from step 5 |
| 8 | **CreateAppointment** | Books an appointment for the contact; uses `contactId` + `locationId` from step 1 (requires `calendarId` from environment) |
| 9 | **DeleteContact** | Cleanup — must run last since the contact is a dependency for all prior tests |