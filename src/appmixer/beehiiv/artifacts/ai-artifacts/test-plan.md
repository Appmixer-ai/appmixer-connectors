## ✅ Test Plan: beehiiv Connector (21 Components)

### 🏗️ Phase 1 — Foundation
| # | Component | Purpose | Data Dependency |
|---|-----------|---------|----------------|
| 1 | **ListPublications** | Get available publications → extract `publicationId` | *(none)* |

### 📋 Phase 2 — Publication-Level Reads (parallel)
| # | Component | Purpose | Data Dependency |
|---|-----------|---------|----------------|
| 2 | **ListAutomations** | List automations for a publication | `publicationId` from #1 |
| 3 | **ListCustomFields** | List custom fields for a publication | `publicationId` from #1 |
| 4 | **ListSegments** | List audience segments for a publication | `publicationId` from #1 |

### 📝 Phase 3 — Post Workflow
| # | Component | Purpose | Data Dependency |
|---|-----------|---------|----------------|
| 5 | **CreatePost** | Create a draft post → extract `postId` | `publicationId` from #1 |
| 6 | **ListPosts** | Verify post appears in list | `publicationId` from #1 |
| 7 | **GetPost** | Retrieve the created post by ID | `publicationId` from #1, `postId` from #5 |

### 👤 Phase 4 — Subscription Lifecycle
| # | Component | Purpose | Data Dependency |
|---|-----------|---------|----------------|
| 8 | **CreateSubscription** | Add a new subscriber → extract `subscriptionId` | `publicationId` from #1 |
| 9 | **FindSubscription** | Find the subscriber by email | `publicationId` from #1, `email` from #8 |
| 10 | **ListSubscriptions** | Verify subscriber appears in list | `publicationId` from #1 |
| 11 | **GetSubscription** | Retrieve the subscription by ID | `publicationId` from #1, `subscriptionId` from #8 |
| 12 | **UpdateSubscription** | Change subscription tier | `publicationId` from #1, `subscriptionId` from #8 |
| 13 | **DeleteSubscription** | Clean up — delete the test subscription | `publicationId` from #1, `subscriptionId` from #8 |

### 🔔 Phase 5 — Webhook Triggers (event-driven, structural validation only)
| # | Component | Event |
|---|-----------|-------|
| 14 | **NewSubscription** | New subscriber signs up |
| 15 | **PostSent** | Newsletter published/sent |
| 16 | **PostUpdated** | Post is updated |
| 17 | **SubscriptionConfirmed** | Subscriber confirms double opt-in |
| 18 | **SubscriptionDeleted** | Subscriber unsubscribes |
| 19 | **SubscriptionDowngraded** | Subscriber downgrades premium → free |
| 20 | **SubscriptionUpgraded** | Subscriber upgrades free → premium |
| 21 | **SurveyResponseSubmitted** | Survey response submitted |

> ⚠️ **Note on Webhook Triggers**: Phases 14–21 are `webhook: true` components. They cannot be exercised via `validate_component` in the same way as action components. Testing them requires registering a live webhook with beehiiv and triggering the event externally. They should be validated structurally (component.json schema, outPort options) rather than functionally.