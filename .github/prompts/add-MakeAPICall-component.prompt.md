---
agent: agent
argument-hint: One or more Appmixer connector names (e.g., "github", "notion", "microsoft").
description: This prompt guides you through creating a MakeApiCall component for an Appmixer connector, including research, implementation, and validation steps.
---

# Task: Create MakeApiCall Component for Appmixer Connector

## Prerequisites

1. **Connector Name Required**: You MUST ask for the connector name if not specified. The connector name should be in lowercase (e.g., `github`, `notion`, `microsoft`).

2. **Check if Component Exists**: Before creating, verify that a MakeApiCall component doesn't already exist for this connector:
   - Search for `src/appmixer/{connector}/*/MakeApiCall/` directory (note: the folder and file names should use `MakeApiCall` with lowercase 'pi')
   - If found, STOP and inform the user that the component already exists

3. **Review Existing Connector Structure**: Examine the connector's existing files:
   - `auth.js` - to understand authentication method (OAuth2, API Key, etc.)
   - `quota.js` - if exists, to understand rate limiting resources
   - `lib.js` - if exists, to check for API_VERSION or other constants
   - `service.json` - to get the connector's service name

## Task Overview

Create a generic MakeApiCall component that allows users to make arbitrary authenticated API calls to the specified service's API. This component is essential for advanced users who need to call API endpoints not covered by existing components.

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
- `{module}` = appropriate module name (typically `core`, but check existing components in the connector to match the pattern - some use `list`, `api`, or service-specific names like `dynamics`, `sharepoint`, `gmail`)

### Naming Convention

**IMPORTANT**: There are two naming conventions in use across connectors:
- `MakeApiCall` (preferred for new components)
- `MakeAPICall` (legacy naming in some connectors)

When creating a new component, use `MakeApiCall` unless the connector already has established naming patterns that differ.

### Required Files

1. `component.json` - Component configuration
2. `MakeApiCall.js` - Component behavior (filename must match the folder name exactly)

## component.json Specification

**IMPORTANT**: Follow the correct attribute order as per Appmixer standards:
1. name, 2. author, 3. description, 4. version, 5. private (optional), 6. auth, 7. quota (if connector has quota.js), 8. inPorts, 9. outPorts, 10. icon

```json
{
    "name": "appmixer.{connector}.{module}.MakeApiCall",
    "author": "Appmixer <info@appmixer.com>",
    "description": "Performs an arbitrary authorized API call to {ServiceName} API.",
    "version": "1.0.0",
    "private": false,
    "auth": {
        "service": "appmixer:{connector}",
        "scope": []
    },
    "quota": {
        "manager": "appmixer:{connector}",
        "resources": "requests",
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
                        "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]
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
                        "tooltip": "Enter the API endpoint URL. For example: <code>https://api.{service}.com/v1/resource</code>."
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
    "icon": "data:image/svg+xml;base64,..."
}
```

### Notes on component.json:

1. **auth.service**: Must match the connector's auth.js service identifier. Check `auth.js` in the connector root. Common patterns:
   - Single service: `"appmixer:{connector}"` (e.g., `"appmixer:notion"`)
   - Nested service: `"appmixer:{connector}:{subservice}"` (e.g., `"appmixer:microsoft:dynamics"`)

2. **auth.scope**: Only include if the connector uses OAuth2 with scopes. Copy scopes from other components in the same connector.

3. **quota**: Only include if the connector has a `quota.js` file. Check existing components for the correct `resources` value.

4. **icon**: Copy the icon from another component in the same connector, or use the icon from `service.json`.

5. **tooltip examples**: Use `<code>` tags for inline code examples in tooltips. Make examples service-specific.

## MakeApiCall.js Specification

The behavior file should handle:
1. Validate required inputs (`url` and `method`)
2. Extract `url`, `method`, and `body` from input
3. Build authenticated request with proper headers
4. Handle API-specific requirements (version headers, base URL, etc.)
5. Parse and send response

**IMPORTANT Code Style Rules:**
- Use 4 spaces for indentation
- Add one empty line after the `receive` function definition
- Use `'use strict';` at the top
- Validate required fields with `throw new context.CancelError('...')`

### Common Patterns

**Pattern 1: Full URL (most common) - OAuth2 Authentication**

Use this when the API expects users to provide full URLs including the base URL.

```javascript
'use strict';

module.exports = {

    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const requestOptions = {
            method: method,
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
```

**Pattern 4: Hardcoded Base URL with Relative Paths**

Use this when all components in the connector use the same hardcoded base URL (e.g., Vercel, Stripe). Users provide relative paths instead of full URLs, ensuring consistency with other components.

```javascript
'use strict';

module.exports = {

    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const requestOptions = {
            method: method,
            url: `https://api.{service}.com${url}`,  // Hardcoded base URL from existing components
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,  // or apiKey, accessToken, etc.
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
```

**Pattern 2: Full URL with API Version Header**

Use this when the API requires a version header (e.g., GitHub, Notion).

```javascript
'use strict';

const { API_VERSION } = require('../../lib');  // If lib.js exists with API_VERSION

module.exports = {

    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const requestOptions = {
            method: method,
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                '{Service}-Version': API_VERSION  // e.g., 'Notion-Version', 'X-GitHub-Api-Version'
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
```

**Pattern 3: Relative URL with Base URL from Auth Context**

Use this when the base URL is stored in auth context (e.g., Microsoft Dynamics, services with tenant-specific URLs).

```javascript
'use strict';

module.exports = {

    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const baseUrl = context.resource || context.auth.resource;
        const requestOptions = {
            method: method,
            url: baseUrl + url,
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
            // Extract meaningful error message from API response
            const axiosError = error.response?.data;
            error.message = `${error.message}: ${axiosError?.error?.message || axiosError?.message || ''}`;
            throw error;
        }
    }
};
```

**Pattern 5: API Key Authentication**

Use this for services using API Key authentication (check auth.js for `type: 'apiKey'`).

```javascript
'use strict';

module.exports = {

    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const requestOptions = {
            method: method,
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,  // or 'X-API-Key': context.auth.apiKey
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
```

## API-Specific Considerations

Research and implement the following based on the service's API documentation:

### 1. Authentication Method

Check the connector's `auth.js` to determine which pattern to use:

| auth.js `type` | Authorization Header |
|----------------|---------------------|
| `oauth2` | `Authorization: Bearer ${context.auth.accessToken}` |
| `apiKey` | `Authorization: Bearer ${context.auth.apiKey}` or `X-API-Key: ${context.auth.apiKey}` |
| Basic auth | Use `auth: { user: context.auth.apiKey, password: 'X' }` in httpRequest |

### 2. Required Headers

Common API-specific headers to check for:
- **API Version**: GitHub (`X-GitHub-Api-Version: 2022-11-28`), Notion (`Notion-Version: 2022-06-28`)
- **Accept header**: GitHub (`accept: application/vnd.github+json`)
- **Content-Type**: Usually `application/json`, but some APIs use `application/x-www-form-urlencoded` (e.g., Stripe)

### 3. Base URL Handling

**CRITICAL STEP**: Before implementing URL handling, examine 2-3 existing components in the connector to identify the common base URL pattern used:

1. Open existing components (e.g., `GetProject/`, `CreateDeployment/`)
2. Check their JavaScript files to see how they construct URLs
3. Identify the common base URL that all components share
4. Use that same base URL pattern in MakeApiCall

| Scenario | Implementation | Example |
|----------|---------------|---------|
| **All components use same hardcoded base URL** | Hardcode base + prepend to user-provided path | Vercel: `https://api.vercel.com${url}` where users provide `/v9/projects` |
| Full URLs expected | Use `url` directly | GitHub, Notion: users provide full URL |
| Relative URLs with dynamic base | Use `context.auth.resource + url` | Microsoft Dynamics: tenant-specific base |
| Relative URLs with static base | Use hardcoded base URL + `url` | Same as "hardcoded base URL" pattern |

**Tooltip Guidance**: When using hardcoded base URL, update the tooltip to specify the path format expected:
- ❌ "Enter the full API endpoint URL" (suggests full URLs)
- ✅ "Enter the API endpoint path relative to https://api.{service}.com/" (clarifies it's a path, not full URL)

### 4. Error Handling

Only add try/catch if the API returns error details in a non-standard format. Most APIs work fine without explicit error handling since Axios/httpRequest will throw on non-2xx status codes.

## Examples Reference

Study these existing implementations for reference:

| Connector | Location | Key Features |
|-----------|----------|--------------|
| **Notion** | `src/appmixer/notion/core/MakeApiCall/` | Full URLs, API version header from lib.js |
| **GitHub** | `src/appmixer/github/list/MakeApiCall/` | Full URLs, accept + version headers |
| **Microsoft Dynamics** | `src/appmixer/microsoft/dynamics/MakeApiCall/` | Relative URLs, base URL from auth context, error handling |
| **Stripe** | `src/appmixer/stripe/core/MakeAPICall/` | API Key auth, form-urlencoded content type |
| **Clerk** | `src/appmixer/clerk/core/MakeApiCall/` | API Key auth, full URLs |

## Validation Checklist

Before completing, verify:

- [ ] Connector name is specified and component doesn't already exist
- [ ] Reviewed existing connector files (auth.js, quota.js, lib.js, service.json)
- [ ] API documentation researched (or knowledge used with disclaimer)
- [ ] Correct module selected (check existing components for pattern)
- [ ] `component.json` follows attribute order: name, author, description, version, private, auth, quota, inPorts, outPorts, icon
- [ ] `auth.service` matches connector's auth.js exactly
- [ ] `quota` section included only if connector has quota.js
- [ ] Required headers identified from API docs (version headers, accept headers)
- [ ] Base URL handling correct for the API (full vs relative URLs)
- [ ] Required field validation with `throw new context.CancelError(...)`
- [ ] Icon copied from another component in the same connector
- [ ] Tooltip examples use `<code>` tags and are service-specific
- [ ] Code style: 4-space indentation, empty line after function definition, `'use strict';` at top

## Post-Creation Steps

After creating both files:

1. **Update bundle.json**: Increment the minor version and add changelog entry <important>at the end</important> of the `changelog` object:
   ```json
   "changelog": {
        "1.1.9": [ ... ],  // existing entries
        "1.2.0": ["Added MakeApiCall component for arbitrary API calls."]
   }
   ```

2. **Verify no errors**: Run `npm run lint` on the connector to ensure no linting errors.

3. **Provide summary** with:
   - API research findings (base URL, auth method, required headers)
   - Key API requirements implemented
   - Example usage showing a sample API call
   - Any assumptions made or documentation gaps

## Success Criteria

- [ ] Component allows making any authenticated API call to the service
- [ ] Proper authentication headers included (matching auth.js pattern)
- [ ] API-specific requirements (versions, headers) implemented correctly
- [ ] Required field validation implemented
- [ ] Code follows Appmixer conventions (indentation, empty lines, strict mode)
- [ ] bundle.json updated with new version and changelog
