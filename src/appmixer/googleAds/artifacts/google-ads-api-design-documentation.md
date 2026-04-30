# Appmixer – Google Ads Integration Design Documentation

## 1. Company Overview

Appmixer is a white-labeled embedded iPaaS (Integration Platform as a Service) with a workflow automation engine and no-code workflow designer. It enables businesses to automate workflows by connecting various cloud services. Appmixer provides a JavaScript SDK, drag-and-drop flow builder, and 100+ pre-built connectors.

More info: https://docs.appmixer.com

## 2. Google Ads Integration Overview

The Appmixer Google Ads connector enables customers to manage **Customer Match audience lists** (user lists) through automated workflows. It uses the **Google Ads API v23** (REST).

The connector does **not** create or manage campaigns, ads, keywords, or budgets. It focuses exclusively on audience list management for Customer Match workflows.

## 3. Authentication

The connector uses **OAuth 2.0** authorization code flow:

1. User clicks "Connect Google Ads" in the Appmixer UI
2. User is redirected to Google's consent screen
3. User grants access to their Google Ads account
4. Appmixer receives an authorization code and exchanges it for access/refresh tokens
5. Tokens are securely stored and automatically refreshed

**Scopes requested:** `profile`, `email`, plus Google Ads API access.

Each API request includes:
- `Authorization: Bearer <access_token>` — identifies the user
- `developer-token` header — identifies the Appmixer application
- `login-customer-id` header — identifies the manager account (when applicable)

## 4. Components / Features

The connector provides the following components, all operating on Google Ads **User Lists** (Customer Match audiences):

| Component | Description | API Endpoint |
|-----------|-------------|--------------|
| **ListAccessibleCustomers** | Lists all Google Ads customer accounts accessible to the authenticated user | `GET /customers:listAccessibleCustomers` |
| **CreateUserList** | Creates a new CRM-based user list | `POST /customers/{customerId}/userLists:mutate` |
| **GetUserList** | Retrieves a single user list by resource name | `POST /customers/{customerId}/googleAds:searchStream` |
| **FindUserLists** | Searches for user lists with optional filters | `POST /customers/{customerId}/googleAds:searchStream` |
| **UpdateUserList** | Updates user list name, description, or membership lifespan | `POST /customers/{customerId}/userLists:mutate` |
| **DeleteUserList** | Removes a user list | `POST /customers/{customerId}/userLists:mutate` |
| **AddUserToUserList** | Adds a single user (by email, phone, name, etc.) to a user list via OfflineUserDataJob | `POST /customers/{customerId}/offlineUserDataJobs` |
| **RemoveUserFromUserList** | Removes a single user from a user list via OfflineUserDataJob | `POST /customers/{customerId}/offlineUserDataJobs` |
| **AddUsersFromCSVToUserList** | Bulk adds users from a CSV file to a user list | `POST /customers/{customerId}/offlineUserDataJobs` |
| **RemoveUsersInCSVFromUserList** | Bulk removes users listed in a CSV file from a user list | `POST /customers/{customerId}/offlineUserDataJobs` |

## 5. Architecture

```
┌─────────────────────┐
│   End User Browser   │
│  (Appmixer Flow UI)  │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   Appmixer Engine    │
│  (Workflow Runtime)  │
└──────────┬──────────┘
           │ HTTPS (REST)
           ▼
┌─────────────────────┐
│  Google Ads API v23  │
│  googleads.googleapis│
│        .com          │
└─────────────────────┘
```

1. User builds an automation workflow in the Appmixer drag-and-drop designer
2. The workflow triggers component execution in the Appmixer engine
3. Each component makes authenticated REST API calls to Google Ads API v23
4. Results are returned to the workflow for further processing or output

## 6. Data Handling

- **User identifiers** (emails, phone numbers) are **SHA-256 hashed** before being sent to Google Ads API, in compliance with Customer Match requirements
- CSV files with user data are processed server-side and streamed in batches
- No Google Ads data is stored permanently — it is processed within the workflow execution context
- OAuth tokens are stored encrypted on the Appmixer platform

## 7. API Usage Summary

The connector exclusively uses:
- **Customer Service** — `listAccessibleCustomers`
- **GoogleAdsService** — `searchStream` (GAQL queries for user lists)
- **UserListService** — `mutate` (create, update, remove)
- **OfflineUserDataJobService** — `create`, `addOperations`, `run` (Customer Match uploads)

No campaign, ad group, ad, keyword, billing, or reporting endpoints are used.
