'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'number': { 'type': 'number', 'title': 'Number' },
    'title': { 'type': 'string', 'title': 'Title' },
    'shortDescription': { 'type': 'string', 'title': 'Short Description' },
    'readme': { 'type': 'string', 'title': 'Readme' },
    'url': { 'type': 'string', 'title': 'URL' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'closedAt': { 'type': 'string', 'title': 'Closed At' },
    'public': { 'type': 'boolean', 'title': 'Public' },
    'owner': { 'type': 'object', 'title': 'Owner' }
};

module.exports = {
    async receive(context) {
        const { owner, projectType = 'user', query: searchQuery, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Projects' });
        }

        const query = projectType === 'organization' ?
            `query($owner: String!) {
                organization(login: $owner) {
                    projectsV2(first: 100) {
                        nodes {
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
                        }
                    }
                }
            }` :
            `query($owner: String!) {
                user(login: $owner) {
                    projectsV2(first: 100) {
                        nodes {
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
                        }
                    }
                }
            }`;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.github.com/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                query,
                variables: { owner }
            }
        });

        if (data.errors) {
            throw new context.CancelError(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const entityData = projectType === 'organization' ? data.data.organization : data.data.user;
        if (!entityData) {
            throw new context.CancelError(`${projectType} '${owner}' not found`);
        }

        const projects = entityData.projectsV2.nodes || [];

        // Filter projects by query if provided
        let filteredProjects = projects;
        if (searchQuery && searchQuery.trim()) {
            const queryLower = searchQuery.trim().toLowerCase();
            filteredProjects = projects.filter(project => {
                const title = project.title || '';
                const shortDescription = project.shortDescription || '';
                const readme = project.readme || '';

                return title.toLowerCase().includes(queryLower) ||
                    shortDescription.toLowerCase().includes(queryLower) ||
                    readme.toLowerCase().includes(queryLower);
            });

            if (filteredProjects.length === 0) {
                return context.sendJson({}, 'notFound');
            }
        }

        return lib.sendArrayOutput({ context, records: filteredProjects, outputType });
    }
};
