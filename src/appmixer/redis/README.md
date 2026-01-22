# Redis Connector for Appmixer

This connector provides integration with Redis, an open-source in-memory data structure store used as a database, cache, and message broker.

## Converted from n8n

This connector was converted from the n8n Redis node available at:
https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes/Redis

## Features

### Authentication
- Host/port configuration
- Database selection
- Optional username/password authentication (Redis 6+ ACL)
- SSL/TLS support with optional certificate verification bypass

### Components

#### Core Operations

1. **DeleteKey** - Delete a key from Redis
   - Input: key name
   - Output: number of keys deleted

2. **GetValue** - Retrieve a value by key
   - Input: key name, optional key type (automatic, string, hash, list, sets)
   - Output: key, value, type
   - Supports automatic type detection

3. **SetValue** - Store a value with optional expiration
   - Input: key, value, key type, expiration settings
   - Output: key, value
   - Supports multiple data types: string, hash, list, set
   - Optional TTL (time-to-live) expiration

4. **IncrementKey** - Atomically increment a key's value
   - Input: key, optional expiration settings
   - Output: key, new value
   - Creates key with value 0 if it doesn't exist

5. **GetInfo** - Get Redis server information and statistics
   - Input: none
   - Output: structured server info object

6. **FindKeys** - Find keys matching a pattern
   - Input: pattern (supports wildcards like `user:*`)
   - Output: array of matching keys
   - Optional: also retrieve values for matching keys

7. **GetListLength** - Get the length of a list
   - Input: key name
   - Output: key, length

8. **PopFromList** - Remove and return element from list
   - Input: key, side (left/right)
   - Output: key, value
   - LPOP or RPOP based on side selection

9. **PushToList** - Add element to list
   - Input: key, value, side (left/right)
   - Output: key, new list length
   - LPUSH or RPUSH based on side selection

10. **PublishMessage** - Publish message to pub/sub channel
    - Input: channel, message
    - Output: channel, message, number of subscribers

#### Trigger Components

1. **OnMessage** - Listen to Redis pub/sub channels
   - Properties: channels (comma-separated patterns), parseJSON, onlyMessage
   - Output: channel, message
   - Supports pattern-based subscriptions with wildcards
   - Optional JSON parsing
   - Continuous listening using pattern subscribe (pSubscribe)

## Data Type Support

The connector supports Redis data types:
- **String**: Simple key-value pairs
- **Hash**: Maps of field-value pairs
- **List**: Ordered collections
- **Set**: Unordered collections of unique values

## Installation

Dependencies are automatically installed via the connector's package.json:
```bash
cd src/appmixer/redis
npm install
```

## Usage Examples

### Setting a Value
```javascript
{
  "key": "user:1001:name",
  "value": "John Doe",
  "keyType": "string",
  "expire": true,
  "ttl": 3600
}
```

### Getting a Value
```javascript
{
  "key": "user:1001:name",
  "keyType": "automatic"  // Auto-detects type
}
```

### Finding Keys by Pattern
```javascript
{
  "pattern": "user:*",
  "getValues": true  // Also retrieve values
}
```

### Pub/Sub Publishing
```javascript
{
  "channel": "notifications",
  "message": "{\"type\": \"alert\", \"text\": \"New message\"}"
}
```

### Pub/Sub Subscription (Trigger)
```javascript
{
  "channels": "notifications:*, events:user:*",
  "parseJSON": true,
  "onlyMessage": false
}
```

## Differences from n8n Implementation

1. **Authentication**: Appmixer uses a dedicated auth.js file instead of credentials config
2. **Component Structure**: Each operation is a separate Appmixer component vs. single n8n node
3. **Trigger Implementation**: Uses Appmixer's start/stop lifecycle methods
4. **Type System**: Uses Appmixer's schema-based type definitions
5. **Error Handling**: Uses Appmixer's CancelError for validation errors
6. **Connection Management**: Each component creates and cleans up its own client connection

## Technical Notes

### Library Functions (lib.js)

The connector includes helper functions:
- `createRedisClient(auth, isTest)` - Creates and connects a Redis client
- `convertInfoToObject(stringData)` - Parses INFO command output
- `getParsedValue(value)` - Converts numeric strings to numbers
- `getValue(client, keyName, type)` - Retrieves value by type
- `setValue(client, keyName, value, expire, ttl, type, valueIsJSON)` - Sets value with options

### Connection Handling

- Exponential backoff reconnection strategy (production)
- Proper cleanup in finally blocks
- Both quit() and disconnect() fallback for reliability

### Trigger Lifecycle

The OnMessage trigger:
1. **start()**: Creates client, subscribes to patterns, sets up message handler
2. **Message Handler**: Processes incoming messages, optionally parses JSON
3. **stop()**: Unsubscribes and disconnects client

## Version

- Initial version: 1.0.0
- Based on n8n Redis node version 1.0

## License

This connector is part of the Appmixer connectors repository.
