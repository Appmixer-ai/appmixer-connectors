1. Preparation Phase
   Initial Setup

- Create a new directory for the connector: appmixer-connectors/src/appmixer/{{connector_name}}
- Research and identify the components that should be implemented in the connector
- Focus on implementing the actions that are crucial for the service the connector represents

Component Planning

{{#if api_docs}}
- Review the API documentation at {{api_docs}} to understand the available endpoints and their functionalities.
{{/if}}

{{#if additional_information}}
- Consider any additional information provided: {{additional_information}}
{{/if}}

The connector should implement essential actions for the target service. For example, for a Google Calendar connector, implement the following critical actions:
- CreateCalendar
- ListCalendars
- CreateEvent
- FindEvents
- UpdateEvent
- DeleteEvent
- DeleteCalendar

Store the desired components list with detailed descriptions in the appmixer-connectors/src/appmixer/{{connector_name}}/context.md file.
Authentication Research

- Research and identify the authentication method used by the target service
- Document the authentication method in the appmixer-connectors/src/appmixer/{{connector_name}}/context.md file
- Include a direct link to the service's official documentation
- IF the authentication is using api key or api token, include instructions on how to obtain the key or token.
- pick the most secure authentication method available (OAuth2 is preferred over API Key, Basic Auth, etc.)
- IMPORTANT: Do not generate connector code, just prepare the context file with the necessary information.
- IMPORTANT: provide max 10 actions and max 3 triggers that are essential for the service