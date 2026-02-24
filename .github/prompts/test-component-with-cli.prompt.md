---
agent: agent
argument-hint: Component path (e.g., "src/appmixer/vapi/core/GetAssistant/") and input data as JSON.
description: This prompt guides you through testing Appmixer components using the Appmixer CLI, including authentication validation and component execution.
---

# Task: Test Appmixer Component with CLI

## Prerequisites

### 1. Authentication Validation - **STOP HERE IF THIS FAILS**

Before testing any component, verify that authentication is properly configured:

```bash
appmixer test component src/appmixer/{connector}/core/ListAssistants/ -i '{"in":{}}'
```

or use any simple **GET** component from the connector that doesn't require input parameters (e.g., `GetUser`, `GetAccount`, `ListProjects`).

**If authentication fails**, you will see errors like:
- `401 Unauthorized`
- `Invalid API token`
- `Authentication failed`
- `Invalid credentials`

**ACTION**: Do NOT proceed with further testing. Instead:
1. Verify the connector's `auth.js` is correctly configured
2. Check that your authentication credentials (API token, OAuth token, etc.) are valid
3. Test authentication separately before proceeding
4. Report the authentication error clearly to the user

**If authentication succeeds**, you will see a successful response. Continue with component testing below.

### 2. Component Path Required

The component path should be in the format:
```
src/appmixer/{connector}/core/{ComponentName}/
```

Or with alternative modules:
```
src/appmixer/{connector}/{module}/{ComponentName}/
```

Examples:
- `src/appmixer/vapi/core/ListAssistants/`
- `src/appmixer/vercel/core/MakeApiCall/`
- `src/appmixer/github/list/GetRepository/`

### 3. Input Data Format

Input data must be valid JSON with the structure:
```json
{
    "in": {
        "field1": "value1",
        "field2": "value2"
    }
}
```

For components without required inputs, use an empty object:
```json
{"in": {}}
```

## Testing Process

### Step 1: Identify Component Type

Determine what the component does:
- **Action component** (performs an operation): GetAssistant, CreateAssistant, UpdateAssistant, DeleteAssistant
- **List component** (returns all items): ListAssistants, ListSquads
- **Find component** (searches with filters and outputType): FindAssistants, FindSquads
- **Trigger component** (event-based): Usually in flow files

### Step 2: Prepare Test Data

For each component, prepare appropriate test data:

#### For GET/Retrieve Components
```bash
appmixer test component src/appmixer/{connector}/core/GetAssistant/ \
  -i '{"in":{"assistantId":"550e8400-e29b-41d4-a716-446655440000"}}'
```

#### For LIST Components
```bash
appmixer test component src/appmixer/{connector}/core/ListAssistants/ \
  -i '{"in":{}}'
```

#### For LIST Components with outputType
```bash
appmixer test component src/appmixer/{connector}/core/ListAssistants/ \
  -i '{"in":{"outputType":"array"}}'
```

Valid `outputType` values:
- `"array"` - All items at once as an array
- `"first"` - First item only
- `"object"` - One item at a time
- `"file"` - Export to CSV file

#### For CREATE Components
```bash
appmixer test component src/appmixer/{connector}/core/CreateAssistant/ \
  -i '{"in":{"name":"Test Assistant","firstMessage":"Hello!"}}'
```

#### For UPDATE Components
```bash
appmixer test component src/appmixer/{connector}/core/UpdateAssistant/ \
  -i '{"in":{"assistantId":"550e8400-e29b-41d4-a716-446655440000","name":"Updated Name"}}'
```

#### For DELETE Components
```bash
appmixer test component src/appmixer/{connector}/core/DeleteAssistant/ \
  -i '{"in":{"assistantId":"550e8400-e29b-41d4-a716-446655440000"}}'
```

#### For FIND Components (Search/Filter)
```bash
appmixer test component src/appmixer/{connector}/core/FindAssistants/ \
  -i '{"in":{"outputType":"array","status":"active"}}'
```

## Real-World Examples

### Example 1: List All Assistants
```bash
appmixer test component src/appmixer/vapi/core/ListAssistants/ -i '{"in":{}}'
```

**Success Response**: Array of assistant objects
**Failure**: Authentication error (stop here)

### Example 2: Get Specific Assistant
```bash
appmixer test component src/appmixer/vapi/core/GetAssistant/ \
  -i '{"in":{"assistantId":"437d851c-26a8-4732-8cde-06fc82ab2195"}}'
```

**Success Response**: Single assistant object with all details
**Failure**: `Not Found` (ID doesn't exist) or authentication error

### Example 3: Create New Assistant
```bash
appmixer test component src/appmixer/vapi/core/CreateAssistant/ \
  -i '{"in":{"name":"Test Assistant","firstMessage":"Hello, how can I help you today?"}}'
```

**Success Response**: Created assistant object with new ID
**Failure**: Validation error (missing required fields) or authentication error

### Example 4: Update Assistant
```bash
appmixer test component src/appmixer/vapi/core/UpdateAssistant/ \
  -i '{"in":{"assistantId":"437d851c-26a8-4732-8cde-06fc82ab2195","name":"Updated Assistant Name"}}'
```

**Success Response**: Updated assistant object
**Failure**: Not found or validation error

### Example 5: Delete Assistant
```bash
appmixer test component src/appmixer/vapi/core/DeleteAssistant/ \
  -i '{"in":{"assistantId":"437d851c-26a8-4732-8cde-06fc82ab2195"}}'
```

**Success Response**: Empty object `{}` or success confirmation
**Failure**: Not found or already deleted

### Example 6: Create Campaign (Complex Input)
```bash
appmixer test component src/appmixer/vapi/core/campaign-controller-create/ \
  -i '{"in":{"phoneNumber":"+14155552671","assistantId":"437d851c-26a8-4732-8cde-06fc82ab2195","customerNumber":"+14155552672","customerName":"John Doe"}}'
```

**Success Response**: Campaign object with ID and details
**Failure**: Validation error on required fields or invalid phone number format

### Example 7: Find with outputType Variations
```bash
# Get all squads as array
appmixer test component src/appmixer/vapi/core/FindSquads/ \
  -i '{"in":{"outputType":"array"}}'

# Get first squad only
appmixer test component src/appmixer/vapi/core/FindSquads/ \
  -i '{"in":{"outputType":"first"}}'

# Get squads one at a time
appmixer test component src/appmixer/vapi/core/FindSquads/ \
  -i '{"in":{"outputType":"object"}}'

# Export to CSV file
appmixer test component src/appmixer/vapi/core/FindSquads/ \
  -i '{"in":{"outputType":"file"}}'
```

## Input Data Validation

Before testing, ensure:
- [ ] Component path is correct and directory exists
- [ ] Input JSON is valid (use `jq` to validate if needed)
- [ ] All required fields are provided (check component.json `"required"` array)
- [ ] Field types match schema (string, integer, boolean, object, array)
- [ ] Complex objects are properly formatted (JSON strings or objects)

**Common Input Errors**:
```json
// ❌ WRONG - String instead of object
{"in":{"model":"gpt-3.5-turbo"}}

// ✅ CORRECT - JSON object as string
{"in":{"model":"{\"provider\": \"openai\", \"model\": \"gpt-3.5-turbo\"}"}}

// ✅ ALSO CORRECT - Array as array
{"in":{"members":[]}}

// ❌ WRONG - Array as string
{"in":{"members":"[]"}}
```

## Testing Workflow

### Phase 1: Authentication Validation
1. Pick a simple GET/LIST component
2. Test with minimal or no inputs
3. Verify response (not 401/403 error)
4. **Stop immediately if auth fails**

### Phase 2: Component Testing
1. Test GET/READ components first
2. Test LIST/FIND components
3. Test CREATE components (use test data)
4. Test UPDATE components (using created ID)
5. Test DELETE components (clean up test data)

### Phase 3: Output Verification
For each test, verify:
- Response status is 2xx (success)
- Response structure matches component.json outPorts definition
- All expected fields are present
- Data types are correct (string, number, object, array)
- No error messages in response

## Troubleshooting

### Authentication Failures
```
Error: 401 Unauthorized
Error: Invalid API token
Error: Bearer token expired
```

**Solutions**:
- Verify API token/credentials are valid
- Check if token has expired (OAuth tokens)
- Ensure auth.js configuration is correct
- Test auth manually outside Appmixer

### Invalid Input Errors
```
Error: Required field missing: assistantId
Error: Invalid JSON format in body parameter
```

**Solutions**:
- Check component.json `"required"` array
- Validate JSON syntax with `jq '.' <<< 'your-json'`
- Ensure field names exactly match schema
- Check for typos in field names

### Not Found Errors
```
Error: 404 Not Found
Error: Resource not found
```

**Solutions**:
- Verify the resource ID exists
- Use a LIST/FIND command first to get valid IDs
- Check if resource was deleted

### Network/Connection Errors
```
Error: Network timeout
Error: Connection refused
Error: ECONNREFUSED
```

**Solutions**:
- Check internet connection
- Verify API endpoint is accessible
- Check firewall/proxy settings
- Verify base URL in auth.js or component code

## Success Criteria

Each component test should result in:
- [ ] No authentication errors (401, 403)
- [ ] Valid HTTP response code (200, 201, 204, etc.)
- [ ] Response body matches schema in component.json
- [ ] No unhandled exceptions or stack traces
- [ ] Required fields are present in response

## Testing Best Practices

1. **Use valid test data**: Replace example UUIDs with real IDs from your environment
2. **Test in sequence**: List → Get → Create → Update → Delete
3. **Clean up**: Always delete test data after creating it
4. **Vary inputs**: Test with minimal inputs and full inputs
5. **Check edge cases**: Test with empty arrays, missing optional fields, etc.
6. **Document results**: Keep a log of which components passed/failed

## Additional Resources

- Appmixer CLI documentation: Run `appmixer --help`
- Component manifest reference: Check component.json in component directory
- Authentication setup: Review connector's auth.js file
- API documentation: Check the external service's API docs (e.g., Vapi, Vercel)

