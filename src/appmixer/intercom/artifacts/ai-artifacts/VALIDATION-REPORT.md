# Intercom Connector Validation Report

Generated: September 19, 2025

## Overview
This document provides a comprehensive validation report for the Intercom connector, documenting test results for all components using `appmixer test component` with multiple scenarios.

## Component Test Results

### ✅ CreateContact
- **Status**: PASSED
- **Test Scenarios**: 
  - Basic contact creation with email and name
  - Contact creation with email only
  - Duplicate contact handling
- **Notes**: Component successfully creates contacts and handles duplicate detection properly

### ✅ FindContacts  
- **Status**: PASSED
- **Test Scenarios**: 
  - Search for contacts by query string
  - Output type variations
- **Notes**: Successfully finds contacts and returns appropriate data structure

### ✅ GetContact
- **Status**: PASSED  
- **Test Scenarios**: 
  - Retrieve contact by valid ID
- **Notes**: Successfully retrieves detailed contact information

### ✅ UpdateContact
- **Status**: PASSED
- **Test Scenarios**: 
  - Update contact name with valid contact ID
  - Field validation (requires `id` field)
- **Notes**: Successfully updates contact information, proper validation of required fields

### ✅ ListAdmins (formerly FindAdmins)
- **Status**: PASSED
- **Test Scenarios**: 
  - List all admins with `array` output type
  - List admins with `first` output type  
- **Notes**: Component successfully renamed from FindAdmins and working properly with both output modes

### ✅ CreateUpdateCompany
- **Status**: PASSED
- **Test Scenarios**: 
  - Create new company with company_id, name, and website
- **Notes**: Successfully creates companies in Intercom workspace

### ✅ FindCompanies  
- **Status**: PASSED
- **Test Scenarios**: 
  - List all companies with `array` output type
  - List companies with `first` output type
- **Notes**: Successfully retrieves company listings with proper pagination support

### ✅ GetCompany
- **Status**: PASSED
- **Test Scenarios**: 
  - Retrieve company by valid company ID
- **Notes**: Successfully retrieves detailed company information (requires `id` field)

### ✅ FindConversations
- **Status**: PASSED
- **Test Scenarios**: 
  - Search conversations with query `{"field":"state","operator":"=","value":"open"}`
  - Array output type returning multiple conversations
- **Notes**: Successfully searches conversations with complex query structures (requires `query` field)

### ✅ GetConversation
- **Status**: PASSED
- **Test Scenarios**: 
  - Retrieve conversation by valid conversation ID
- **Notes**: Successfully retrieves detailed conversation information including conversation parts (requires `id` field)

### ✅ ReplytoConversation
- **Status**: PASSED
- **Test Scenarios**: 
  - Admin reply to existing conversation with proper admin_id
- **Notes**: Successfully adds replies to conversations (requires `id`, `reply_type`, `body`, and `admin_id` for admin replies)

### ✅ SendMessage
- **Status**: PASSED
- **Test Scenarios**: 
  - Send in-app message to contact
  - Send email message with subject and template
- **Notes**: Successfully sends both in-app and email messages (requires `from_admin_id`, `to_contact_id`, `message_type`, `body`)

### ✅ CreateConversation
- **Status**: PASSED
- **Test Scenarios**: 
  - Create new conversation from user contact
- **Notes**: Successfully creates new conversations (requires `from_type`, `from_id`, `body`)

### ✅ ListTags
- **Status**: PASSED
- **Test Scenarios**: 
  - List all tags with empty input
  - List all tags with trigger parameter
- **Notes**: Successfully retrieves all available tags for the workspace. No input fields required. Returns array of tag objects with id, name, and type properties.

## Test Command Examples

Here are the working test command examples for each component:

### CreateContact
```bash
npx appmixer test component src/appmixer/intercom/core/CreateContact -i '{"in":{"email":"test@example.com","name":"Test User"}}'
```

### FindContacts  
```bash
npx appmixer test component src/appmixer/intercom/core/FindContacts -i '{"in":{"query":"Test"}}'
```

### GetContact
```bash
npx appmixer test component src/appmixer/intercom/core/GetContact -i '{"in":{"contactId":"CONTACT_ID"}}'
```

### UpdateContact
```bash
npx appmixer test component src/appmixer/intercom/core/UpdateContact -i '{"in":{"id":"CONTACT_ID","name":"Updated Name"}}'
```

### ListAdmins
```bash
npx appmixer test component src/appmixer/intercom/core/ListAdmins -i '{"in":{"outputType":"array"}}'
```

### CreateUpdateCompany
```bash
npx appmixer test component src/appmixer/intercom/core/CreateUpdateCompany -i '{"in":{"company_id":"test-company-123","name":"Test Company","website":"https://testcompany.com"}}'
```

### FindCompanies
```bash
npx appmixer test component src/appmixer/intercom/core/FindCompanies -i '{"in":{"outputType":"array"}}'
```

### GetCompany
```bash
npx appmixer test component src/appmixer/intercom/core/GetCompany -i '{"in":{"id":"COMPANY_ID"}}'
```

### FindConversations
```bash
npx appmixer test component src/appmixer/intercom/core/FindConversations -i '{"in":{"query":"{\"field\":\"state\",\"operator\":\"=\",\"value\":\"open\"}","outputType":"array"}}'
```

### GetConversation
```bash
npx appmixer test component src/appmixer/intercom/core/GetConversation -i '{"in":{"id":"CONVERSATION_ID"}}'
```

### ReplytoConversation
```bash
npx appmixer test component src/appmixer/intercom/core/ReplytoConversation -i '{"in":{"id":"CONVERSATION_ID","reply_type":"admin","body":"Test reply","admin_id":"ADMIN_ID"}}'
```

### SendMessage
```bash
# In-app message
npx appmixer test component src/appmixer/intercom/core/SendMessage -i '{"in":{"from_admin_id":ADMIN_ID,"to_contact_id":"CONTACT_ID","message_type":"in_app","body":"Test message"}}'

# Email message  
npx appmixer test component src/appmixer/intercom/core/SendMessage -i '{"in":{"from_admin_id":ADMIN_ID,"to_contact_id":"CONTACT_ID","message_type":"email","body":"Test email","subject":"Test Subject","template":"plain"}}'
```

### CreateConversation
```bash
npx appmixer test component src/appmixer/intercom/core/CreateConversation -i '{"in":{"from_type":"user","from_id":"CONTACT_ID","body":"Test conversation"}}'
```

### ListTags
```bash
npx appmixer test component src/appmixer/intercom/core/ListTags -i '{"in":{}}'
```

## Common Field Name Patterns

Based on testing, here are the key field naming patterns to remember:

- Most components expecting IDs use `id` field (not `contactId`, `conversationId`, etc.)
- UpdateContact requires `id` field for the contact ID
- GetCompany requires `id` field for the company ID
- GetConversation requires `id` field for the conversation ID
- SendMessage requires `from_admin_id`, `to_contact_id`, `message_type`, `body`
- CreateConversation requires `from_type`, `from_id`, `body`
- ReplytoConversation requires `id`, `reply_type`, `body` (plus `admin_id` for admin replies)
- FindConversations requires `query` field with JSON string

## Summary

✅ **Total Components Tested**: 14/14  
✅ **All Tests Passed**: Yes  
✅ **Authentication**: Working correctly  
✅ **API Integration**: All endpoints responding properly  
✅ **Data Validation**: Input/output schemas working as expected  

## Recommendations

1. **Documentation**: Update component documentation to clearly specify required field names
2. **Error Handling**: All components show appropriate error messages for missing required fields
3. **Field Validation**: Consider making field names more consistent across components
4. **Test Coverage**: Add more comprehensive unit tests for edge cases

## Validation Environment

- **Appmixer CLI**: Working properly
- **Authentication Token**: Valid and working
- **Test Workspace**: Intercom test workspace "gjjrsiph"
- **API Version**: Using Intercom-Version 2.14
- **Test Date**: September 19, 2025
