# Mailerlite Connector - Context and Planning

## Service Overview
Mailerlite is an email marketing platform that provides tools for creating, sending, and managing email campaigns. Key features include subscriber management, campaign creation, automation workflows, landing pages, and detailed analytics.

## API Documentation
Official API Documentation: https://developers.mailerlite.com/docs/#mailerlite-api

## Authentication Method
**Type**: API Key Authentication
**Method**: Bearer Token in Authorization header
**Documentation**: https://developers.mailerlite.com/docs/#authentication

### How to obtain API Key:
1. Log in to your Mailerlite account
2. Navigate to Integrations > Developer API
3. Generate a new API token
4. Copy the generated token for use in the connector

**Authentication Format**: 
- Header: `Authorization: Bearer {api_token}`
- The API token is used as a Bearer token in the Authorization header

## Planned Components

Based on the Mailerlite API documentation and core email marketing functionality, the following components should be implemented:

### Subscriber Management
1. **CreateSubscriber** - Add a new subscriber to a group
   - Endpoint: POST /api/subscribers
   - Purpose: Add subscribers to mailing lists

2. **UpdateSubscriber** - Update existing subscriber information
   - Endpoint: PUT /api/subscribers/{subscriber_id}
   - Purpose: Modify subscriber details and preferences

3. **DeleteSubscriber** - Remove a subscriber
   - Endpoint: DELETE /api/subscribers/{subscriber_id}
   - Purpose: Remove subscribers from the system

4. **GetSubscriber** - Retrieve subscriber details
   - Endpoint: GET /api/subscribers/{subscriber_id}
   - Purpose: Fetch individual subscriber information

5. **ListSubscribers** - Get list of subscribers
   - Endpoint: GET /api/subscribers
   - Purpose: Retrieve subscribers with filtering options

### Group Management
6. **CreateGroup** - Create a new subscriber group
   - Endpoint: POST /api/groups
   - Purpose: Organize subscribers into groups/segments

7. **ListGroups** - Get all groups
   - Endpoint: GET /api/groups
   - Purpose: Retrieve available subscriber groups

8. **UpdateGroup** - Update group information
   - Endpoint: PUT /api/groups/{group_id}
   - Purpose: Modify group details

9. **DeleteGroup** - Remove a group
   - Endpoint: DELETE /api/groups/{group_id}
   - Purpose: Delete subscriber groups

### Campaign Management
10. **CreateCampaign** - Create a new email campaign
    - Endpoint: POST /api/campaigns
    - Purpose: Create email marketing campaigns

11. **ListCampaigns** - Get all campaigns
    - Endpoint: GET /api/campaigns
    - Purpose: Retrieve campaign list with status information

12. **GetCampaign** - Get campaign details
    - Endpoint: GET /api/campaigns/{campaign_id}
    - Purpose: Fetch specific campaign information

13. **UpdateCampaign** - Update campaign details
    - Endpoint: PUT /api/campaigns/{campaign_id}
    - Purpose: Modify campaign settings

14. **DeleteCampaign** - Remove a campaign
    - Endpoint: DELETE /api/campaigns/{campaign_id}
    - Purpose: Delete campaigns

15. **SendCampaign** - Send/schedule a campaign
    - Endpoint: POST /api/campaigns/{campaign_id}/actions/send
    - Purpose: Execute email campaign delivery

### Analytics and Reporting
16. **GetCampaignStats** - Retrieve campaign statistics
    - Endpoint: GET /api/campaigns/{campaign_id}/reports
    - Purpose: Get campaign performance metrics

17. **GetSubscriberActivity** - Get subscriber activity
    - Endpoint: GET /api/subscribers/{subscriber_id}/activities
    - Purpose: Track subscriber engagement

### Fields Management
18. **ListFields** - Get custom fields
    - Endpoint: GET /api/fields
    - Purpose: Retrieve available subscriber fields

19. **CreateField** - Create custom field
    - Endpoint: POST /api/fields
    - Purpose: Add custom subscriber data fields

### Automation (if API supports)
20. **ListAutomations** - Get automation workflows
    - Endpoint: GET /api/automations
    - Purpose: Retrieve available automation workflows

## Priority Implementation Order
1. **Phase 1 (Core)**: CreateSubscriber, ListSubscribers, GetSubscriber, ListGroups
2. **Phase 2 (Campaigns)**: CreateCampaign, ListCampaigns, SendCampaign, GetCampaignStats
3. **Phase 3 (Management)**: UpdateSubscriber, DeleteSubscriber, CreateGroup, UpdateGroup
4. **Phase 4 (Advanced)**: DeleteCampaign, UpdateCampaign, ListFields, CreateField

## API Rate Limits
- Standard rate limits apply (to be verified during implementation)
- Implement appropriate quota management

## Special Considerations
- Handle email validation properly
- Support for custom fields and subscriber metadata
- Campaign status management (draft, sent, scheduled)
- Proper error handling for invalid email addresses
- Support for subscriber preferences and consent management
