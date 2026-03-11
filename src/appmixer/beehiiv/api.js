// Auto-generated from OpenAPI spec. Do not edit.

const Index = {
    method: 'GET',
    path: '/publications/{publicationId}/advertisement_opportunities',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/advertisement_opportunities`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index2 = {
    method: 'GET',
    path: '/publications/{publicationId}/automations/{automationId}/journeys',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, automationId, status, limit, page, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}/journeys`,
            params: { status, limit, page, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create = {
    method: 'POST',
    path: '/publications/{publicationId}/automations/{automationId}/journeys',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, {
        publicationId, automationId, email, subscription_id: subscriptionId,
        double_opt_override: doubleOptOverride, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}/journeys`,
            data: { email, 'subscription_id': subscriptionId, 'double_opt_override': doubleOptOverride, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show = {
    method: 'GET',
    path: '/publications/{publicationId}/automations/{automationId}/journeys/{automationJourneyId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, automationId, automationJourneyId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}/journeys/${automationJourneyId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index3 = {
    method: 'GET',
    path: '/publications/{publicationId}/automations',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, limit, page, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations`,
            params: { limit, page, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show2 = {
    method: 'GET',
    path: '/publications/{publicationId}/automations/{automationId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, automationId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/automations/${automationId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create2 = {
    method: 'POST',
    path: '/publications/{publicationId}/bulk_subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, { publicationId, subscriptions, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscriptions`,
            data: { subscriptions, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index4 = {
    method: 'GET',
    path: '/publications/{publicationId}/bulk_subscription_updates',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscription_updates`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show3 = {
    method: 'GET',
    path: '/publications/{publicationId}/bulk_subscription_updates/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, id, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscription_updates/${id}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Put = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions/bulk_actions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context, { publicationId, subscriptions, ...rest }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/bulk_actions`,
            data: { subscriptions, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Patch = {
    method: 'PATCH',
    path: '/publications/{publicationId}/subscriptions/bulk_actions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context, { publicationId, subscriptions, ...rest }) {
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/bulk_actions`,
            data: { subscriptions, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index5 = {
    method: 'GET',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, {
        publicationId, status, tier, limit, cursor, page, email, order_by: orderBy, direction,
        creation_date: creationDate, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            params: { status, tier, limit, cursor, page, email, 'order_by': orderBy, direction, 'creation_date': creationDate, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create3 = {
    method: 'POST',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, {
        publicationId, email, reactivate_existing: reactivateExisting, send_welcome_email: sendWelcomeEmail,
        utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_term: utmTerm,
        utm_content: utmContent, referring_site: referringSite, referral_code: referralCode,
        custom_fields: customFields, double_opt_override: doubleOptOverride, tier, premium_tiers: premiumTiers,
        premium_tier_ids: premiumTierIds, stripe_customer_id: stripeCustomerId, automation_ids: automationIds,
        ...rest
    }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            data: {
                email, 'reactivate_existing': reactivateExisting, 'send_welcome_email': sendWelcomeEmail, 'utm_source': utmSource, 'utm_medium': utmMedium, 'utm_campaign': utmCampaign, 'utm_term': utmTerm,
                'utm_content': utmContent, 'referring_site': referringSite, 'referral_code': referralCode, 'custom_fields': customFields, 'double_opt_override': doubleOptOverride, tier, 'premium_tiers': premiumTiers,
                'premium_tier_ids': premiumTierIds, 'stripe_customer_id': stripeCustomerId, 'automation_ids': automationIds, ...rest
            },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const PutStatus = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put-status',
    async execute(context, { publicationId, subscription_ids: subscriptionIds, new_status: newStatus, ...rest }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            data: { 'subscription_ids': subscriptionIds, 'new_status': newStatus, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const PatchStatus = {
    method: 'PATCH',
    path: '/publications/{publicationId}/subscriptions',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch-status',
    async execute(context, { publicationId, subscription_ids: subscriptionIds, new_status: newStatus, ...rest }) {
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
            data: { 'subscription_ids': subscriptionIds, 'new_status': newStatus, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index6 = {
    method: 'GET',
    path: '/publications/{publicationId}/custom_fields',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create4 = {
    method: 'POST',
    path: '/publications/{publicationId}/custom_fields',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, { publicationId, kind, display, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields`,
            data: { kind, display, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show4 = {
    method: 'GET',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, id, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Put2 = {
    method: 'PUT',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context, { publicationId, id, display, ...rest }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            data: { display, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Patch2 = {
    method: 'PATCH',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context, { publicationId, id, display, ...rest }) {
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            data: { display, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Delete = {
    method: 'DELETE',
    path: '/publications/{publicationId}/custom_fields/{id}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context, { publicationId, id, ...rest }) {
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/custom_fields/${id}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index7 = {
    method: 'GET',
    path: '/publications/{publicationId}/engagements',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, {
        publicationId, start_date: startDate, number_of_days: numberOfDays, granularity, email_type: emailType,
        direction, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/engagements`,
            params: { 'start_date': startDate, 'number_of_days': numberOfDays, granularity, 'email_type': emailType, direction, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index8 = {
    method: 'GET',
    path: '/publications/{publicationId}/polls',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, {
        publicationId, limit, cursor, page, order_by: orderBy, direction, post_id: postId, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/polls`,
            params: { limit, cursor, page, 'order_by': orderBy, direction, 'post_id': postId, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show5 = {
    method: 'GET',
    path: '/publications/{publicationId}/polls/{pollId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, pollId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/polls/${pollId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const ListResponses = {
    method: 'GET',
    path: '/publications/{publicationId}/polls/{pollId}/responses',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/list-responses',
    async execute(context, {
        publicationId, pollId, limit, cursor, page, order_by: orderBy, direction, post_id: postId, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/polls/${pollId}/responses`,
            params: { limit, cursor, page, 'order_by': orderBy, direction, 'post_id': postId, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index9 = {
    method: 'GET',
    path: '/publications/{publicationId}/posts',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, {
        publicationId, expand, audience, platform, status, premium_tiers: premiumTiers, limit, page,
        order_by: orderBy, direction, hidden_from_feed: hiddenFromFeed, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
            params: {
                expand, audience, platform, status, 'premium_tiers': premiumTiers, limit, page, 'order_by': orderBy, direction,
                'hidden_from_feed': hiddenFromFeed, ...rest
            },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create5 = {
    method: 'POST',
    path: '/publications/{publicationId}/posts',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, {
        publicationId, body_content: bodyContent, blocks, title, subtitle, post_template_id: postTemplateId,
        status, scheduled_at: scheduledAt, custom_link_tracking_enabled: customLinkTrackingEnabled,
        email_capture_type_override: emailCaptureTypeOverride, override_scheduled_at: overrideScheduledAt,
        social_share: socialShare, thumbnail_image_url: thumbnailImageUrl, recipients,
        email_settings: emailSettings, web_settings: webSettings, seo_settings: seoSettings,
        content_tags: contentTags, headers, custom_fields: customFields, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
            data: {
                'body_content': bodyContent, blocks, title, subtitle, 'post_template_id': postTemplateId, status, 'scheduled_at': scheduledAt,
                'custom_link_tracking_enabled': customLinkTrackingEnabled, 'email_capture_type_override': emailCaptureTypeOverride, 'override_scheduled_at': overrideScheduledAt, 'social_share': socialShare,
                'thumbnail_image_url': thumbnailImageUrl, recipients, 'email_settings': emailSettings, 'web_settings': webSettings, 'seo_settings': seoSettings, 'content_tags': contentTags, headers,
                'custom_fields': customFields, ...rest
            },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const AggregateStats = {
    method: 'GET',
    path: '/publications/{publicationId}/posts/aggregate_stats',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/aggregate-stats',
    async execute(context, { publicationId, audience, platform, status, hidden_from_feed: hiddenFromFeed, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts/aggregate_stats`,
            params: { audience, platform, status, 'hidden_from_feed': hiddenFromFeed, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show6 = {
    method: 'GET',
    path: '/publications/{publicationId}/posts/{postId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, postId, expand, premium_tiers: premiumTiers, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${postId}`,
            params: { expand, 'premium_tiers': premiumTiers, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Delete2 = {
    method: 'DELETE',
    path: '/publications/{publicationId}/posts/{postId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context, { publicationId, postId, ...rest }) {
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${postId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index10 = {
    method: 'GET',
    path: '/publications/{publicationId}/post_templates',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, limit, page, order, order_by: orderBy, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/post_templates`,
            params: { limit, page, order, 'order_by': orderBy, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index11 = {
    method: 'GET',
    path: '/publications',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { expand, limit, page, direction, order_by: orderBy, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.beehiiv.com/v2/publications',
            params: { expand, limit, page, direction, 'order_by': orderBy, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show7 = {
    method: 'GET',
    path: '/publications/{publicationId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, expand, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}`,
            params: { expand, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show8 = {
    method: 'GET',
    path: '/publications/{publicationId}/referral_program',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, limit, page, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/referral_program`,
            params: { limit, page, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index12 = {
    method: 'GET',
    path: '/publications/{publicationId}/segments',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, type, status, limit, page, order_by: orderBy, direction, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments`,
            params: { type, status, limit, page, 'order_by': orderBy, direction, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show9 = {
    method: 'GET',
    path: '/publications/{publicationId}/segments/{segmentId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, segmentId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Delete3 = {
    method: 'DELETE',
    path: '/publications/{publicationId}/segments/{segmentId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context, { publicationId, segmentId, ...rest }) {
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Recalculate = {
    method: 'PUT',
    path: '/publications/{publicationId}/segments/{segmentId}/recalculate',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/recalculate',
    async execute(context, { publicationId, segmentId, ...rest }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}/recalculate`,
            data: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const ListMembers = {
    method: 'GET',
    path: '/publications/{publicationId}/segments/{segmentId}/members',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/list-members',
    async execute(context, { publicationId, segmentId, limit, page, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}/members`,
            params: { limit, page, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const ExpandResults = {
    method: 'GET',
    path: '/publications/{publicationId}/segments/{segmentId}/results',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/expand-results',
    async execute(context, { publicationId, segmentId, limit, page, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/segments/${segmentId}/results`,
            params: { limit, page, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const GetByEmail = {
    method: 'GET',
    path: '/publications/{publicationId}/subscriptions/by_email/{email}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/get-by-email',
    async execute(context, { publicationId, email, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${email}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const UpdateByEmail = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions/by_email/{email}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/update-by-email',
    async execute(context, {
        publicationId, email, tier, premium_tier_ids: premiumTierIds, premium_tiers: premiumTiers,
        stripe_customer_id: stripeCustomerId, unsubscribe, custom_fields: customFields, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/by_email/${email}`,
            data: { email, tier, 'premium_tier_ids': premiumTierIds, 'premium_tiers': premiumTiers, 'stripe_customer_id': stripeCustomerId, unsubscribe, 'custom_fields': customFields, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const GetById = {
    method: 'GET',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/get-by-id',
    async execute(context, { publicationId, subscriberId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Put3 = {
    method: 'PUT',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context, {
        publicationId, subscriberId, tier, premium_tier_ids: premiumTierIds, premium_tiers: premiumTiers,
        email, stripe_customer_id: stripeCustomerId, unsubscribe, custom_fields: customFields, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            data: { tier, 'premium_tier_ids': premiumTierIds, 'premium_tiers': premiumTiers, email, 'stripe_customer_id': stripeCustomerId, unsubscribe, 'custom_fields': customFields, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Patch3 = {
    method: 'PATCH',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context, {
        publicationId, subscriberId, email, tier, premium_tier_ids: premiumTierIds,
        premium_tiers: premiumTiers, stripe_customer_id: stripeCustomerId, unsubscribe,
        custom_fields: customFields, ...rest
    }) {
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            data: { email, tier, 'premium_tier_ids': premiumTierIds, 'premium_tiers': premiumTiers, 'stripe_customer_id': stripeCustomerId, unsubscribe, 'custom_fields': customFields, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Delete4 = {
    method: 'DELETE',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context, { publicationId, subscriberId, ...rest }) {
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create6 = {
    method: 'POST',
    path: '/publications/{publicationId}/subscriptions/{subscriptionId}/tags',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, { publicationId, subscriberId, tags, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions/${subscriberId}/tags`,
            data: { tags, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index13 = {
    method: 'GET',
    path: '/publications/{publicationId}/tiers',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, limit, page, direction, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers`,
            params: { limit, page, direction, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create7 = {
    method: 'POST',
    path: '/publications/{publicationId}/tiers',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, { publicationId, name, description, prices_attributes: pricesAttributes, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers`,
            data: { name, description, 'prices_attributes': pricesAttributes, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show10 = {
    method: 'GET',
    path: '/publications/{publicationId}/tiers/{tierId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, tierId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers/${tierId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Put4 = {
    method: 'PUT',
    path: '/publications/{publicationId}/tiers/{tierId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/put',
    async execute(context, { publicationId, tierId, name, description, prices_attributes: pricesAttributes, ...rest }) {
        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers/${tierId}`,
            data: { name, description, 'prices_attributes': pricesAttributes, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Patch4 = {
    method: 'PATCH',
    path: '/publications/{publicationId}/tiers/{tierId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/patch',
    async execute(context, { publicationId, tierId, name, description, prices_attributes: pricesAttributes, ...rest }) {
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/tiers/${tierId}`,
            data: { name, description, 'prices_attributes': pricesAttributes, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Index14 = {
    method: 'GET',
    path: '/publications/{publicationId}/webhooks',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/index',
    async execute(context, { publicationId, limit, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks`,
            params: { limit, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Create8 = {
    method: 'POST',
    path: '/publications/{publicationId}/webhooks',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/create',
    async execute(context, { publicationId, url, event_types: eventTypes, description, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks`,
            data: { url, 'event_types': eventTypes, description, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Show11 = {
    method: 'GET',
    path: '/publications/{publicationId}/webhooks/{endpointId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/show',
    async execute(context, { publicationId, endpointId, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks/${endpointId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Update = {
    method: 'PATCH',
    path: '/publications/{publicationId}/webhooks/{endpointId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/update',
    async execute(context, { publicationId, endpointId, event_types: eventTypes, description, ...rest }) {
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks/${endpointId}`,
            data: { 'event_types': eventTypes, description, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Delete5 = {
    method: 'DELETE',
    path: '/publications/{publicationId}/webhooks/{endpointId}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/delete',
    async execute(context, { publicationId, endpointId, ...rest }) {
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.beehiiv.com/v2/publications/${publicationId}/webhooks/${endpointId}`,
            params: { ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const Identify = {
    method: 'GET',
    path: '/workspaces/identify',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/identify',
    async execute(context, input) {
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.beehiiv.com/v2/workspaces/identify',
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

const PublicationsBySubscriptionEmail = {
    method: 'GET',
    path: '/workspaces/publications/by_subscription_email/{email}',
    docsUrl: 'https://developers.beehiiv.com/openapi.json?api=b8f1ff54-4a50-481f-8374-498a9601c3a6#operation/publications-by-subscription-email',
    async execute(context, { email, expand, ...rest }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.beehiiv.com/v2/workspaces/publications/by_subscription_email/${email}`,
            params: { expand, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
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
