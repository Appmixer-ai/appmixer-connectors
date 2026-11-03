'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the deprecated
// @modelcontextprotocol/server-gitlab package (pinned to MCP SDK 1.0.1 / zod 3)
// and keeps its tool contract: same tool names, input schemas, GitLab API calls
// and response text.
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const server = new Server(
    { name: 'gitlab-mcp-server', version: '0.5.1' },
    { capabilities: { tools: {} } }
);

const GITLAB_PERSONAL_ACCESS_TOKEN = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
const GITLAB_API_URL = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';

if (!GITLAB_PERSONAL_ACCESS_TOKEN) {
    console.error('GITLAB_PERSONAL_ACCESS_TOKEN environment variable is not set');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Input schemas (JSON Schema, as the original zod schemas serialised them).
// ---------------------------------------------------------------------------

const JSON_SCHEMA_DRAFT = 'http://json-schema.org/draft-07/schema#';

const PROJECT_ID_PROPERTY = { type: 'string', description: 'Project ID or URL-encoded path' };

const CreateOrUpdateFileSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        file_path: { type: 'string', description: 'Path where to create/update the file' },
        content: { type: 'string', description: 'Content of the file' },
        commit_message: { type: 'string', description: 'Commit message' },
        branch: { type: 'string', description: 'Branch to create/update the file in' },
        previous_path: { type: 'string', description: 'Path of the file to move/rename' }
    },
    required: ['project_id', 'file_path', 'content', 'commit_message', 'branch'],
    additionalProperties: false
};

const SearchRepositoriesSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        search: { type: 'string', description: 'Search query' },
        page: { type: 'number', description: 'Page number for pagination (default: 1)' },
        per_page: { type: 'number', description: 'Number of results per page (default: 20)' }
    },
    required: ['search'],
    additionalProperties: false
};

const CreateRepositorySchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        name: { type: 'string', description: 'Repository name' },
        description: { type: 'string', description: 'Repository description' },
        visibility: {
            type: 'string',
            enum: ['private', 'internal', 'public'],
            description: 'Repository visibility level'
        },
        initialize_with_readme: { type: 'boolean', description: 'Initialize with README.md' }
    },
    required: ['name'],
    additionalProperties: false
};

const GetFileContentsSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        file_path: { type: 'string', description: 'Path to the file or directory' },
        ref: { type: 'string', description: 'Branch/tag/commit to get contents from' }
    },
    required: ['project_id', 'file_path'],
    additionalProperties: false
};

const PushFilesSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        branch: { type: 'string', description: 'Branch to push to' },
        files: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    file_path: { type: 'string', description: 'Path where to create the file' },
                    content: { type: 'string', description: 'Content of the file' }
                },
                required: ['file_path', 'content'],
                additionalProperties: false
            },
            description: 'Array of files to push'
        },
        commit_message: { type: 'string', description: 'Commit message' }
    },
    required: ['project_id', 'branch', 'files', 'commit_message'],
    additionalProperties: false
};

const CreateIssueSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        assignee_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of user IDs to assign'
        },
        labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of label names'
        },
        milestone_id: { type: 'number', description: 'Milestone ID to assign' }
    },
    required: ['project_id', 'title'],
    additionalProperties: false
};

const CreateMergeRequestSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        title: { type: 'string', description: 'Merge request title' },
        description: { type: 'string', description: 'Merge request description' },
        source_branch: { type: 'string', description: 'Branch containing changes' },
        target_branch: { type: 'string', description: 'Branch to merge into' },
        draft: { type: 'boolean', description: 'Create as draft merge request' },
        allow_collaboration: { type: 'boolean', description: 'Allow commits from upstream members' }
    },
    required: ['project_id', 'title', 'source_branch', 'target_branch'],
    additionalProperties: false
};

const ForkRepositorySchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        namespace: { type: 'string', description: 'Namespace to fork to (full path)' }
    },
    required: ['project_id'],
    additionalProperties: false
};

const CreateBranchSchema = {
    $schema: JSON_SCHEMA_DRAFT,
    type: 'object',
    properties: {
        project_id: PROJECT_ID_PROPERTY,
        branch: { type: 'string', description: 'Name for the new branch' },
        ref: { type: 'string', description: 'Source branch/commit for new branch' }
    },
    required: ['project_id', 'branch'],
    additionalProperties: false
};

const TOOLS = [
    {
        name: 'create_or_update_file',
        description: 'Create or update a single file in a GitLab project',
        inputSchema: CreateOrUpdateFileSchema
    },
    {
        name: 'search_repositories',
        description: 'Search for GitLab projects',
        inputSchema: SearchRepositoriesSchema
    },
    {
        name: 'create_repository',
        description: 'Create a new GitLab project',
        inputSchema: CreateRepositorySchema
    },
    {
        name: 'get_file_contents',
        description: 'Get the contents of a file or directory from a GitLab project',
        inputSchema: GetFileContentsSchema
    },
    {
        name: 'push_files',
        description: 'Push multiple files to a GitLab project in a single commit',
        inputSchema: PushFilesSchema
    },
    {
        name: 'create_issue',
        description: 'Create a new issue in a GitLab project',
        inputSchema: CreateIssueSchema
    },
    {
        name: 'create_merge_request',
        description: 'Create a new merge request in a GitLab project',
        inputSchema: CreateMergeRequestSchema
    },
    {
        name: 'fork_repository',
        description: 'Fork a GitLab project to your account or specified namespace',
        inputSchema: ForkRepositorySchema
    },
    {
        name: 'create_branch',
        description: 'Create a new branch in a GitLab project',
        inputSchema: CreateBranchSchema
    }
];

// ---------------------------------------------------------------------------
// Argument validation. Replaces zod's `.parse()` on the input schemas above:
// checks required keys, primitive types, enums and array items, strips unknown
// keys and reports failures in the same "path: message" wording.
// ---------------------------------------------------------------------------

class ArgumentsError extends Error {

    constructor(issues) {
        super(`Invalid arguments: ${issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`);
        this.issues = issues;
    }
}

function receivedType(value) {

    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number' && Number.isNaN(value)) return 'nan';
    return typeof value;
}

function validateValue(schema, value, path, issues) {

    if (schema.enum) {
        if (!schema.enum.includes(value)) {
            const expected = schema.enum.map(option => `'${option}'`).join(' | ');
            issues.push({ path, message: `Invalid enum value. Expected ${expected}, received '${value}'` });
        }
        return value;
    }

    const received = receivedType(value);
    if (received !== schema.type) {
        issues.push({ path, message: `Expected ${schema.type}, received ${received}` });
        return value;
    }

    if (schema.type === 'array') {
        return value.map((item, index) => validateValue(schema.items, item, path.concat(String(index)), issues));
    }

    if (schema.type === 'object') {
        const result = {};
        const required = schema.required || [];
        Object.keys(schema.properties).forEach(key => {
            const propertyPath = path.concat(key);
            if (value[key] === undefined) {
                if (required.includes(key)) {
                    issues.push({ path: propertyPath, message: 'Required' });
                }
                return;
            }
            result[key] = validateValue(schema.properties[key], value[key], propertyPath, issues);
        });
        return result;
    }

    return value;
}

function parseArguments(schema, args) {

    const issues = [];
    const parsed = validateValue(schema, args, [], issues);
    if (issues.length) {
        throw new ArgumentsError(issues);
    }
    return parsed;
}

// ---------------------------------------------------------------------------
// Response shapes. The original parsed every GitLab response with a zod object
// schema, which keeps only the declared keys. `pick()` does the same projection
// (nested objects and arrays included, nulls kept, missing keys omitted).
// ---------------------------------------------------------------------------

function pick(value, shape) {

    if (Array.isArray(shape)) {
        return Array.isArray(value) ? value.map(item => pick(item, shape[0])) : value;
    }
    if (shape === true || value === null || typeof value !== 'object') {
        return value;
    }
    const result = {};
    Object.keys(shape).forEach(key => {
        if (value[key] !== undefined) {
            result[key] = pick(value[key], shape[key]);
        }
    });
    return result;
}

const OWNER_SHAPE = { username: true, id: true, avatar_url: true, web_url: true, name: true, state: true };

const REPOSITORY_SHAPE = {
    id: true,
    name: true,
    path_with_namespace: true,
    visibility: true,
    owner: OWNER_SHAPE,
    web_url: true,
    description: true,
    fork: true,
    ssh_url_to_repo: true,
    http_url_to_repo: true,
    created_at: true,
    last_activity_at: true,
    default_branch: true
};

const FORK_SHAPE = Object.assign({}, REPOSITORY_SHAPE, {
    forked_from_project: {
        name: true,
        path_with_namespace: true,
        owner: { username: true, id: true, avatar_url: true },
        web_url: true
    }
});

const FILE_CONTENT_SHAPE = {
    file_name: true,
    file_path: true,
    size: true,
    encoding: true,
    content: true,
    content_sha256: true,
    ref: true,
    blob_id: true,
    last_commit_id: true
};

const DIRECTORY_CONTENT_SHAPE = { name: true, path: true, type: true, mode: true, id: true, web_url: true };

const CREATE_UPDATE_FILE_RESPONSE_SHAPE = {
    file_path: true,
    branch: true,
    commit_id: true,
    content: FILE_CONTENT_SHAPE
};

const COMMIT_SHAPE = {
    id: true,
    short_id: true,
    title: true,
    author_name: true,
    author_email: true,
    authored_date: true,
    committer_name: true,
    committer_email: true,
    committed_date: true,
    web_url: true,
    parent_ids: [true]
};

const REFERENCE_SHAPE = { name: true, commit: { id: true, web_url: true } };

const USER_SHAPE = { username: true, id: true, name: true, avatar_url: true, web_url: true };

const LABEL_SHAPE = { id: true, name: true, color: true, description: true };

const MILESTONE_SHAPE = { id: true, iid: true, title: true, description: true, state: true, web_url: true };

const ISSUE_SHAPE = {
    id: true,
    iid: true,
    project_id: true,
    title: true,
    description: true,
    state: true,
    author: USER_SHAPE,
    assignees: [USER_SHAPE],
    labels: [LABEL_SHAPE],
    milestone: MILESTONE_SHAPE,
    created_at: true,
    updated_at: true,
    closed_at: true,
    web_url: true
};

const MERGE_REQUEST_SHAPE = {
    id: true,
    iid: true,
    project_id: true,
    title: true,
    description: true,
    state: true,
    merged: true,
    author: USER_SHAPE,
    assignees: [USER_SHAPE],
    source_branch: true,
    target_branch: true,
    diff_refs: { base_sha: true, head_sha: true, start_sha: true },
    web_url: true,
    created_at: true,
    updated_at: true,
    merged_at: true,
    closed_at: true,
    merge_commit_sha: true
};

// ---------------------------------------------------------------------------
// GitLab API calls (same endpoints, headers and bodies as the original).
// ---------------------------------------------------------------------------

const AUTH_HEADERS = { 'Authorization': `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}` };
const JSON_HEADERS = Object.assign({ 'Content-Type': 'application/json' }, AUTH_HEADERS);

async function assertOk(response) {

    if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
    }
    return response;
}

async function forkProject(projectId, namespace) {

    const url = `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/fork`;
    const queryParams = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';

    const response = await assertOk(await fetch(url + queryParams, {
        method: 'POST',
        headers: JSON_HEADERS
    }));
    return pick(await response.json(), FORK_SHAPE);
}

async function createBranch(projectId, options) {

    const response = await assertOk(await fetch(
        `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/branches`,
        {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                branch: options.name,
                ref: options.ref
            })
        }
    ));
    return pick(await response.json(), REFERENCE_SHAPE);
}

async function getFileContents(projectId, filePath, ref) {

    const encodedPath = encodeURIComponent(filePath);
    let url = `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/files/${encodedPath}`;
    if (ref) {
        url += `?ref=${encodeURIComponent(ref)}`;
    } else {
        url += '?ref=HEAD';
    }

    const response = await assertOk(await fetch(url, { headers: AUTH_HEADERS }));

    const raw = await response.json();
    const data = Array.isArray(raw) ? pick(raw, [DIRECTORY_CONTENT_SHAPE]) : pick(raw, FILE_CONTENT_SHAPE);

    if (!Array.isArray(data) && data.content) {
        data.content = Buffer.from(data.content, 'base64').toString('utf8');
    }

    return data;
}

async function createIssue(projectId, options) {

    const response = await assertOk(await fetch(
        `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/issues`,
        {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                title: options.title,
                description: options.description,
                assignee_ids: options.assignee_ids,
                milestone_id: options.milestone_id,
                labels: options.labels ? options.labels.join(',') : undefined
            })
        }
    ));
    return pick(await response.json(), ISSUE_SHAPE);
}

async function createMergeRequest(projectId, options) {

    const response = await assertOk(await fetch(
        `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/merge_requests`,
        {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                title: options.title,
                description: options.description,
                source_branch: options.source_branch,
                target_branch: options.target_branch,
                allow_collaboration: options.allow_collaboration,
                draft: options.draft
            })
        }
    ));
    return pick(await response.json(), MERGE_REQUEST_SHAPE);
}

async function createOrUpdateFile(projectId, filePath, content, commitMessage, branch, previousPath) {

    const encodedPath = encodeURIComponent(filePath);
    const url = `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/files/${encodedPath}`;

    const body = Object.assign(
        { branch, content, commit_message: commitMessage },
        previousPath ? { previous_path: previousPath } : {}
    );

    // Check if file exists
    let method = 'POST';
    try {
        await getFileContents(projectId, filePath, branch);
        method = 'PUT';
    } catch (error) {
        // File doesn't exist, use POST
    }

    const response = await assertOk(await fetch(url, {
        method,
        headers: JSON_HEADERS,
        body: JSON.stringify(body)
    }));
    return pick(await response.json(), CREATE_UPDATE_FILE_RESPONSE_SHAPE);
}

async function createCommit(projectId, message, branch, actions) {

    const response = await assertOk(await fetch(
        `${GITLAB_API_URL}/projects/${encodeURIComponent(projectId)}/repository/commits`,
        {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({
                branch,
                commit_message: message,
                actions: actions.map(action => ({
                    action: 'create',
                    file_path: action.path,
                    content: action.content
                }))
            })
        }
    ));
    return pick(await response.json(), COMMIT_SHAPE);
}

async function searchProjects(query, page = 1, perPage = 20) {

    const url = new URL(`${GITLAB_API_URL}/projects`);
    url.searchParams.append('search', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());

    const response = await assertOk(await fetch(url.toString(), { headers: AUTH_HEADERS }));

    const projects = await response.json();
    return {
        count: parseInt(response.headers.get('X-Total') || '0'),
        items: pick(projects, [REPOSITORY_SHAPE])
    };
}

async function createRepository(options) {

    const response = await assertOk(await fetch(`${GITLAB_API_URL}/projects`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
            name: options.name,
            description: options.description,
            visibility: options.visibility,
            initialize_with_readme: options.initialize_with_readme
        })
    }));
    return pick(await response.json(), REPOSITORY_SHAPE);
}

// ---------------------------------------------------------------------------
// MCP handlers.
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

function textResult(data) {

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    if (!request.params.arguments) {
        throw new Error('Arguments are required');
    }

    switch (request.params.name) {
        case 'fork_repository': {
            const args = parseArguments(ForkRepositorySchema, request.params.arguments);
            return textResult(await forkProject(args.project_id, args.namespace));
        }

        case 'create_branch': {
            const args = parseArguments(CreateBranchSchema, request.params.arguments);
            const branch = await createBranch(args.project_id, {
                name: args.branch,
                ref: args.ref || 'HEAD'
            });
            return textResult(branch);
        }

        case 'search_repositories': {
            const args = parseArguments(SearchRepositoriesSchema, request.params.arguments);
            return textResult(await searchProjects(args.search, args.page, args.per_page));
        }

        case 'create_repository': {
            const args = parseArguments(CreateRepositorySchema, request.params.arguments);
            return textResult(await createRepository(args));
        }

        case 'get_file_contents': {
            const args = parseArguments(GetFileContentsSchema, request.params.arguments);
            return textResult(await getFileContents(args.project_id, args.file_path, args.ref));
        }

        case 'create_or_update_file': {
            const args = parseArguments(CreateOrUpdateFileSchema, request.params.arguments);
            const result = await createOrUpdateFile(
                args.project_id,
                args.file_path,
                args.content,
                args.commit_message,
                args.branch,
                args.previous_path
            );
            return textResult(result);
        }

        case 'push_files': {
            const args = parseArguments(PushFilesSchema, request.params.arguments);
            const result = await createCommit(
                args.project_id,
                args.commit_message,
                args.branch,
                args.files.map(file => ({ path: file.file_path, content: file.content }))
            );
            return textResult(result);
        }

        case 'create_issue': {
            const args = parseArguments(CreateIssueSchema, request.params.arguments);
            const { project_id: projectId, ...options } = args;
            return textResult(await createIssue(projectId, options));
        }

        case 'create_merge_request': {
            const args = parseArguments(CreateMergeRequestSchema, request.params.arguments);
            const { project_id: projectId, ...options } = args;
            return textResult(await createMergeRequest(projectId, options));
        }

        default:
            throw new Error(`Unknown tool: ${request.params.name}`);
    }
});

async function runServer() {

    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stdout is the MCP channel; diagnostics go to stderr.
    console.error('GitLab MCP Server running on stdio');
}

runServer().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
