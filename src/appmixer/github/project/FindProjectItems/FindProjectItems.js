'use strict';

const lib = require('../../lib');

const query = `
            query($projectId: ID!, $after: String) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        title
                        items(first: 100, after: $after) {
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                            nodes {
                                id
                                content {
                                    __typename
                                    ... on Issue {
                                        id
                                        title
                                        url
                                        number
                                        state
                                        assignees(first: 10) {
                                            nodes {
                                                login
                                            }
                                        }
                                        labels(first: 10) {
                                            nodes {
                                                name
                                            }
                                        }
                                        repository {
                                            name
                                            owner {
                                                login
                                            }
                                        }
                                        timelineItems(first: 20, itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT]) {
                                            nodes {
                                                ... on ConnectedEvent {
                                                    subject {
                                                        ... on PullRequest {
                                                            id
                                                            title
                                                            url
                                                            number
                                                            state
                                                            assignees(first: 10) {
                                                                nodes {
                                                                    login
                                                                }
                                                            }
                                                            labels(first: 10) {
                                                                nodes {
                                                                    name
                                                                }
                                                            }
                                                            repository {
                                                                name
                                                                owner {
                                                                    login
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ... on PullRequest {
                                        id
                                        title
                                        url
                                        number
                                        state
                                        assignees(first: 10) {
                                            nodes {
                                                login
                                            }
                                        }
                                        labels(first: 10) {
                                            nodes {
                                                name
                                            }
                                        }
                                        repository {
                                            name
                                            owner {
                                                login
                                            }
                                        }
                                        timelineItems(first: 20, itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT]) {
                                            nodes {
                                                ... on ConnectedEvent {
                                                    subject {
                                                        ... on Issue {
                                                            id
                                                            title
                                                            url
                                                            number
                                                            state
                                                            assignees(first: 10) {
                                                                nodes {
                                                                    login
                                                                }
                                                            }
                                                            labels(first: 10) {
                                                                nodes {
                                                                    name
                                                                }
                                                            }
                                                            repository {
                                                                name
                                                                owner {
                                                                    login
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ... on DraftIssue {
                                        id
                                        title
                                    }
                                }
                                fieldValues(first: 20) {
                                    nodes {
                                        ... on ProjectV2ItemFieldTextValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    name
                                                }
                                            }
                                            text
                                        }
                                        ... on ProjectV2ItemFieldNumberValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    name
                                                }
                                            }
                                            number
                                        }
                                        ... on ProjectV2ItemFieldDateValue {
                                            field {
                                                ... on ProjectV2Field {
                                                    name
                                                }
                                            }
                                            date
                                        }
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            field {
                                                ... on ProjectV2SingleSelectField {
                                                    name
                                                }
                                            }
                                            name
                                        }
                                        ... on ProjectV2ItemFieldIterationValue {
                                            field {
                                                ... on ProjectV2IterationField {
                                                    name
                                                }
                                            }
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

const schema = {
    id: {
        type: 'string',
        title: 'Id'
    },
    title: {
        type: 'string',
        title: 'Title'
    },
    status: {
        type: 'string',
        title: 'Status'
    },
    content: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                title: 'Content.Id'
            },
            type: {
                type: 'string',
                title: 'Content.Type'
            },
            title: {
                type: 'string',
                title: 'Content.Title'
            },
            url: {
                type: 'string',
                title: 'Content.Url'
            },
            state: {
                type: 'string',
                title: 'Content.State'
            },
            assignees: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        login: {
                            type: 'string',
                            title: 'Content.Assignees.Login'
                        }
                    }
                },
                title: 'Content.Assignees'
            },
            labels: {
                type: 'array',
                items: {},
                title: 'Content.Labels'
            },
            linkedItems: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            title: 'Content.Linked Items.Id'
                        },
                        type: {
                            type: 'string',
                            title: 'Content.Linked Items.Type'
                        },
                        title: {
                            type: 'string',
                            title: 'Content.Linked Items.Title'
                        },
                        url: {
                            type: 'string',
                            title: 'Content.Linked Items.Url'
                        },
                        state: {
                            type: 'string',
                            title: 'Content.Linked Items.State'
                        },
                        assignees: {
                            type: 'array',
                            items: {},
                            title: 'Content.Linked Items.Assignees'
                        },
                        labels: {
                            type: 'array',
                            items: {},
                            title: 'Content.Linked Items.Labels'
                        },
                        linkedItems: {
                            type: 'array',
                            items: {},
                            title: 'Content.Linked Items.Linked Items'
                        }
                    }
                },
                title: 'Content.Linked Items'
            }
        },
        title: 'Content'
    }
};

const normalizeContent = (content) => {

    if (!content) return {};

    const timelineItems = content.timelineItems?.nodes || [];
    return {
        id: content.id,
        type: content.url?.includes('/pull/') ? 'PR' : 'issue',
        title: content.title,
        url: content.url,
        state: content.state,
        assignees: content.assignees ? content.assignees.nodes : [],
        labels: content.labels ? content.labels.nodes?.map(label => label.name) : [],
        linkedItems: timelineItems.map(item => normalizeContent(item?.subject))
    };
};

module.exports = {

    async receive(context) {
        const {
            projectId,
            status,
            outputType = 'array'
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Items' });
        }

        let allItems = [];
        let hasNextPage = true;
        let cursor = null;
        let requestCount = 0;
        const maxRequests = 10; // Prevent infinite loops

        while (hasNextPage && requestCount < maxRequests) {
            requestCount++;

            const response = await context.httpRequest({
                method: 'POST',
                url: 'https://api.github.com/graphql',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Appmixer GitHub Connector'
                },
                data: {
                    query,
                    variables: { projectId, after: cursor }
                }
            });

            const data = response.data;

            if (data.errors) {
                throw new context.CancelError(data.errors);
            }

            const project = response.data.data?.node;
            if (!project) {
                throw new context.CancelError(`Project with ID '${projectId}' not found. Ensure the project ID is correct and you have 'read:project' permission. The project ID should start with 'PVTI_' for project items.`);
            }

            if (!project.items) {
                throw new context.CancelError(`Unable to access items for project ${projectId}. This might be a permissions issue - ensure your token has 'read:project' scope.`);
            }

            const items = project.items.nodes || [];
            allItems = allItems.concat(items);

            hasNextPage = project.items.pageInfo.hasNextPage;
            cursor = project.items.pageInfo.endCursor;
        }

        if (requestCount >= maxRequests) {
            await context.log({ message: `Reached maximum request limit (${maxRequests}). Some items might be missing.` });
        }

        // Process items to add easier access to status and other fields
        let processedItems = allItems.map(item => {
            // Process the item to add easier access to status and other fields
            const processedItem = {
                id: item.id,
                title: null,
                status: null,
                content: normalizeContent(item.content)
            };

            const fieldNodes = item.fieldValues?.nodes || [];
            const fields = fieldNodes.reduce((res, item) => {

                const key = item.field?.name || item.field?.id;
                if (key) {
                    res[key.toLowerCase()] = item.text || item.name ||
                        item.title || String(item.number) ||
                        item.date || null;
                }
                return res;
            }, {});

            processedItem.title = fields.title;
            processedItem.status = fields.status;

            return processedItem;
        });

        // Filter by status if provided
        const statusItems = status ?
            status.split(',').filter(s => s.trim()).map(s => s.trim().toLowerCase()) : [];

        if (statusItems.length > 0) {
            processedItems = processedItems.filter(item => {
                if (!item.status) {
                    return false;
                }
                return statusItems.includes(item.status.toLowerCase());
            });
        }

        if (processedItems.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: processedItems, outputType });
    }
};
