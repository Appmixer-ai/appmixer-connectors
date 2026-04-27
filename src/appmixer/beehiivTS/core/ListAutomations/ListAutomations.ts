import type { AppmixerContext, OutputType, ItemSchema } from '../../types';

const api = require('../../api.ts');
const lib = require('../../lib.ts');

const SCHEMA: ItemSchema = {
    id: { type: 'string', title: 'Automation ID' },
    name: { type: 'string', title: 'Name' },
    status: { type: 'string', title: 'Status' }
};

interface ListAutomationsInput {
    publicationId: string;
    outputType: OutputType;
}

module.exports = {

    async receive(context: AppmixerContext): Promise<void> {

        const { publicationId, outputType } = context.messages.in.content as ListAutomationsInput;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Automations', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const result = await api.Index3.execute(context, { publicationId });
        const automations: Record<string, unknown>[] = (result as { data?: Record<string, unknown>[] }).data || [];

        return lib.sendArrayOutput({ context, outputType, records: automations });
    }
};
