'use strict';

// Port of operations/*.ts of the deprecated @modelcontextprotocol/server-github package:
// same endpoints, query/body construction and response validation (common.parse replaces zod).

const { githubRequest, buildUrl, parse } = require('./server-common');
const schemas = require('./server-schemas');

// ---------------------------------------------------------------------------
// operations/repository.ts
// ---------------------------------------------------------------------------

async function createRepository(options) {

    const response = await githubRequest('https://api.github.com/user/repos', {
        method: 'POST',
        body: options
    });
    return parse(schemas.GitHubRepositorySchema, response);
}

async function searchRepositories(query, page = 1, perPage = 30) {

    const url = new URL('https://api.github.com/search/repositories');
    url.searchParams.append('q', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());

    const response = await githubRequest(url.toString());
    return parse(schemas.GitHubSearchResponseSchema, response);
}

async function forkRepository(owner, repo, organization) {

    const url = organization
        ? `https://api.github.com/repos/${owner}/${repo}/forks?organization=${organization}`
        : `https://api.github.com/repos/${owner}/${repo}/forks`;

    const response = await githubRequest(url, { method: 'POST' });
    return parse(schemas.GitHubForkedRepositorySchema, response);
}

// ---------------------------------------------------------------------------
// operations/files.ts
// ---------------------------------------------------------------------------

async function getFileContents(owner, repo, path, branch) {

    let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    if (branch) {
        url += `?ref=${branch}`;
    }

    const response = await githubRequest(url);
    const data = parse(schemas.GitHubContentSchema, response);

    // If it's a file, decode the content
    if (!Array.isArray(data) && data.content) {
        data.content = Buffer.from(data.content, 'base64').toString('utf8');
    }

    return data;
}

async function createOrUpdateFile(owner, repo, path, content, message, branch, sha) {

    const encodedContent = Buffer.from(content).toString('base64');

    let currentSha = sha;
    if (!currentSha) {
        try {
            const existingFile = await getFileContents(owner, repo, path, branch);
            if (!Array.isArray(existingFile)) {
                currentSha = existingFile.sha;
            }
        } catch (error) {
            console.error('Note: File does not exist in branch, will create new file');
        }
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const body = {
        message,
        content: encodedContent,
        branch,
        ...(currentSha ? { sha: currentSha } : {})
    };

    const response = await githubRequest(url, {
        method: 'PUT',
        body
    });

    return parse(schemas.GitHubCreateUpdateFileResponseSchema, response);
}

async function createTree(owner, repo, files, baseTree) {

    const tree = files.map((file) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: file.content
    }));

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        body: {
            tree,
            base_tree: baseTree
        }
    });

    return parse(schemas.GitHubTreeSchema, response);
}

async function createCommit(owner, repo, message, tree, parents) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        body: {
            message,
            tree,
            parents
        }
    });

    return parse(schemas.GitHubCommitSchema, response);
}

async function updateReference(owner, repo, ref, sha) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/refs/${ref}`, {
        method: 'PATCH',
        body: {
            sha,
            force: true
        }
    });

    return parse(schemas.GitHubReferenceSchema, response);
}

async function pushFiles(owner, repo, branch, files, message) {

    const refResponse = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`);

    const ref = parse(schemas.GitHubReferenceSchema, refResponse);
    const commitSha = ref.object.sha;

    const tree = await createTree(owner, repo, files, commitSha);
    const commit = await createCommit(owner, repo, message, tree.sha, [commitSha]);
    return await updateReference(owner, repo, `heads/${branch}`, commit.sha);
}

// ---------------------------------------------------------------------------
// operations/issues.ts
// ---------------------------------------------------------------------------

async function getIssue(owner, repo, issueNumber) {

    return githubRequest(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`);
}

async function addIssueComment(owner, repo, issueNumber, body) {

    return githubRequest(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        body: { body }
    });
}

async function createIssue(owner, repo, options) {

    return githubRequest(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: options
    });
}

async function listIssues(owner, repo, options) {

    const urlParams = {
        direction: options.direction,
        labels: options.labels?.join(','),
        page: options.page?.toString(),
        per_page: options.per_page?.toString(),
        since: options.since,
        sort: options.sort,
        state: options.state
    };

    return githubRequest(buildUrl(`https://api.github.com/repos/${owner}/${repo}/issues`, urlParams));
}

async function updateIssue(owner, repo, issueNumber, options) {

    return githubRequest(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        body: options
    });
}

// ---------------------------------------------------------------------------
// operations/pulls.ts
// ---------------------------------------------------------------------------

async function createPullRequest(params) {

    const { owner, repo, ...options } = parse(schemas.CreatePullRequestSchema, params);

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: options
    });

    return parse(schemas.GitHubPullRequestSchema, response);
}

async function getPullRequest(owner, repo, pullNumber) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`);
    return parse(schemas.GitHubPullRequestSchema, response);
}

async function listPullRequests(owner, repo, options) {

    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls`);

    if (options.state) url.searchParams.append('state', options.state);
    if (options.head) url.searchParams.append('head', options.head);
    if (options.base) url.searchParams.append('base', options.base);
    if (options.sort) url.searchParams.append('sort', options.sort);
    if (options.direction) url.searchParams.append('direction', options.direction);
    if (options.per_page) url.searchParams.append('per_page', options.per_page.toString());
    if (options.page) url.searchParams.append('page', options.page.toString());

    const response = await githubRequest(url.toString());
    return parse(schemas.array(schemas.GitHubPullRequestSchema), response);
}

async function createPullRequestReview(owner, repo, pullNumber, options) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
        method: 'POST',
        body: options
    });
    return parse(schemas.PullRequestReviewSchema, response);
}

async function mergePullRequest(owner, repo, pullNumber, options) {

    return githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
        method: 'PUT',
        body: options
    });
}

async function getPullRequestFiles(owner, repo, pullNumber) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`);
    return parse(schemas.array(schemas.PullRequestFileSchema), response);
}

async function updatePullRequestBranch(owner, repo, pullNumber, expectedHeadSha) {

    await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/update-branch`, {
        method: 'PUT',
        body: expectedHeadSha ? { expected_head_sha: expectedHeadSha } : undefined
    });
}

async function getPullRequestComments(owner, repo, pullNumber) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/comments`);
    return parse(schemas.array(schemas.PullRequestCommentSchema), response);
}

async function getPullRequestReviews(owner, repo, pullNumber) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`);
    return parse(schemas.array(schemas.PullRequestReviewSchema), response);
}

async function getPullRequestStatus(owner, repo, pullNumber) {

    // First get the PR to get the head SHA
    const pr = await getPullRequest(owner, repo, pullNumber);
    const sha = pr.head.sha;

    // Then get the combined status for that SHA
    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}/status`);
    return parse(schemas.CombinedStatusSchema, response);
}

// ---------------------------------------------------------------------------
// operations/branches.ts
// ---------------------------------------------------------------------------

async function getDefaultBranchSHA(owner, repo) {

    try {
        const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`);
        const data = parse(schemas.GitHubReferenceSchema, response);
        return data.object.sha;
    } catch (error) {
        const masterResponse = await githubRequest(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/master`
        );
        if (!masterResponse) {
            throw new Error("Could not find default branch (tried 'main' and 'master')");
        }
        const data = parse(schemas.GitHubReferenceSchema, masterResponse);
        return data.object.sha;
    }
}

async function createBranch(owner, repo, options) {

    const fullRef = `refs/heads/${options.ref}`;

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: {
            ref: fullRef,
            sha: options.sha
        }
    });

    return parse(schemas.GitHubReferenceSchema, response);
}

async function getBranchSHA(owner, repo, branch) {

    const response = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`);

    const data = parse(schemas.GitHubReferenceSchema, response);
    return data.object.sha;
}

async function createBranchFromRef(owner, repo, newBranch, fromBranch) {

    let sha;
    if (fromBranch) {
        sha = await getBranchSHA(owner, repo, fromBranch);
    } else {
        sha = await getDefaultBranchSHA(owner, repo);
    }

    return createBranch(owner, repo, {
        ref: newBranch,
        sha
    });
}

// ---------------------------------------------------------------------------
// operations/search.ts
// ---------------------------------------------------------------------------

async function searchCode(params) {

    return githubRequest(buildUrl('https://api.github.com/search/code', params));
}

async function searchIssues(params) {

    return githubRequest(buildUrl('https://api.github.com/search/issues', params));
}

async function searchUsers(params) {

    return githubRequest(buildUrl('https://api.github.com/search/users', params));
}

// ---------------------------------------------------------------------------
// operations/commits.ts
// ---------------------------------------------------------------------------

async function listCommits(owner, repo, page, perPage, sha) {

    return githubRequest(buildUrl(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        page: page?.toString(),
        per_page: perPage?.toString(),
        sha
    }));
}

module.exports = {
    createRepository,
    searchRepositories,
    forkRepository,
    getFileContents,
    createOrUpdateFile,
    pushFiles,
    getIssue,
    addIssueComment,
    createIssue,
    listIssues,
    updateIssue,
    createPullRequest,
    getPullRequest,
    listPullRequests,
    createPullRequestReview,
    mergePullRequest,
    getPullRequestFiles,
    updatePullRequestBranch,
    getPullRequestComments,
    getPullRequestReviews,
    getPullRequestStatus,
    createBranchFromRef,
    searchCode,
    searchIssues,
    searchUsers,
    listCommits
};
