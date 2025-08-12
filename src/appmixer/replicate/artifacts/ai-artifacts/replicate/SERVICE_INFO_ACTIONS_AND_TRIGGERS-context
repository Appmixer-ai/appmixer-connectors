# Replicate Connector - Context and Planning

## Service Overview

Replicate is a platform for running machine learning models in the cloud. It provides APIs to run various AI models including image generation, text processing, speech synthesis, and more. Key features include model predictions, training custom models, and accessing a marketplace of pre-trained models. The service is commonly used for AI/ML workflows and integrations.

## Authentication Method

**API Key Authentication**
- All API requests must include a valid API token in the `Authorization` request header
- The token must be prefixed by "Bearer", followed by a space and the token value
- Example: `Authorization: Bearer r8_Hw***********************************`
- Users can find their tokens at: https://replicate.com/account/api-tokens

## API Documentation

Official API Documentation: https://replicate.com/docs/reference/http#authentication

## Base URL
`https://api.replicate.com/v1`

## Rate Limits
- Create prediction: 600 requests per minute
- All other endpoints: 3000 requests per minute

## Key API Endpoints Identified

### Predictions
- **POST** `/predictions` - Create a prediction
- **GET** `/predictions/{prediction_id}` - Get a prediction
- **GET** `/predictions` - List predictions
- **POST** `/predictions/{prediction_id}/cancel` - Cancel a prediction

### Models
- **POST** `/models` - Create a model
- **GET** `/models/{model_owner}/{model_name}` - Get a model
- **GET** `/models` - List public models
- **QUERY** `/models` - Search public models
- **DELETE** `/models/{model_owner}/{model_name}` - Delete a model
- **GET** `/models/{model_owner}/{model_name}/examples` - List examples for a model
- **POST** `/models/{model_owner}/{model_name}/predictions` - Create a prediction using an official model

### Model Versions
- **GET** `/models/{model_owner}/{model_name}/versions/{version_id}` - Get a model version
- **GET** `/models/{model_owner}/{model_name}/versions` - List model versions
- **DELETE** `/models/{model_owner}/{model_name}/versions/{version_id}` - Delete a model version

### Collections
- **GET** `/collections/{collection_slug}` - Get a collection of models
- **GET** `/collections` - List collections of models

### Deployments
- **POST** `/deployments` - Create a deployment
- **GET** `/deployments/{deployment_owner}/{deployment_name}` - Get a deployment
- **GET** `/deployments` - List deployments
- **PATCH** `/deployments/{deployment_owner}/{deployment_name}` - Update a deployment
- **DELETE** `/deployments/{deployment_owner}/{deployment_name}` - Delete a deployment
- **POST** `/deployments/{deployment_owner}/{deployment_name}/predictions` - Create a prediction using a deployment

### Files
- **GET** `/files` - List files
- **POST** `/files` - Create a file
- **DELETE** `/files/{file_id}` - Delete a file
- **GET** `/files/{file_id}` - Get a file
- **GET** `/files/{file_id}/download` - Download a file

### Trainings
- **POST** `/models/{model_owner}/{model_name}/versions/{version_id}/trainings` - Create a training
- **GET** `/trainings/{training_id}` - Get a training
- **GET** `/trainings` - List trainings
- **POST** `/trainings/{training_id}/cancel` - Cancel a training

### Hardware & Account
- **GET** `/hardware` - List available hardware for models
- **GET** `/account` - Get the authenticated account

## Planned Components

### Essential Components for Replicate Connector:

1. **CreatePrediction** - Create a new prediction with model version and inputs
   - Most important component for running ML models
   - Supports both specific version IDs and official models
   - Handles input validation and file uploads

2. **GetPrediction** - Get the status and results of a prediction
   - Monitor prediction progress and retrieve outputs
   - Essential for checking completion status

3. **ListPredictions** - List all predictions for the authenticated user
   - View prediction history with pagination support
   - Filter by creation date

4. **CancelPrediction** - Cancel a running prediction
   - Stop predictions that are taking too long or no longer needed

5. **ListModels** - List available public models
   - Browse available models for predictions
   - Discover new models to use

6. **GetModel** - Get detailed information about a specific model
   - View model details, input/output schemas, and examples
   - Essential for understanding model capabilities

7. **SearchModels** - Search for models by query
   - Find specific models by keywords or functionality

8. **ListCollections** - List model collections
   - Browse curated collections of models by category

9. **GetCollection** - Get models in a specific collection
   - Access grouped models by use case (e.g., super-resolution, image-restoration)

10. **ListFiles** - List uploaded files
    - Manage user's uploaded files for use in predictions

11. **CreateFile** - Upload a file for use in predictions
    - Upload files to be used as inputs for models

12. **GetAccount** - Get authenticated account information
    - Retrieve user/organization details and verify authentication

### Advanced Components (Optional for initial release):

13. **CreateModel** - Create a new model (for model creators)
14. **ListModelVersions** - List versions of a specific model
15. **GetModelVersion** - Get details of a specific model version
16. **CreateTraining** - Start training a custom model
17. **GetTraining** - Get training status and results
18. **ListTrainings** - List all trainings
19. **CreateDeployment** - Create a deployment for faster inference
20. **ListDeployments** - List user's deployments

## Component Priority

**Phase 1 (Essential - Core Functionality):**
- CreatePrediction
- GetPrediction
- ListPredictions
- CancelPrediction
- GetModel
- ListModels

**Phase 2 (Important - Enhanced Functionality):**
- SearchModels
- ListCollections
- GetCollection
- CreateFile
- ListFiles
- GetAccount

**Phase 3 (Advanced - Power User Features):**
- Model management and training components
- Deployment management components

## Technical Notes

- All endpoints use Bearer token authentication
- API supports both synchronous and asynchronous prediction creation
- File inputs can be provided as HTTP URLs or data URLs
- Webhook support available for real-time updates
- Predictions have states: starting, processing, succeeded, failed, canceled
- Input/output schemas are dynamic based on the specific model being used
- Rate limiting requires careful handling in component implementations