/* eslint-disable */
var blockedIPsEntry = context.getVariable('blocked-ips');
var blockedIPs = [];

if (blockedIPsEntry) {
    try {
        var blockedIPsObject = entryToList(blockedIPsEntry);
        print('Number of entries: ' + Object.keys(blockedIPsObject).length);

        var currentTime = new Date();

        Object.keys(blockedIPsObject).forEach(function(ip) {
            var entry = blockedIPsObject[ip];

            if (entry.expiration) {
                var expirationDate = new Date(entry.expiration);
                if (expirationDate > currentTime) {
                    blockedIPs.push(entry.ip);
                }
            } else {
                blockedIPs.push(entry.ip);
            }
        });

        context.setVariable('blocked.ips.simple', JSON.stringify(blockedIPs));
        context.setVariable('blocked.ips.count', blockedIPs.length.toString());
        context.setVariable('blocked.ips.loaded', 'true');

    } catch (e) {
        print('Raw value (first 500 chars): ' + (blockedIPsEntry ? blockedIPsEntry.substring(0, 500) : 'null'));
        context.setVariable('blocked.ips.loaded', false);
        context.setVariable('blocked.ips.error', e.message);
    }
}

var clientIP = context.getVariable('request.header.X-Forwarded-For') ||
    context.getVariable('request.header.X-Real-IP') ||
    context.getVariable('request.ip') ||
    context.getVariable('client.ip');

print('Raw client IP: ' + clientIP);

if (clientIP && clientIP.indexOf(',') > -1) {
    clientIP = clientIP.split(',')[0].trim();
}

print('Processed client IP: ' + clientIP);

// Separate individual IPs from CIDR ranges
var individualIPs = [];
var cidrRanges = [];

blockedIPs.forEach(function(entry) {
    if (entry.indexOf('/') > -1) {
        cidrRanges.push(entry);
    } else {
        individualIPs.push(entry);
    }
});

print('Individual IPs to check: ' + JSON.stringify(individualIPs));
print('CIDR ranges to check: ' + JSON.stringify(cidrRanges));

// Check if IP is blocked
var isBlocked = individualIPs.indexOf(clientIP) > -1;

// Check CIDR ranges if not already blocked
if (!isBlocked && cidrRanges.length > 0) {
    for (var i = 0; i < cidrRanges.length; i++) {
        if (isIPInCIDR(clientIP, cidrRanges[i])) {
            isBlocked = true;
            print('IP blocked by CIDR range: ' + cidrRanges[i]);
            break;
        }
    }
}

// Always set the ip.blocked variable (important for condition checking)
if (isBlocked) {
    context.setVariable('ip.blocked', true);
    context.setVariable('blocked.client.ip', clientIP);
} else {
    context.setVariable('ip.blocked', false);
    context.setVariable('blocked.client.ip', clientIP);
}

/*

  Helper functions

 */

function entryToList(entry) {
    if (!entry) {
        return {};
    }
    return entry.split('|').reduce((res, item) => {
        var parts = item.split(';');
        var ip = parts[0];
        var expiration = parts[1];

        if (ip) {
            res[ip] = {
                ip: ip,
                expiration: expiration ? parseInt(expiration, 10) : null
            };
        }
        return res;
    }, {});
}

// CIDR check function implementation
function isIPInCIDR(ip, cidr) {
    print('Checking IP ' + ip + ' against CIDR ' + cidr);

    try {
        var parts = cidr.split('/');
        var networkIP = parts[0];
        var prefixLength = parseInt(parts[1], 10);

        // Convert IPs to integers for comparison
        var clientIPInt = ipToInt(ip);
        var networkIPInt = ipToInt(networkIP);

        // Calculate network mask
        var mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;

        // Check if IP is in network
        var result = (clientIPInt & mask) === (networkIPInt & mask);
        print('CIDR check result: ' + result);

        return result;
    } catch (e) {
        print('Error in CIDR check: ' + e.message);
        return false;
    }
}

// Helper function to convert IP to integer
function ipToInt(ip) {
    var parts = ip.split('.');
    return (parseInt(parts[0], 10) << 24) +
        (parseInt(parts[1], 10) << 16) +
        (parseInt(parts[2], 10) << 8) +
        parseInt(parts[3], 10);
}
