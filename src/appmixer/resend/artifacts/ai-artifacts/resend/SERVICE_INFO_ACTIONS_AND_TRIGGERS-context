# Resend Connector Context

## Service Overview
Resend is an email API service for developers that provides simple, reliable email delivery. Key features include sending transactional emails, managing email templates, webhooks for email events, and domain verification. The service is designed to be developer-friendly with a RESTful API and comprehensive documentation.

## API Documentation
- Base URL: https://api.resend.com
- Documentation: https://resend.com/docs/api-reference

## Authentication
- **Method**: API Key (Bearer token)
- **How to obtain**: Go to Resend dashboard → API Keys section → Create API Key
- **Usage**: Include in Authorization header as `Bearer {api_key}`

## Current Implementation Status
The connector already has basic setup with:
- ✅ Service configuration (service.json)
- ✅ Authentication setup (auth.js) 
- ✅ Basic components implemented:
  - SendEmail
  - DeleteApiKey
  - DeleteDomain
  - UpdateDomain

## Recommended Components to Implement

### Email Operations (Core)
1. ✅ **SendEmail** - Send transactional emails (already implemented)
2. **GetEmail** - Retrieve a specific email by ID
3. **ListEmails** - List sent emails with filtering options

### Domain Management
4. **CreateDomain** - Add a new domain for sending emails
5. **GetDomain** - Retrieve domain information
6. **ListDomains** - List all verified domains
7. **VerifyDomain** - Verify domain ownership
8. ✅ **UpdateDomain** - Update domain settings (already implemented)
9. ✅ **DeleteDomain** - Remove a domain (already implemented)

### API Key Management
10. **CreateApiKey** - Create a new API key
11. **ListApiKeys** - List all API keys
12. ✅ **DeleteApiKey** - Delete an API key (already implemented)

### Contact Management
13. **CreateContact** - Add a contact to audience
14. **GetContact** - Retrieve contact information
15. **ListContacts** - List contacts in audience
16. **UpdateContact** - Update contact information
17. **DeleteContact** - Remove a contact

### Audience Management
18. **CreateAudience** - Create a new audience
19. **GetAudience** - Retrieve audience information
20. **ListAudiences** - List all audiences
21. **DeleteAudience** - Remove an audience

### Webhook Events (Optional)
22. **ListWebhooks** - List webhook configurations
23. **CreateWebhook** - Set up webhook endpoints
24. **DeleteWebhook** - Remove webhook endpoints

## Priority Implementation Order
1. **High Priority** (Essential email operations):
   - GetEmail
   - ListEmails
   - CreateDomain
   - GetDomain
   - ListDomains
   - VerifyDomain

2. **Medium Priority** (Extended functionality):
   - CreateApiKey
   - ListApiKeys
   - CreateContact
   - ListContacts
   - GetContact
   - UpdateContact
   - DeleteContact

3. **Low Priority** (Advanced features):
   - Audience management components
   - Webhook management components

## API Endpoints Reference
- GET /emails - List emails
- GET /emails/{id} - Get email
- POST /emails - Send email ✅
- GET /domains - List domains
- POST /domains - Create domain
- GET /domains/{id} - Get domain
- PATCH /domains/{id} - Update domain ✅
- DELETE /domains/{id} - Delete domain ✅
- POST /domains/{id}/verify - Verify domain
- GET /api-keys - List API keys
- POST /api-keys - Create API key
- DELETE /api-keys/{id} - Delete API key ✅
- GET /audiences - List audiences
- POST /audiences - Create audience
- DELETE /audiences/{id} - Delete audience
- GET /audiences/{id}/contacts - List contacts
- POST /audiences/{id}/contacts - Create contact
- GET /contacts/{id} - Get contact
- PATCH /contacts/{id} - Update contact
- DELETE /contacts/{id} - Delete contact
