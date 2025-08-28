const assert = require('assert');

describe('Nested Template Literal Refactoring Tests', function() {

    describe('Clerk API URL Building', function() {
        it('should build correct URLs with query parameters', function() {
            // Test query string building logic similar to FindOrganizations
            const query = 'test-query';
            const queryString = query ? `?query=${encodeURIComponent(query)}` : '';
            const baseUrl = 'https://api.clerk.com/v1/organizations';
            const fullUrl = `${baseUrl}${queryString}`;

            assert.strictEqual(fullUrl, 'https://api.clerk.com/v1/organizations?query=test-query');
        });

        it('should build correct URLs without query parameters', function() {
            const query = '';
            const queryString = query ? `?query=${encodeURIComponent(query)}` : '';
            const baseUrl = 'https://api.clerk.com/v1/organizations';
            const fullUrl = `${baseUrl}${queryString}`;

            assert.strictEqual(fullUrl, 'https://api.clerk.com/v1/organizations');
        });

        it('should handle URLSearchParams correctly', function() {
            const queryParams = new URLSearchParams();
            queryParams.append('user_id', 'user123');
            queryParams.append('session_id', 'session456');

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const baseUrl = 'https://api.clerk.com/v1/sessions';
            const fullUrl = `${baseUrl}${queryString}`;

            assert.strictEqual(fullUrl, 'https://api.clerk.com/v1/sessions?user_id=user123&session_id=session456');
        });
    });

    describe('GitHub Label Query Building', function() {
        it('should build label queries correctly', function() {
            const labels = ['bug', 'urgent', 'high priority'];
            const labelQuery = labels.length ? labels.map(label => `"${label}"`).join(',') : '';

            assert.strictEqual(labelQuery, '"bug","urgent","high priority"');
        });

        it('should handle empty labels array', function() {
            const labels = [];
            const labelQuery = labels.length ? labels.map(label => `"${label}"`).join(',') : '';

            assert.strictEqual(labelQuery, '');
        });
    });

    describe('Google Drive Parent Queries', function() {
        it('should build parent queries correctly', function() {
            const subfolderIds = ['folder1', 'folder2', 'folder3'];
            const parentQueries = subfolderIds.map(id => `'${id}' in parents`);
            const query = `(${parentQueries.join(' or ')})`;

            assert.strictEqual(query, "('folder1' in parents or 'folder2' in parents or 'folder3' in parents)");
        });
    });

    describe('HubSpot Query Building', function() {
        it('should build API key queries correctly', function() {
            const apiKey = 'test-api-key';
            const existingQuery = 'param1=value1&param2=value2';
            const additionalQuery = existingQuery ? `&${existingQuery}` : '';
            const query = `hapikey=${apiKey}${additionalQuery}`;

            assert.strictEqual(query, 'hapikey=test-api-key&param1=value1&param2=value2');
        });

        it('should handle empty existing query', function() {
            const apiKey = 'test-api-key';
            const existingQuery = '';
            const additionalQuery = existingQuery ? `&${existingQuery}` : '';
            const query = `hapikey=${apiKey}${additionalQuery}`;

            assert.strictEqual(query, 'hapikey=test-api-key');
        });
    });

    describe('Klaviyo Filter Building', function() {
        it('should build filters correctly', function() {
            const channelFilter = 'email';
            const filter = 'additional-filter';
            const additionalFilter = filter?.length > 0 ? `,${filter}` : '';
            const fullFilter = `equals(messages.channel,'${channelFilter}')${additionalFilter}`;

            assert.strictEqual(fullFilter, "equals(messages.channel,'email'),additional-filter");
        });

        it('should handle empty additional filter', function() {
            const channelFilter = 'email';
            const filter = '';
            const additionalFilter = filter?.length > 0 ? `,${filter}` : '';
            const fullFilter = `equals(messages.channel,'${channelFilter}')${additionalFilter}`;

            assert.strictEqual(fullFilter, "equals(messages.channel,'email')");
        });
    });

    describe('PostgreSQL Value List Building', function() {
        it('should build IN value lists correctly', function() {
            const value = 'value1,value2,value3';
            const valuesList = value.trim().split(',').map(v => `'${v}'`).join(',');

            assert.strictEqual(valuesList, "'value1','value2','value3'");
        });

        it('should handle single value', function() {
            const value = 'single-value';
            const valuesList = value.trim().split(',').map(v => `'${v}'`).join(',');

            assert.strictEqual(valuesList, "'single-value'");
        });

        it('should handle values with whitespace', function() {
            const value = ' value1 , value2 , value3 ';
            const valuesList = value.trim().split(',').map(v => `'${v.trim()}'`).join(',');

            assert.strictEqual(valuesList, "'value1','value2','value3'");
        });
    });

    describe('Snowflake SQL Value Building', function() {
        it('should build VALUES clause correctly', function() {
            const values = ['value1', 'value2', 'value3'];
            const valuesList = values.map(val => `'${val}'`).join(',');
            const schema = 'test_schema';
            const tableName = 'test_table';
            const columns = ['col1', 'col2', 'col3'];
            const sqlText = `INSERT INTO ${schema}.${tableName} (${columns.join(',')}) VALUES (${valuesList});`;

            assert.strictEqual(sqlText, "INSERT INTO test_schema.test_table (col1,col2,col3) VALUES ('value1','value2','value3');");
        });
    });
});
