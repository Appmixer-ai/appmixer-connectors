'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { Readable } = require('stream');
const sinon = require('sinon');
const lib = require('../../lib');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function createContext(csv, delimiter = ',') {

    return {
        config: {},
        auth: { accessToken: 'token' },
        messages: {
            in: {
                content: {
                    accountId: 'act_1',
                    audienceId: '123',
                    fileId: 'file-1',
                    delimiter,
                    schema: { ADD: [{ csvHeader: 'Email', fbType: 'EMAIL' }, { csvHeader: ' Phone ', fbType: 'PHONE' }] }
                }
            }
        },
        getFileReadStream: sinon.stub().resolves(Readable.from([csv])),
        getFileInfo: sinon.stub().resolves({ length: Buffer.byteLength(csv) }),
        httpRequest: {
            post: sinon.stub().resolves({ data: { num_invalid_entries: 0 }, headers: {} })
        },
        log: sinon.stub().resolves(),
        setTimeout: sinon.stub().resolves(),
        sendJson: sinon.stub().resolves(),
        CancelError: Error
    };
}

describe('facebookbusiness sendCSVAudienceToFacebook (csv-parse 7)', function() {

    this.timeout(10000);

    it('reads lower-cased, trimmed headers and uploads hashed members', async () => {

        const context = createContext('EMAIL, Phone,Ignored\na@example.com,111,x\nb@example.com,222,y\n');
        await lib.sendCSVAudienceToFacebook(context, 'post', 'users');

        assert.strictEqual(context.httpRequest.post.callCount, 1);
        const [url, body] = context.httpRequest.post.firstCall.args;
        assert.strictEqual(url, 'https://graph.facebook.com/v25.0/123/users');
        assert.deepStrictEqual(body.payload.schema, ['EMAIL', 'PHONE']);
        assert.deepStrictEqual(body.payload.data, [
            [sha256('a@example.com'), sha256('111')],
            [sha256('b@example.com'), sha256('222')]
        ]);
        assert.strictEqual(body.session.last_batch_flag, true);

        const [out, port] = context.sendJson.firstCall.args;
        assert.strictEqual(port, 'out');
        assert.strictEqual(out.num_total_entries, 2);
    });

    it('honours a custom delimiter', async () => {

        const context = createContext('Email;Phone\na@example.com;111\n', ';');
        await lib.sendCSVAudienceToFacebook(context, 'post', 'users');

        const [, body] = context.httpRequest.post.firstCall.args;
        assert.deepStrictEqual(body.payload.data, [[sha256('a@example.com'), sha256('111')]]);
    });

    it('fails on a row with a different number of cells than the header', async () => {

        const context = createContext('Email,Phone\na@example.com\n');
        await assert.rejects(
            lib.sendCSVAudienceToFacebook(context, 'post', 'users'),
            err => err.code === 'CSV_RECORD_INCONSISTENT_COLUMNS'
        );
    });
});
