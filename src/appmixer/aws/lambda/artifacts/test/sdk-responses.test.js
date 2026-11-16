'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Readable } = require('stream');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const { HttpResponse } = require('@smithy/protocol-http');
const lib = require('../../lib');
const Invoke = require('../../Invoke/Invoke');
const auth = require('../../auth');

// Answers the SDK HTTP request with a canned response, so that the real response parsing of the
// AWS SDK (fast-xml-parser, pinned through npm overrides) runs without any network.
function stubHttp(responder) {

    return sinon.stub(NodeHttpHandler.prototype, 'handle').callsFake(async request => {
        const { statusCode = 200, body, headers = { 'content-type': 'text/xml' } } = responder(request);
        const stream = Readable.from([Buffer.from(body, 'utf8')]);
        return { response: new HttpResponse({ statusCode, headers, body: stream }) };
    });
}

const STS_NS = 'xmlns="https://sts.amazonaws.com/doc/2011-06-15/"';
const STS_OK = `<GetCallerIdentityResponse ${STS_NS}><GetCallerIdentityResult>`
    + '<Arn>arn:aws:iam::000123456789:user/t &amp; co</Arn><UserId>AIDA007</UserId><Account>000123456789</Account>'
    + '</GetCallerIdentityResult><ResponseMetadata><RequestId>R1</RequestId></ResponseMetadata>'
    + '</GetCallerIdentityResponse>';
const STS_ERR = `<ErrorResponse ${STS_NS}><Error><Type>Sender</Type><Code>InvalidClientTokenId</Code>`
    + '<Message>The security token included in the request is invalid.</Message></Error>'
    + '<RequestId>R2</RequestId></ErrorResponse>';

describe('aws.lambda SDK responses', () => {

    afterEach(() => sinon.restore());

    describe('auth validate (STS GetCallerIdentity, XML)', () => {

        it('should return the caller identity', async () => {

            const handle = stubHttp(() => ({ body: STS_OK }));

            const identity = await auth.definition.validate({ accessKeyId: 'AKIA_TEST', secretKey: 'SECRET' });

            assert(handle.calledOnce, 'one HTTP request');
            // The account id keeps its leading zeros and the entity in the ARN is decoded.
            assert.strictEqual(identity.Account, '000123456789');
            assert.strictEqual(identity.UserId, 'AIDA007');
            assert.strictEqual(identity.Arn, 'arn:aws:iam::000123456789:user/t & co');
        });

        it('should fail with the AWS error code and message for invalid credentials', async () => {

            stubHttp(() => ({ statusCode: 403, body: STS_ERR }));

            await assert.rejects(
                auth.definition.validate({ accessKeyId: 'AKIA_BAD', secretKey: 'SECRET' }),
                err => {
                    assert.strictEqual(err.name, 'InvalidClientTokenId');
                    assert.strictEqual(err.message, 'The security token included in the request is invalid.');
                    assert.strictEqual(err.$metadata.httpStatusCode, 403);
                    return true;
                }
            );
        });
    });

    describe('Invoke (JSON)', () => {

        it('should send the payload and return the function response', async () => {

            const handle = stubHttp(() => ({
                headers: { 'content-type': 'application/json', 'x-amz-executed-version': '$LATEST' },
                body: '{"result":"ok"}'
            }));
            const context = {
                CancelError: Error,
                auth: { accessKeyId: 'AKIA_TEST', secretKey: 'SECRET' },
                properties: {},
                messages: {
                    in: { content: { region: 'eu-west-1', name: 'fn', invocationType: 'RequestResponse', payload: { a: 1 } } }
                },
                sendJson: sinon.stub()
            };

            await Invoke.receive(context);

            const request = handle.getCall(0).args[0];
            assert.strictEqual(request.hostname, 'lambda.eu-west-1.amazonaws.com');
            assert.strictEqual(request.path, '/2015-03-31/functions/fn/invocations');
            assert.strictEqual(Buffer.from(request.body).toString('utf8'), '{"a":1}');
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{
                ExecutedVersion: '$LATEST',
                FunctionError: undefined,
                LogResult: undefined,
                Payload: '{"result":"ok"}',
                StatusCode: 200
            }, 'out']);
            assert.strictEqual(lib.init(context).region, 'eu-west-1');
        });
    });
});
