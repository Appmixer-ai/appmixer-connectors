# Research Connector

Research API authentication options for a connector and optionally post findings to a GitHub issue.

## Arguments
- `$ARGUMENTS` - Format: `<github-issue-url>`
    - `github-issue-url` (required): GitHub issue URL to read requirements from

## Instructions

### Step 0: Read GitHub Issue (if provided)

If a GitHub issue URL is provided, **first read the issue description**:
```bash
gh issue view <issue-number> --repo <owner/repo>
```

Extract from the issue:
- **Expected Actions** (e.g., CreateTask, GetUser, UpdateRecord)
- **Expected Triggers** (e.g., NewTask, TaskUpdated, NewMessage)
- Any specific API endpoints or features mentioned
- Any constraints or requirements

Use this information to focus your API research on the relevant endpoints.

### Questions to Answer

1. **Is the API public?**
    - Free to use or requires paid plan?

2. **OAuth2 Multitenant Support**
    - Can we build a multitenant OAuth2 application where multiple users authenticate through a single Client ID and Client Secret?
    - If yes, provide:
        - How to obtain Client ID and Client Secret
        - Authorization URL
        - Token URL
        - Available scopes
        - Configuration requirements
        - Any limitations or considerations

3. **Alternative Authentication (if OAuth2 not supported)**
    - Is API key authentication supported?
    - If yes, provide:
        - Steps to generate API keys
        - How to use in requests (header name, format)
        - Any usage limitations

4. **API Endpoints Analysis**
    - Research the full API surface area (all available endpoints)
    - For each endpoint, identify:
        - Resource name and description
        - API endpoint URL
        - HTTP method
        - Key parameters
        - Any plan restrictions or limitations
    - **Include a valid documentation link** for each endpoint
    - If a GitHub issue is provided and lists expected actions/triggers, make sure to cover those
    - Flag any requested features that are NOT supported by the API

5. **Suggested Components**
    - Based on the API endpoints found, propose a list of Appmixer components to implement
    - **Actions** — each action must include:
        - Component name (e.g., `CreateSubscription`, `ListPosts`, `GetUser`)
        - Component type: `Get`, `List`, `Find`, `Create`, `Update`, or `Delete`
        - API endpoint and HTTP method
        - Notes (filters, pagination, limitations, plan restrictions)
    - **Triggers** — each trigger must include:
        - Component name (e.g., `NewSubscription`, `PostSent`)
        - Mechanism: webhook event type or polling endpoint
        - Notes (plan requirements, event details)
    - Prioritize core CRUD operations for primary entities
    - Flag components with API restrictions (e.g., "Enterprise only", "beta", "requires Scale plan")

### Research Process

1. If GitHub issue provided, read it first to get requirements
2. Search for `<connector-name> API documentation`
3. Look for authentication/authorization sections
4. Check for OAuth2 app registration/console
5. Look for API key/token generation options
6. Research all available API endpoints — build a complete endpoint map
7. Propose suggested components based on discovered endpoints

### Output Format

Provide a structured summary:

```markdown
## <Connector Name> API Authentication Research

### 1. API Availability
- Public: Yes/No
- Pricing: Free/Paid/Freemium

### 2. OAuth2 Multitenant Support
- Supported: Yes/No
- App Console URL: <url>
- Authorization URL: <url>
- Token URL: <url>
- Scopes: <list>
- Limitations: <any>

### 3. API Key Authentication (if applicable)
- Supported: Yes/No
- Generation: <steps>
- Header: <header-name>
- Limitations: <any>

### 4. API Endpoints Analysis

| Resource | Endpoint | Method | Docs |
|----------|----------|--------|------|
| List Tasks | `/v2/tasks` | GET | [docs](https://api.example.com/docs/tasks/list) |
| Create Task | `/v2/tasks` | POST | [docs](https://api.example.com/docs/tasks/create) |
| ... | ... | ... | ... |

### 5. Suggested Components

#### Actions
| Component | Type | API Endpoint | Method | Notes |
|-----------|------|-------------|--------|-------|
| **ListTasks** | List | `/v2/tasks` | GET | Paginated |
| **CreateTask** | Create | `/v2/tasks` | POST | |
| **GetTask** | Get | `/v2/tasks/{taskId}` | GET | |
| **UpdateTask** | Update | `/v2/tasks/{taskId}` | PUT | |
| **DeleteTask** | Delete | `/v2/tasks/{taskId}` | DELETE | |
| **FindTask** | Find | `/v2/tasks/search` | GET | Search by name |
| ... | ... | ... | ... | ... |

#### Triggers
| Component | Webhook Event / Polling | Notes |
|-----------|------------------------|-------|
| **NewTask** | `task.created` | Webhook |
| **TaskUpdated** | `task.updated` | Webhook |
| ... | ... | ... |

#### Unsupported Features
- <List any requested features not supported by API>

### 6. Key Technical Details
- <Pagination details, rate limits, scoping, etc.>

### Recommendation
<OAuth2 preferred, API key as fallback, or other>
```

### GitHub Issue Comment

If a GitHub issue URL is provided, post the research summary as a comment using:
```bash
gh issue comment <issue-number> --repo <owner/repo> --body "<summary>"
```

## Example Usage

```
/research-connector todoist https://developer.todoist.com/api/v1/
/research-connector slack https://api.slack.com/docs https://github.com/org/repo/issues/123
```
