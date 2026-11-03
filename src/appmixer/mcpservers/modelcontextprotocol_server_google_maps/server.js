'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the deprecated
// @modelcontextprotocol/server-google-maps package (pinned to MCP SDK 1.0.1 / zod 3)
// and keeps its tool contract: same tool names, input schemas and response text.
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

function getApiKey() {

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_MAPS_API_KEY environment variable is not set');
        process.exit(1);
    }
    return apiKey;
}

const GOOGLE_MAPS_API_KEY = getApiKey();

// Tool definitions
const GEOCODE_TOOL = {
    name: 'maps_geocode',
    description: 'Convert an address into geographic coordinates',
    inputSchema: {
        type: 'object',
        properties: {
            address: {
                type: 'string',
                description: 'The address to geocode'
            }
        },
        required: ['address']
    }
};

const REVERSE_GEOCODE_TOOL = {
    name: 'maps_reverse_geocode',
    description: 'Convert coordinates into an address',
    inputSchema: {
        type: 'object',
        properties: {
            latitude: {
                type: 'number',
                description: 'Latitude coordinate'
            },
            longitude: {
                type: 'number',
                description: 'Longitude coordinate'
            }
        },
        required: ['latitude', 'longitude']
    }
};

const SEARCH_PLACES_TOOL = {
    name: 'maps_search_places',
    description: 'Search for places using Google Places API',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query'
            },
            location: {
                type: 'object',
                properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' }
                },
                description: 'Optional center point for the search'
            },
            radius: {
                type: 'number',
                description: 'Search radius in meters (max 50000)'
            }
        },
        required: ['query']
    }
};

const PLACE_DETAILS_TOOL = {
    name: 'maps_place_details',
    description: 'Get detailed information about a specific place',
    inputSchema: {
        type: 'object',
        properties: {
            place_id: {
                type: 'string',
                description: 'The place ID to get details for'
            }
        },
        required: ['place_id']
    }
};

const DISTANCE_MATRIX_TOOL = {
    name: 'maps_distance_matrix',
    description: 'Calculate travel distance and time for multiple origins and destinations',
    inputSchema: {
        type: 'object',
        properties: {
            origins: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of origin addresses or coordinates'
            },
            destinations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of destination addresses or coordinates'
            },
            mode: {
                type: 'string',
                description: 'Travel mode (driving, walking, bicycling, transit)',
                enum: ['driving', 'walking', 'bicycling', 'transit']
            }
        },
        required: ['origins', 'destinations']
    }
};

const ELEVATION_TOOL = {
    name: 'maps_elevation',
    description: 'Get elevation data for locations on the earth',
    inputSchema: {
        type: 'object',
        properties: {
            locations: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        latitude: { type: 'number' },
                        longitude: { type: 'number' }
                    },
                    required: ['latitude', 'longitude']
                },
                description: 'Array of locations to get elevation for'
            }
        },
        required: ['locations']
    }
};

const DIRECTIONS_TOOL = {
    name: 'maps_directions',
    description: 'Get directions between two points',
    inputSchema: {
        type: 'object',
        properties: {
            origin: {
                type: 'string',
                description: 'Starting point address or coordinates'
            },
            destination: {
                type: 'string',
                description: 'Ending point address or coordinates'
            },
            mode: {
                type: 'string',
                description: 'Travel mode (driving, walking, bicycling, transit)',
                enum: ['driving', 'walking', 'bicycling', 'transit']
            }
        },
        required: ['origin', 'destination']
    }
};

const MAPS_TOOLS = [
    GEOCODE_TOOL,
    REVERSE_GEOCODE_TOOL,
    SEARCH_PLACES_TOOL,
    PLACE_DETAILS_TOOL,
    DISTANCE_MATRIX_TOOL,
    ELEVATION_TOOL,
    DIRECTIONS_TOOL
];

function errorResult(text) {

    return { content: [{ type: 'text', text }], isError: true };
}

function jsonResult(data) {

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], isError: false };
}

// API handlers
async function handleGeocode(address) {

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Geocoding failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        location: data.results[0].geometry.location,
        formatted_address: data.results[0].formatted_address,
        place_id: data.results[0].place_id
    });
}

async function handleReverseGeocode(latitude, longitude) {

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('latlng', `${latitude},${longitude}`);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Reverse geocoding failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        formatted_address: data.results[0].formatted_address,
        place_id: data.results[0].place_id,
        address_components: data.results[0].address_components
    });
}

async function handlePlaceSearch(query, location, radius) {

    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    if (location) {
        url.searchParams.append('location', `${location.latitude},${location.longitude}`);
    }
    if (radius) {
        url.searchParams.append('radius', radius.toString());
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Place search failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        places: data.results.map((place) => ({
            name: place.name,
            formatted_address: place.formatted_address,
            location: place.geometry.location,
            place_id: place.place_id,
            rating: place.rating,
            types: place.types
        }))
    });
}

async function handlePlaceDetails(placeId) {

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Place details request failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        name: data.result.name,
        formatted_address: data.result.formatted_address,
        location: data.result.geometry.location,
        formatted_phone_number: data.result.formatted_phone_number,
        website: data.result.website,
        rating: data.result.rating,
        reviews: data.result.reviews,
        opening_hours: data.result.opening_hours
    });
}

async function handleDistanceMatrix(origins, destinations, mode = 'driving') {

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origins.join('|'));
    url.searchParams.append('destinations', destinations.join('|'));
    url.searchParams.append('mode', mode);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Distance matrix request failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        origin_addresses: data.origin_addresses,
        destination_addresses: data.destination_addresses,
        results: data.rows.map((row) => ({
            elements: row.elements.map((element) => ({
                status: element.status,
                duration: element.duration,
                distance: element.distance
            }))
        }))
    });
}

async function handleElevation(locations) {

    const url = new URL('https://maps.googleapis.com/maps/api/elevation/json');
    const locationString = locations
        .map((loc) => `${loc.latitude},${loc.longitude}`)
        .join('|');
    url.searchParams.append('locations', locationString);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Elevation request failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        results: data.results.map((result) => ({
            elevation: result.elevation,
            location: result.location,
            resolution: result.resolution
        }))
    });
}

async function handleDirections(origin, destination, mode = 'driving') {

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    url.searchParams.append('mode', mode);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
        return errorResult(`Directions request failed: ${data.error_message || data.status}`);
    }

    return jsonResult({
        routes: data.routes.map((route) => ({
            summary: route.summary,
            distance: route.legs[0].distance,
            duration: route.legs[0].duration,
            steps: route.legs[0].steps.map((step) => ({
                instructions: step.html_instructions,
                distance: step.distance,
                duration: step.duration,
                travel_mode: step.travel_mode
            }))
        }))
    });
}

// Server setup
const server = new Server(
    { name: 'mcp-server/google-maps', version: '0.1.0' },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: MAPS_TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    try {
        const args = request.params.arguments;
        switch (request.params.name) {
            case 'maps_geocode': {
                const { address } = args;
                return await handleGeocode(address);
            }
            case 'maps_reverse_geocode': {
                const { latitude, longitude } = args;
                return await handleReverseGeocode(latitude, longitude);
            }
            case 'maps_search_places': {
                const { query, location, radius } = args;
                return await handlePlaceSearch(query, location, radius);
            }
            case 'maps_place_details': {
                const { place_id: placeId } = args;
                return await handlePlaceDetails(placeId);
            }
            case 'maps_distance_matrix': {
                const { origins, destinations, mode } = args;
                return await handleDistanceMatrix(origins, destinations, mode);
            }
            case 'maps_elevation': {
                const { locations } = args;
                return await handleElevation(locations);
            }
            case 'maps_directions': {
                const { origin, destination, mode } = args;
                return await handleDirections(origin, destination, mode);
            }
            default:
                return errorResult(`Unknown tool: ${request.params.name}`);
        }
    } catch (error) {
        return errorResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
});

// stdout is the MCP channel; diagnostics go to stderr.
server.connect(new StdioServerTransport())
    .then(() => console.error('Google Maps MCP Server running on stdio'))
    .catch((error) => {
        console.error('Fatal error running server:', error);
        process.exit(1);
    });
