import type { AppmixerContext, OutputType, ItemSchema } from '../../types';

const api = require('../../api.ts');
const lib = require('../../lib.ts');

const SCHEMA: ItemSchema = {
    id: { type: 'string', title: 'Field ID' },
    display: { type: 'string', title: 'Name' },
    kind: { type: 'string', title: 'Kind' },
    created: { type: 'integer', title: 'Created' }
};

interface ListCustomFieldsInput {
    publicationId: string;
    outputType: OutputType;
}

module.exports = {

    async receive(context: AppmixerContext): Promise<void> {

        const { publicationId, outputType } = context.messages.in.content as ListCustomFieldsInput;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Custom Fields', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const result = await api.Index6.execute(context, { publicationId });
        const customFields: Record<string, unknown>[] = (result as { data?: Record<string, unknown>[] }).data || [];

        return lib.sendArrayOutput({ context, outputType, records: customFields });
    }
};
