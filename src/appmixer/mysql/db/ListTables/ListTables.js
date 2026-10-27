'use strict';

const { createConnection } = require('../../common');

module.exports = {

    async receive(context) {

        const query = 'SHOW TABLES';

        const conn = await createConnection(context);

        try {
            const tables = await new Promise((resolve, reject) => {
                conn.query(query, (err, results, fields) => {
                    if (err) return reject(err);
                    resolve((results || []).map(item => {
                        const key = Object.keys(item)[0];
                        return item[key];
                    }));
                });
            });
            await context.sendJson({ tables }, 'tables');
        } finally {
            conn.end();
        }
    }
};

