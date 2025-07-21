'use strict';

const query = `
            query($projectItemId: ID!) {
                node(id: $projectItemId) {
                    ... on ProjectV2Item {
                        id
                        project {
                            id
                            title
                        }
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
        `;

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
        linkedItems: timelineItems.map(item => normalizeContent(item.subject))
    };
};

module.exports = {

    async receive(context) {

        const { projectItemId } = context.messages.in.content;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.github.com/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                query,
                variables: { projectItemId }
            }
        });

        if (data.errors) {
            throw new context.CancelError(data.errors);
        }

        const item = data?.data?.node;
        if (!item) {
            throw new context.CancelError(`Project item with ID '${projectItemId}' not found`);
        }

        // Process the item to add easier access to status and other fields
        const processedItem = {
            id: item.id,
            title: null,
            status: null,
            projectId: item?.project?.id,
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

        return context.sendJson(processedItem, 'out');
    }
};
