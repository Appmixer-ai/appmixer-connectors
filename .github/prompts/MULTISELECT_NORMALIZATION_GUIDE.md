# Multiselect Input Normalization Guide for Appmixer Connectors

## Overview

This guide provides instructions for implementing robust multiselect input normalization across Appmixer connectors. The goal is to ensure that fields defined as multiselect are consistently normalized to the format expected by their respective APIs.

## Key Principles

1. **Only normalize true multiselect fields** - Fields defined with `"type": "multiselect"` in component.json
2. **Preserve text fields** - Fields with `"type": "text"` that accept comma-separated values should remain as designed
3. **Consistent implementation** - Use shared normalization functions across connectors
4. **Keep it simple** - Basic normalization without unnecessary complexity
5. **Comprehensive testing** - Every normalization implementation must include unit tests

## Implementation Steps

### 1. Identify Multiselect Fields

Before implementing normalization, identify which fields are true multiselect fields:

- ✅ **Normalize these**: Fields with `"type": "multiselect"` in `component.json`
- ❌ **Don't normalize these**: Fields with `"type": "text"` that happen to accept comma-separated values

### 2. Create Shared Library Function

Create or update `src/appmixer/{connector}/lib.js` with a normalization function:

```javascript
module.exports = {

    /**
     * Normalize multiselect input (array or string) to array format.
     * Strings are treated as single values or comma-separated lists.
     * @param {string|string[]} input
     * @param {object} context
     * @param {string} fieldName
     * @returns {string[]}
     */
    normalizeMultiselectInput(input, context, fieldName) {

        if (Array.isArray(input)) {
            return input;
        } else if (typeof input === 'string') {
            // Handle single string value or comma-separated string
            return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            throw new context.CancelError(`${fieldName} must be a string or an array`);
        }
    }
};
```

### 3. Update Component Logic

In the component's JavaScript file:

1. **Import the lib module**:
```javascript
const lib = require('../../lib');
```

2. **Apply normalization only to multiselect fields**:
```javascript
// Before API call
const normalizedFieldName = fieldName ?
    lib.normalizeMultiselectInput(fieldName, context, 'Field Name') : undefined;

// In API request
const response = await context.httpRequest({
    // ...other config
    data: {
        // Use normalized value for multiselect fields
        multiselectField: normalizedFieldName,
        // Keep text fields as-is (even if they accept comma-separated values)
        textField: textFieldValue
    }
});
```

3. **Update component.json schema for multiselect fields**:

For fields that are multiselect in the inspector but have `"type": "array"` in the schema, update them to accept both array and string inputs:

```json
{
    "inPorts": [
        {
            "name": "in",
            "schema": {
                "properties": {
                    "statuses": { "type": ["array", "string"] }
                }
            },
            "inspector": {
                "inputs": {
                    "statuses": {
                        "type": "multiselect"
                    }
                }
            }
        }
    ]
}
```

This allows the field to accept both array inputs (from the UI multiselect) and string inputs (comma-separated values from variables or other sources).

### 4. Create Unit Tests

Create comprehensive unit tests in `test/{connector}/lib.test.js`:

```javascript
const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/{connector}/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('{Connector} lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = normalizeMultiselectInput(input, mockContext, 'statuses');
            assert.deepStrictEqual(result, ['value1', 'value2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('single', mockContext, 'statuses'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'statuses'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('2023:123:1231Z12', mockContext, 'ids'),
                ['2023:123:1231Z12']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1,value2', mockContext, 'statuses'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1, value2, value3', mockContext, 'statuses'),
                ['value1', 'value2', 'value3']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' value1 , value2 , value3 ', mockContext, 'statuses'),
                ['value1', 'value2', 'value3']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1,,value2', mockContext, 'statuses'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1, , value2', mockContext, 'statuses'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'statuses'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'statuses');
            }, /statuses must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'statuses');
            }, /statuses must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'statuses');
            }, /statuses must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'statuses'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value,', mockContext, 'statuses'),
                ['value']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',value', mockContext, 'statuses'),
                ['value']
            );
        });
    });
});
```

### 5. Update Bundle Version and Changelog

Update `src/appmixer/{connector}/bundle.json`:

```json
{
    "name": "appmixer.{connector}",
    "version": "X.Y.Z",
    "changelog": {
        "X.Y.Z": ["Implemented multiselect input normalization for {specific fields}."],
        // ...previous versions
    }
}
```

## Examples by Connector Type

### API Key Authentication Example (ClickUp)

```javascript
// FindTasks.js
const lib = require('../../lib');

// In receive function:
const { statuses, assigneeIds, tags } = context.messages.in.content;

// Only normalize the true multiselect field
const normalizedStatuses = statuses ?
    lib.normalizeMultiselectInput(statuses, context, 'Statuses') : undefined;

// Keep text fields as comma-separated strings
const tasks = await cu.requestPaginated('GET', `/list/${listId}/task`, {
    params: {
        statuses: normalizedStatuses,        // Multiselect field - normalized
        assignees: assigneeIds,              // Text field - kept as string
        tags: tags                           // Text field - kept as string
    }
});
```

### OAuth2 Authentication Example (Canvas)

```javascript
// CreateAssignment.js
const lib = require('../../lib');

// In receive function:
const { submissionTypes, allowedExtensions } = context.messages.in.content;

// Only normalize the true multiselect field
const normalizedSubmissionTypes = submissionTypes ?
    lib.normalizeMultiselectInput(submissionTypes, context, 'Submission Types') : undefined;

const response = await context.httpRequest({
    data: {
        assignment: {
            submission_types: normalizedSubmissionTypes,  // Multiselect - normalized
            allowed_extensions: allowedExtensions         // Text field - kept as string
        }
    }
});
```

## Field Type Identification Guide

### Multiselect Fields (Should be normalized)
- `"type": "multiselect"` in component.json inspector
- Usually have predefined options
- Expected by API as arrays
- Examples: status selections, category selections, feature toggles

### Text Fields (Should NOT be normalized)
- `"type": "text"` in component.json inspector
- May accept comma-separated values as free-form input
- API may expect them as strings or may handle string-to-array conversion internally
- Examples: user IDs, tag names, file extensions

## Testing Commands

```bash
# Run specific connector tests
npm run test-unit -- test/{connector}/lib.test.js

# Run all tests
npm run test-unit

```

## Validation Checklist

Before considering the implementation complete:

- [ ] Identified all true multiselect fields in the connector
- [ ] Created/updated shared lib.js with normalization function
- [ ] Updated component logic to use normalization only for multiselect fields
- [ ] Ensured text fields are left unchanged
- [ ] Created comprehensive unit tests
- [ ] All tests pass
- [ ] Updated bundle.json version and changelog
- [ ] Verified that existing functionality remains intact

## Common Pitfalls to Avoid

1. **Over-normalization**: Don't normalize text fields that happen to accept comma-separated values
2. **Missing edge cases**: Ensure normalization handles empty strings, whitespace, and single values
3. **Inconsistent implementation**: Use the same normalization logic across all connectors
4. **Missing tests**: Every normalization function must have comprehensive unit tests
5. **Breaking changes**: Ensure existing functionality continues to work after implementing normalization

## Future Considerations

- Consider creating a shared normalization utility package across all Appmixer connectors
- Implement validation at the schema level to catch normalization issues early
- Add integration tests to verify end-to-end functionality with real API calls
- Consider adding normalization for other input types (e.g., date formats, number formats)

## Related Documentation

- [Appmixer Component Development Guide](https://docs.appmixer.com/building-connectors/)
- [Appmixer Authentication Guide](https://docs.appmixer.com/building-connectors/authentication/)
- [JSON Schema Validation](http://json-schema.org/)
