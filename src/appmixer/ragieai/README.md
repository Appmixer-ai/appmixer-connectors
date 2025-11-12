# RagieAI Connector

This connector integrates with the RagieAI API to manage documents and chunks for RAG (Retrieval Augmented Generation) applications.

## Overview

RagieAI is a fully managed RAG-as-a-Service platform that helps developers build production-ready AI applications with retrieval augmented generation.

## Components

### Document Management

#### CreateDocument
- **Description**: Creates a new document from text content
- **Input**: Document name (required), content (required), optional metadata
- **Output**: Document object with id, name, status, created_at, metadata

#### CreateDocumentFromUrl
- **Description**: Creates a new document from a URL
- **Input**: URL (required), optional name, optional metadata
- **Output**: Document object with id, name, url, status, created_at, metadata

#### GetDocument
- **Description**: Retrieves a document by ID
- **Input**: Document ID (required)
- **Output**: Document object with full details

#### FindDocuments
- **Description**: Lists and searches documents with optional filtering
- **Input**: Optional filter, output type (array/object/first/file)
- **Output**: List of documents (max 100 per page)
- **Features**: 
  - Supports multiple output types
  - Returns notFound port when no documents match

#### UpdateDocument
- **Description**: Updates a document's metadata
- **Input**: Document ID (required), optional name, optional metadata
- **Output**: Empty object on success

#### DeleteDocument
- **Description**: Deletes a document by ID
- **Input**: Document ID (required)
- **Output**: Empty object on success

### Chunk Management

#### CreateChunk
- **Description**: Creates a new chunk manually
- **Input**: Document ID (required), text (required), optional metadata
- **Output**: Chunk object with id, document_id, text, metadata, created_at

#### RetrieveChunk
- **Description**: Retrieves a chunk by ID
- **Input**: Chunk ID (required)
- **Output**: Chunk object with id, document_id, text, metadata, score

#### GetChunkContent
- **Description**: Retrieves the content of a chunk
- **Input**: Chunk ID (required)
- **Output**: Object with id, content, document_id

#### ListChunks
- **Description**: Lists chunks with optional filtering by document
- **Input**: Optional document ID filter, output type (array/object/first/file)
- **Output**: List of chunks (max 100 per page)
- **Features**:
  - Supports multiple output types
  - Returns notFound port when no chunks match

## Authentication

The connector uses API Key authentication. Obtain your API key from the RagieAI dashboard at https://ragie.ai/dashboard

All requests include the `Authorization: Bearer {apiKey}` header.

## Component Patterns

### Output Types

Find and List components support multiple output types:
- **array**: Returns all items at once (default)
- **object**: Returns items one at a time
- **first**: Returns only the first item
- **file**: Exports results to a CSV file

### Error Handling

All components include proper error handling:
- Required field validation with clear error messages
- JSON parsing validation for metadata fields
- HTTP error responses are properly propagated

### Metadata Fields

Components that accept metadata fields support both:
- JSON strings: `'{"key": "value"}'`
- JSON objects: `{"key": "value"}`

## API Reference

For detailed API documentation, visit: https://docs.ragie.ai/reference

## Component Naming Convention

All components follow the Appmixer naming pattern:
- Format: `appmixer.ragieai.core.ComponentName`
- Component types: Create, Get, Find (List), Update, Delete, Retrieve

## Standards Compliance

- ✅ **API Key Authentication**: Properly configured
- ✅ **Input Validation**: All required fields validated
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **Coding Standards**: 4-space indentation, camelCase variables
- ✅ **ESLint**: All files pass linting
- ✅ **JSON Schema**: All component.json files are valid
- ✅ **Output Ports**: Properly defined with schemas
- ✅ **Helper Library**: Shared lib.js for array output handling

## Directory Structure

```
ragieai/
├── auth.js              # API Key authentication
├── bundle.json          # Bundle metadata
├── service.json         # Service configuration
├── lib.js              # Shared helper functions
└── core/               # Core components
    ├── CreateDocument/
    ├── CreateDocumentFromUrl/
    ├── FindDocuments/
    ├── GetDocument/
    ├── UpdateDocument/
    ├── DeleteDocument/
    ├── CreateChunk/
    ├── RetrieveChunk/
    ├── GetChunkContent/
    └── ListChunks/
```

## Usage Examples

### Creating a Document
```javascript
{
  "name": "My Document",
  "content": "This is the document content...",
  "metadata": {"category": "technical", "author": "John Doe"}
}
```

### Finding Documents
```javascript
{
  "filter": "technical",
  "outputType": "array"
}
```

### Creating a Chunk
```javascript
{
  "documentId": "doc_123",
  "text": "This is a chunk of text...",
  "metadata": {"section": "introduction"}
}
```

## Ready for Use

All components are production-ready and follow Appmixer best practices. 🚀
