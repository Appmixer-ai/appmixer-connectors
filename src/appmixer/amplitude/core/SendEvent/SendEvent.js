'use strict';

module.exports = {
    async receive(context) {
        const {
            eventType,
            userId,
            deviceId,
            time,
            eventProperties,
            userProperties,
            groups,
            groupProperties,
            appVersion,
            platform,
            osName,
            osVersion,
            deviceBrand,
            deviceManufacturer,
            deviceModel,
            carrier,
            country,
            region,
            city,
            dma,
            language,
            price,
            quantity,
            revenue,
            productId,
            revenueType,
            locationLat,
            locationLng,
            ip,
            idfa,
            idfv,
            adid,
            androidId,
            eventId,
            sessionId,
            insertId,
            planBranch,
            planSource,
            planVersion,
            ingestionMetadataSourceName,
            ingestionMetadataSourceVersion,
            minIdLength
        } = context.messages.in.content;

        // Validate required fields
        if (!eventType) {
            throw new context.CancelError('Event Type is required!');
        }

        if (!userId && !deviceId) {
            throw new context.CancelError('Either User ID or Device ID is required!');
        }

        // Build the event object
        const event = {
            event_type: eventType
        };

        // Add optional user/device identifiers
        if (userId) {
            event.user_id = userId;
        }
        if (deviceId) {
            event.device_id = deviceId;
        }

        // Add optional timestamp
        if (time) {
            event.time = time;
        }

        // Add optional properties
        if (eventProperties) {
            event.event_properties = typeof eventProperties === 'string' ? JSON.parse(eventProperties) : eventProperties;
        }
        if (userProperties) {
            event.user_properties = typeof userProperties === 'string' ? JSON.parse(userProperties) : userProperties;
        }
        if (groups) {
            event.groups = typeof groups === 'string' ? JSON.parse(groups) : groups;
        }
        if (groupProperties) {
            event.group_properties = typeof groupProperties === 'string' ? JSON.parse(groupProperties) : groupProperties;
        }

        // Add optional device properties
        if (appVersion) {
            event.app_version = appVersion;
        }
        if (platform) {
            event.platform = platform;
        }
        if (osName) {
            event.os_name = osName;
        }
        if (osVersion) {
            event.os_version = osVersion;
        }
        if (deviceBrand) {
            event.device_brand = deviceBrand;
        }
        if (deviceManufacturer) {
            event.device_manufacturer = deviceManufacturer;
        }
        if (deviceModel) {
            event.device_model = deviceModel;
        }
        if (carrier) {
            event.carrier = carrier;
        }

        // Add optional location properties
        if (country) {
            event.country = country;
        }
        if (region) {
            event.region = region;
        }
        if (city) {
            event.city = city;
        }
        if (dma) {
            event.dma = dma;
        }
        if (language) {
            event.language = language;
        }
        if (locationLat) {
            event.location_lat = locationLat;
        }
        if (locationLng) {
            event.location_lng = locationLng;
        }
        if (ip) {
            event.ip = ip;
        }

        // Add optional mobile identifiers
        if (idfa) {
            event.idfa = idfa;
        }
        if (idfv) {
            event.idfv = idfv;
        }
        if (adid) {
            event.adid = adid;
        }
        if (androidId) {
            event.android_id = androidId;
        }

        // Add optional revenue properties
        if (price) {
            event.price = price;
        }
        if (quantity) {
            event.quantity = quantity;
        }
        if (revenue) {
            event.revenue = revenue;
        }
        if (productId) {
            event.product_id = productId;
        }
        if (revenueType) {
            event.revenue_type = revenueType;
        }

        // Add optional deduplication properties
        if (eventId) {
            event.event_id = eventId;
        }
        if (sessionId) {
            event.session_id = sessionId;
        }
        if (insertId) {
            event.insert_id = insertId;
        }

        // Add optional plan properties
        if (planBranch || planSource || planVersion) {
            event.plan = {};
            if (planBranch) {
                event.plan.branch = planBranch;
            }
            if (planSource) {
                event.plan.source = planSource;
            }
            if (planVersion) {
                event.plan.version = planVersion;
            }
        }

        // Add optional ingestion metadata
        if (ingestionMetadataSourceName || ingestionMetadataSourceVersion) {
            event.ingestion_metadata = {};
            if (ingestionMetadataSourceName) {
                event.ingestion_metadata.source_name = ingestionMetadataSourceName;
            }
            if (ingestionMetadataSourceVersion) {
                event.ingestion_metadata.source_version = ingestionMetadataSourceVersion;
            }
        }

        // Build the request payload
        const payload = {
            api_key: context.auth.apiKey,
            events: [event]
        };

        // Add optional min_id_length
        if (minIdLength) {
            payload.options = {
                min_id_length: minIdLength
            };
        }

        // Make the HTTP request with Basic Auth
        const basicAuth = Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64');

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.amplitude.com/2/httpapi',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`
            },
            data: payload
        });

        return context.sendJson(response.data, 'out');
    }
};
