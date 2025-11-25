/**
 * IP Blocking Policy Script
 * IMPORTANT: ECMAScript version 5 only!
 */

/* eslint-disable */
var NUM_OF_IP_GROUPS = 500;

var clientIP = context.getVariable('request.header.X-Forwarded-For') ||
    context.getVariable('request.header.X-Real-IP') ||
    context.getVariable('request.ip') ||
    context.getVariable('client.ip');

if (clientIP.indexOf(',') > -1) {
    clientIP = clientIP.split(',')[0].trim();
}

print('Processed client IP: ' + clientIP);

var ipGroup = getIpGroup(clientIP);

context.setVariable("kvm.key.name", 'blocked-ips-' + ipGroup);

/*
  Helper functions
 */

function getIpGroup(ip) {

    // Simple hash function for ES5 compatibility
    var hash = 0;
    var i;
    var chr;

    if (ip.length === 0) {
        return 0;
    }

    for (i = 0; i < ip.length; i++) {
        chr = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash = hash >>> 0; // Convert to 32bit unsigned integer
    }

    return hash % NUM_OF_IP_GROUPS;
}

