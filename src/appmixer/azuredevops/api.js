'use strict';

const BASE_URL = 'https://dev.azure.com';
const API_VERSION = '7.1';

// ─── Projects ────────────────────────────────────────────────────────────────

const ListProjects = {
    method: 'GET',
    path: '/{organization}/_apis/projects',
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1',
    async execute(context, { organization }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/${organization}/_apis/projects`,
            params: { 'api-version': API_VERSION },
            headers: { Authorization: `Bearer ${context.auth.accessToken}` }
        });
        return response.data;
    }
};

// ─── Work Items ──────────────────────────────────────────────────────────────

const CreateWorkItem = {
    method: 'POST',
    path: '/{organization}/{project}/_apis/wit/workitems/${type}',
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create?view=azure-devops-rest-7.1',
    async execute(
        context,
        { organization, project, workItemType, title, description, priority, assignedTo, areaPath, iterationPath, tags }
    ) {
        const patchDoc = [
            { op: 'add', path: '/fields/System.Title', value: title }
        ];

        if (description !== undefined && description !== null && description !== '') {
            patchDoc.push({ op: 'add', path: '/fields/System.Description', value: description });
        }
        if (priority !== undefined && priority !== null && priority !== '') {
            patchDoc.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: Number(priority) });
        }
        if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
            patchDoc.push({ op: 'add', path: '/fields/System.AssignedTo', value: assignedTo });
        }
        if (areaPath !== undefined && areaPath !== null && areaPath !== '') {
            patchDoc.push({ op: 'add', path: '/fields/System.AreaPath', value: areaPath });
        }
        if (iterationPath !== undefined && iterationPath !== null && iterationPath !== '') {
            patchDoc.push({ op: 'add', path: '/fields/System.IterationPath', value: iterationPath });
        }
        if (tags !== undefined && tags !== null && tags !== '') {
            patchDoc.push({ op: 'add', path: '/fields/System.Tags', value: tags });
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/${organization}/${project}/_apis/wit/workitems/$${workItemType}`,
            params: { 'api-version': API_VERSION },
            headers: {
                Authorization: `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json-patch+json'
            },
            data: patchDoc
        });
        return response.data;
    }
};

const GetWorkItem = {
    method: 'GET',
    path: '/{organization}/{project}/_apis/wit/workitems/{id}',
    // eslint-disable-next-line max-len
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/get-work-item?view=azure-devops-rest-7.1',
    async execute(context, { organization, project, workItemId }) {
        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/${organization}/${project}/_apis/wit/workitems/${workItemId}`,
            params: { 'api-version': API_VERSION, $expand: 'all' },
            headers: { Authorization: `Bearer ${context.auth.accessToken}` }
        });
        return response.data;
    }
};

const UpdateWorkItem = {
    method: 'PATCH',
    path: '/{organization}/{project}/_apis/wit/workitems/{id}',
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/update?view=azure-devops-rest-7.1',
    async execute(
        context,
        {
            organization, project, workItemId, title, description,
            state, priority, assignedTo, areaPath, iterationPath, tags
        }
    ) {
        const patchDoc = [];

        if (title !== undefined && title !== null && title !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.Title', value: title });
        }
        if (description !== undefined && description !== null && description !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.Description', value: description });
        }
        if (state !== undefined && state !== null && state !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.State', value: state });
        }
        if (priority !== undefined && priority !== null && priority !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/Microsoft.VSTS.Common.Priority', value: Number(priority) });
        }
        if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.AssignedTo', value: assignedTo });
        }
        if (areaPath !== undefined && areaPath !== null && areaPath !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.AreaPath', value: areaPath });
        }
        if (iterationPath !== undefined && iterationPath !== null && iterationPath !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.IterationPath', value: iterationPath });
        }
        if (tags !== undefined && tags !== null && tags !== '') {
            patchDoc.push({ op: 'replace', path: '/fields/System.Tags', value: tags });
        }

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `${BASE_URL}/${organization}/${project}/_apis/wit/workitems/${workItemId}`,
            params: { 'api-version': API_VERSION },
            headers: {
                Authorization: `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json-patch+json'
            },
            data: patchDoc
        });
        return response.data;
    }
};

const DeleteWorkItem = {
    method: 'DELETE',
    path: '/{organization}/{project}/_apis/wit/workitems/{id}',
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/delete?view=azure-devops-rest-7.1',
    async execute(context, { organization, project, workItemId }) {
        await context.httpRequest({
            method: 'DELETE',
            url: `${BASE_URL}/${organization}/${project}/_apis/wit/workitems/${workItemId}`,
            params: { 'api-version': API_VERSION },
            headers: { Authorization: `Bearer ${context.auth.accessToken}` }
        });
        return {};
    }
};

const FindWorkItems = {
    method: 'POST',
    path: '/{organization}/{project}/_apis/wit/wiql',
    // eslint-disable-next-line max-len
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/wiql/query-by-wiql?view=azure-devops-rest-7.1',
    async execute(context, { organization, project, wiqlQuery }) {
        // Step 1: Execute WIQL to get IDs
        const wiqlResponse = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/${organization}/${project}/_apis/wit/wiql`,
            params: { 'api-version': API_VERSION },
            headers: {
                Authorization: `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: { query: wiqlQuery }
        });

        const workItemRefs = wiqlResponse.data.workItems || [];
        if (workItemRefs.length === 0) {
            return { value: [], count: 0 };
        }

        // Step 2: Batch fetch work items (max 200 per request)
        const ids = workItemRefs.slice(0, 200).map(wi => wi.id).join(',');
        const detailsResponse = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/${organization}/${project}/_apis/wit/workitems`,
            params: { ids, 'api-version': API_VERSION, $expand: 'fields' },
            headers: { Authorization: `Bearer ${context.auth.accessToken}` }
        });

        return {
            value: detailsResponse.data.value || [],
            count: detailsResponse.data.count || 0
        };
    }
};

// ─── Service Hooks (Webhooks) ─────────────────────────────────────────────────

const CreateSubscription = {
    method: 'POST',
    path: '/{organization}/_apis/hooks/subscriptions',
    // eslint-disable-next-line max-len
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/hooks/subscriptions/create?view=azure-devops-rest-7.1',
    async execute(context, { organization, projectId, eventType, webhookUrl }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/${organization}/_apis/hooks/subscriptions`,
            params: { 'api-version': API_VERSION },
            headers: {
                Authorization: `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                publisherId: 'tfs',
                eventType,
                consumerId: 'webHooks',
                consumerActionId: 'httpRequest',
                publisherInputs: { projectId },
                consumerInputs: { url: webhookUrl }
            }
        });
        return response.data;
    }
};

const DeleteSubscription = {
    method: 'DELETE',
    path: '/{organization}/_apis/hooks/subscriptions/{subscriptionId}',
    // eslint-disable-next-line max-len
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/hooks/subscriptions/delete?view=azure-devops-rest-7.1',
    async execute(context, { organization, subscriptionId }) {
        await context.httpRequest({
            method: 'DELETE',
            url: `${BASE_URL}/${organization}/_apis/hooks/subscriptions/${subscriptionId}`,
            params: { 'api-version': API_VERSION },
            headers: { Authorization: `Bearer ${context.auth.accessToken}` }
        });
        return {};
    }
};

module.exports = {
    ListProjects,
    CreateWorkItem,
    GetWorkItem,
    UpdateWorkItem,
    DeleteWorkItem,
    FindWorkItems,
    CreateSubscription,
    DeleteSubscription
};
