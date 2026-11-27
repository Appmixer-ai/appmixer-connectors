'use strict';

module.exports = {
    picklistValuesToSelectArray: (fields = {}) => {

        const fieldProperties = fields?.fields[0];
        if (Array.isArray(fieldProperties?.picklistValues)) {

            return fieldProperties.picklistValues.map(item => {

                return {
                    value: item.value,
                    label: item.label
                };
            });
        }

        return [];
    },

    fieldsToSelectOptions: (fields = {}) => {

        if (Array.isArray(fields?.fields)) {

            return fields.fields.map(item => {

                return {
                    label: item.label ? `${item.label} - (${item.name})` : item.name,
                    value: item.name
                };
            });
        }
        return [];
    },

    // Output variables of the Record Updated trigger: the fields of the object plus the old
    // and the new value of the watched field.
    recordUpdatedOutputOptions: (fields = {}) => {

        const options = Array.isArray(fields?.fields) ? fields.fields.map(item => {

            return {
                label: item.label ? `${item.label} - (${item.name})` : item.name,
                value: item.name
            };
        }) : [];
        return options.concat([
            { label: 'Old Value (Changes, Changes to)', value: 'oldValue' },
            { label: 'New Value', value: 'newValue' }
        ]);
    }
};
