# Connector Validation Instructions

## Your Task
Test and validate the `{{connector_name}}` connector by running real API calls through all its components to ensure they function correctly.

**Connector Location:** `appmixer-connectors/src/appmixer/{{connector_name}}`

## Validation Process

### Step 1: Check Current Progress
- Look for the file `{{connector_name}}/TEST-REPORT.md` which tracks your validation progress
- If the file exists:
  - Review the checklist to see which steps are already completed (marked with checkboxes)
  - Skip completed steps and continue with unfinished ones
- If the file doesn't exist:
  - Create a new `TEST-REPORT.md` file to track your progress
- After completing each step, update the checklist in `TEST-REPORT.md`

### Step 2: Static Review of the Connector
Review the connector and its components to ensure they match Appmixer standards. Use the `instructions-component-standards` tool to get the latest comprehensive guidelines and check your connector against these standards.

### Step 3: Plan Your Test Strategy
Design a test sequence that mimics how users actually use the service:

**Key Principles:**
- **Test dependencies first**: Components that create resources should be tested before components that read, update, or delete them
- **Reuse test data**: Use outputs from earlier tests (like created IDs) as inputs for later tests
- **Follow natural workflows**: Test components in the order users would typically use them

**Example workflow for Google Calendar:**
```
CreateCalendar → ListCalendars → CreateEvent → FindEvents → UpdateEvent → DeleteEvent → DeleteCalendar
```

### Step 4: Run the Tests
For each component, use the `run_component_verification` tool:

**Best Practices:**
- Use realistic test data that the actual API would accept
- Ensure tests make real API calls (not mocked responses)
- Test every component in the connector
- There is a checkmark in the `TEST-REPORT.md` for each test command to indicate its status
- When tests fail, analyze the error and adjust your approach

### Step 5: Troubleshooting Guide

| Error Type | Solution |
|------------|----------|
| **404 Not Found** | The component needs data that doesn't exist yet. Create the required resources first |
| **Validation Error** | Check the component.json file for input requirements and adjust your test data |
| **Authentication Failed** | Verify the connector's authentication configuration is properly set up |
| **Rate Limit Exceeded** | Add delays between tests if the service has strict rate limiting |

### Step 6: Document Your Results
Save all results to `{{connector_name}}/TEST-REPORT.md` with:

1. **Strategic Test Sequence**: A simple list of components in the order you'll test them

2. **Test Commands and Outputs**: Document each command you run and its output

**Command Format Requirements:**
- Use forward slashes in paths (not backslashes)
- Use single quotes for JSON inputs (not double quotes)

**Correct Command Example:**
```bash
appmixer test component ./src/appmixer/googleForms/core/CreateForm -i '{"in":{"title":"testform"}}'
[OUTPUT OF THE TEST GOES HERE]

appmixer test component ./src/appmixer/googleForms/core/ListForms -i '{"in":{}}'
[OUTPUT OF THE TEST GOES HERE]
```

**Incorrect Examples to Avoid:**
- ❌ Using backslashes: `.\src\appmixer\...`
- ❌ Using double quotes: `-i "{"in":{"title":"testform"}}"`