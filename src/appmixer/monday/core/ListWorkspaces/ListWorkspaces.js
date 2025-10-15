'use strict';
const commons = require('../../monday-commons');
const queries = require('../../queries');
const PagingAggregator = require('appmixer-lib').util.PagingAggregator;

const aggregator = new PagingAggregator(
    (args, page, pageSize) => {

        args.options.variables.page = page;
        args.options.variables.limit = pageSize;
        return commons.makeRequest(args);
    },
    (accumulator, chunk) => {
        return accumulator.concat(chunk.workspaces);
    },
    (accumulator, chunk, page, pageSize) => {
        const isDone = !chunk.workspaces.length || chunk.workspaces.length < pageSize;
        return isDone ? -1 : page + 1;
    }
);
/**
 * Component for fetching list of workspaces.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        let lock;
        try {
            lock = await context.lock(context.auth.apiKey + '_workspaces');
            let workspaces = await context.staticCache.get(context.auth.apiKey + '_workspaces');
            if (workspaces) {
                return context.sendJson({ workspaces }, 'out');
            }

            const options = {
                query: queries.listWorkspaces,
                options: {
                    variables: {
                        page: 1,
                        limit: 50
                    }
                },
                apiKey: context.auth.apiKey
            };
            workspaces = await aggregator.fetch(options, 1, 50);

            await context.staticCache.set(
                context.auth.apiKey + '_workspaces',
                workspaces,
                context.config.listWorkspacesCacheTTL || 20 * 1000
            );

            return context.sendJson({ workspaces }, 'out');
        } finally {
            lock?.unlock();
        }
    },

    workspacesToSelectArray({ workspaces }) {

        return workspaces.map(workspace => {
            return { label: workspace.name, value: workspace.id };
        });
    }
};

