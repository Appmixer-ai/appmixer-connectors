# Klaviyo Connector Validation

This document contains the validation results for all Klaviyo connector components.

## Overview

The Klaviyo connector provides 25 components across 6 categories:
- **Campaigns** (8 components): Create, manage, and send marketing campaigns
- **Lists** (7 components): Manage customer lists and memberships
- **Profiles** (6 components): Create and manage customer profiles
- **Events** (1 component): Track customer events
- **Metrics** (2 components): Access campaign and profile metrics
- **Segments** (1 component): Access customer segments

## Testing Strategy

Components are tested in a strategic order that follows real-world usage patterns:

1. **Foundation**: Retrieve existing data (Lists, Profiles, Segments, Metrics)
2. **Core Creation**: Create basic entities (Profile, List)
3. **Data Operations**: Retrieve and manage created entities
4. **Campaign Operations**: Create and manage campaigns
5. **Events & Updates**: Track events and update entities
6. **Advanced Operations**: Advanced campaign and segment operations
7. **Cleanup**: Remove test data

## Test Commands

### Phase 1: Foundation - Basic Data Retrieval

```bash
# FindLists - Retrieve all available lists
appmixer test component ./src/appmixer/klaviyo/list/FindLists -i '{"in":{"outputType":"array"}}'
```

```bash
# FindProfiles - Search for customer profiles  
appmixer test component ./src/appmixer/klaviyo/profile/FindProfiles -i '{"in":{"outputType":"array"}}'
```

```bash
# FindSegments - Retrieve all segments
appmixer test component ./src/appmixer/klaviyo/segment/FindSegments -i '{"in":{"outputType":"array"}}'
```

```bash
# FindMetrics - Get all available metrics
appmixer test component ./src/appmixer/klaviyo/metric/FindMetrics -i '{"in":{"outputType":"array"}}'
```

### Phase 2: Core Data Creation

```bash
# CreateProfile - Create a new customer profile
appmixer test component ./src/appmixer/klaviyo/profile/CreateProfile -i '{"in":{"email":"test.appmixer@example.com","firstName":"John","lastName":"Doe","city":"New York","country":"USA"}}'
```

```bash
# CreateList - Create a new static list  
appmixer test component ./src/appmixer/klaviyo/list/CreateList -i '{"in":{"name":"Appmixer Test List"}}'
```

### Phase 3: Data Operations

**Note:** Replace `PROFILE_ID_FROM_CREATE` and `LIST_ID_FROM_CREATE` with actual IDs from Phase 2 results.

```bash
# GetProfile - Retrieve specific profile by ID
appmixer test component ./src/appmixer/klaviyo/profile/GetProfile -i '{"in":{"profileId":"PROFILE_ID_FROM_CREATE"}}'
```

```bash
# GetList - Retrieve specific list by ID
appmixer test component ./src/appmixer/klaviyo/list/GetList -i '{"in":{"listId":"LIST_ID_FROM_CREATE"}}'
```

```bash
# AddProfilesToList - Add profiles to a list
appmixer test component ./src/appmixer/klaviyo/list/AddProfilesToList -i '{"in":{"listId":"LIST_ID_FROM_CREATE","profiles":[{"email":"test.appmixer@example.com"}]}}'
```

```bash
# ListListProfiles - List profiles in a specific list
appmixer test component ./src/appmixer/klaviyo/profile/ListListProfiles -i '{"in":{"listId":"LIST_ID_FROM_CREATE","outputType":"array"}}'
```

### Phase 4: Campaign Operations

**Note:** Replace `LIST_ID_FROM_CREATE` and `CAMPAIGN_ID_FROM_CREATE` with actual IDs from previous results.

```bash
# CreateCampaign - Create a new campaign
appmixer test component ./src/appmixer/klaviyo/campaign/CreateCampaign -i '{"in":{"name":"Appmixer Test Campaign","channelFilter":"email","audiencesIncluded":[{"type":"list","listId":"LIST_ID_FROM_CREATE"}],"sendStrategyMethod":"immediate"}}'
```

```bash
# FindCampaigns - Retrieve all campaigns
appmixer test component ./src/appmixer/klaviyo/campaign/FindCampaigns -i '{"in":{"outputType":"array"}}'
```

```bash
# GetCampaign - Retrieve specific campaign by ID
appmixer test component ./src/appmixer/klaviyo/campaign/GetCampaign -i '{"in":{"campaignId":"CAMPAIGN_ID_FROM_CREATE"}}'
```

### Phase 5: Events and Updates

**Note:** Replace IDs with actual values from previous results.

```bash
# CreateEvent - Create a profile event
appmixer test component ./src/appmixer/klaviyo/event/CreateEvent -i '{"in":{"type":"Custom Event","profileEmail":"test.appmixer@example.com","properties":{"event_name":"Appmixer Test Event","value":"test"}}}'
```

```bash
# UpdateProfile - Update an existing profile
appmixer test component ./src/appmixer/klaviyo/profile/UpdateProfile -i '{"in":{"profileId":"PROFILE_ID_FROM_CREATE","firstName":"Jane","lastName":"Smith","city":"Los Angeles"}}'
```

```bash
# UpdateList - Update an existing list
appmixer test component ./src/appmixer/klaviyo/list/UpdateList -i '{"in":{"listId":"LIST_ID_FROM_CREATE","name":"Updated Appmixer Test List"}}'
```

```bash
# UpdateCampaign - Update an existing campaign
appmixer test component ./src/appmixer/klaviyo/campaign/UpdateCampaign -i '{"in":{"campaignId":"CAMPAIGN_ID_FROM_CREATE","name":"Updated Appmixer Test Campaign"}}'
```

### Phase 6: Advanced Operations  

**Note:** Replace IDs with actual values from previous results.

```bash
# ListSegmentProfiles - List profiles in segments (use existing segment ID)
appmixer test component ./src/appmixer/klaviyo/profile/ListSegmentProfiles -i '{"in":{"segmentId":"SEGMENT_ID_FROM_FIND_SEGMENTS","outputType":"array"}}'
```

```bash
# GetMetric - Get specific metric by ID (use existing metric ID)
appmixer test component ./src/appmixer/klaviyo/metric/GetMetric -i '{"in":{"metricId":"METRIC_ID_FROM_FIND_METRICS"}}'
```

```bash
# CloneCampaign - Clone an existing campaign
appmixer test component ./src/appmixer/klaviyo/campaign/CloneCampaign -i '{"in":{"campaignId":"CAMPAIGN_ID_FROM_CREATE","name":"Cloned Appmixer Test Campaign"}}'
```

```bash
# CreateCampaignSendJob - Create campaign send job
appmixer test component ./src/appmixer/klaviyo/campaign/CreateCampaignSendJob -i '{"in":{"campaignId":"CAMPAIGN_ID_FROM_CREATE"}}'
```

```bash
# UpdateCampaignSendJob - Update campaign send job
appmixer test component ./src/appmixer/klaviyo/campaign/UpdateCampaignSendJob -i '{"in":{"campaignId":"CAMPAIGN_ID_FROM_CREATE","action":"cancel"}}'
```

### Phase 7: Cleanup

**Note:** Replace IDs with actual values from previous results.

```bash
# RemoveProfilesFromList - Remove profiles from list
appmixer test component ./src/appmixer/klaviyo/list/RemoveProfilesFromList -i '{"in":{"listId":"LIST_ID_FROM_CREATE","profiles":[{"email":"test.appmixer@example.com"}]}}'
```

```bash
# DeleteCampaign - Delete the test campaign
appmixer test component ./src/appmixer/klaviyo/campaign/DeleteCampaign -i '{"in":{"campaignId":"CAMPAIGN_ID_FROM_CREATE"}}'
```

```bash
# DeleteList - Delete the test list
appmixer test component ./src/appmixer/klaviyo/list/DeleteList -i '{"in":{"listId":"LIST_ID_FROM_CREATE"}}'
```

## Testing Notes

1. **Authentication**: Ensure your Klaviyo API key is properly configured as an environment variable.

2. **ID Management**: 
   - After Phase 2 (CreateProfile, CreateList), note the returned IDs
   - Replace placeholder IDs in subsequent commands with actual values
   - Some components may require existing segment/metric IDs from Phase 1

3. **Campaign Testing**: 
   - Campaign creation requires at least one included audience (list or segment)
   - Send jobs can only be created for valid campaigns
   - Some operations may require campaigns to be in specific states

4. **Cleanup**: 
   - Always run cleanup commands to avoid leaving test data
   - Some deletions may fail if resources are in use (e.g., active campaigns)

5. **Error Handling**: 
   - If a test fails due to missing dependencies, ensure prerequisite components ran successfully
   - Some components may have specific business rules (e.g., unique email addresses)

## Validation Status

❌ **Not Started** - Execute the test commands above in order to validate all components.

Once testing is complete, update this README with:
- ✅ Successfully tested commands
- ❌ Failed tests with error details  
- 📝 Additional notes or requirements discovered during testing

## Component Coverage

**Total Components: 25**

### Campaign Components (8)
- [ ] CloneCampaign
- [ ] CreateCampaign  
- [ ] CreateCampaignSendJob
- [ ] DeleteCampaign
- [ ] FindCampaigns
- [ ] GetCampaign
- [ ] UpdateCampaign
- [ ] UpdateCampaignSendJob

### List Components (7)
- [ ] AddProfilesToList
- [ ] CreateList
- [ ] DeleteList
- [ ] FindLists
- [ ] GetList
- [ ] RemoveProfilesFromList
- [ ] UpdateList

### Profile Components (6)
- [ ] CreateProfile
- [ ] FindProfiles
- [ ] GetProfile
- [ ] ListListProfiles
- [ ] ListSegmentProfiles
- [ ] UpdateProfile

### Event Components (1)
- [ ] CreateEvent

### Metric Components (2)
- [ ] FindMetrics
- [ ] GetMetric

### Segment Components (1)
- [ ] FindSegments
