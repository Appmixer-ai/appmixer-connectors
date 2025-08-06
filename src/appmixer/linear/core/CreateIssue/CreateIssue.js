'use strict';

module.exports = {
    async receive(context) {

        const { title, description, teamId, assigneeId, labelIds, stateId, priority } = context.messages.in.content;

        if (!title) {
            throw new context.CancelError('title is required');
        }

        if (!teamId) {
            throw new context.CancelError('teamId is required');
        }

        // Build GraphQL mutation for creating an issue
        const graphqlMutation = `
            mutation IssueCreate($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue {
                        id
                        title
                        description
                        url
                        createdAt
                        updatedAt
                        state {
                            id
                            name
                            color
                        }
                        assignee {
                            id
                            name
                            email
                        }
                        creator {
                            id
                            name
                            email
                        }
                        team {
                            id
                            name
                            key
                        }
                        labels {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                }
            }
        `;

        // Build input object
        const input = {
            title: title,
            teamId: teamId
        };

        if (description) {
            input.description = description;
        }

        if (assigneeId) {
            input.assigneeId = assigneeId;
        }

        if (labelIds && labelIds.length > 0) {
            input.labelIds = labelIds;
        }

        if (stateId) {
            input.stateId = stateId;
        }

        if (priority !== undefined) {
            input.priority = priority;
        }

        // https://linear.app/developers/graphql
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.linear.app/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                query: graphqlMutation,
                variables: { input }
            }
        });

        if (data.errors) {
            throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
        }

        if (!data.data.issueCreate.success) {
            throw new Error('Failed to create issue');
        }

        return context.sendJson(data.data.issueCreate.issue, 'out');
    }
};
