const { URL } = require('url');

const page = (baseUrl, endpoint) => {
    return `
        <!DOCTYPE html>
        <html>
        <body>
        <script type="module" src="${baseUrl}/plugins/appmixer/utils/chat/assets/chat.bundle.js"></script>
        <script type="module">
        initLauncher({
            mode: 'fullscreen',
            theme: 'light',
            endpoint: '${endpoint}',
            baseUrl: '${baseUrl}',
            jwt: '',
            widgetPosition: 'bottom-right'
        });
        </script>
        </body>
        </html>
        `;
};

module.exports = {

    generateWebUI: function(endpoint) {

        const parsedUrl = new URL(endpoint);
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
        return page(baseUrl, endpoint);
    },

};
