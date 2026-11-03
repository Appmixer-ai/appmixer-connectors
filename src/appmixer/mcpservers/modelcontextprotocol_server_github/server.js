'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the deprecated
// @modelcontextprotocol/server-github package (pinned to MCP SDK 1.0.1 / zod 3) and keeps its
// tool contract: same 26 tools, input schemas, GitHub API calls, response shapes and error texts.
// Helpers live in ./server/ (common.js, schemas.js, operations.js).
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const {
    VERSION,
    GitHubValidationError,
    GitHubResourceNotFoundError,
    GitHubAuthenticationError,
    GitHubPermissionError,
    GitHubRateLimitError,
    GitHubConflictError,
    isGitHubError,
    SchemaValidationError,
    parse
} = require('./server/common');
const schemas = require('./server/schemas');
const ops = require('./server/operations');

const server = new Server(
    { name: 'github-mcp-server', version: VERSION },
    { capabilities: { tools: {} } }
);

function formatGitHubError(error) {

    let message = `GitHub API Error: ${error.message}`;

    if (error instanceof GitHubValidationError) {
        message = `Validation Error: ${error.message}`;
        if (error.response) {
            message += `\nDetails: ${JSON.stringify(error.response)}`;
        }
    } else if (error instanceof GitHubResourceNotFoundError) {
        message = `Not Found: ${error.message}`;
    } else if (error instanceof GitHubAuthenticationError) {
        message = `Authentication Failed: ${error.message}`;
    } else if (error instanceof GitHubPermissionError) {
        message = `Permission Denied: ${error.message}`;
    } else if (error instanceof GitHubRateLimitError) {
        message = `Rate Limit Exceeded: ${error.message}\nResets at: ${error.resetAt.toISOString()}`;
    } else if (error instanceof GitHubConflictError) {
        message = `Conflict: ${error.message}`;
    }

    return message;
}

const TOOLS = [
    {
        name: 'create_or_update_file',
        description: 'Create or update a single file in a GitHub repository',
        inputSchema: schemas.CreateOrUpdateFileSchema
    },
    {
        name: 'search_repositories',
        description: 'Search for GitHub repositories',
        inputSchema: schemas.SearchRepositoriesSchema
    },
    {
        name: 'create_repository',
        description: 'Create a new GitHub repository in your account',
        inputSchema: schemas.CreateRepositoryOptionsSchema
    },
    {
        name: 'get_file_contents',
        description: 'Get the contents of a file or directory from a GitHub repository',
        inputSchema: schemas.GetFileContentsSchema
    },
    {
        name: 'push_files',
        description: 'Push multiple files to a GitHub repository in a single commit',
        inputSchema: schemas.PushFilesSchema
    },
    {
        name: 'create_issue',
        description: 'Create a new issue in a GitHub repository',
        inputSchema: schemas.CreateIssueSchema
    },
    {
        name: 'create_pull_request',
        description: 'Create a new pull request in a GitHub repository',
        inputSchema: schemas.CreatePullRequestSchema
    },
    {
        name: 'fork_repository',
        description: 'Fork a GitHub repository to your account or specified organization',
        inputSchema: schemas.ForkRepositorySchema
    },
    {
        name: 'create_branch',
        description: 'Create a new branch in a GitHub repository',
        inputSchema: schemas.CreateBranchSchema
    },
    {
        name: 'list_commits',
        description: 'Get list of commits of a branch in a GitHub repository',
        inputSchema: schemas.ListCommitsSchema
    },
    {
        name: 'list_issues',
        description: 'List issues in a GitHub repository with filtering options',
        inputSchema: schemas.ListIssuesOptionsSchema
    },
    {
        name: 'update_issue',
        description: 'Update an existing issue in a GitHub repository',
        inputSchema: schemas.UpdateIssueOptionsSchema
    },
    {
        name: 'add_issue_comment',
        description: 'Add a comment to an existing issue',
        inputSchema: schemas.IssueCommentSchema
    },
    {
        name: 'search_code',
        description: 'Search for code across GitHub repositories',
        inputSchema: schemas.SearchCodeSchema
    },
    {
        name: 'search_issues',
        description: 'Search for issues and pull requests across GitHub repositories',
        inputSchema: schemas.SearchIssuesSchema
    },
    {
        name: 'search_users',
        description: 'Search for users on GitHub',
        inputSchema: schemas.SearchUsersSchema
    },
    {
        name: 'get_issue',
        description: 'Get details of a specific issue in a GitHub repository.',
        inputSchema: schemas.GetIssueSchema
    },
    {
        name: 'get_pull_request',
        description: 'Get details of a specific pull request',
        inputSchema: schemas.GetPullRequestSchema
    },
    {
        name: 'list_pull_requests',
        description: 'List and filter repository pull requests',
        inputSchema: schemas.ListPullRequestsSchema
    },
    {
        name: 'create_pull_request_review',
        description: 'Create a review on a pull request',
        inputSchema: schemas.CreatePullRequestReviewSchema
    },
    {
        name: 'merge_pull_request',
        description: 'Merge a pull request',
        inputSchema: schemas.MergePullRequestSchema
    },
    {
        name: 'get_pull_request_files',
        description: 'Get the list of files changed in a pull request',
        inputSchema: schemas.GetPullRequestFilesSchema
    },
    {
        name: 'get_pull_request_status',
        description: 'Get the combined status of all status checks for a pull request',
        inputSchema: schemas.GetPullRequestStatusSchema
    },
    {
        name: 'update_pull_request_branch',
        description: 'Update a pull request branch with the latest changes from the base branch',
        inputSchema: schemas.UpdatePullRequestBranchSchema
    },
    {
        name: 'get_pull_request_comments',
        description: 'Get the review comments on a pull request',
        inputSchema: schemas.GetPullRequestCommentsSchema
    },
    {
        name: 'get_pull_request_reviews',
        description: 'Get the reviews on a pull request',
        inputSchema: schemas.GetPullRequestReviewsSchema
    }
];

function textResult(value) {

    return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

async function callTool(name, rawArgs) {

    switch (name) {
        case 'fork_repository': {
            const args = parse(schemas.ForkRepositorySchema, rawArgs);
            return textResult(await ops.forkRepository(args.owner, args.repo, args.organization));
        }

        case 'create_branch': {
            const args = parse(schemas.CreateBranchSchema, rawArgs);
            return textResult(await ops.createBranchFromRef(args.owner, args.repo, args.branch, args.from_branch));
        }

        case 'search_repositories': {
            const args = parse(schemas.SearchRepositoriesSchema, rawArgs);
            return textResult(await ops.searchRepositories(args.query, args.page, args.perPage));
        }

        case 'create_repository': {
            const args = parse(schemas.CreateRepositoryOptionsSchema, rawArgs);
            return textResult(await ops.createRepository(args));
        }

        case 'get_file_contents': {
            const args = parse(schemas.GetFileContentsSchema, rawArgs);
            return textResult(await ops.getFileContents(args.owner, args.repo, args.path, args.branch));
        }

        case 'create_or_update_file': {
            const args = parse(schemas.CreateOrUpdateFileSchema, rawArgs);
            return textResult(await ops.createOrUpdateFile(
                args.owner, args.repo, args.path, args.content, args.message, args.branch, args.sha
            ));
        }

        case 'push_files': {
            const args = parse(schemas.PushFilesSchema, rawArgs);
            return textResult(await ops.pushFiles(args.owner, args.repo, args.branch, args.files, args.message));
        }

        case 'create_issue': {
            const args = parse(schemas.CreateIssueSchema, rawArgs);
            const { owner, repo, ...options } = args;

            try {
                console.error(`[DEBUG] Attempting to create issue in ${owner}/${repo}`);
                console.error('[DEBUG] Issue options:', JSON.stringify(options, null, 2));

                const issue = await ops.createIssue(owner, repo, options);

                console.error('[DEBUG] Issue created successfully');
                return textResult(issue);
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));

                console.error('[ERROR] Failed to create issue:', error);

                if (error instanceof GitHubResourceNotFoundError) {
                    throw new Error(
                        `Repository '${owner}/${repo}' not found. Please verify:\n` +
                        '1. The repository exists\n' +
                        '2. You have correct access permissions\n' +
                        '3. The owner and repository names are spelled correctly'
                    );
                }

                throw new Error(`Failed to create issue: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`);
            }
        }

        case 'create_pull_request': {
            const args = parse(schemas.CreatePullRequestSchema, rawArgs);
            return textResult(await ops.createPullRequest(args));
        }

        case 'search_code': {
            const args = parse(schemas.SearchCodeSchema, rawArgs);
            return textResult(await ops.searchCode(args));
        }

        case 'search_issues': {
            const args = parse(schemas.SearchIssuesSchema, rawArgs);
            return textResult(await ops.searchIssues(args));
        }

        case 'search_users': {
            const args = parse(schemas.SearchUsersSchema, rawArgs);
            return textResult(await ops.searchUsers(args));
        }

        case 'list_issues': {
            const args = parse(schemas.ListIssuesOptionsSchema, rawArgs);
            const { owner, repo, ...options } = args;
            return textResult(await ops.listIssues(owner, repo, options));
        }

        case 'update_issue': {
            const args = parse(schemas.UpdateIssueOptionsSchema, rawArgs);
            const { owner, repo, issue_number: issueNumber, ...options } = args;
            return textResult(await ops.updateIssue(owner, repo, issueNumber, options));
        }

        case 'add_issue_comment': {
            const args = parse(schemas.IssueCommentSchema, rawArgs);
            const { owner, repo, issue_number: issueNumber, body } = args;
            return textResult(await ops.addIssueComment(owner, repo, issueNumber, body));
        }

        case 'list_commits': {
            const args = parse(schemas.ListCommitsSchema, rawArgs);
            return textResult(await ops.listCommits(args.owner, args.repo, args.page, args.perPage, args.sha));
        }

        case 'get_issue': {
            const args = parse(schemas.GetIssueSchema, rawArgs);
            return textResult(await ops.getIssue(args.owner, args.repo, args.issue_number));
        }

        case 'get_pull_request': {
            const args = parse(schemas.GetPullRequestSchema, rawArgs);
            return textResult(await ops.getPullRequest(args.owner, args.repo, args.pull_number));
        }

        case 'list_pull_requests': {
            const args = parse(schemas.ListPullRequestsSchema, rawArgs);
            const { owner, repo, ...options } = args;
            return textResult(await ops.listPullRequests(owner, repo, options));
        }

        case 'create_pull_request_review': {
            const args = parse(schemas.CreatePullRequestReviewSchema, rawArgs);
            const { owner, repo, pull_number: pullNumber, ...options } = args;
            return textResult(await ops.createPullRequestReview(owner, repo, pullNumber, options));
        }

        case 'merge_pull_request': {
            const args = parse(schemas.MergePullRequestSchema, rawArgs);
            const { owner, repo, pull_number: pullNumber, ...options } = args;
            return textResult(await ops.mergePullRequest(owner, repo, pullNumber, options));
        }

        case 'get_pull_request_files': {
            const args = parse(schemas.GetPullRequestFilesSchema, rawArgs);
            return textResult(await ops.getPullRequestFiles(args.owner, args.repo, args.pull_number));
        }

        case 'get_pull_request_status': {
            const args = parse(schemas.GetPullRequestStatusSchema, rawArgs);
            return textResult(await ops.getPullRequestStatus(args.owner, args.repo, args.pull_number));
        }

        case 'update_pull_request_branch': {
            const args = parse(schemas.UpdatePullRequestBranchSchema, rawArgs);
            const { owner, repo, pull_number: pullNumber, expected_head_sha: expectedHeadSha } = args;
            await ops.updatePullRequestBranch(owner, repo, pullNumber, expectedHeadSha);
            return textResult({ success: true });
        }

        case 'get_pull_request_comments': {
            const args = parse(schemas.GetPullRequestCommentsSchema, rawArgs);
            return textResult(await ops.getPullRequestComments(args.owner, args.repo, args.pull_number));
        }

        case 'get_pull_request_reviews': {
            const args = parse(schemas.GetPullRequestReviewsSchema, rawArgs);
            return textResult(await ops.getPullRequestReviews(args.owner, args.repo, args.pull_number));
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    try {
        if (!request.params.arguments) {
            throw new Error('Arguments are required');
        }
        return await callTool(request.params.name, request.params.arguments);
    } catch (error) {
        if (error instanceof SchemaValidationError) {
            throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
        }
        if (isGitHubError(error)) {
            throw new Error(formatGitHubError(error));
        }
        throw error;
    }
});

// stdout is the MCP channel; diagnostics go to stderr.
server.connect(new StdioServerTransport())
    .then(() => console.error('GitHub MCP Server running on stdio'))
    .catch((error) => {
        console.error('Fatal error in main():', error);
        process.exit(1);
    });
