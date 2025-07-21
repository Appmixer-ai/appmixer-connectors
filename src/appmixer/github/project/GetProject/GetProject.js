'use strict';

module.exports = {
    async receive(context) {
        const { projectId } = context.messages.in.content;

        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        id
                        number
                        title
                        shortDescription
                        readme
                        url
                        createdAt
                        updatedAt
                        closedAt
                        public
                        owner {
                            __typename
                            ... on Organization {
                                login
                            }
                            ... on User {
                                login
                            }
                        }
                        fields(first: 100) {
                            nodes {
                                ... on ProjectV2Field {
                                    id
                                    name
                                    dataType
                                }
                                ... on ProjectV2SingleSelectField {
                                    id
                                    name
                                    dataType
                                    options {
                                        id
                                        name
                                        color
                                    }
                                }
                                ... on ProjectV2IterationField {
                                    id
                                    name
                                    dataType
                                    configuration {
                                        iterations {
                                            id
                                            title
                                            startDate
                                            duration
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.github.com/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                query,
                variables: { projectId }
            }
        });

        if (data.errors) {
            throw new context.CancelError(data.errors);
        }

        const project = data.data.node;
        if (!project) {
            throw new context.CancelError(`Project with ID '${projectId}' not found`);
        }

        // Flatten fields for easier access
        const result = {
            ...project,
            fields: project.fields.nodes || []
        };

        return context.sendJson(result, 'out');
    }
};
