let client;

class R {

}

console.log('Redis module initialized in SW360');

module.exports = {
    getClient() {
        if (!client) {
            client = new R();
        }
        return client;
    },

    async usingDb(context, callback) {
        if (!client) {
            client = new R();
            await context.log({
                message: 'SW360 component reconnected to Redis',
                gridInstanceId: context.gridInstanceId
            });
        } else {
            await context.log({ message: 'Client is there', gridInstanceId: context.gridInstanceId });
        }


        return await callback(client);
    }
};
