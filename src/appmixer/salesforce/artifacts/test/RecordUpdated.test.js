'use strict';

const assert = require('assert');
const Module = require('module');
const path = require('path');
const sinon = require('sinon');

// lib.js requires jsforce at load time; the Record Updated helpers do not use it, so the tests
// do not need the connector's dependencies installed.
/* eslint-disable no-underscore-dangle */
const originalLoad = Module._load;
Module._load = function(request, ...args) {
    if (request === 'jsforce') {
        return { Connection: function() {}, Date: {} };
    }
    return originalLoad.call(this, request, ...args);
};
const lib = require(path.join(__dirname, '../../crm/lib.js'));
const RecordUpdated = require(path.join(__dirname, '../../crm/RecordUpdated/RecordUpdated.js'));
Module._load = originalLoad;
/* eslint-enable no-underscore-dangle */

class CancelError extends Error {}

const INSTANCE = 'https://example.my.salesforce.com';
const BASE = Date.now() - 60 * 60 * 1000;
// Salesforce timestamps: whole seconds, +0000 offset.
const at = (seconds) => new Date(BASE + seconds * 1000).toISOString().replace('Z', '+0000');

/**
 * In-memory Salesforce: records of one object, its Field History rows, the field definition.
 * Answers the queries the trigger sends (parsed loosely), pages results by pageSize.
 */
const createSalesforce = ({ objectName = 'Case', tracked = true, pageSize = 2000 } = {}) => {

    const sf = { records: new Map(), history: [], requests: [], pageSize, cursors: new Map(), nextHistoryId: 1 };

    sf.addRecord = (record) => sf.records.set(record.Id, { SystemModstamp: at(0), ...record });
    sf.change = (id, field, oldValue, newValue, second, extra = {}) => {
        sf.history.push({
            Id: 'hist' + String(sf.nextHistoryId++).padStart(6, '0'),
            CaseId: id, Field: field, DataType: 'Text', OldValue: oldValue, NewValue: newValue,
            CreatedDate: at(second), ...extra
        });
        const record = sf.records.get(id);
        record[field] = newValue;
        record.SystemModstamp = at(second);
    };
    sf.touch = (id, values, second) => Object.assign(sf.records.get(id), values, { SystemModstamp: at(second) });

    const literal = (soql, field, op) => {
        const match = soql.match(new RegExp(field + ' ' + op + ' (\\S+Z)'));
        return match ? new Date(match[1]).getTime() : null;
    };
    const inWindow = (soql, field, value) => {
        const from = literal(soql, field, '>=');
        const to = literal(soql, field, '<=');
        const time = new Date(value).getTime();
        return (from === null || time >= from) && (to === null || time <= to);
    };
    const order = (rows, field, desc) => rows.sort((a, b) => {
        const diff = new Date(a[field]) - new Date(b[field]) || (a.Id < b.Id ? -1 : a.Id > b.Id ? 1 : 0);
        return desc ? -diff : diff;
    });
    const page = (rows, offset = 0) => {
        const records = rows.slice(offset, offset + sf.pageSize);
        const done = offset + sf.pageSize >= rows.length;
        const result = { done, totalSize: rows.length, records };
        if (!done) {
            const token = '01gCURSOR' + sf.cursors.size + '-' + (offset + sf.pageSize);
            sf.cursors.set(token, { rows, offset: offset + sf.pageSize });
            result.nextRecordsUrl = '/services/data/v58.0/query/' + token;
        }
        return result;
    };

    const runQuery = (soql) => {
        const desc = / DESC/.test(soql);
        const limit = (soql.match(/ LIMIT (\d+)/) || [])[1];
        let rows;
        if (/FROM FieldDefinition/.test(soql)) {
            const field = soql.match(/AND QualifiedApiName = '([^']+)'/)[1];
            rows = field === 'Missing__c' ? [] : [{ QualifiedApiName: field, IsFieldHistoryTracked: tracked }];
        } else if (/FROM CaseHistory/.test(soql)) {
            const fields = soql.match(/Field IN \(([^)]+)\)/)[1].split(', ').map(f => f.replace(/'/g, ''));
            rows = order(sf.history.filter(row => fields.includes(row.Field) &&
                inWindow(soql, 'CreatedDate', row.CreatedDate)), 'CreatedDate', desc);
        } else if (/WHERE Id IN/.test(soql)) {
            const ids = soql.match(/Id IN \(([^)]+)\)/)[1].split(', ').map(id => id.replace(/'/g, ''));
            const where = soql.match(/AND \((.+)\)$/)[1];
            const [, field, value] = where.match(/(\w+) = '([^']*)'/);
            rows = ids.filter(id => sf.records.has(id) && String(sf.records.get(id)[field]) === value)
                .map(Id => ({ Id }));
        } else {
            const where = (soql.match(/AND \((\w+) = '([^']*)'\)/) || []);
            rows = order(Array.from(sf.records.values()).filter(record => {
                return inWindow(soql, 'SystemModstamp', record.SystemModstamp) &&
                    (!where[1] || String(record[where[1]]) === where[2]);
            }), 'SystemModstamp', desc).map(record => ({ ...record }));
        }
        if (limit) rows = rows.slice(0, Number(limit));
        return page(rows);
    };

    sf.httpRequest = sinon.stub().callsFake(async ({ method = 'GET', url, data }) => {
        const action = url.replace(INSTANCE + '/services/data/v58.0/', '');
        sf.requests.push({ method, action: decodeURIComponent(action) });
        if (action.startsWith('query?q=')) {
            return { data: runQuery(decodeURIComponent(action.slice('query?q='.length))) };
        }
        if (action.startsWith('query/')) {
            const cursor = sf.cursors.get(action.slice('query/'.length));
            return { data: page(cursor.rows, cursor.offset) };
        }
        if (action === 'sobjects/CaseHistory/describe') {
            if (!tracked) throw Object.assign(new Error('404'), { response: { status: 404 } });
            return { data: { fields: [
                { name: 'Id', type: 'id' },
                { name: 'CreatedById', type: 'reference', referenceTo: ['User'] },
                { name: 'CaseId', type: 'reference', referenceTo: [objectName] }
            ] } };
        }
        if (action === 'sobjects/' + objectName + '/describe') {
            return { data: { fields: [
                { name: 'Id', type: 'id' },
                { name: 'Subject', type: 'string' },
                { name: 'Status', type: 'picklist' },
                { name: 'Address', type: 'address' },
                { name: 'SystemModstamp', type: 'datetime' }
            ] } };
        }
        if (method === 'POST' && action === 'composite/sobjects/' + objectName) {
            const body = JSON.parse(data);
            assert(!body.fields.includes('Address'), 'compound fields are not requested');
            return { data: body.ids.map(id => {
                const record = sf.records.get(id);
                if (!record) return null;
                const result = { attributes: { type: objectName } };
                body.fields.forEach(field => {
                    result[field] = record[field] === undefined ? null : record[field];
                });
                return result;
            }) };
        }
        throw new Error('Unexpected request ' + method + ' ' + action);
    });
    return sf;
};

const createContext = (sf, properties) => {

    const sent = [];
    const context = {
        auth: { accessToken: 'token', userId: 'u1', profileInfo: { email: 'a@example.com' } },
        profileInfo: { instanceUrl: INSTANCE },
        config: {},
        properties,
        state: {},
        CancelError,
        httpRequest: sf.httpRequest,
        sendJson: sinon.stub().callsFake(async (data, port) => sent.push({ data, port })),
        saveState: sinon.stub().callsFake(async (state) => {
            context.state = JSON.parse(JSON.stringify(state));
        }),
        lock: async () => ({ unlock() {} }),
        staticCache: (() => {
            const cache = new Map();
            return { get: async (key) => cache.get(key), set: async (key, value) => cache.set(key, value) };
        })(),
        log: async () => {}
    };
    context.sent = sent;
    return context;
};

const SINCE = new Date(BASE).toISOString();

describe('salesforce RecordUpdated', () => {

    describe('Changes to (Field History)', () => {

        it('emits a change on a record that existed long before the flow started', async () => {

            const sf = createSalesforce();
            for (let i = 0; i < 2500; i++) {
                sf.addRecord({ Id: 'case' + String(i).padStart(5, '0'), Subject: 'Old ' + i, Status: 'New' });
            }
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changedTo', value: 'Closed', since: SINCE });
            await RecordUpdated.start(context);
            sf.change('case02400', 'Status', 'New', 'Closed', 10);

            await RecordUpdated.tick(context);

            assert.strictEqual(context.sent.length, 1);
            assert.deepStrictEqual(context.sent[0], {
                port: 'out',
                data: {
                    Id: 'case02400', Subject: 'Old 2400', Status: 'Closed',
                    SystemModstamp: new Date(BASE + 10000).toISOString(),
                    oldValue: 'New', newValue: 'Closed'
                }
            });
            // The state holds the watermark, not the records of the object.
            assert.ok(JSON.stringify(context.state).length < 300, JSON.stringify(context.state));
        });

        it('emits more than 200 changes between ticks, in order, each once, across pages', async () => {

            const sf = createSalesforce({ pageSize: 100 });
            for (let i = 0; i < 450; i++) {
                sf.addRecord({ Id: 'case' + String(i).padStart(5, '0'), Subject: 'S', Status: 'New' });
            }
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changed', since: SINCE });
            await RecordUpdated.start(context);
            for (let i = 0; i < 450; i++) {
                // Several changes share a second.
                sf.change('case' + String(i).padStart(5, '0'), 'Status', 'New', 'Working', 10 + Math.floor(i / 7));
            }

            await RecordUpdated.tick(context);
            await RecordUpdated.tick(context);

            assert.strictEqual(context.sent.length, 450);
            assert.deepStrictEqual(context.sent.map(item => item.data.Id),
                Array.from({ length: 450 }, (v, i) => 'case' + String(i).padStart(5, '0')));
            assert.ok(sf.requests.some(request => request.action.startsWith('query/01gCURSOR')), 'followed nextRecordsUrl');
            assert.ok(context.state.seen.length <= 7);
        });

        it('stops a large backlog at a second boundary and continues in the next tick', async () => {

            const sf = createSalesforce({ pageSize: 50 });
            const max = lib.RECORD_UPDATED_MAX_PER_TICK;
            lib.RECORD_UPDATED_MAX_PER_TICK = 100;
            try {
                for (let i = 0; i < 300; i++) {
                    sf.addRecord({ Id: 'case' + String(i).padStart(5, '0'), Status: 'New' });
                }
                const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changed', since: SINCE });
                await RecordUpdated.start(context);
                for (let i = 0; i < 300; i++) {
                    sf.change('case' + String(i).padStart(5, '0'), 'Status', 'New', 'Working', 10 + Math.floor(i / 30));
                }

                await RecordUpdated.tick(context);
                assert.strictEqual(context.sent.length, 120, 'the second of the 100th change is completed');
                await RecordUpdated.tick(context);
                await RecordUpdated.tick(context);
                await RecordUpdated.tick(context);

                const ids = context.sent.map(item => item.data.Id);
                assert.strictEqual(ids.length, 300);
                assert.strictEqual(new Set(ids).size, 300);
            } finally {
                lib.RECORD_UPDATED_MAX_PER_TICK = max;
            }
        });

        it('fires once per closing: a reopen and a second close fire again', async () => {

            const sf = createSalesforce();
            sf.addRecord({ Id: 'case1', Subject: 'Broken', Status: 'New' });
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changedTo', value: 'closed', since: SINCE });
            await RecordUpdated.start(context);

            sf.change('case1', 'Status', 'New', 'Closed', 10);
            await RecordUpdated.tick(context);
            await RecordUpdated.tick(context);
            sf.change('case1', 'Status', 'Closed', 'Working', 20);
            await RecordUpdated.tick(context);
            sf.change('case1', 'Status', 'Working', 'Closed', 30);
            await RecordUpdated.tick(context);

            assert.deepStrictEqual(context.sent.map(item => [item.data.oldValue, item.data.newValue]),
                [['New', 'Closed'], ['Working', 'Closed']]);
        });

        it('emits a change committed later with the same timestamp as the watermark, once', async () => {

            const sf = createSalesforce();
            ['a', 'b', 'c'].forEach(id => sf.addRecord({ Id: id, Status: 'New' }));
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changed', since: SINCE });
            await RecordUpdated.start(context);
            sf.change('a', 'Status', 'New', 'Working', 10);
            sf.change('b', 'Status', 'New', 'Working', 10);
            await RecordUpdated.tick(context);
            sf.change('c', 'Status', 'New', 'Working', 10);
            await RecordUpdated.tick(context);
            await RecordUpdated.tick(context);

            assert.deepStrictEqual(context.sent.map(item => item.data.Id), ['a', 'b', 'c']);
        });

        it('applies the additional SOQL filter', async () => {

            const sf = createSalesforce();
            sf.addRecord({ Id: 'a', Subject: 'Keep', Status: 'New' });
            sf.addRecord({ Id: 'b', Subject: 'Skip', Status: 'New' });
            const context = createContext(sf, {
                objectName: 'Case', fieldName: 'Status', operator: 'changedTo', value: 'Closed', where: 'Subject = \'Keep\'', since: SINCE
            });
            await RecordUpdated.start(context);
            sf.change('a', 'Status', 'New', 'Closed', 10);
            sf.change('b', 'Status', 'New', 'Closed', 10);
            await RecordUpdated.tick(context);

            assert.deepStrictEqual(context.sent.map(item => item.data.Id), ['a']);
        });

        it('emits one change for a lookup field, which Salesforce records as two history rows', async () => {

            const sf = createSalesforce();
            sf.addRecord({ Id: 'a', Status: 'New' });
            const context = createContext(sf, { objectName: 'Case', fieldName: 'OwnerId', operator: 'changed', since: SINCE });
            await RecordUpdated.start(context);
            sf.change('a', 'Owner', '005A', '005B', 10, { DataType: 'EntityId' });
            sf.change('a', 'Owner', 'Ann', 'Bob', 10, { DataType: 'Text' });
            await RecordUpdated.tick(context);

            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.newValue, 'Bob');
        });

        it('start() fails with a clear error when Field History Tracking is off', async () => {

            const sf = createSalesforce({ tracked: false });
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changedTo', value: 'Closed' });

            await assert.rejects(RecordUpdated.start(context), (err) => {
                return err instanceof CancelError &&
                    /Field History Tracking/.test(err.message) && /Equals/.test(err.message);
            });
            assert.strictEqual(context.saveState.callCount, 0);
        });

        it('test() emits the latest matching change without writing state', async () => {

            const sf = createSalesforce();
            sf.addRecord({ Id: 'a', Status: 'New' });
            sf.addRecord({ Id: 'b', Status: 'New' });
            sf.change('a', 'Status', 'New', 'Closed', 10);
            sf.change('b', 'Status', 'New', 'Closed', 20);
            sf.change('b', 'Status', 'Closed', 'Working', 30);
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'changedTo', value: 'Closed' });

            await RecordUpdated.test(context);

            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.Id, 'b');
            assert.strictEqual(context.sent[0].data.newValue, 'Closed');
            assert.strictEqual(context.saveState.callCount, 0);
            assert.ok(sf.requests.every(request => request.method === 'GET' || request.action.startsWith('composite/sobjects')));
        });
    });

    describe('Equals (no Field History)', () => {

        it('emits a record once while the field keeps the value, again after it stopped matching', async () => {

            const sf = createSalesforce({ tracked: false });
            sf.addRecord({ Id: 't1', Subject: 'Call', Status: 'Not Started' });
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'equals', value: 'Completed', since: SINCE });
            await RecordUpdated.start(context);

            sf.touch('t1', { Status: 'Completed' }, 10);
            await RecordUpdated.tick(context);
            sf.touch('t1', { Subject: 'Call back' }, 20);
            await RecordUpdated.tick(context);
            sf.touch('t1', { Status: 'In Progress' }, 30);
            await RecordUpdated.tick(context);
            sf.touch('t1', { Status: 'Completed' }, 40);
            await RecordUpdated.tick(context);

            assert.deepStrictEqual(context.sent.map(item => [item.data.Subject, item.data.newValue]),
                [['Call', 'Completed'], ['Call back', 'Completed']]);
        });

        it('pages through more than 200 modified records and keeps the emitted list bounded', async () => {

            const sf = createSalesforce({ tracked: false, pageSize: 200 });
            const max = lib.RECORD_UPDATED_MAX_EMITTED;
            lib.RECORD_UPDATED_MAX_EMITTED = 50;
            try {
                for (let i = 0; i < 500; i++) {
                    sf.addRecord({ Id: 't' + String(i).padStart(4, '0'), Status: 'Not Started' });
                }
                const context = createContext(sf, {
                    objectName: 'Case', fieldName: 'Status', operator: 'notEquals', value: 'Not Started', since: SINCE
                });
                await RecordUpdated.start(context);
                for (let i = 0; i < 500; i++) {
                    sf.touch('t' + String(i).padStart(4, '0'), { Status: 'Completed' }, 10 + i);
                }
                await RecordUpdated.tick(context);
                await RecordUpdated.tick(context);

                assert.strictEqual(context.sent.length, 500);
                assert.strictEqual(context.state.emitted.length, 50);
                assert.ok(!sf.requests.some(request => /FIELDS\(ALL\)/.test(request.action)));
            } finally {
                lib.RECORD_UPDATED_MAX_EMITTED = max;
            }
        });

        it('requires a value', async () => {

            const sf = createSalesforce();
            const context = createContext(sf, { objectName: 'Case', fieldName: 'Status', operator: 'equals' });
            await assert.rejects(RecordUpdated.start(context), /Value is required/);
        });

        it('rejects an object name that is not an API name', async () => {

            const sf = createSalesforce();
            const context = createContext(sf, { objectName: 'Case WHERE', fieldName: 'Status', operator: 'changed' });
            await assert.rejects(RecordUpdated.start(context), CancelError);
        });
    });
});
