---
mode: agent
---

# Task: Create MakeAPICall Component for Appmixer Connector

## Prerequisites

1. **Connector Name Required**: You MUST ask for the connector name if not specified. The connector name should be in lowercase (e.g., `github`, `notion`, `microsoft`).

2. **Check if Component Exists**: Before creating, verify that a MakeAPICall component doesn't already exist for this connector:
   - Search for `src/appmixer/{connector}/*/MakeApiCall/` directory
   - If found, STOP and inform the user that the component already exists

## Task Overview

Create a generic MakeAPICall component that allows users to make arbitrary authenticated API calls to the specified service's API. This component is essential for advanced users who need to call API endpoints not covered by existing components.

## Research Requirements

1. **Search for Latest API Documentation**: 
   - Try to fetch the latest API documentation from the service's official documentation website
   - Look for: base URL, authentication method, API version, required headers, common patterns
   - Examples: `https://docs.github.com/api`, `https://developers.notion.com/reference`, `https://learn.microsoft.com/en-us/dynamics365/`

2. **Fallback to Model Knowledge**:
   - If web search is not available or fails, use your existing knowledge about the API
   - Clearly indicate you're using existing knowledge and recommend user verification

## Component Structure

### Directory Location

Create the component in: `src/appmixer/{connector}/{module}/MakeApiCall/`

Where:
- `{connector}` = lowercase connector name (e.g., `github`, `notion`, `microsoft`)
- `{module}` = appropriate module name (typically `core`, `list`, or connector-specific like `dynamics`)

### Required Files

1. `component.json` - Component configuration
2. `MakeApiCall.js` - Component behavior

## component.json Specification

```json
{
    "name": "appmixer.{connector}.{module}.MakeApiCall",
    "author": "Appmixer <info@appmixer.com>",
    "description": "Performs an arbitrary authorized API call to {ServiceName} API.",
    "private": false,
    "auth": {
        "service": "appmixer:{connector}",
        "scope": []  // Add required scopes if applicable
    },
    "quota": {
        "manager": "appmixer:{connector}",
        "resources": "general",  // or specific resource name
        "scope": {
            "userId": "{{userId}}"
        }
    },
    "inPorts": [
        {
            "name": "in",
            "schema": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string"
                    },
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                        "default": "GET"
                    },
                    "body": {
                        "type": "string"
                    }
                },
                "required": ["url", "method"]
            },
            "inspector": {
                "inputs": {
                    "url": {
                        "type": "text",
                        "index": 1,
                        "label": "API Endpoint URL",
                        "tooltip": "Enter the API endpoint URL. Examples: /api/v1/resource, https://api.service.com/endpoint"
                    },
                    "method": {
                        "type": "select",
                        "index": 2,
                        "label": "HTTP Method",
                        "defaultValue": "GET",
                        "tooltip": "Select the HTTP method for the API call.",
                        "options": [
                            { "label": "GET", "value": "GET" },
                            { "label": "POST", "value": "POST" },
                            { "label": "PUT", "value": "PUT" },
                            { "label": "PATCH", "value": "PATCH" },
                            { "label": "DELETE", "value": "DELETE" }
                        ]
                    },
                    "body": {
                        "type": "textarea",
                        "index": 3,
                        "label": "Request Body",
                        "tooltip": "Enter the request body for the API call (JSON format)."
                    }
                }
            }
        }
    ],
    "outPorts": [
        {
            "name": "out",
            "options": [
                { "label": "Status Code", "value": "status" },
                { "label": "Response Headers", "value": "headers" },
                { "label": "Response Body", "value": "body", "schema": { "type": "object", "properties": {} } }
            ]
        }
    ],
    "icon": "data:image/svg+xml;base64,..."  // Use connector's icon
}
```

## MakeApiCall.js Specification

The behavior file should handle:
1. Extract `url`, `method`, and `body` from input
2. Build authenticated request with proper headers
3. Handle API-specific requirements (version headers, base URL, etc.)
4. Parse and send response

### Common Patterns

**Pattern 1: Relative URL with Base URL from Auth Context**
```javascript
'use strict';

module.exports = {
    async receive(context) {
        const { url, method, body } = context.messages.in.content;

        const requestOptions = {
            method: method,
            url: (context.resource || context.auth.resource) + url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.accessToken || context.auth?.accessToken}`
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        try {
            const response = await context.httpRequest(requestOptions);
            
            return context.sendJson({
                status: response.status,
                headers: response.headers,
                body: response.data
            }, 'out');
        } catch (error) {
            const axiosError = error.response?.data;
            error.message = `${error.message}: ${axiosError?.error?.message || axiosError?.message || ''}`;
            throw error;
        }
    }
};
```

**Pattern 2: Full URL with API Version Header**
```javascript
'use strict';

const { API_VERSION } = require('../../lib');  // If lib.js exists

module.exports = {
    async receive(context) {
        const { url, method, body } = context.messages.in.content;

        const requestOptions = {
            method: method,
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'API-Version': API_VERSION  // Service-specific version header
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        await context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
```

## API-Specific Considerations

Research and implement the following based on the service's API documentation:

1. **Authentication Method**:
   - Bearer token: `Authorization: Bearer {token}`
   - Basic auth: Use `auth: { user, password }` in httpRequest
   - API key in header: `X-API-Key: {key}`

2. **Required Headers**:
   - API Version (e.g., GitHub: `X-GitHub-Api-Version: 2022-11-28`)
   - Accept header (e.g., Notion: `Notion-Version: 2022-06-28`)
   - Content-Type (usually `application/json`)

3. **Base URL Handling**:
   - If relative URLs: prepend base URL from `context.auth.resource` or hardcoded
   - If full URLs: use `url` directly

4. **Error Handling**:
   - Extract meaningful error messages from API responses
   - Handle rate limiting, authentication errors appropriately

## Examples Reference

Study these existing implementations:

1. **Microsoft Dynamics** (`src/appmixer/microsoft/dynamics/MakeApiCall/`)
   - Uses base URL from auth context
   - Prepends URL with resource
   - Has comprehensive error handling

2. **Notion** (`src/appmixer/notion/core/MakeApiCall/`)
   - Uses full URLs
   - Includes API version header
   - References lib.js for constants

3. **GitHub** (`src/appmixer/github/list/MakeApiCall/`)
   - Uses full URLs
   - Includes accept and version headers
   - Clean structure

## Validation Checklist

Before completing, verify:

- [ ] Connector name is specified
- [ ] Component doesn't already exist
- [ ] API documentation researched (or knowledge used with disclaimer)
- [ ] Correct module selected (core, list, or service-specific)
- [ ] Auth service matches connector auth.js
- [ ] Quota manager matches connector quota.js (if exists)
- [ ] Required headers identified from API docs
- [ ] Base URL handling correct for the API
- [ ] Error handling implemented
- [ ] Icon included (use connector's icon)
- [ ] Examples in tooltips are service-specific and accurate

## Output Format

1. Create both files with proper content
2. Use .github/prompts/post-refactor-bundle-update.prompt.md to update the connector bundle minor version
3. Provide a summary of:
   - API research findings
   - Key API requirements implemented
   - Example usage
   - Any assumptions made or documentation gaps

## Success Criteria

- Component allows making any authenticated API call to the service
- Proper authentication headers included
- API-specific requirements (versions, headers) implemented
- Error messages are informative
- Code follows Appmixer conventions and existing patterns
