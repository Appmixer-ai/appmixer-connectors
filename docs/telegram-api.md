# Telegram Bot API Cheat Sheet for Node.js

## Getting Started

### 1. Create a Bot
1. Message `@BotFather` on Telegram
2. Use `/newbot` command
3. Follow instructions to get your bot token
4. Token format: `123456789:AbCdefGhIJKlmNoPQRsTUVwxyZ`

### 2. Installation
```bash
npm install node-telegram-bot-api
```

## Basic Setup

```javascript
const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token from @BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Create bot instance with polling
const bot = new TelegramBot(token, { polling: true });
```

## Authentication
- All API requests use HTTPS
- Token is passed in URL: `https://api.telegram.org/bot<token>/METHOD_NAME`
- No additional authentication required

## Receiving Messages

### Listen to All Messages
```javascript
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  console.log(`Received: ${messageText} from ${chatId}`);
});
```

### Handle Specific Commands
```javascript
// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Bot is now active.');
});

// Handle /echo command with parameters
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = match[1]; // The captured text
  bot.sendMessage(chatId, response);
});
```

## Sending Messages

### Basic Text Message
```javascript
const chatId = 'USER_CHAT_ID';
bot.sendMessage(chatId, 'Hello World!');
```

### Message with Options
```javascript
bot.sendMessage(chatId, 'Choose an option:', {
  reply_markup: {
    keyboard: [
      ['Option 1', 'Option 2'],
      ['Option 3']
    ],
    one_time_keyboard: true
  }
});
```

### Inline Keyboard
```javascript
bot.sendMessage(chatId, 'Click a button:', {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Button 1', callback_data: 'btn1' },
        { text: 'Button 2', callback_data: 'btn2' }
      ]
    ]
  }
});
```

## Common Use Cases

### Echo Bot
```javascript
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `You said: ${msg.text}`);
});
```

### Handle Callback Queries (Button Clicks)
```javascript
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  
  bot.answerCallbackQuery(callbackQuery.id);
  bot.sendMessage(message.chat.id, `You clicked: ${data}`);
});
```

### Send Photos
```javascript
// From URL
bot.sendPhoto(chatId, 'https://example.com/photo.jpg');

// From local file
bot.sendPhoto(chatId, './path/to/photo.jpg');
```

### Get Chat Info
```javascript
bot.on('message', (msg) => {
  console.log('Chat ID:', msg.chat.id);
  console.log('User ID:', msg.from.id);
  console.log('Username:', msg.from.username);
});
```

## Error Handling

### Basic Error Handling
```javascript
bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});

// Handle API errors
bot.sendMessage(chatId, 'Hello').catch((error) => {
  console.log('Send message error:', error);
});
```

## Important Notes

- **Rate Limits**: Avoid sending more than 30 messages per second
- **Chat ID**: Get from incoming messages or use username with '@' prefix
- **File Size**: Maximum 20MB for file uploads
- **Polling vs Webhooks**: Use polling for development, webhooks for production
- **HTTPS Only**: All requests must use HTTPS

## Complete Example

```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Hello! I am your bot. Send me any message!');
});

// Echo all messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Skip command messages
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(chatId, `You said: ${msg.text}`);
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.log('Error:', error);
});

console.log('Bot is running...');
```

This cheat sheet covers the essential basics for getting started with Telegram bots in Node.js.