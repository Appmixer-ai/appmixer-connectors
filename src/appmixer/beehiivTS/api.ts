// Auto-generated from OpenAPI spec. Do not edit.

import type {
    AppmixerContext,
    ApiOperation,
    BeehiivApiListResponse
} from './types';

// --------------------------------------------------------------------------
// Parameter interfaces
// --------------------------------------------------------------------------

interface IndexParams {
    publicationId: string;
    [key: string]: unknown;
}

interface Index2Params {
    publicationId: string;
    automationId: string;
    status?: string;
    limit?: number;
    page?: number;
    [key: string]: unknown;
}

interface CreateParams {
    publicationId: string;
    automationId: string;
    email: string;
    subscription_id?: string;
    double_opt_override?: string;
    [key: string]: unknown;
}

interface ShowParams {
    publicationId: string;
    automationId: string;
    automationJourneyId: string;
    [key: string]: unknown;
}

interface Index3Params {
    publicationId: string;
    limit?: number;
    page?: number;
    [key: string]: unknown;
}

interface Show2Params {
    publicationId: string;
    automationId: string;
    [key: string]: unknown;
}

interface Create2Params {
    publicationId: string;
    subscriptions?: unknown[];
    [key: string]: unknown;
}

interface Index4Params {
    publicationId: string;
    [key: string]: unknown;
}

interface Show3Params {
    publicationId: string;
    id: string;
    [key: string]: unknown;
}

interface PutParams {
    publicationId: string;
    subscriptions?: unknown[];
    [key: string]: unknown;
}

interface PatchParams {
    publicationId: string;
    subscriptions?: unknown[];
    [key: string]: unknown;
}

interface Index5Params {
    publicationId: string;
    status?: string;
    tier?: string;
    limit?: number;
    cursor?: string;
    page?: number;
    email?: string;
    order_by?: string;
    direction?: string;
    creation_date?: string;
    [key: string]: unknown;
}

interface Create3Params {
    publicationId: string;
    email: string;
    reactivate_existing?: boolean;
    send_welcome_email?: boolean;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    referring_site?: string;
    referral_code?: string;
    custom_fields?: unknown[];
    double_opt_override?: string;
    tier?: string;
    premium_tiers?: unknown[];
    premium_tier_ids?: string[];
    stripe_customer_id?: string;
    automation_ids?: string[];
    [key: string]: unknown;
}

interface PutStatusParams {
    publicationId: string;
    subscription_ids?: string[];
    new_status?: string;
    [key: string]: unknown;
}

interface PatchStatusParams {
    publicationId: string;
    subscription_ids?: string[];
    new_status?: string;
    [key: string]: unknown;
}

interface Index6Params {
    publicationId: string;
    [key: string]: unknown;
}

interface Create4Params {
    publicationId: string;
    kind: string;
    display: string;
    [key: string]: unknown;
}

interface Show4Params {
    publicationId: string;
    id: string;
    [key: string]: unknown;
}

interface Put2Params {
    publicationId: string;
    id: string;
    display: string;
    [key: string]: unknown;
}

interface Patch2Params {
    publicationId: string;
    id: string;
    display: string;
    [key: string]: unknown;
}

interface DeleteParams {
    publicationId: string;
    id: string;
    [key: string]: unknown;
}

interface Index7Params {
    publicationId: string;
    start_date?: string;
    number_of_days?: number;
    granularity?: string;
    email_type?: string;
    direction?: string;
    [key: string]: unknown;
}

interface Index8Params {
    publicationId: string;
    limit?: number;
    cursor?: string;
    page?: number;
    order_by?: string;
    direction?: string;
    post_id?: string;
    [key: string]: unknown;
}

interface Show5Params {
    publicationId: string;
    pollId: string;
    [key: string]: unknown;
}

interface ListResponsesParams {
    publicationId: string;
    pollId: string;
    limit?: number;
    cursor?: string;
    page?: number;
    order_by?: string;
    direction?: string;
    post_id?: string;
    [key: string]: unknown;
}

interface Index9Params {
    publicationId: string;
    expand?: string;
    audience?: string;
    platform?: string;
    status?: string;
    premium_tiers?: string[];
    limit?: number;
    page?: number;
    order_by?: string;
    direction?: string;
    hidden_from_feed?: boolean;
    [key: string]: unknown;
}

interface Create5Params {
    publicationId: string;
    body_content?: string;
    blocks?: unknown[];
    title?: string;
    subtitle?: string;
    post_template_id?: string;
    status?: string;
    scheduled_at?: string;
    custom_link_tracking_enabled?: boolean;
    email_capture_type_override?: string;
    override_scheduled_at?: boolean;
    social_share?: unknown;
    thumbnail_image_url?: string;
    recipients?: unknown;
    email_settings?: unknown;
    web_settings?: unknown;
    seo_settings?: unknown;
    content_tags?: string[];
    headers?: unknown;
    custom_fields?: unknown[];
    [key: string]: unknown;
}

interface AggregateStatsParams {
    publicationId: string;
    audience?: string;
    platform?: string;
    status?: string;
    hidden_from_feed?: boolean;
    [key: string]: unknown;
}

interface Show6Params {
    publicationId: string;
    postId: string;
    expand?: string;
    premium_tiers?: string[];
    [key: string]: unknown;
}

interface Delete2Params {
    publicationId: string;
    postId: string;
    [key: string]: unknown;
}

interface Index10Params {
    publicationId: string;
    limit?: number;
    page?: number;
    order?: string;
    order_by?: string;
    [key: string]: unknown;
}

interface Index11Params {
    expand?: string;
    limit?: number;
    page?: number;
    direction?: string;
    order_by?: string;
    [key: string]: unknown;
}

interface Show7Params {
    publicationId: string;
    expand?: string;
    [key: string]: unknown;
}

interface Show8Params {
    publicationId: string;
    limit?: number;
    page?: number;
    [key: string]: unknown;
}

interface Index12Params {
    publicationId: string;
    type?: string;
    status?: string;
    limit?: number;
    page?: number;
    order_by?: string;
    direction?: string;
    [key: string]: unknown;
}

interface Show9Params {
    publicationId: string;
    segmentId: string;
    [key: string]: unknown;
}

interface Delete3Params {
    publicationId: string;
    segmentId: string;
    [key: string]: unknown;
}

interface RecalculateParams {
    publicationId: string;
    segmentId: string;
    [key: string]: unknown;
}

interface ListMembersParams {
    publicationId: string;
    segmentId: string;
    limit?: number;
    page?: number;
    [key: string]: unknown;
}

interface ExpandResultsParams {
    publicationId: string;
    segmentId: string;
    limit?: number;
    page?: number;
    [key: string]: unknown;
}

interface GetByEmailParams {
    publicationId: string;
    email: string;
    [key: string]: unknown;
}

interface UpdateByEmailParams {
    publicationId: string;
    email: string;
    tier?: string;
    premium_tier_ids?: string[];
    premium_tiers?: unknown[];
    stripe_customer_id?: string;
    unsubscribe?: boolean;
    custom_fields?: unknown[];
    [key: string]: unknown;
}

interface GetByIdParams {
    publicationId: string;
    subscriberId: string;
    [key: string]: unknown;
}

interface Put3Params {
    publicationId: string;
    subscriberId: string;
    tier?: string;
    premium_tier_ids?: string[];
    premium_tiers?: unknown[];
    email?: string;
    stripe_customer_id?: string;
    unsubscribe?: boolean;
    custom_fields?: unknown[];
    [key: string]: unknown;
}

interface Patch3Params {
    publicationId: string;
    subscriberId: string;
    email?: string;
    tier?: string;
    premium_tier_ids?: string[];
    premium_tiers?: unknown[];
    stripe_customer_id?: string;
    unsubscribe?: boolean;
    custom_fields?: unknown[];
    [key: string]: unknown;
}

interface Delete4Params {
    publicationId: string;
    subscriberId: string;
    [key: string]: unknown;
}

interface Create6Params {
    publicationId: string;
    subscriberId: string;
    tags?: string[];
    [key: string]: unknown;
}

interface Index13Params {
    publicationId: string;
    limit?: number;
    page?: number;
    direction?: string;
    [key: string]: unknown;
}

interface Create7Params {
    publicationId: string;
    name: string;
    description?: string;
    prices_attributes?: unknown[];
    [key: string]: unknown;
}

interface Show10Params {
    publicationId: string;
    tierId: string;
    [key: string]: unknown;
}

interface Put4Params {
    publicationId: string;
    tierId: string;
    name?: string;
    description?: string;
    prices_attributes?: unknown[];
    [key: string]: unknown;
}

interface Patch4Params {
    publicationId: string;
    tierId: string;
    name?: string;
    description?: string;
    prices_attributes?: unknown[];
    [key: string]: unknown;
}

interface Index14Params {
    publicationId: string;
    limit?: number;
    [key: string]: unknown;
}

interface Create8Params {
    publicationId: string;
    url: string;
    event_types?: string[];
    description?: string;
    [key: string]: unknown;
}

interface Show11Params {
    publicationId: string;
    endpointId: string;
    [key: string]: unknown;
}

interface UpdateParams {
    publicationId: string;
    endpointId: string;
    event_types?: string[];
    description?: string;
    [key: string]: unknown;
}

interface Delete5Params {
    publicationId: string;
    endpointId: string;
    [key: string]: unknown;
}

interface IdentifyParams {
    [key: string]: unknown;
}

interface PublicationsBySubscriptionEmailParams {
    email: string;
    expand?: string;
    [key: string]: unknown;
}

// --------------------------------------------------------------------------
// API operations
// --------------------------------------------------------------------------

const Index: ApiOperation<IndexParams, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/advertisement_opportunities',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, ...rest }: IndexParams) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/advertisement_opportunities`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index2: ApiOperation<Index2Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/automations/{automationId}/journeys',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, automationId, status, limit, page, ...rest }: Index2Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}/journeys`,
            params: { status, limit, page, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create: ApiOperation<CreateParams, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/automations/{automationId}/journeys',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, {
        publicationId, automationId, email, subscription_id: subscriptionId,
        double_opt_override: doubleOptOverride, ...rest
    }: CreateParams) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}/journeys`,
            data: { email, 'subscription_id': subscriptionId, 'double_opt_override': doubleOptOverride, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show: ApiOperation<ShowParams, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/automations/{automationId}/journeys/{automationJourneyId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, automationId, automationJourneyId, ...rest }: ShowParams) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}/journeys/${automationJourneyId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index3: ApiOperation<Index3Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/automations',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, limit, page, ...rest }: Index3Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations`,
            params: { limit, page, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show2: ApiOperation<Show2Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/automations/{automationId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, automationId, ...rest }: Show2Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create2: ApiOperation<Create2Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/bulk_subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, { publicationId, subscriptions, ...rest }: Create2Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscriptions`,
            data: { subscriptions, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index4: ApiOperation<Index4Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/bulk_subscription_updates',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, ...rest }: Index4Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscription_updates`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show3: ApiOperation<Show3Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/bulk_subscription_updates/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, id, ...rest }: Show3Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscription_updates/${id}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Put: ApiOperation<PutParams, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions/bulk_actions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context: AppmixerContext, { publicationId, subscriptions, ...rest }: PutParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/bulk_actions`,
            data: { subscriptions, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Patch: ApiOperation<PatchParams, unknown> = {
    method: 'PATCH',
    path: '/publications/{publicationId}/subscriptions/bulk_actions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context: AppmixerContext, { publicationId, subscriptions, ...rest }: PatchParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/bulk_actions`,
            data: { subscriptions, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index5: ApiOperation<Index5Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, {
        publicationId, status, tier, limit, cursor, page, email, order_by: orderBy, direction,
        creation_date: creationDate, ...rest
    }: Index5Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            params: { status, tier, limit, cursor, page, email, 'order_by': orderBy, direction, 'creation_date': creationDate, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create3: ApiOperation<Create3Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, {
        publicationId, email, reactivate_existing: reactivateExisting, send_welcome_email: sendWelcomeEmail,
        utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_term: utmTerm,
        utm_content: utmContent, referring_site: referringSite, referral_code: referralCode,
        custom_fields: customFields, double_opt_override: doubleOptOverride, tier, premium_tiers: premiumTiers,
        premium_tier_ids: premiumTierIds, stripe_customer_id: stripeCustomerId, automation_ids: automationIds,
        ...rest
    }: Create3Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            data: {
                email, 'reactivate_existing': reactivateExisting, 'send_welcome_email': sendWelcomeEmail,
                'utm_source': utmSource, 'utm_medium': utmMedium, 'utm_campaign': utmCampaign, 'utm_term': utmTerm,
                'utm_content': utmContent, 'referring_site': referringSite, 'referral_code': referralCode,
                'custom_fields': customFields, 'double_opt_override': doubleOptOverride, tier, 'premium_tiers': premiumTiers,
                'premium_tier_ids': premiumTierIds, 'stripe_customer_id': stripeCustomerId, 'automation_ids': automationIds, ...rest
            },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const PutStatus: ApiOperation<PutStatusParams, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put-status',
    async execute(context: AppmixerContext, { publicationId, subscription_ids: subscriptionIds, new_status: newStatus, ...rest }: PutStatusParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            data: { 'subscription_ids': subscriptionIds, 'new_status': newStatus, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const PatchStatus: ApiOperation<PatchStatusParams, unknown> = {
    method: 'PATCH',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch-status',
    async execute(context: AppmixerContext, { publicationId, subscription_ids: subscriptionIds, new_status: newStatus, ...rest }: PatchStatusParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            data: { 'subscription_ids': subscriptionIds, 'new_status': newStatus, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index6: ApiOperation<Index6Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/custom_fields',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, ...rest }: Index6Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create4: ApiOperation<Create4Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/custom_fields',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, { publicationId, kind, display, ...rest }: Create4Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields`,
            data: { kind, display, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show4: ApiOperation<Show4Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, id, ...rest }: Show4Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Put2: ApiOperation<Put2Params, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context: AppmixerContext, { publicationId, id, display, ...rest }: Put2Params) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            data: { display, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Patch2: ApiOperation<Patch2Params, unknown> = {
    method: 'PATCH',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context: AppmixerContext, { publicationId, id, display, ...rest }: Patch2Params) {
        const response = await context.httpRequest<unknown>({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            data: { display, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Delete: ApiOperation<DeleteParams, unknown> = {
    method: 'DELETE',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context: AppmixerContext, { publicationId, id, ...rest }: DeleteParams) {
        const response = await context.httpRequest<unknown>({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index7: ApiOperation<Index7Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/engagements',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, {
        publicationId, start_date: startDate, number_of_days: numberOfDays, granularity,
        email_type: emailType, direction, ...rest
    }: Index7Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/engagements`,
            params: { 'start_date': startDate, 'number_of_days': numberOfDays, granularity, 'email_type': emailType, direction, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index8: ApiOperation<Index8Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/polls',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, {
        publicationId, limit, cursor, page, order_by: orderBy, direction, post_id: postId, ...rest
    }: Index8Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/polls`,
            params: { limit, cursor, page, 'order_by': orderBy, direction, 'post_id': postId, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show5: ApiOperation<Show5Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/polls/{pollId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, pollId, ...rest }: Show5Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/polls/${pollId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const ListResponses: ApiOperation<ListResponsesParams, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/polls/{pollId}/responses',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/list-responses',
    async execute(context: AppmixerContext, {
        publicationId, pollId, limit, cursor, page, order_by: orderBy, direction, post_id: postId, ...rest
    }: ListResponsesParams) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/polls/${pollId}/responses`,
            params: { limit, cursor, page, 'order_by': orderBy, direction, 'post_id': postId, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index9: ApiOperation<Index9Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/posts',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, {
        publicationId, expand, audience, platform, status, premium_tiers: premiumTiers, limit, page,
        order_by: orderBy, direction, hidden_from_feed: hiddenFromFeed, ...rest
    }: Index9Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
            params: {
                expand, audience, platform, status, 'premium_tiers': premiumTiers, limit, page,
                'order_by': orderBy, direction, 'hidden_from_feed': hiddenFromFeed, ...rest
            },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create5: ApiOperation<Create5Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/posts',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, {
        publicationId, body_content: bodyContent, blocks, title, subtitle, post_template_id: postTemplateId,
        status, scheduled_at: scheduledAt, custom_link_tracking_enabled: customLinkTrackingEnabled,
        email_capture_type_override: emailCaptureTypeOverride, override_scheduled_at: overrideScheduledAt,
        social_share: socialShare, thumbnail_image_url: thumbnailImageUrl, recipients,
        email_settings: emailSettings, web_settings: webSettings, seo_settings: seoSettings,
        content_tags: contentTags, headers, custom_fields: customFields, ...rest
    }: Create5Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
            data: {
                'body_content': bodyContent, blocks, title, subtitle, 'post_template_id': postTemplateId,
                status, 'scheduled_at': scheduledAt, 'custom_link_tracking_enabled': customLinkTrackingEnabled,
                'email_capture_type_override': emailCaptureTypeOverride, 'override_scheduled_at': overrideScheduledAt,
                'social_share': socialShare, 'thumbnail_image_url': thumbnailImageUrl, recipients,
                'email_settings': emailSettings, 'web_settings': webSettings, 'seo_settings': seoSettings,
                'content_tags': contentTags, headers, 'custom_fields': customFields, ...rest
            },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const AggregateStats: ApiOperation<AggregateStatsParams, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/posts/aggregate_stats',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/aggregate-stats',
    async execute(context: AppmixerContext, { publicationId, audience, platform, status, hidden_from_feed: hiddenFromFeed, ...rest }: AggregateStatsParams) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts/aggregate_stats`,
            params: { audience, platform, status, 'hidden_from_feed': hiddenFromFeed, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show6: ApiOperation<Show6Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/posts/{postId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, postId, expand, premium_tiers: premiumTiers, ...rest }: Show6Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${postId}`,
            params: { expand, 'premium_tiers': premiumTiers, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Delete2: ApiOperation<Delete2Params, unknown> = {
    method: 'DELETE',
    path: '/publications/{publicationId}/posts/{postId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context: AppmixerContext, { publicationId, postId, ...rest }: Delete2Params) {
        const response = await context.httpRequest<unknown>({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${postId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index10: ApiOperation<Index10Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/post_templates',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, limit, page, order, order_by: orderBy, ...rest }: Index10Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/post_templates`,
            params: { limit, page, order, 'order_by': orderBy, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index11: ApiOperation<Index11Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { expand, limit, page, direction, order_by: orderBy, ...rest }: Index11Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: 'https://api.beehiiv.com/v2/publications',
            params: { expand, limit, page, direction, 'order_by': orderBy, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show7: ApiOperation<Show7Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, expand, ...rest }: Show7Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}`,
            params: { expand, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show8: ApiOperation<Show8Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/referral_program',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, limit, page, ...rest }: Show8Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/referral_program`,
            params: { limit, page, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index12: ApiOperation<Index12Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/segments',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, type, status, limit, page, order_by: orderBy, direction, ...rest }: Index12Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments`,
            params: { type, status, limit, page, 'order_by': orderBy, direction, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show9: ApiOperation<Show9Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/segments/{segmentId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, segmentId, ...rest }: Show9Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Delete3: ApiOperation<Delete3Params, unknown> = {
    method: 'DELETE',
    path: '/publications/{publicationId}/segments/{segmentId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context: AppmixerContext, { publicationId, segmentId, ...rest }: Delete3Params) {
        const response = await context.httpRequest<unknown>({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Recalculate: ApiOperation<RecalculateParams, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/segments/{segmentId}/recalculate',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/recalculate',
    async execute(context: AppmixerContext, { publicationId, segmentId, ...rest }: RecalculateParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}/recalculate`,
            data: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const ListMembers: ApiOperation<ListMembersParams, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/segments/{segmentId}/members',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/list-members',
    async execute(context: AppmixerContext, { publicationId, segmentId, limit, page, ...rest }: ListMembersParams) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}/members`,
            params: { limit, page, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const ExpandResults: ApiOperation<ExpandResultsParams, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/segments/{segmentId}/results',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/expand-results',
    async execute(context: AppmixerContext, { publicationId, segmentId, limit, page, ...rest }: ExpandResultsParams) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}/results`,
            params: { limit, page, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const GetByEmail: ApiOperation<GetByEmailParams, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/subscriptions/by_email/{email}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/get-by-email',
    async execute(context: AppmixerContext, { publicationId, email, ...rest }: GetByEmailParams) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${email}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const UpdateByEmail: ApiOperation<UpdateByEmailParams, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions/by_email/{email}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/update-by-email',
    async execute(context: AppmixerContext, {
        publicationId, email, tier, premium_tier_ids: premiumTierIds, premium_tiers: premiumTiers,
        stripe_customer_id: stripeCustomerId, unsubscribe, custom_fields: customFields, ...rest
    }: UpdateByEmailParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${email}`,
            data: { email, tier, 'premium_tier_ids': premiumTierIds, 'premium_tiers': premiumTiers, 'stripe_customer_id': stripeCustomerId, unsubscribe, 'custom_fields': customFields, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const GetById: ApiOperation<GetByIdParams, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/get-by-id',
    async execute(context: AppmixerContext, { publicationId, subscriberId, ...rest }: GetByIdParams) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Put3: ApiOperation<Put3Params, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context: AppmixerContext, {
        publicationId, subscriberId, tier, premium_tier_ids: premiumTierIds, premium_tiers: premiumTiers,
        email, stripe_customer_id: stripeCustomerId, unsubscribe, custom_fields: customFields, ...rest
    }: Put3Params) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            data: { tier, 'premium_tier_ids': premiumTierIds, 'premium_tiers': premiumTiers, email, 'stripe_customer_id': stripeCustomerId, unsubscribe, 'custom_fields': customFields, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Patch3: ApiOperation<Patch3Params, unknown> = {
    method: 'PATCH',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context: AppmixerContext, {
        publicationId, subscriberId, email, tier, premium_tier_ids: premiumTierIds,
        premium_tiers: premiumTiers, stripe_customer_id: stripeCustomerId, unsubscribe,
        custom_fields: customFields, ...rest
    }: Patch3Params) {
        const response = await context.httpRequest<unknown>({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            data: { email, tier, 'premium_tier_ids': premiumTierIds, 'premium_tiers': premiumTiers, 'stripe_customer_id': stripeCustomerId, unsubscribe, 'custom_fields': customFields, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Delete4: ApiOperation<Delete4Params, unknown> = {
    method: 'DELETE',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context: AppmixerContext, { publicationId, subscriberId, ...rest }: Delete4Params) {
        const response = await context.httpRequest<unknown>({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create6: ApiOperation<Create6Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}/tags',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, { publicationId, subscriberId, tags, ...rest }: Create6Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}/tags`,
            data: { tags, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index13: ApiOperation<Index13Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/tiers',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, limit, page, direction, ...rest }: Index13Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers`,
            params: { limit, page, direction, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create7: ApiOperation<Create7Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/tiers',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, { publicationId, name, description, prices_attributes: pricesAttributes, ...rest }: Create7Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers`,
            data: { name, description, 'prices_attributes': pricesAttributes, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show10: ApiOperation<Show10Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/tiers/{tierId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, tierId, ...rest }: Show10Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers/${tierId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Put4: ApiOperation<Put4Params, unknown> = {
    method: 'PUT',
    path: '/publications/{publicationId}/tiers/{tierId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context: AppmixerContext, { publicationId, tierId, name, description, prices_attributes: pricesAttributes, ...rest }: Put4Params) {
        const response = await context.httpRequest<unknown>({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers/${tierId}`,
            data: { name, description, 'prices_attributes': pricesAttributes, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Patch4: ApiOperation<Patch4Params, unknown> = {
    method: 'PATCH',
    path: '/publications/{publicationId}/tiers/{tierId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context: AppmixerContext, { publicationId, tierId, name, description, prices_attributes: pricesAttributes, ...rest }: Patch4Params) {
        const response = await context.httpRequest<unknown>({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers/${tierId}`,
            data: { name, description, 'prices_attributes': pricesAttributes, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Index14: ApiOperation<Index14Params, BeehiivApiListResponse<unknown>> = {
    method: 'GET',
    path: '/publications/{publicationId}/webhooks',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context: AppmixerContext, { publicationId, limit, ...rest }: Index14Params) {
        const response = await context.httpRequest<BeehiivApiListResponse<unknown>>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks`,
            params: { limit, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Create8: ApiOperation<Create8Params, unknown> = {
    method: 'POST',
    path: '/publications/{publicationId}/webhooks',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context: AppmixerContext, { publicationId, url, event_types: eventTypes, description, ...rest }: Create8Params) {
        const response = await context.httpRequest<unknown>({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks`,
            data: { url, 'event_types': eventTypes, description, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Show11: ApiOperation<Show11Params, unknown> = {
    method: 'GET',
    path: '/publications/{publicationId}/webhooks/{endpointId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context: AppmixerContext, { publicationId, endpointId, ...rest }: Show11Params) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks/${endpointId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Update: ApiOperation<UpdateParams, unknown> = {
    method: 'PATCH',
    path: '/publications/{publicationId}/webhooks/{endpointId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/update',
    async execute(context: AppmixerContext, { publicationId, endpointId, event_types: eventTypes, description, ...rest }: UpdateParams) {
        const response = await context.httpRequest<unknown>({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks/${endpointId}`,
            data: { 'event_types': eventTypes, description, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Delete5: ApiOperation<Delete5Params, unknown> = {
    method: 'DELETE',
    path: '/publications/{publicationId}/webhooks/{endpointId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context: AppmixerContext, { publicationId, endpointId, ...rest }: Delete5Params) {
        const response = await context.httpRequest<unknown>({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks/${endpointId}`,
            params: { ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const Identify: ApiOperation<IdentifyParams, unknown> = {
    method: 'GET',
    path: '/workspaces/identify',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/identify',
    async execute(context: AppmixerContext, _input: IdentifyParams) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: 'https://api.beehiiv.com/v2/workspaces/identify',
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

const PublicationsBySubscriptionEmail: ApiOperation<PublicationsBySubscriptionEmailParams, unknown> = {
    method: 'GET',
    path: '/workspaces/publications/by_subscription_email/{email}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/publications-by-subscription-email',
    async execute(context: AppmixerContext, { email, expand, ...rest }: PublicationsBySubscriptionEmailParams) {
        const response = await context.httpRequest<unknown>({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/workspaces/publications/by_subscription_email/${email}`,
            params: { expand, ...rest },
            headers: { Authorization: `Bearer ${context.auth.apiKey}` }
        });
        return response.data;
    }
};

module.exports = {
    Index,
    Index2,
    Create,
    Show,
    Index3,
    Show2,
    Create2,
    Index4,
    Show3,
    Put,
    Patch,
    Index5,
    Create3,
    PutStatus,
    PatchStatus,
    Index6,
    Create4,
    Show4,
    Put2,
    Patch2,
    Delete,
    Index7,
    Index8,
    Show5,
    ListResponses,
    Index9,
    Create5,
    AggregateStats,
    Show6,
    Delete2,
    Index10,
    Index11,
    Show7,
    Show8,
    Index12,
    Show9,
    Delete3,
    Recalculate,
    ListMembers,
    ExpandResults,
    GetByEmail,
    UpdateByEmail,
    GetById,
    Put3,
    Patch3,
    Delete4,
    Create6,
    Index13,
    Create7,
    Show10,
    Put4,
    Patch4,
    Index14,
    Create8,
    Show11,
    Update,
    Delete5,
    Identify,
    PublicationsBySubscriptionEmail
};
