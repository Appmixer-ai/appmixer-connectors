'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Readable } = require('stream');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const { HttpResponse } = require('@smithy/protocol-http');
const { SNSClient, ListTopicsCommand, PublishCommand } = require('@aws-sdk/client-sns');
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

const CONFIG = { region: 'us-east-1', credentials: { accessKeyId: 'AKIA_TEST', secretAccessKey: 'SECRET' } };

describe('aws.sns SDK responses', () => {

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

    describe('SNS (XML)', () => {

        it('should parse a ListTopics response, a single member included', async () => {

            const one = '<member><TopicArn>arn:aws:sns:us-east-1:123:t1</TopicArn></member>';
            const two = one + '<member><TopicArn>arn:aws:sns:us-east-1:123:t2</TopicArn></member>';
            const body = members => '<ListTopicsResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/"><ListTopicsResult>'
                + `<Topics>${members}</Topics><NextToken>n&amp;1</NextToken></ListTopicsResult>`
                + '<ResponseMetadata><RequestId>R</RequestId></ResponseMetadata></ListTopicsResponse>';
            const handle = stubHttp(() => ({ body: body(handle.callCount === 1 ? one : two) }));
            const client = new SNSClient(CONFIG);

            const first = await client.send(new ListTopicsCommand({}));
            assert.deepStrictEqual(first.Topics, [{ TopicArn: 'arn:aws:sns:us-east-1:123:t1' }]);
            assert.strictEqual(first.NextToken, 'n&1');

            const second = await client.send(new ListTopicsCommand({}));
            assert.deepStrictEqual(second.Topics, [
                { TopicArn: 'arn:aws:sns:us-east-1:123:t1' },
                { TopicArn: 'arn:aws:sns:us-east-1:123:t2' }
            ]);
        });

        it('should parse a Publish response and an error response', async () => {

            const ok = '<PublishResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/"><PublishResult>'
                + '<MessageId>0012-ab</MessageId></PublishResult></PublishResponse>';
            const error = '<ErrorResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/"><Error><Type>Sender</Type>'
                + '<Code>InvalidParameter</Code><Message>Invalid parameter: PhoneNumber</Message></Error></ErrorResponse>';
            const handle = stubHttp(() => (handle.callCount === 1 ? { body: ok } : { statusCode: 400, body: error }));
            const client = new SNSClient(CONFIG);

            const result = await client.send(new PublishCommand({ PhoneNumber: '+420123456789', Message: 'hi' }));
            assert.strictEqual(result.MessageId, '0012-ab');

            await assert.rejects(client.send(new PublishCommand({ PhoneNumber: 'x', Message: 'hi' })), err => {
                assert.strictEqual(err.name, 'InvalidParameterException');
                assert.strictEqual(err.message, 'Invalid parameter: PhoneNumber');
                return true;
            });
        });
    });
});
