'use strict';
module.exports = context => {

    class ChatMessageModel extends context.db.Model {

        static get collection() {

            return 'chat_messages';
        }

        static get idProperty() {

            return 'id';
        }

        static get properties() {

            return [
                'id',
                'content',
                'files',  // Array of file objects { id, name, type, size, md5 }
                'role',  // 'user' or 'agent'
                'threadId',
                'userId',
                'correlationId',
                'componentId',
                'flowId',
                'createdAt'
            ];
        }
    }

    ChatMessageModel.createSettersAndGetters();

    return ChatMessageModel;
};
