# Vapi Connector for Appmixer

This connector provides integration with the Vapi platform (https://docs.vapi.ai/api-reference), enabling you to build voice AI workflows in Appmixer.

## Overview

Vapi is a platform for building voice AI assistants. This connector allows you to create, manage, and interact with voice assistants and squads within your Appmixer workflows.

## Authentication

The connector uses API Key authentication. To use this connector:

1. Log into your Vapi account
2. Navigate to your API Keys section in the dashboard
3. Copy your API key
4. When configuring the connector in Appmixer, paste the API key in the authentication dialog

## Components

### Assistants

Assistants are AI-powered voice agents that can interact with users.

- **ListAssistants** - List all assistants in your account (max 100)
- **GetAssistant** - Retrieve a specific assistant by ID
- **CreateAssistant** - Create a new assistant with custom configuration
- **UpdateAssistant** - Update an existing assistant
- **DeleteAssistant** - Delete an assistant



### Squads

Squads allow you to organize multiple assistants together.

- **ListSquads** - List all squads (max 100)
- **GetSquad** - Retrieve a specific squad by ID
- **CreateSquad** - Create a new squad
- **UpdateSquad** - Update an existing squad
- **DeleteSquad** - Delete a squad

## Output Types

List components (ListAssistants, ListSquads) support multiple output types:

- **First Item Only** - Returns only the first item from the list
- **All items at once** - Returns all items as an array
- **One item at a time** - Sends each item separately through the workflow
- **Store to CSV file** - Exports all items to a CSV file and returns the file ID

## Rate Limiting

The connector implements rate limiting to prevent API quota violations:
- Maximum 100 requests per minute per user
- Uses sliding window throttling with FIFO queueing

## Usage Examples

### Example 1: List All Assistants

1. Add the **ListAssistants** component to your flow
2. Configure authentication with your Vapi API key
3. Select output type (e.g., "All items at once")
4. Connect the output to process the list of assistants

### Example 2: Create and Configure an Assistant

1. Add the **CreateAssistant** component
2. Configure:
   - Name: "Customer Support Bot"
   - First Message: "Hello! How can I help you today?"
   - Model Configuration: JSON object with model settings
   - Voice Configuration: JSON object with voice settings
3. The component returns the newly created assistant details including its ID


## Component Details

### Assistant Configuration

When creating or updating assistants, you can provide:
- **name** (required for create): Name of the assistant
- **firstMessage**: Initial greeting message
- **model**: JSON configuration for the AI model
- **voice**: JSON configuration for voice settings

### Squad Configuration

Squads can be configured with:
- **name** (required): Name of the squad
- **members**: JSON array of squad member configurations

## Testing

Unit tests are available in the `test/vapi/` directory. To run tests:

```bash
# Set your API key
export VAPI_API_KEY=your_api_key_here

# Run tests
npm test -- test/vapi
```

## Version History

### 1.0.0
- Initial release
- Added Assistants components (List, Get, Create, Update, Delete)
- Added Squads components (List, Get, Create, Update, Delete)

## Resources

- [Vapi API Documentation](https://docs.vapi.ai/api-reference)
- [Vapi Platform](https://vapi.ai)

## Support

For issues related to this connector, please open an issue in the Appmixer connectors repository.
For Vapi API-specific questions, refer to the [Vapi documentation](https://docs.vapi.ai).
