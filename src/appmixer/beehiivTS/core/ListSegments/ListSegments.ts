import type { AppmixerContext, OutputType, ItemSchema } from '../../types';

const api = require('../../api.ts');
const lib = require('../../lib.ts');

const SCHEMA: ItemSchema = {
    id: { type: 'string', title: 'Segment ID' },
    name: { type: 'string', title: 'Name' },
    status: { type: 'string', title: 'Status' },
    type: { type: 'string', title: 'Type' },
    count: { type: 'integer', title: 'Subscriber Count' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' }
};

interface ListSegmentsInput {
    publicationId: string;
    outputType: OutputType;
}

module.exports = {

    async receive(context: AppmixerContext): Promise<void> {

        const { publicationId, outputType } = context.messages.in.content as ListSegmentsInput;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Segments', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const result = await api.Index12.execute(context, { publicationId });
        const segments: Record<string, unknown>[] = (result as { data?: Record<string, unknown>[] }).data || [];

        return lib.sendArrayOutput({ context, outputType, records: segments });
    }
};
