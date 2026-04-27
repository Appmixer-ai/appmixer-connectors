// Auto-generated from OpenAPI spec. Do not edit.
// This file demonstrates the TypeScript conversion pattern for the first 3-4 exports.
// See api.js for the full set of operations.

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

// --------------------------------------------------------------------------
// API operations (first 4)
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
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
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
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
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
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
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
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
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
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });
        return response.data;
    }
};

// NOTE: Remaining operations (Show2, Create2, Index4, ...) follow the same pattern.
// See api.js for the full list. This file demonstrates the conversion of the first 4.

module.exports = { Index, Index2, Create, Show, Index3 };
