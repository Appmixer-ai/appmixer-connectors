# Fix and Test Appmixer Connector {{connector_name}}

## Objective
Fix the implementation of the Appmixer connector {{connector_name}}. Information about the service, its API implementation, and expected actions are specified in the `appmixer-connectors/src/appmixer/{{connector_name}}/context.md` file.

Connector is located in the `appmixer-connectors/src/appmixer/{{connector_name}}` directory.

## Implementation Guidelines
- Maintain Appmixer standards and architecture throughout the implementation
- Follow the specifications outlined in the context.md file
- Ensure all components are properly implemented according to the service's API documentation

## Post-Implementation Requirements
Once you have fixed the implementation, create comprehensive tests for the connector. Develop simple tests for ideally all components to ensure proper functionality.

# Testing Instructions

## Overview
Run tests for the Appmixer connector {{connector_name}} and fix any issues found in tests and components as needed.

## Test Structure

### Directory Organization
Tests for a connector are located in the `appmixer-connectors/test/{{connector_name}}` directory.

**Example:** `appmixer-connectors/test/googleForms`

### File Naming Convention
Each component has its own test file named after the component.

**Example:** `FindForms.test.js` for the FindForms component
**Path:** `appmixer-connectors/test/googleForms/FindForms.test.js`

## Test Requirements and Rules

### Core Testing Principles
- Tests should only verify the types of results returned
- The goal is to confirm that components work correctly without throwing errors
- **Do not mock** `context.httpRequest` - use real API calls instead

### Environment Setup
- Access tokens or API keys are available in environment variables: {{access_token_variable_name}}
- Load environment variables using:
  ```javascript
  dotenv.config({ path: path.join(__dirname, '../.env') });
  ```
- Use assertions to check types:
  ```javascript
  const assert = require('assert');
  ```

### Testing Strategy
1. **Start with data creation components** - Test components that create sample data first
2. **Verify with listing/search components** - Check results using components that list or search entities
3. **Test all components systematically** - Repeat this process for all connector components

### Test Execution
- Use the `appmixer-dev` tool to run tests
- This tool supports running:
    - All tests
- Tests for a specific connector only
- Tests for a specific component only

### Output Port Schema Testing
Create tests to verify that output port schemas are properly generated for components returning arrays.

**Configuration:**
```javascript
context.properties.generateOutputPortOptions = true;
context.messages.in.content = {
    outputType: 'array' // or 'first'
};
```

**Example:** `test/googleForms/FindResponses.test.js`

## Testing Workflow
1. Fix connector implementation based on context.md specifications
2. Create test files for each component
3. Run tests using appmixer-dev tools
4. Fix any failing tests or component issues
5. Verify all components pass their respective tests
6. Ensure output port schemas are correctly generated for array-returning components