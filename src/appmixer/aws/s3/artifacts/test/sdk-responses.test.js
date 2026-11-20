'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { Readable } = require('stream');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const { HttpResponse } = require('@smithy/protocol-http');
const { S3Client, ListBucketsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
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
const XMLNS = 'xmlns="http://s3.amazonaws.com/doc/2006-03-01/"';

describe('aws.s3 SDK responses', () => {

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

    describe('S3 (XML)', () => {

        it('should parse a ListBuckets response', async () => {

            stubHttp(() => ({
                headers: { 'content-type': 'application/xml' },
                body: `<?xml version="1.0" encoding="UTF-8"?><ListAllMyBucketsResult ${XMLNS}>`
                    + '<Owner><ID>007</ID><DisplayName>o &amp; co</DisplayName></Owner><Buckets><Bucket><Name>b1</Name>'
                    + '<CreationDate>2026-01-01T00:00:00.000Z</CreationDate></Bucket></Buckets></ListAllMyBucketsResult>'
            }));

            const result = await new S3Client(CONFIG).send(new ListBucketsCommand({}));

            assert.deepStrictEqual(result.Owner, { ID: '007', DisplayName: 'o & co' });
            assert.deepStrictEqual(result.Buckets, [{ Name: 'b1', CreationDate: new Date('2026-01-01T00:00:00.000Z') }]);
        });

        it('should parse a ListObjectsV2 response with entities, numbers and non-ASCII keys', async () => {

            stubHttp(() => ({
                headers: { 'content-type': 'application/xml' },
                body: `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult ${XMLNS}><Name>b1</Name>`
                    + '<KeyCount>2</KeyCount><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated>'
                    + '<Contents><Key>a &lt;1&gt;.txt</Key><Size>0012</Size><ETag>&quot;abc&quot;</ETag></Contents>'
                    + '<Contents><Key>č/🐎.txt</Key><Size>5</Size></Contents></ListBucketResult>'
            }));

            const result = await new S3Client(CONFIG).send(new ListObjectsV2Command({ Bucket: 'b1' }));

            assert.strictEqual(result.Name, 'b1');
            assert.strictEqual(result.KeyCount, 2);
            assert.strictEqual(result.MaxKeys, 1000);
            assert.strictEqual(result.IsTruncated, false);
            assert.deepStrictEqual(result.Contents, [
                { Key: 'a <1>.txt', Size: 12, ETag: '"abc"' },
                { Key: 'č/🐎.txt', Size: 5 }
            ]);
        });

        it('should turn an XML error response into a named error', async () => {

            stubHttp(() => ({
                statusCode: 404,
                headers: { 'content-type': 'application/xml' },
                body: '<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchBucket</Code>'
                    + '<Message>The specified bucket does not exist</Message><BucketName>missing</BucketName></Error>'
            }));

            await assert.rejects(new S3Client(CONFIG).send(new ListObjectsV2Command({ Bucket: 'missing' })), err => {
                assert.strictEqual(err.name, 'NoSuchBucket');
                assert.strictEqual(err.message, 'The specified bucket does not exist');
                assert.strictEqual(err.$metadata.httpStatusCode, 404);
                return true;
            });
        });
    });
});
