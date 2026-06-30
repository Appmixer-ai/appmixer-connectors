---
description: Validate an Appmixer component using the CLI
argument-hint: <connector> <component>
---

# Validate Component

Validate an Appmixer connector component using the Appmixer CLI.

## Arguments
Arguments provided: $ARGUMENTS

- First argument ($1): connector name - `$1`
- Second argument ($2): component name - `$2`

## Instructions

1. **Parse the arguments**: connector=`$1`, component=`$2`

2. **Validate authentication** first by running:
   ```
   appmixer test auth validate ./src/appmixer/<connector>/auth.js
   ```
   - If authentication fails, stop and inform the user they need to authenticate first
   - Suggest running: `appmixer test auth ./src/appmixer/<connector>/auth.js`

3. **Read the component files** to understand the component:
   - Read `src/appmixer/<connector>/core/<component>/component.json` to understand required inputs, outputs, and component type
   - Read `src/appmixer/<connector>/core/<component>/<component>.js` to understand the behavior

4. **Validate outputType helper usage** (for Find/List components):

   If component.json contains `outputType` in inPorts or `generateOutputPortOptions` in outPorts:

   a. **Check lib.js exists:**
      - Path: `src/appmixer/<connector>/lib.js`
      - If missing: FAIL - "Connector needs lib.js with outputType helpers"

   b. **Validate lib.js has required functions:**
      - Must contain `sendArrayOutput` function
      - Must contain `getOutputPortOptions` function
      - For `array` outputType, output field must be named `result` (not `records` or custom names)
      - Reference implementation: `appmixer-cli/src/ai/src/templates/libs/lib.js`

   c. **Validate behavior file:**
      - Must import lib.js: `const lib = require('../../lib');`
      - Must call `lib.sendArrayOutput({ context, outputType, records })`
      - Must handle generateOutputPortOptions:
        ```javascript
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Items' });
        }
        ```

   d. **Auto-fix if issues found:**
      - If lib.js missing helpers → Copy canonical functions from template
      - If behavior missing pattern → Add correct implementation
      - Report fixes made in validation-results.md

5. **Determine component type** from the component name and structure:
   - **Create**: Creates a new entity (e.g., CreateTask, CreateDocument)
   - **Get**: Retrieves a single entity by ID (e.g., GetTask, GetUser)
   - **List**: Retrieves all entities without filtering (e.g., ListFolders, ListUsers)
   - **Find**: Searches with filters, has `outputType` option (e.g., FindTasks, FindEmails)
   - **Update**: Modifies an existing entity by ID (e.g., UpdateTask)
   - **Delete**: Removes an entity by ID (e.g., DeleteTask)
   - **Trigger**: Polling (`tick: true`) or webhook-based components

6. **Determine test inputs**:
   - Identify required fields from the component.json `inPorts` schema
   - For fields that need dynamic values (like IDs), first fetch them using related List/Get components from the same connector
   - Use realistic test data appropriate for the field type

7. **Run the component test**:
   ```
   appmixer test component ./src/appmixer/<connector>/core/<component> -i '{ "in": { ... } }'
   ```

8. **Test scenarios based on component type**:

   **For all components:**
   - Test with valid required inputs
   - Test required field validation by omitting required fields

   **For Find/List components (if they have `outputType`):**
   - Test with `outputType: "first"` - returns first item
   - Test with `outputType: "array"` - returns array of items
   - Test with `outputType: "object"` - returns object with items array

   **For Find components (if they have `notFound` output port):**
   - Test with filters that return no results to verify `notFound` port behavior

   **For Create components:**
   - Test creating an entity with minimal required fields
   - Test creating an entity with optional fields populated
   - Consider cleanup: note the created entity ID for potential deletion

   **For Update/Delete components:**
   - First create or retrieve an entity to get a valid ID
   - Test the operation with that ID

   **For components with optional boolean/enum fields:**
   - Test with different values for those fields

9. **Store test results** in the artifacts folder:
   - Create directory if it doesn't exist: `src/appmixer/<connector>/artifacts/ai-artifacts/<component>/`
   - Save results to: `src/appmixer/<connector>/artifacts/ai-artifacts/<component>/validation-results.md`
   - Include in the file:
     - Timestamp of validation
     - Component name and type
     - Authentication status
     - Summary table of all test scenarios
     - Any errors or warnings encountered
   - Save test data to: `src/appmixer/<connector>/artifacts/ai-artifacts/<component>/test-data.json`
   - Include in the JSON file:
     - All appmixer CLI commands executed during testing
     - Successful outputs from each command (can be reused as inputs for future tests)
     - Input parameters used for each test
   - Example `test-data.json` structure:
     ```json
     {
       "timestamp": "2026-01-08T12:33:20Z",
       "commands": [
         {
           "command": "appmixer test component ./src/appmixer/clickup/core/GetSpaces -i '{ \"in\": {} }'",
           "input": { "in": {} },
           "output": { "spaces": [{ "id": "123", "name": "My Space" }] },
           "success": true,
           "executionTime": "417 ms"
         }
       ],
       "reusableData": {
         "spaceId": "123",
         "folderId": "456",
         "listId": "789"
       }
     }
     ```
   - The `reusableData` section stores IDs and values that can be used as inputs for subsequent test runs

10. **Report results** to the user with a summary table showing:
   - Test scenario
   - Input used
   - Result (success/failure)
   - Execution time

11. **Fix issues and re-validate**:
    - If any test fails or reveals an issue in the component code:
      1. Analyze the error to understand the root cause
      2. Fix the issue in the component's JavaScript or component.json file
      3. Re-run the validation from step 7 (or earlier if needed)
      4. Repeat until all tests pass
    - Common issues to fix:
      - Missing required field validation
      - Incorrect API endpoint or request structure
      - Wrong output port names or schema mismatches
      - Missing error handling
      - Incorrect `outputType` handling in Find/List components
      - Missing or incorrect outputType helper usage:
        - lib.js missing `sendArrayOutput` or `getOutputPortOptions` functions
        - Behavior not calling helpers correctly
        - Wrong output field naming (`records` instead of `result`)
    - Document all fixes made in the validation-results.md file

## Example Workflow

For a component like `FindTasks`:
1. Validate connector auth
2. Read component files to understand inputs/outputs
3. Identify dependencies (e.g., needs a `listId`)
4. Fetch required IDs using related components (e.g., GetSpaces → GetLists)
5. Run main test with valid inputs
6. Test `outputType` variations if applicable
7. Test edge cases (empty results, missing required fields)
8. **If any test fails**: analyze the error, fix the component code, and re-run from step 5
9. Save results to `<connector>/artifacts/ai-artifacts/<component>/validation-results.md`
10. Report all results in summary table (including any fixes made)
