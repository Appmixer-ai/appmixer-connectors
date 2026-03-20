# Appmixer Flow API Reference

## Authentication

```bash
# Get token from .env
source "$APPMIXER_ENV"
TOKEN=$(curl -s -X POST "$APPMIXER_BASE_URL/user/auth" \
  -H "Content-Type: application/json" \
  -d '{"username":"'"$APPMIXER_USERNAME"'","password":"'"$APPMIXER_PASSWORD"'"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
```

⚠️ Password may contain special chars (`&`, `!`). Always single-quote in shell or use the python helper script.

## Flow Endpoints

### Create Flow
```
POST /flows
Authorization: Bearer <token>
Content-Type: application/json
Body: { "name": "...", "flow": { ... } }
```

### Get Flow
```
GET /flows/<flowId>
Authorization: Bearer <token>
```
Response keys: `_id`, `flowId`, `flow`, `stage`, `name`, `btime`, `mtime`, `componentIdMap`, `started`, `stopped`

### Update Flow
```
PUT /flows/<flowId>
Authorization: Bearer <token>
Content-Type: application/json
Body: { "flow": { ... } }
```

### Delete Flow
```
DELETE /flows/<flowId>
Authorization: Bearer <token>
```

### Start Flow
```
POST /flows/<flowId>/coordinator
Authorization: Bearer <token>
Content-Type: application/json
Body: { "command": "start" }
```

### Stop Flow
```
POST /flows/<flowId>/coordinator
Authorization: Bearer <token>
Content-Type: application/json
Body: { "command": "stop" }
```

### Get Flow Stage
```
GET /flows/<flowId>
```
Check `stage` field: `stopped`, `running`, `error`

## Logs

### Query Logs
```
GET /logs?flowId=<flowId>&from=0&size=50&sort=gridTimestamp:desc
Authorization: Bearer <token>
```

Response:
```json
{
  "hits": [
    {
      "gridTimestamp": "2026-03-13T10:00:00.000Z",
      "componentId": "...",
      "componentType": "appmixer.vapi.core.ListAssistants",
      "level": "info|error|debug",
      "message": "...",
      "data": { ... }
    }
  ],
  "buckets": [],
  "size": "50",
  "nextFrom": 50
}
```

### Filter Logs by Time Range
```
GET /logs?flowId=<flowId>&from=0&size=100&sort=gridTimestamp:desc&query=gridTimestamp:[<from> TO <to>]
```

### Error Detection in Logs
Look for:
- `level: "error"` entries
- `stage: "error"` on the flow object itself
- `err` field on the flow object after stopping
- Assert component failures (type `appmixer.utils.test.Assert`)

## Accounts (Auth Credentials)

### Create Account
```
POST /accounts
Authorization: Bearer <token>
Content-Type: application/json
Body: {
  "name": "<connector> test",
  "service": "appmixer:<connector>",
  "token": { <authFields> },
  "profileInfo": {}
}
```

Response: `{ "_id": "<accountId>", ... }`

### List Accounts
```
GET /accounts
Authorization: Bearer <token>
```

## Variable Validation

### Fetch Available Variables
```
POST /variables/<flowId>/fetch?compress=true
Authorization: Bearer <token>
Content-Type: application/json
Body: {
    "useCache": false,
    "flow": false,
    "components": {
        "IDs": ["assert-create", "assert-find"],
        "properties": true,
        "links": true
    }
}
```

Response structure:
```json
{
    "components": {
        "<componentId>": {
            "links": {
                "in": {
                    "<senderComponentId>": {
                        "<senderPort>": {
                            "variables": {
                                "static": {},
                                "dynamic": [],
                                "refs": [0, 1, 2],
                                "errors": {
                                    "dynamic": {
                                        "<senderComp>": {
                                            "<port>": [{"in": [[{"message": "..."}]]}]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "dynamicComponentVariables": [
        {
            "componentId": "create-journal",
            "port": "out",
            "label": "Manual Journal ID",
            "value": "{{{$.create-journal.out.ManualJournalID}}}"
        }
    ]
}
```

**Key fields:**
- `dynamicComponentVariables` — flat list of ALL available variables, indexed by position
- `components.<id>.links.in.<sender>.<port>.variables.refs` — indices into `dynamicComponentVariables` that are available from that specific link
- `components.<id>.links.in.<sender>.<port>.variables.errors.dynamic` — present when variable references are INVALID

**Important:** Components with **dynamic output ports** (those using `generateOutputPortOptions`, like list/search components with `outputType`) only expose `Raw Output` (`{{{$.comp-id.out}}}`) in the variables list. Individual fields like `{{{$.comp-id.out.FieldName}}}` are NOT available. Use `Raw Output` with a `notEmpty` assertion instead.

## Pack & Publish (CLI)

```bash
cd <CONNECTORS_DIR>/src/appmixer
appmixer pack <connector>
appmixer publish <connector>.zip
```

Run from `src/appmixer/` directory (parent of connector dir).
