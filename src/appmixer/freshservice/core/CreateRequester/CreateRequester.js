'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            firstName, lastName, primaryEmail, workPhoneNumber, mobilePhoneNumber, jobTitle, departmentIds,
            reportingManagerId, locationId, address, timeZone, language, backgroundInformation, customFields
        } = context.messages.in.content;

        if (!firstName) {
            throw new context.CancelError('First Name is required!');
        }
        if (!primaryEmail && !workPhoneNumber && !mobilePhoneNumber) {
            throw new context.CancelError('Primary Email, Work Phone Number or Mobile Phone Number is required!');
        }

        const body = lib.compact({
            first_name: firstName,
            last_name: lastName,
            primary_email: primaryEmail,
            work_phone_number: workPhoneNumber,
            mobile_phone_number: mobilePhoneNumber,
            job_title: jobTitle,
            department_ids: lib.idList(context, departmentIds, 'Department IDs'),
            reporting_manager_id: lib.optionalId(context, reportingManagerId, 'Reporting Manager ID'),
            location_id: lib.optionalId(context, locationId, 'Location ID'),
            address,
            time_zone: timeZone,
            language,
            background_information: backgroundInformation,
            custom_fields: lib.parseCustomFields(context, customFields)
        });

        const { data } = await lib.request(context, { method: 'POST', path: '/requesters', data: body });

        return context.sendJson(lib.withoutNulls(data.requester), 'out');
    }
};
