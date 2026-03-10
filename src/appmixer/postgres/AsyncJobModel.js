'use strict';

/**
 * MongoDB model for tracking long-running async PostgreSQL queries.
 * Used by the dblink-based async query execution feature.
 */
module.exports = context => {

    class AsyncJobModel extends context.db.Model {

        static get collection() {
            return 'pgAsyncJobs';
        }

        static get idProperty() {
            return 'jobId';
        }

        static get properties() {
            return [
                'jobId',          // unique job ID (crypto hex)
                'status',         // 'running' | 'done' | 'error'
                'flowId',
                'componentId',
                'auth',           // PG credentials (dbUser, dbHost, dbPort, database, dbPassword)
                'query',          // original SQL query
                'outputType',     // 'row' | 'rows' | 'file' — stored for result delivery
                'dblinkConnName', // active dblink connection name (for in-progress queries)
                'error',          // error message if status='error'
                'createdAt',
                'updatedAt'
            ];
        }
    }

    AsyncJobModel.createSettersAndGetters();
    return AsyncJobModel;
};
