'use strict';

const amqp = require('amqplib');
const crypto = require('crypto');

// Note that we cannot simply define with `const RABBITMQ_CONNECTOR_OPEN_CONNECTIONS = {}; `.
// This is because the Appmixer engine clears the "require" cache
// when loading individual component code. Therefore, different RabbitMQ componnets will not share the same RABBITMQ_OPEN_CONNECTIONS object
// even on the same node! Therefore, we take advantage of the global `process` object to get the variable if it exists, or create it if it doesn't.
// [connectionId]: consumer/producer object
let RABBITMQ_CONNECTOR_OPEN_CONNECTIONS;
if (process.RABBITMQ_CONNECTOR_OPEN_CONNECTIONS) {
    RABBITMQ_CONNECTOR_OPEN_CONNECTIONS = process.RABBITMQ_CONNECTOR_OPEN_CONNECTIONS;
} else {
    process.RABBITMQ_CONNECTOR_OPEN_CONNECTIONS = RABBITMQ_CONNECTOR_OPEN_CONNECTIONS = {};
}

let RABBITMQ_CONNECTOR_OPEN_CHANNELS;
if (process.RABBITMQ_CONNECTOR_OPEN_CHANNELS) {
    RABBITMQ_CONNECTOR_OPEN_CHANNELS = process.RABBITMQ_CONNECTOR_OPEN_CHANNELS;
} else {
    process.RABBITMQ_CONNECTOR_OPEN_CHANNELS = RABBITMQ_CONNECTOR_OPEN_CHANNELS = {};
}

// The flush interval bounds what a node that dies replays, the probe timeout bounds a single read.
const OFFSET_FLUSH_MS = 1000;
const PROBE_TIMEOUT_MS = 1000;

// A channelId carries a per-run random suffix, so the offset is keyed by what survives a flow restart.
const offsetKey = (flowId, componentId) => `offset:${flowId}:${componentId}`;

const connectionHash = (auth) => {
    const authString = JSON.stringify(auth);
    return crypto.createHash('md5').update(authString).digest('hex');
};

const removeConnection = async (context, connection, reason) => {
    await context.log('info', '[RABBITMQ] RabbitMQ connection Closed. (' + connection.id + '). Reason + ' + reason + ' Removing connection from local connections.');
    try {
        await connection.connection.close();
    } catch (err) {
        await context.log('info', '[RABBITMQ] Warning: closing connection failed. (' + connection.id + '). Reason + ' + err + '.');
    }
    // Close all channels associated with this connection.
    Object.keys(connection.channels).forEach(async (channelId) => {
        const channel = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
        if (channel) {
            try {
                await channel.close();
            } catch (err) {
                await context.log('info', '[RABBITMQ] Warning: closing channel failed. (' + channelId + '). Reason + ' + err + '.');
            }
            delete RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
        }
        delete connection.channels[channelId];
    });
    delete RABBITMQ_CONNECTOR_OPEN_CONNECTIONS[connection.id];
};

const createChannel = async (context, channelId, auth) => {

    const connectionId = connectionHash(auth);
    await context.log('info', `[RABBITMQ] Creating channel ${channelId} on connection ${connectionId}.`);
    let connection = RABBITMQ_CONNECTOR_OPEN_CONNECTIONS[connectionId];
    if (!connection) {
        await context.log('info', `[RABBITMQ] Connection ${connectionId} does not exist. Creating.`);
        connection = {
            connection: await amqp.connect(auth),
            id: connectionId,
            channels: {}
        };
        RABBITMQ_CONNECTOR_OPEN_CONNECTIONS[connectionId] = connection;

        connection.connection.on('error', (err) => {
            removeConnection(context, connection, 'connection error event');
        });
        connection.connection.on('close', () => {
            removeConnection(context, connection, 'connection close event');
        });
    }

    let channel;
    try {
        channel = await connection.connection.createChannel();
    } catch (err) {
        await context.log('error', `[RABBITMQ] Error creating channel ${channelId} on connection ${connectionId}: ${err.message}`);
        await removeConnection(context, connection, 'channel creation error');
        throw err;
    }
    RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId] = {
        channel,
        connectionId
    };
    connection.channels[channelId] = channel;

    channel.on('error', async (error) => {
        await context.log('info', '[RABBITMQ] RabbitMQ channel ERROR (' + channelId + '). Removing channel from local connections.');
        try {
            await channel.close();
        } catch (err) {
            await context.log('info', '[RABBITMQ] Warning: closing channel failed. (' + channelId + '). Reason + ' + err + '.');
        }
        delete RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
        delete connection.channels[channelId];
    });

    await context.log('info', `[RABBITMQ] Channel ${channelId} created on connection ${connectionId}.`);
    return channel;
};

const removeChannel = async (context, channelId) => {

    await context.log('info', `[RABBITMQ] Removing channel ${channelId}.`);
    const registration = isConsumerChannel(channelId) && await context.service.stateGet(channelId);
    if (registration?.flowId) {
        await rememberOffset(context, channelId, offsetKey(registration.flowId, registration.componentId), null, true);
    }
    await context.service.stateUnset(channelId);
    await closeLocalChannel(context, channelId);
};

// Closes the channel on this node only; while it stays registered, the sync job opens it again.
const closeLocalChannel = async (context, channelId) => {

    const channel = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
    if (!channel) return; // Channel doesn't exist, do nothing.

    try {
        await channel.channel.close();
    } catch (err) {
        await context.log('info', `[RABBITMQ] Warning: closing channel ${channelId} failed. Reason: ${err}.`);
    }
    delete RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];

    const connection = RABBITMQ_CONNECTOR_OPEN_CONNECTIONS[channel.connectionId];
    if (connection?.channels[channelId]) {
        delete connection.channels[channelId];
        if (Object.keys(connection.channels).length === 0) {
            await context.log('info', `[RABBITMQ] Closing connection ${channel.connectionId} of channel ${channelId}. No other channels are using the connection.`);
            try {
                await connection.connection.close();
            } catch (err) {
                await context.log('info', `[RABBITMQ] Warning: closing connection ${channel.connectionId} failed. Reason: ${err}.`);
            }
            delete RABBITMQ_CONNECTOR_OPEN_CONNECTIONS[channel.connectionId];
        }
    }
};

// Stores the offset after the last one handled (resubscribing is inclusive), flushed at most once per interval.
const rememberOffset = async (context, channelId, key, offset, force) => {

    const record = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
    if (!record) return;
    if (Number.isInteger(offset)) record.offset = offset + 1;
    if (!Number.isInteger(record.offset)) return;
    if (!force && Date.now() - (record.flushedAt || 0) < OFFSET_FLUSH_MS) return;

    // Stamped before the write, so an overlapping flush does not write the same offset again.
    record.flushedAt = Date.now();
    try {
        await context.service.stateSet(key, { offset: record.offset });
    } catch (err) {
        await context.log('error', `[RABBITMQ] Could not persist stream offset ${key}: ${err.message}.`);
    }
};

// Earliest offset still held at or after the given one; unfiltered, since filtering also skips offsets.
const firstAvailableOffset = async (context, auth, queue, offset) => {

    const probeId = `probe:${queue}:${Math.random().toString(36).substring(7)}`;
    const channel = await createChannel(context, probeId, auth);
    let found = null;

    try {
        await channel.prefetch(1, false);
        // Nothing is acked, so the probe advances nothing.
        await channel.consume(queue, (message) => {
            found = found ?? message?.properties.headers['x-stream-offset'];
        }, { arguments: { 'x-stream-offset': offset } });

        const deadline = Date.now() + PROBE_TIMEOUT_MS;
        while (found === null && Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 25));
        }
    } finally {
        await removeChannel(context, probeId);
    }

    return found;
};

const addConsumer = async (context, queue, options, flowId, componentId, auth, channelId) => {

    // Genereate a unique consumer channel ID that differes between flow runs. Therefore, one setting
    // of the consumer followed by a flow stop and restart is not going to cause the job or message consumption
    // to consider the consumer is valid.
    channelId = channelId || `consumer:${flowId}:${componentId}:${Math.random().toString(36).substring(7)}`;

    await context.log('info', `[RABBITMQ] Adding consumer channel ${channelId}.`);

    await context.service.stateSet(channelId, {
        queue, options, flowId, componentId, auth
    });

    const consumer = await createChannel(context, channelId, auth);

    // A stream rejects consumption without a QoS prefetch, and rejects a global one.
    if (options?.prefetch) {
        await consumer.prefetch(options.prefetch, false);
    }

    const filterValue = options?.arguments?.['x-stream-filter'];
    const key = options?.arguments ? offsetKey(flowId, componentId) : null;
    const stored = key && await context.service.stateGet(key);

    if (stored) {
        // Where the previous run got to outranks what the component was configured to start from.
        let resumeFrom = stored.offset;
        const available = await firstAvailableOffset(context, auth, queue, resumeFrom);

        if (available > resumeFrom) {
            const lost = available - resumeFrom;
            await context.log('error', `[RABBITMQ] Stream ${queue}: retention dropped ${lost} message(s) that ${channelId} had not read.`);
            await context.triggerComponent(flowId, componentId,
                { warning: { reason: 'truncated', queue, requestedOffset: resumeFrom, firstOffset: available, lost } },
                { enqueueOnly: 'true' });
            resumeFrom = available;
        }
        options = { ...options, arguments: { ...options.arguments, 'x-stream-offset': resumeFrom } };
        RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId].offset = resumeFrom;
    }

    const handle = async (message) => {

        // If the message is null, it means the consumer was cancelled.
        if (!message) return;

        // First, make sure the consumer is still needed. The flow might have stopped
        // which disconnected the consumer from open connections but only on one node in the cluster.
        const channel = await context.service.stateGet(channelId);
        if (!channel) return;

        const offset = message.properties.headers?.['x-stream-offset'];
        // The broker's stream filter is a bloom filter: it over-delivers, so the header is rechecked here.
        if (filterValue && message.properties.headers?.['x-stream-filter-value'] !== filterValue) {
            await rememberOffset(context, channelId, key, offset, false);
            if (options?.noAck !== true) consumer.ack(message);
            return;
        }

        await context.triggerComponent(
            flowId,
            componentId,
            {
                content: message.content && message.content.toString(),
                fields: message.fields,
                properties: message.properties
            },
            { enqueueOnly: 'true' }
        );

        // enqueueOnly already queued the message for the flow, so the offset can move past it.
        if (key) {
            await rememberOffset(context, channelId, key, offset, false);
        }

        if (options?.noAck !== true) {
            consumer.ack(message);
        }
    };

    // One stream delivery at a time, so the stored offset never passes a delivery that is not enqueued yet.
    let pending = Promise.resolve();
    let failed = false;
    const onMessage = !key ? handle : (message) => {
        // Returned only so a caller can wait for the delivery to be handled; amqplib ignores it.
        return pending = pending
            .then(() => failed ? undefined : handle(message))
            .catch(async (err) => {
                failed = true;
                await context.log('error', `[RABBITMQ] Stream ${queue}: delivery failed on ${channelId}, ` +
                    `resuming from it on the next connection sync: ${err.message}.`);
                // Everything before it is handled, so reading resumes at the failed delivery, not the configured offset.
                const record = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
                const offset = message?.properties.headers?.['x-stream-offset'];
                if (record && Number.isInteger(offset)) record.offset = offset;
                await rememberOffset(context, channelId, key, null, true);
                await closeLocalChannel(context, channelId);
            });
    };

    await consumer.consume(queue, onMessage, options || {});

    return channelId;
};

const addProducer = async (context, flowId, componentId, auth, channelId) => {

    channelId = channelId || `producer:${flowId}:${componentId}:${Math.random().toString(36).substring(7)}`;

    await context.log('info', `[RABBITMQ] Adding producer channel ${channelId} for flow ${flowId}.`);

    await context.service.stateSet(channelId, {
        flowId, componentId, auth
    });

    await createChannel(context, channelId, auth);
    return channelId;
};

const sendToQueue = async (context, channelId, payload) => {

    let producer = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
    if (!producer) {
        const channel = await context.service.stateGet(channelId);
        if (!channel) {
            return await context.log('info', `[RABBITMQ] SendToQueue. Channel ${channelId} not found.`);
        }
        await addProducer(context, channel.flowId, channel.componentId, channel.auth, channelId);
        producer = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
    }
    return producer.channel.sendToQueue(
        payload.queue,
        Buffer.from(payload.message),
        payload.options
    );
};

const publish = async (context, channelId, payload) => {

    let producer = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
    if (!producer) {
        const channel = await context.service.stateGet(channelId);
        if (!channel) {
            return await context.log('info', `[RABBITMQ] Publish. Channel ${channelId} not found.`);
        }
        await addProducer(context, channel.flowId, channel.componentId, channel.auth, channelId);
        producer = RABBITMQ_CONNECTOR_OPEN_CHANNELS[channelId];
    }
    return producer.channel.publish(
        payload.exchange,
        payload.routingKey,
        Buffer.from(payload.message),
        payload.options
    );
};

const listChannels = () => { return RABBITMQ_CONNECTOR_OPEN_CHANNELS; };

const listConnections = () => { return RABBITMQ_CONNECTOR_OPEN_CHANNELS; };

const isConsumerChannel = (channelId) => channelId.startsWith('consumer:');
// The plugin state holds stream offsets next to the channel registrations, and they are not channels.
const isChannel = (channelId) => isConsumerChannel(channelId) || channelId.startsWith('producer:');

module.exports = {
    addConsumer,
    addProducer,
    sendToQueue,
    publish,
    removeChannel,
    listChannels,
    listConnections,
    isConsumerChannel,
    isChannel
};
