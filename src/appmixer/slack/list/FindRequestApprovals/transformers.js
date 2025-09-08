'use strict';

/**
 * Component for transforming users to select array format.
 * @param {Object} users
 */
module.exports.usersToSelectArray = users => {

    let transformed = [];

    if (Array.isArray(users)) {
        users.forEach(user => {
            if (user && user.id && user.real_name && !user.deleted && !user.is_bot) {
                transformed.push({
                    label: user.real_name + (user.display_name ? ` (${user.display_name})` : ''),
                    value: user.id
                });
            }
        });
    }

    return transformed;
};
