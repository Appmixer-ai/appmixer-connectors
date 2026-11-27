'use strict';

const lib = require('../../lib');

const OCCUPANCY_FIELDS = ['default_occupancy', 'min_occupancy', 'max_occupancy'];

// inventory.update (https://postman.roompricegenie.com/#24f5aeae-218b-4bcf-8511-1dc9248de4d2).
// The message replaces the whole inventory of the property: a room type or rate plan that is
// missing from it is un-mapped on RoomPriceGenie's side.
module.exports = {

    async receive(context) {

        const { roomTypes, ratePlans } = context.messages.in.content;

        const rooms = lib.parseJsonArray(context, roomTypes, 'Room Types');
        if (!rooms || !rooms.length) {
            throw new context.CancelError('Room Types is required: the complete list of room types of the property.');
        }
        const data = {
            room_types: rooms.map((room, index) => {
                const label = `Room Types: item ${index + 1}`;
                if (lib.isEmpty(room.room_type_code) || lib.isEmpty(room.room_type_name)) {
                    throw new context.CancelError(`${label} needs room_type_code and room_type_name.`);
                }
                const item = {
                    ...room,
                    room_type_code: String(room.room_type_code).trim(),
                    room_type_name: String(room.room_type_name).trim(),
                    number_of_rooms: lib.toInteger(context, room.number_of_rooms, `${label}: number_of_rooms`)
                };
                for (const field of OCCUPANCY_FIELDS) {
                    if (!lib.isEmpty(room[field])) {
                        item[field] = lib.toInteger(context, room[field], `${label}: ${field}`);
                    }
                }
                return item;
            })
        };

        const plans = lib.parseJsonArray(context, ratePlans, 'Rate Plans');
        if (plans && plans.length) {
            data.rate_plans = plans.map((plan, index) => {
                if (lib.isEmpty(plan.rate_plan_code) || lib.isEmpty(plan.rate_plan_name)) {
                    throw new context.CancelError(`Rate Plans: item ${index + 1} needs rate_plan_code and rate_plan_name.`);
                }
                return {
                    ...plan,
                    rate_plan_code: String(plan.rate_plan_code).trim(),
                    rate_plan_name: String(plan.rate_plan_name).trim()
                };
            });
        }

        const result = await lib.sendEvent(context, { event: 'inventory.update', data });
        return context.sendJson(result, 'out');
    }
};
