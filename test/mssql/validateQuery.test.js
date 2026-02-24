'use strict';

const assert = require('assert');
const { validateQuery } = require('../../src/appmixer/mssql/common');

describe('MSSQL validateQuery', () => {

    it('should allow SELECT queries', () => {
        assert.doesNotThrow(() => validateQuery('SELECT * FROM users'));
        assert.doesNotThrow(() => validateQuery('  SELECT id, name FROM users'));
        assert.doesNotThrow(() => validateQuery('\nSELECT * FROM users'));
    });

    it('should allow WITH queries (CTEs)', () => {
        assert.doesNotThrow(() => validateQuery('WITH cte AS (SELECT * FROM users) SELECT * FROM cte'));
        assert.doesNotThrow(() => validateQuery('  WITH cte AS (SELECT * FROM users) SELECT * FROM cte'));
    });

    it('should allow case-insensitive SELECT', () => {
        assert.doesNotThrow(() => validateQuery('select * from users'));
        assert.doesNotThrow(() => validateQuery('SeLeCt * from users'));
    });

    it('should allow case-insensitive WITH', () => {
        assert.doesNotThrow(() => validateQuery('with cte as (select * from users) select * from cte'));
        assert.doesNotThrow(() => validateQuery('WiTh cte as (select * from users) select * from cte'));
    });

    it('should reject INSERT queries', () => {
        assert.throws(
            () => validateQuery('INSERT INTO users (name) VALUES (\'test\')'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject UPDATE queries', () => {
        assert.throws(
            () => validateQuery('UPDATE users SET name = \'test\' WHERE id = 1'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject DELETE queries', () => {
        assert.throws(
            () => validateQuery('DELETE FROM users WHERE id = 1'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject DROP queries', () => {
        assert.throws(
            () => validateQuery('DROP TABLE users'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject CREATE queries', () => {
        assert.throws(
            () => validateQuery('CREATE TABLE users (id INT, name VARCHAR(255))'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject ALTER queries', () => {
        assert.throws(
            () => validateQuery('ALTER TABLE users ADD email VARCHAR(255)'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject TRUNCATE queries', () => {
        assert.throws(
            () => validateQuery('TRUNCATE TABLE users'),
            /Only SELECT or WITH queries are allowed/
        );
    });

    it('should reject queries with leading spaces that are not SELECT/WITH', () => {
        assert.throws(
            () => validateQuery('  INSERT INTO users (name) VALUES (\'test\')'),
            /Only SELECT or WITH queries are allowed/
        );
    });
});
