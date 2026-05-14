# Part 8: Best Practices

## Code Style Guidelines (For All)

- Use 4 spaces for indentation
- Add one empty line after function definitions
- Add one empty line after the `receive` function definition
- Use camelCase for variable names in JavaScript behavior files (destructure with aliases if needed)
- Remove all unused variables and imports
- Property names in component.json must use underscore `_` or camelCase as separator (NOT pipe `|`, e.g., `lock_type` or `lockType`, not `lock|type`)
- Property names in component.json must exactly match those used in `context.messages.in.content`

## Development Guidelines (For All)

### auth.js Requirements

`auth.js` file with type `apiKey` MUST follow these rules:
- `requestProfileInfo` MUST return either:
    - An object with just the obfuscated apiKey (if profile info is not available via API) or
    - An object with the profile info

### Component Behavior (JavaScript) Requirements

Behavior JS file MUST follow these rules:
- Every required input in the component.json must be also asserted in the behavior file
- If a required input is missing, throw exception: `throw new context.CancelError('<human_readable_input_name> is required!')`
- Delete components must return an empty object, e.g., `return context.sendJson({}, 'out');` at the end of the function

### component.json Requirements

`component.json` file MUST follow these rules:
- Delete components must have `outPorts: ['out']`
- Update or delete components must have at least one required input, which is the ID of the entity being updated or deleted
- **IMPORTANT**: Find and List components must NOT include `limit` or `offset` fields in their input schema - these pagination controls are not supported by Appmixer and should be handled internally using the maximum available page size from the API

## Best Practices (AI Assistance)

Intended for AI assistance like Copilot, CodeRabbit, Claude, etc.

### Critical Restrictions for AI Code Generation

- **OAuth Scope Changes are Breaking Changes**: NEVER add new OAuth scopes to an existing connector's `component.json` `auth.scope` array without treating it as a **major** version bump. Adding a scope forces all existing users to re-authenticate. Always:
  - Bump the connector `bundle.json` to the next major version (e.g. `2.x.x` → `3.0.0`)
  - Add a `BREAKING:` prefix to the changelog entry describing the scope addition
  - Note in the PR description that existing users must re-authenticate

- **Pagination Fields**: NEVER generate `limit` or `offset` fields in Find or List component inputs. Appmixer does not support these pagination controls. Instead, use the maximum available page size from the external API and mention the limit in the component description.

- **Property Name Consistency**: Property names in `component.json` (both schema and inspector) MUST exactly match the property names used in the behavior file's `context.messages.in.content`. Use underscore `_` or camelCase as separator, NOT pipe `|`. For example:

  ```
  // component.json - WRONG
  "properties": {
    "lock|type": { "type": "string" },      // WRONG - uses pipe |
    "lock|expires_at": { "type": "string" } // WRONG - uses pipe |
  }
  
  // component.json - CORRECT (option 1: snake_case)
  "properties": {
    "lock_type": { "type": "string" },      
    "lock_expires_at": { "type": "string" }
  }
  
  // component.json - CORRECT (option 2: camelCase)
  "properties": {
    "lockType": { "type": "string" },      
    "lockExpiresAt": { "type": "string" }
  }
  
  // Behavior file - use camelCase variables
  // If component.json uses snake_case, destructure with aliases:
  const { 
    lock_type: lockType,
    lock_expires_at: lockExpiresAt
  } = context.messages.in.content;
  
  // If component.json uses camelCase, destructure directly:
  const { lockType, lockExpiresAt } = context.messages.in.content;
  ```

- **Unused Variables**: Remove all unused variables and imports. Every declared variable must be used in the code. If a property is not needed in the behavior logic, do not include it in component.json.

- **Unnecessary Input Fields**: Do not create select fields with only one option. If a value is constant, hardcode it in the behavior file instead of making it a user input.

- **Date/Time Input Types**: When a field accepts date or datetime values, use the appropriate inspector type:
    - For datetime fields: Use inspector type `"date-time"`
    - Schema: `"type": "string", "format": "date-time"`
    - Inspector: `"type": "date-time"`
    - For date-only fields: Use inspector type `"date-time"` with config `{ "enableTime": false }`
    - Do NOT use `"type": "text"` for date/datetime fields in the inspector

  Example:
  ```json
  {
    "schema": {
      "properties": {
        "expires_at": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "inspector": {
      "inputs": {
        "expires_at": {
          "type": "date-time",
          "label": "Expires At"
        }
      }
    }
  }
  ```

## Best Practices (Humans)

### Development Guidelines

- **Authentication**: Store sensitive data in auth configuration, not component code
- **Rate Limiting**: Use quota.js to prevent API abuse
- **Documentation**: Provide clear descriptions and tooltips for all fields

### Performance Considerations

- **Caching**: Cache frequently accessed data (e.g., user lists, configuration)
- **Pagination**: Handle large datasets with proper pagination
- **Locking**: Use locking mechanisms for shared resources
- **Batching**: Batch API calls when possible to reduce requests

#### Cache TTL using staticCache

When caching data (e.g., folder structures, user lists, property definitions), use `context.staticCache` with a TTL (Time-To-Live) to ensure the cache is refreshed periodically:

```javascript
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async tick(context) {
    const cacheKey = `myconnector_data_${context.componentId}`;
    let cachedData = await context.staticCache.get(cacheKey);

    if (!cachedData) {
        // Cache miss - fetch fresh data
        cachedData = await fetchData(context);
        // staticCache handles expiration automatically
        await context.staticCache.set(cacheKey, cachedData, CACHE_TTL_MS);
    }

    // ... rest of tick logic using cachedData
}
```

**Best practices for staticCache**:
- Use descriptive cache keys with connector name prefix (e.g., `hubspot_properties_contacts`)
- Include relevant identifiers in the key (e.g., user ID, folder ID) to avoid cache collisions
- Use TTL between 10-60 minutes depending on how frequently the data changes
- Combine with `context.lock()` when the fetch operation is expensive (see locking section below)

**Example with lock** (from hubspot/commons.js):
```javascript
async getObjectProperties(context, objectType) {
    const cacheKey = `hubspot_properties_${objectType}`;
    let lock;
    try {
        lock = await context.lock(cacheKey);
        const cached = await context.staticCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch data from API
        const { data } = await context.httpRequest({ /* ... */ });

        // Cache with 1 minute TTL
        await context.staticCache.set(cacheKey, data, 60 * 1000);
        return data;
    } finally {
        await lock?.unlock();
    }
}
```

**Why staticCache is preferred over state-based caching**: `staticCache` provides built-in TTL support, handles expiration automatically, and is shared across component instances. State-based caching requires manual timestamp tracking and persists in the database unnecessarily.

#### Locking for Long-Running Tick Operations

When a `tick()` function may take a long time to execute (e.g., fetching nested folder structures), use a lock to prevent concurrent execution:

```javascript
async tick(context) {
    let lock;
    try {
        lock = await context.lock(context.componentId, {
            ttl: 5 * 60 * 1000, // 5 minute lock TTL
            maxRetryCount: 0    // Don't wait, skip if already running
        });
    } catch (e) {
        // Another tick is already running, skip this one
        return;
    }

    try {
        // ... long-running tick logic
    } finally {
        lock?.unlock();
    }
}
```

**Why locking is important**: The Appmixer engine calls `tick()` at regular intervals (default: 60 seconds). If a tick operation takes longer than the interval, multiple concurrent tick executions can overwhelm external APIs and cause race conditions.

#### Batching Recursive API Calls

When fetching hierarchical data (e.g., recursive folder structures), use batched concurrent requests instead of sequential recursive calls:

```javascript
// ❌ BAD: Sequential recursive calls - slow and can timeout
async function getSubfoldersRecursive(context, folderId, result = []) {
    const { data } = await context.httpRequest({ /* ... */ });
    for (const folder of data.files) {
        result.push(folder.id);
        await getSubfoldersRecursive(context, folder.id, result); // Sequential!
    }
    return result;
}

// ✅ GOOD: Batched breadth-first traversal - faster and more reliable
async function getSubfolders(context, rootFolderId) {
    const allFolderIds = [];
    let foldersToProcess = [rootFolderId];

    while (foldersToProcess.length > 0) {
        // Process in batches of 10 to avoid overwhelming the API
        const batch = foldersToProcess.splice(0, 10);

        const batchResults = await Promise.all(
            batch.map(parentId => context.httpRequest({ /* ... */ }))
        );

        for (const { data } of batchResults) {
            for (const folder of (data.files || [])) {
                allFolderIds.push(folder.id);
                foldersToProcess.push(folder.id);
            }
        }
    }

    return allFolderIds;
}
```

**Why batching is important**: Deep recursive folder structures with hundreds of subfolders can take minutes to traverse sequentially. Batched concurrent requests significantly reduce total execution time and are less likely to timeout.
    
### Common Patterns

#### When Adding New Field to component.json

> Use-case: "I want to add a new number field `itemCount` to the `MyAwesomeComponent` component."

- Add the field to both `schema` and `inspector` sections in the `inPorts` array. Follow JSON schema format.
- Add the fields to behavior JS file, especially in `context.httpRequest` call.

#### Dynamic Field Options

Use `source` property to populate field options dynamically:

```json
{
    "inspector": {
        "inputs": {
            "projectId": {
                "type": "select",
                "source": {
                    "url": "/component/appmixer/service/core/ListProjects?outPort=out",
                    "data": {
                        "transform": "./transformers#projectsToOptions"
                    }
                }
            }
        }
    }
}
```

#### File Handling

##### file input components

```json
{
    "schema": {
        "properties": {
            "file": {
                "type": "string",
                "format": "data-url",
                "title": "File"
            }
        }
    },
    "inspector": {
        "inputs": {
            "file": {
                "type": "filepicker",
                "index": 1
            }
        }
    }
}
```

##### file output components
- use `context.saveFileStream()` in behavior JS
- must return `fileId` in output message
- should return additional info like `fileSize`, `prompt`, etc. — define these as fields in the `outPorts.schema.properties` (JSON Schema), each with a realistic `example`. See `05-component-config.md` § "Output Port Examples" for the canonical pattern.

Examples:

```javascript
const filename = `generated-image-${(new Date).toISOString()}.png`;
const file = await context.saveFileStream(filename, readStream);
return context.sendJson({ fileId: file.fileId, prompt, size }, 'out');
```
```javascript
const outFilename = filename || `${Date.now()}_elevenlabs_soundeffect`;
const file = await context.saveFileStream(outFilename, data);

return context.sendJson({ fileId: file.fileId, input: text, fileSize: file.length }, 'out');
```
