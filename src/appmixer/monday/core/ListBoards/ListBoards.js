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
        return accumulator.concat(chunk.boards);
    },
    (accumulator, chunk, page, pageSize) => {
        // Limiting number of API calls in source mode to avoid long runs of fetching flow variables.
        const pageCountLimitReached = page >= 10;
        const isDone = !chunk.boards.length || chunk.boards.length < pageSize || pageCountLimitReached;
        return isDone ? -1 : page + 1;
    }
);

/**
 * Component for fetching list of boards.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        let lock;
        try {
            lock = await context.lock(context.auth.apiKey + '_boards');
            let boards = await context.staticCache.get(context.auth.apiKey + '_boards');
            if (boards) {
                return context.sendJson({ boards }, 'out');
            }

            // Use simplified query if this is being called as a source for another component
            const queryToUse = context.properties.isSource ? queries.listBoardsSimple : queries.listBoards;

            const options = {
                query: queryToUse,
                options: {
                    variables: {
                        page: 1,
                        limit: 50
                    }
                },
                apiKey: context.auth.apiKey
            };
            boards = await aggregator.fetch(options, 1, 50);

            await context.staticCache.set(
                context.auth.apiKey + '_boards',
                boards,
                context.config.listBoardsCacheTTL || 20 * 1000
            );

            return context.sendJson({ boards }, 'out');
        } finally {
            lock?.unlock();
        }
    },

    boardsToSelectArray({ boards }) {

        return boards.map(board => {
            return { label: board.name, value: board.id };
        });
    }
};
