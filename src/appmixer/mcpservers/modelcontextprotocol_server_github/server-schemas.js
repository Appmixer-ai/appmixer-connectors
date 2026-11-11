'use strict';

// JSON Schema translations of the zod schemas of the deprecated @modelcontextprotocol/server-github
// package (common/types.ts and operations/*.ts). Input schemas reproduce the zod-to-json-schema
// output of the original byte for byte (draft-07 `$schema`, `additionalProperties: false`,
// property order of the zod shape). Response schemas are only used by common.parse() to validate
// and strip GitHub API responses exactly like the original `Schema.parse(response)` calls did.

const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

function object(properties, required) {

    const schema = { type: 'object', properties };
    if (required && required.length) {
        schema.required = required;
    }
    schema.additionalProperties = false;
    return schema;
}

function input(properties, required) {

    return { $schema: DRAFT_07, ...object(properties, required) };
}

function str(description) {

    return description ? { type: 'string', description } : { type: 'string' };
}

function num(description) {

    return description ? { type: 'number', description } : { type: 'number' };
}

function bool(description) {

    return { type: 'boolean', description };
}

function enumOf(values, description) {

    const schema = { type: 'string', enum: values };
    if (description) {
        schema.description = description;
    }
    return schema;
}

function array(items, description) {

    const schema = { type: 'array', items };
    if (description) {
        schema.description = description;
    }
    return schema;
}

const nullableString = { type: ['string', 'null'] };
const nullableNumber = { type: ['number', 'null'] };

// ---------------------------------------------------------------------------
// Input schemas (one per tool)
// ---------------------------------------------------------------------------

const OWNER = str('Repository owner (username or organization)');
const REPO = str('Repository name');
const PULL_NUMBER = num('Pull request number');

// operations/repository.ts
const CreateRepositoryOptionsSchema = input({
    name: str('Repository name'),
    description: str('Repository description'),
    private: bool('Whether the repository should be private'),
    autoInit: bool('Initialize with README.md')
}, ['name']);

const SearchRepositoriesSchema = input({
    query: str('Search query (see GitHub search syntax)'),
    page: num('Page number for pagination (default: 1)'),
    perPage: num('Number of results per page (default: 30, max: 100)')
}, ['query']);

const ForkRepositorySchema = input({
    owner: OWNER,
    repo: REPO,
    organization: str('Optional: organization to fork to (defaults to your personal account)')
}, ['owner', 'repo']);

// operations/files.ts
const FileOperationSchema = object({
    path: str(),
    content: str()
}, ['path', 'content']);

const CreateOrUpdateFileSchema = input({
    owner: OWNER,
    repo: REPO,
    path: str('Path where to create/update the file'),
    content: str('Content of the file'),
    message: str('Commit message'),
    branch: str('Branch to create/update the file in'),
    sha: str('SHA of the file being replaced (required when updating existing files)')
}, ['owner', 'repo', 'path', 'content', 'message', 'branch']);

const GetFileContentsSchema = input({
    owner: OWNER,
    repo: REPO,
    path: str('Path to the file or directory'),
    branch: str('Branch to get contents from')
}, ['owner', 'repo', 'path']);

const PushFilesSchema = input({
    owner: OWNER,
    repo: REPO,
    branch: str("Branch to push to (e.g., 'main' or 'master')"),
    files: array(FileOperationSchema, 'Array of files to push'),
    message: str('Commit message')
}, ['owner', 'repo', 'branch', 'files', 'message']);

// operations/issues.ts
const GetIssueSchema = input({
    owner: str(),
    repo: str(),
    issue_number: num()
}, ['owner', 'repo', 'issue_number']);

const IssueCommentSchema = input({
    owner: str(),
    repo: str(),
    issue_number: num(),
    body: str()
}, ['owner', 'repo', 'issue_number', 'body']);

const CreateIssueSchema = input({
    owner: str(),
    repo: str(),
    title: str(),
    body: str(),
    assignees: array(str()),
    milestone: num(),
    labels: array(str())
}, ['owner', 'repo', 'title']);

const ListIssuesOptionsSchema = input({
    owner: str(),
    repo: str(),
    direction: enumOf(['asc', 'desc']),
    labels: array(str()),
    page: num(),
    per_page: num(),
    since: str(),
    sort: enumOf(['created', 'updated', 'comments']),
    state: enumOf(['open', 'closed', 'all'])
}, ['owner', 'repo']);

const UpdateIssueOptionsSchema = input({
    owner: str(),
    repo: str(),
    issue_number: num(),
    title: str(),
    body: str(),
    assignees: array(str()),
    milestone: num(),
    labels: array(str()),
    state: enumOf(['open', 'closed'])
}, ['owner', 'repo', 'issue_number']);

// operations/pulls.ts
const CreatePullRequestSchema = input({
    owner: OWNER,
    repo: REPO,
    title: str('Pull request title'),
    body: str('Pull request body/description'),
    head: str('The name of the branch where your changes are implemented'),
    base: str('The name of the branch you want the changes pulled into'),
    draft: bool('Whether to create the pull request as a draft'),
    maintainer_can_modify: bool('Whether maintainers can modify the pull request')
}, ['owner', 'repo', 'title', 'head', 'base']);

const GetPullRequestSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER
}, ['owner', 'repo', 'pull_number']);

const ListPullRequestsSchema = input({
    owner: OWNER,
    repo: REPO,
    state: enumOf(['open', 'closed', 'all'], 'State of the pull requests to return'),
    head: str('Filter by head user or head organization and branch name'),
    base: str('Filter by base branch name'),
    sort: enumOf(['created', 'updated', 'popularity', 'long-running'], 'What to sort results by'),
    direction: enumOf(['asc', 'desc'], 'The direction of the sort'),
    per_page: num('Results per page (max 100)'),
    page: num('Page number of the results')
}, ['owner', 'repo']);

const CreatePullRequestReviewSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER,
    commit_id: str('The SHA of the commit that needs a review'),
    body: str('The body text of the review'),
    event: enumOf(['APPROVE', 'REQUEST_CHANGES', 'COMMENT'], 'The review action to perform'),
    comments: array({
        anyOf: [
            object({
                path: str('The relative path to the file being commented on'),
                position: num('The position in the diff where you want to add a review comment'),
                body: str('Text of the review comment')
            }, ['path', 'position', 'body']),
            object({
                path: str('The relative path to the file being commented on'),
                line: num('The line number in the file where you want to add a review comment'),
                body: str('Text of the review comment')
            }, ['path', 'line', 'body'])
        ]
    }, 'Comments to post as part of the review (specify either position or line, not both)')
}, ['owner', 'repo', 'pull_number', 'body', 'event']);

const MergePullRequestSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER,
    commit_title: str('Title for the automatic commit message'),
    commit_message: str('Extra detail to append to automatic commit message'),
    merge_method: enumOf(['merge', 'squash', 'rebase'], 'Merge method to use')
}, ['owner', 'repo', 'pull_number']);

const GetPullRequestFilesSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER
}, ['owner', 'repo', 'pull_number']);

const GetPullRequestStatusSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER
}, ['owner', 'repo', 'pull_number']);

const UpdatePullRequestBranchSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER,
    expected_head_sha: str("The expected SHA of the pull request's HEAD ref")
}, ['owner', 'repo', 'pull_number']);

const GetPullRequestCommentsSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER
}, ['owner', 'repo', 'pull_number']);

const GetPullRequestReviewsSchema = input({
    owner: OWNER,
    repo: REPO,
    pull_number: PULL_NUMBER
}, ['owner', 'repo', 'pull_number']);

// operations/branches.ts
const CreateBranchSchema = input({
    owner: OWNER,
    repo: REPO,
    branch: str('Name for the new branch'),
    from_branch: str("Optional: source branch to create from (defaults to the repository's default branch)")
}, ['owner', 'repo', 'branch']);

// operations/search.ts
function searchOptions(extra) {

    return input({
        q: str(),
        order: enumOf(['asc', 'desc']),
        page: { type: 'number', minimum: 1 },
        per_page: { type: 'number', minimum: 1, maximum: 100 },
        ...extra
    }, ['q']);
}

const SearchCodeSchema = searchOptions({});

const SearchUsersSchema = searchOptions({
    sort: enumOf(['followers', 'repositories', 'joined'])
});

const SearchIssuesSchema = searchOptions({
    sort: enumOf([
        'comments',
        'reactions',
        'reactions-+1',
        'reactions--1',
        'reactions-smile',
        'reactions-thinking_face',
        'reactions-heart',
        'reactions-tada',
        'interactions',
        'created',
        'updated'
    ])
});

// operations/commits.ts
const ListCommitsSchema = input({
    owner: str(),
    repo: str(),
    sha: str(),
    page: num(),
    perPage: num()
}, ['owner', 'repo']);

// ---------------------------------------------------------------------------
// Response schemas (common/types.ts and operations/*.ts) used to validate/strip API responses
// ---------------------------------------------------------------------------

const GitHubAuthorSchema = object({
    name: str(),
    email: str(),
    date: str()
}, ['name', 'email', 'date']);

const GitHubOwnerSchema = object({
    login: str(),
    id: num(),
    node_id: str(),
    avatar_url: str(),
    url: str(),
    html_url: str(),
    type: str()
}, ['login', 'id', 'node_id', 'avatar_url', 'url', 'html_url', 'type']);

const repositoryProperties = {
    id: num(),
    node_id: str(),
    name: str(),
    full_name: str(),
    private: { type: 'boolean' },
    owner: GitHubOwnerSchema,
    html_url: str(),
    description: nullableString,
    fork: { type: 'boolean' },
    url: str(),
    created_at: str(),
    updated_at: str(),
    pushed_at: str(),
    git_url: str(),
    ssh_url: str(),
    clone_url: str(),
    default_branch: str()
};

const GitHubRepositorySchema = object(repositoryProperties, Object.keys(repositoryProperties));

// GitHubRepositorySchema.extend({ parent, source }) used by forkRepository.
const GitHubForkedRepositorySchema = object({
    ...repositoryProperties,
    parent: GitHubRepositorySchema,
    source: GitHubRepositorySchema
}, Object.keys(repositoryProperties).concat(['parent', 'source']));

const GithubFileContentLinks = object({
    self: str(),
    git: nullableString,
    html: nullableString
}, ['self', 'git', 'html']);

const GitHubFileContentSchema = object({
    name: str(),
    path: str(),
    sha: str(),
    size: num(),
    url: str(),
    html_url: str(),
    git_url: str(),
    download_url: str(),
    type: str(),
    content: str(),
    encoding: str(),
    _links: GithubFileContentLinks
}, ['name', 'path', 'sha', 'size', 'url', 'html_url', 'git_url', 'download_url', 'type', '_links']);

const GitHubDirectoryContentSchema = object({
    type: str(),
    size: num(),
    name: str(),
    path: str(),
    sha: str(),
    url: str(),
    git_url: str(),
    html_url: str(),
    download_url: nullableString
}, ['type', 'size', 'name', 'path', 'sha', 'url', 'git_url', 'html_url', 'download_url']);

const GitHubContentSchema = {
    anyOf: [GitHubFileContentSchema, array(GitHubDirectoryContentSchema)]
};

const GitHubTreeEntrySchema = object({
    path: str(),
    mode: enumOf(['100644', '100755', '040000', '160000', '120000']),
    type: enumOf(['blob', 'tree', 'commit']),
    size: num(),
    sha: str(),
    url: str()
}, ['path', 'mode', 'type', 'sha', 'url']);

const GitHubTreeSchema = object({
    sha: str(),
    url: str(),
    tree: array(GitHubTreeEntrySchema),
    truncated: { type: 'boolean' }
}, ['sha', 'url', 'tree', 'truncated']);

const shaUrl = object({ sha: str(), url: str() }, ['sha', 'url']);

const GitHubCommitSchema = object({
    sha: str(),
    node_id: str(),
    url: str(),
    author: GitHubAuthorSchema,
    committer: GitHubAuthorSchema,
    message: str(),
    tree: shaUrl,
    parents: array(shaUrl)
}, ['sha', 'node_id', 'url', 'author', 'committer', 'message', 'tree', 'parents']);

const GitHubReferenceSchema = object({
    ref: str(),
    node_id: str(),
    url: str(),
    object: object({ sha: str(), type: str(), url: str() }, ['sha', 'type', 'url'])
}, ['ref', 'node_id', 'url', 'object']);

const GitHubIssueAssigneeSchema = object({
    login: str(),
    id: num(),
    avatar_url: str(),
    url: str(),
    html_url: str()
}, ['login', 'id', 'avatar_url', 'url', 'html_url']);

const GitHubLabelSchema = object({
    id: num(),
    node_id: str(),
    url: str(),
    name: str(),
    color: str(),
    default: { type: 'boolean' },
    description: nullableString
}, ['id', 'node_id', 'url', 'name', 'color', 'default']);

const GitHubSearchResponseSchema = object({
    total_count: num(),
    incomplete_results: { type: 'boolean' },
    items: array(GitHubRepositorySchema)
}, ['total_count', 'incomplete_results', 'items']);

const GitHubPullRequestRefSchema = object({
    label: str(),
    ref: str(),
    sha: str(),
    user: GitHubIssueAssigneeSchema,
    repo: GitHubRepositorySchema
}, ['label', 'ref', 'sha', 'user', 'repo']);

const nullableAssignee = { ...GitHubIssueAssigneeSchema, nullable: true };

const pullRequestProperties = {
    url: str(),
    id: num(),
    node_id: str(),
    html_url: str(),
    diff_url: str(),
    patch_url: str(),
    issue_url: str(),
    number: num(),
    state: str(),
    locked: { type: 'boolean' },
    title: str(),
    user: GitHubIssueAssigneeSchema,
    body: nullableString,
    created_at: str(),
    updated_at: str(),
    closed_at: nullableString,
    merged_at: nullableString,
    merge_commit_sha: nullableString,
    assignee: nullableAssignee,
    assignees: array(GitHubIssueAssigneeSchema),
    requested_reviewers: array(GitHubIssueAssigneeSchema),
    labels: array(GitHubLabelSchema),
    head: GitHubPullRequestRefSchema,
    base: GitHubPullRequestRefSchema
};

const GitHubPullRequestSchema = object(pullRequestProperties, Object.keys(pullRequestProperties));

// operations/files.ts
const GitHubCreateUpdateFileResponseSchema = object({
    content: { ...GitHubFileContentSchema, nullable: true },
    commit: object({
        sha: str(),
        node_id: str(),
        url: str(),
        html_url: str(),
        author: GitHubAuthorSchema,
        committer: GitHubAuthorSchema,
        message: str(),
        tree: shaUrl,
        parents: array(object({ sha: str(), url: str(), html_url: str() }, ['sha', 'url', 'html_url']))
    }, ['sha', 'node_id', 'url', 'html_url', 'author', 'committer', 'message', 'tree', 'parents'])
}, ['content', 'commit']);

// operations/pulls.ts
const PullRequestFileSchema = object({
    sha: str(),
    filename: str(),
    status: enumOf(['added', 'removed', 'modified', 'renamed', 'copied', 'changed', 'unchanged']),
    additions: num(),
    deletions: num(),
    changes: num(),
    blob_url: str(),
    raw_url: str(),
    contents_url: str(),
    patch: str()
}, ['sha', 'filename', 'status', 'additions', 'deletions', 'changes', 'blob_url', 'raw_url', 'contents_url']);

const StatusCheckSchema = object({
    url: str(),
    state: enumOf(['error', 'failure', 'pending', 'success']),
    description: nullableString,
    target_url: nullableString,
    context: str(),
    created_at: str(),
    updated_at: str()
}, ['url', 'state', 'description', 'target_url', 'context', 'created_at', 'updated_at']);

const CombinedStatusSchema = object({
    state: enumOf(['error', 'failure', 'pending', 'success']),
    statuses: array(StatusCheckSchema),
    sha: str(),
    total_count: num()
}, ['state', 'statuses', 'sha', 'total_count']);

const href = object({ href: str() }, ['href']);

const PullRequestCommentSchema = object({
    url: str(),
    id: num(),
    node_id: str(),
    pull_request_review_id: nullableNumber,
    diff_hunk: str(),
    path: nullableString,
    position: nullableNumber,
    original_position: nullableNumber,
    commit_id: str(),
    original_commit_id: str(),
    user: GitHubIssueAssigneeSchema,
    body: str(),
    created_at: str(),
    updated_at: str(),
    html_url: str(),
    pull_request_url: str(),
    author_association: str(),
    _links: object({ self: href, html: href, pull_request: href }, ['self', 'html', 'pull_request'])
}, [
    'url', 'id', 'node_id', 'pull_request_review_id', 'diff_hunk', 'path', 'position', 'original_position',
    'commit_id', 'original_commit_id', 'user', 'body', 'created_at', 'updated_at', 'html_url',
    'pull_request_url', 'author_association', '_links'
]);

const PullRequestReviewSchema = object({
    id: num(),
    node_id: str(),
    user: GitHubIssueAssigneeSchema,
    body: nullableString,
    state: enumOf(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'PENDING']),
    html_url: str(),
    pull_request_url: str(),
    commit_id: str(),
    submitted_at: nullableString,
    author_association: str()
}, ['id', 'node_id', 'user', 'body', 'state', 'html_url', 'pull_request_url', 'commit_id', 'submitted_at',
    'author_association']);

module.exports = {
    array,
    // input schemas
    CreateRepositoryOptionsSchema,
    SearchRepositoriesSchema,
    ForkRepositorySchema,
    CreateOrUpdateFileSchema,
    GetFileContentsSchema,
    PushFilesSchema,
    GetIssueSchema,
    IssueCommentSchema,
    CreateIssueSchema,
    ListIssuesOptionsSchema,
    UpdateIssueOptionsSchema,
    CreatePullRequestSchema,
    GetPullRequestSchema,
    ListPullRequestsSchema,
    CreatePullRequestReviewSchema,
    MergePullRequestSchema,
    GetPullRequestFilesSchema,
    GetPullRequestStatusSchema,
    UpdatePullRequestBranchSchema,
    GetPullRequestCommentsSchema,
    GetPullRequestReviewsSchema,
    CreateBranchSchema,
    SearchCodeSchema,
    SearchUsersSchema,
    SearchIssuesSchema,
    ListCommitsSchema,
    // response schemas
    GitHubRepositorySchema,
    GitHubForkedRepositorySchema,
    GitHubContentSchema,
    GitHubTreeSchema,
    GitHubCommitSchema,
    GitHubReferenceSchema,
    GitHubSearchResponseSchema,
    GitHubPullRequestSchema,
    GitHubCreateUpdateFileResponseSchema,
    PullRequestFileSchema,
    CombinedStatusSchema,
    PullRequestCommentSchema,
    PullRequestReviewSchema
};
