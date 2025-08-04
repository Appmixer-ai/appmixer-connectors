# Replicate Connector Tests

This directory contains comprehensive tests for the Replicate connector components.

## Prerequisites

1. **Environment Setup**: Set your Replicate API token as an environment variable:
   ```bash
   export REPLICATE_ACCESS_TOKEN=your_token_here
   ```

2. **Test Dependencies**: Ensure you have the test helper and required dependencies:
   - `../helper.js` - Test context helper
   - `mocha` - Test runner
   - `assert` - Assertions
   - `dotenv` - Environment variable loading

## Test Files

- `FindModels.test.js` - Tests for searching and listing models
- `CreatePrediction.test.js` - Tests for creating predictions
- `GetPrediction.test.js` - Tests for retrieving prediction details
- `FindPredictions.test.js` - Tests for listing predictions with filtering
- `CancelPrediction.test.js` - Tests for canceling predictions
- `GetModel.test.js` - Tests for retrieving model details
- `integration.test.js` - End-to-end workflow tests

## Running Tests

### All Tests
```bash
npm test
```

### Individual Test Files
```bash
mocha FindModels.test.js
mocha CreatePrediction.test.js
mocha GetPrediction.test.js
mocha FindPredictions.test.js
mocha CancelPrediction.test.js
mocha GetModel.test.js
mocha integration.test.js
```

### Quick Status Check
```bash
node test-runner.js
```

## Test Coverage

### FindModels Component
- ✅ Search models without query
- ✅ Search models with specific query
- ✅ Return first model only
- ✅ Output port schema generation for arrays
- ✅ Output port schema generation for objects

### CreatePrediction Component
- ✅ Create prediction with object input
- ✅ Create prediction with JSON string input
- ✅ Validate required version parameter
- ✅ Handle invalid JSON input
- ✅ Validate input object requirement

### GetPrediction Component
- ✅ Retrieve prediction details
- ✅ Validate required prediction_id parameter
- ✅ Handle invalid prediction IDs

### FindPredictions Component
- ✅ List all predictions
- ✅ Filter predictions by status
- ✅ Return first prediction only
- ✅ Output port schema generation for arrays/objects

### CancelPrediction Component
- ✅ Cancel running predictions
- ✅ Handle already completed predictions
- ✅ Validate required prediction_id parameter
- ✅ Handle invalid prediction IDs

### GetModel Component
- ✅ Retrieve model details
- ✅ Handle special characters in model names
- ✅ Validate required parameters
- ✅ Handle invalid model references

### Integration Tests
- ✅ Complete workflow: Find → Get → Create → Monitor → List
- ✅ Output port schema generation across components
- ✅ Error handling and edge cases

## Components Fixed

### Issues Resolved
1. **CreatePrediction**: Enhanced input validation, better JSON parsing, proper error handling
2. **FindPredictions**: Added status filtering support, improved schema definition
3. **GetPrediction**: Added input validation for required parameters
4. **CancelPrediction**: Added input validation and error handling
5. **FindModels**: Enhanced search functionality and error handling
6. **GetModel**: Added input validation and URL encoding for parameters

### Schema Improvements
- Updated output port schemas to match actual API responses
- Added comprehensive field definitions for all data types
- Improved dynamic schema generation for array/object outputs

## Expected Test Results

All tests should pass if:
1. Your Replicate API token is valid and has appropriate permissions
2. The API is accessible from your network
3. Test models (like GFPGAN) are available on Replicate

Some tests may produce warnings or expected errors when testing edge cases (invalid IDs, missing parameters, etc.) - this is normal and indicates proper error handling.
