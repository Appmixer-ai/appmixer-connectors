s# Research Connector Authentication

Research API authentication options for a connector and optionally post findings to a GitHub issue.

## Arguments
- `$ARGUMENTS` - Format: `<github-issue-url>`
    - `github-issue-url` (required): GitHub issue URL to read requirements from and post findings to

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

4. **API Endpoints for Required Components** (if GitHub issue provided)
   - For each expected action/trigger from the issue, identify:
     - Relevant API endpoint
     - HTTP method
     - Required parameters
     - Whether it's supported by the API
   - Flag any requested features that are NOT supported by the API

### Research Process

1. If GitHub issue provided, read it first to get requirements
2. Search for `<connector-name> API documentation`
3. Look for authentication/authorization sections
4. Check for OAuth2 app registration/console
5. Look for API key/token generation options
6. Research specific endpoints for required actions/triggers

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

### 4. API Endpoints Analysis (if requirements from issue)

#### Actions
| Component | API Endpoint | Method | Supported |
|-----------|--------------|--------|-----------|
| CreateTask | POST /tasks | POST | Yes |
| ... | ... | ... | ... |

#### Triggers
| Component | API Support | Method | Notes |
|-----------|-------------|--------|-------|
| NewTask | Webhooks | POST | Requires webhook registration |
| ... | ... | ... | ... |

#### Unsupported Features
- <List any requested features not supported by API>

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
