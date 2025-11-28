# Grok Connector Context

## Service Overview
Grok is a family of Large Language Models (LLMs) developed by xAI. It provides text generation, reasoning, image understanding, and image generation capabilities through a REST API. The API is designed to be compatible with OpenAI's API structure, making it familiar for developers.

## Authentication Method
**API Key Authentication (Bearer Token)**
- **Security Level**: High (API Key with Bearer Token authentication)
- **Authentication Type**: API Key
- **Header**: `Authorization: Bearer <API_KEY>`
- **How to obtain API Key**:
  1. Create an xAI account at https://accounts.x.ai/sign-up?redirect=cloud-console
  2. Go to the xAI Console API Keys Page: https://console.x.ai/team/default/api-keys
  3. Create a new API key
  4. Set the API key in environment: `export XAI_API_KEY="your_api_key"`

## Base URL
- **Production API**: `https://api.x.ai/v1`

## Essential Actions (Maximum 10)

### 1. ChatCompletion
**Description**: Generate text responses using Grok models with conversational context
- **Endpoint**: `POST /v1/chat/completions`
- **Purpose**: Primary text generation, conversation, question answering, content creation
- **Key Features**: Supports system/user/assistant roles, temperature control, streaming responses
- **Models**: grok-3-latest, grok-3-fast-latest, grok-3-mini-latest, grok-2-latest

### 2. ReasoningCompletion
**Description**: Generate responses with step-by-step reasoning using specialized reasoning models
- **Endpoint**: `POST /v1/chat/completions` (with reasoning_effort parameter)
- **Purpose**: Math problems, logical reasoning, complex problem solving
- **Key Features**: Provides reasoning trace in response, supports low/high reasoning effort
- **Models**: grok-3-mini-beta, grok-3-mini-fast-beta

### 3. ImageGeneration
**Description**: Generate images from text prompts
- **Endpoint**: `POST /v1/images/generations`
- **Purpose**: Create images based on text descriptions
- **Key Features**: Supports multiple image generation (1-10), base64 or URL response format
- **Models**: grok-2-image-latest

### 4. ImageUnderstanding
**Description**: Analyze and understand images with text queries
- **Endpoint**: `POST /v1/chat/completions` (with image input)
- **Purpose**: Image analysis, OCR, visual question answering
- **Key Features**: Accepts images in base64 or URL format
- **Models**: grok-2-vision-latest, grok-vision-beta

### 5. StreamingResponse
**Description**: Get real-time streaming responses for chat completions
- **Endpoint**: `POST /v1/chat/completions` (with stream: true)
- **Purpose**: Real-time text generation for interactive applications
- **Key Features**: Server-sent events, progressive response delivery

### 6. StructuredOutput
**Description**: Generate responses in specific JSON schemas
- **Endpoint**: `POST /v1/chat/completions` (with response_format)
- **Purpose**: Structured data extraction, API responses, form filling
- **Key Features**: JSON schema validation, consistent output format

### 7. DeferredChatCompletion
**Description**: Handle asynchronous, long-running chat completion requests
- **Endpoint**: `POST /v1/chat/completions` (asynchronous mode)
- **Purpose**: Long-running requests, batch processing
- **Key Features**: Job-based processing, status checking

### 8. ListModels
**Description**: Retrieve available models and their capabilities
- **Endpoint**: `GET /v1/models`
- **Purpose**: Discover available models, check model status
- **Key Features**: Model metadata, pricing information, capabilities

### 9. ModelFingerprint
**Description**: Get model version fingerprints for tracking and consistency
- **Endpoint**: `POST /v1/fingerprint`
- **Purpose**: Model versioning, reproducibility, consistency checks
- **Key Features**: Unique model identifiers, version tracking

### 10. ValidateCredentials
**Description**: Validate API key and check account status
- **Endpoint**: `GET /v1/models` (used for validation)
- **Purpose**: Authentication testing, account verification
- **Key Features**: Simple credential validation

## Essential Triggers (Maximum 3)

### 1. ModelUpdate
**Description**: Trigger when new models are available or existing models are updated
- **Purpose**: Notify when model capabilities change
- **Polling**: Check model list periodically

### 2. UsageLimitAlert
**Description**: Trigger when API usage approaches rate limits or quota
- **Purpose**: Monitor API consumption, prevent service interruption
- **Polling**: Check usage statistics

### 3. ServiceStatus
**Description**: Trigger when API service status changes
- **Purpose**: Monitor service availability and performance
- **Polling**: Health check endpoint monitoring

## Available Models

### Text Generation Models
- **grok-3-beta/grok-3-latest**: Most capable, $15.00/1M tokens
- **grok-3-fast-beta/grok-3-fast-latest**: Faster responses, $25.00/1M tokens
- **grok-3-mini-beta/grok-3-mini-latest**: Lightweight with reasoning, $0.50/1M tokens
- **grok-3-mini-fast-beta/grok-3-mini-fast-latest**: Fast lightweight, $4.00/1M tokens
- **grok-2-latest**: Previous generation, $10.00/1M tokens

### Vision Models
- **grok-2-vision-latest**: Image understanding, $2.00/1M text + $10.00/1M image tokens
- **grok-vision-beta**: Vision capabilities, $5.00/1M text + $15.00/1M image tokens

### Image Generation Models
- **grok-2-image-latest**: Image generation, $0.07 per image

## Key Features
- **Flexible Message Roles**: No strict ordering of system/user/assistant messages
- **Reasoning Capabilities**: Step-by-step thinking with grok-3-mini models
- **Image Generation**: High-quality image creation from text prompts
- **Image Understanding**: Comprehensive visual analysis capabilities
- **Streaming Support**: Real-time response delivery
- **Structured Outputs**: JSON schema-based response formatting
- **OpenAI Compatibility**: Familiar API structure for easy migration

## Rate Limits and Pricing
- Pay-per-use model with different rates per model
- Rate limits vary by model and subscription tier
- Free credits available for new accounts
- Usage tracking and monitoring available

## Official Documentation
- **Primary Documentation**: https://docs.x.ai/
- **API Reference**: https://grok-api.apidog.io/
- **Console**: https://console.x.ai/
- **Pricing**: https://grok-api.apidog.io/models-and-pricing-933995m0
