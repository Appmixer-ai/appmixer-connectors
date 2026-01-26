'use strict';

module.exports = {

    async receive(context) {

        const lib = require('../../lib');
        let client;

        function convertInfoToObject(stringData) {
            const result = {};
            const lines = stringData.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Skip comments and empty lines
                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue;
                }

                const [key, value] = trimmedLine.split(':');
                if (!key || value === undefined) {
                    continue;
                }

                // Flatten comma-separated key=value pairs into the top-level result
                if (value.includes('=')) {
                    const pairs = value.split(',');
                    for (const pair of pairs) {
                        const [nestedKey, nestedValue] = pair.split('=');
                        if (nestedKey && nestedValue !== undefined) {
                            result[nestedKey.trim()] = lib.getParsedValue(nestedValue.trim());
                        }
                    }
                } else {
                    result[key.trim()] = lib.getParsedValue(value.trim());
                }
            }

            return result;
        }

        try {
            client = await lib.createRedisClient(context.auth);

            /** Get Redis server info
             * Example value:
             *  # Server
                redis_version:8.2.1
                redis_git_sha1:00000000
                redis_git_dirty:0
                redis_build_id:0000000000000000000000000000000000000000
                redis_mode:standalone
                os:Linux 6.8.0-1043-aws x86_64
                gcc_version:11.4.0
                ...<more lines>...
                lru_clock:0
                config_file:

                # Clients
                connected_clients:0
                client_longest_output_list:0
                client_biggest_input_buf:0
                blocked_clients:0
                maxclients:30
                cluster_connections:0
                ...<more lines>...
                */
            const infoString = await client.info();

            // Convert info string to structured object
            const info = convertInfoToObject(infoString);

            return context.sendJson({
                info,
                redis_version: info.redis_version,
                redis_mode: info.redis_mode,
                os: info.os,
                used_memory_human: info.used_memory_human,
                maxmemory_policy: info.maxmemory_policy,
                connected_clients: info.connected_clients,
                total_commands_processed: info.total_commands_processed,
                uptime_in_seconds: info.uptime_in_seconds,
                role: info.role,
                cluster_enabled: info.cluster_enabled
            }, 'out');
        } finally {
            await client?.disconnect();
        }
    }
};
