require('dotenv/config');
const { AssetCache } = require('@11ty/eleventy-fetch');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const octokitGql = require('@octokit/graphql');

const readRelative = path =>
  readFileSync(join(__dirname, path), 'utf8');

// QUERIES
const fragment = readRelative('./members.fragment.graphql');
const initialQuery = [readRelative('./initial.query.graphql'), fragment].join('\n');
const followupQuery = [readRelative('./followup.query.graphql'), fragment].join('\n');

// VARIABLES
/** Fetch data for redhat israels github org */
const org = 'RedHat-Israel';
/** Max members per query for avoiding gh internal timeouts, multiple queries will be performed */
const maxMembers = 10;
/** @see https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql */
const headers = { authorization: `bearer ${process.env.SITE_GITHUB_TOKEN}` };
const graphql = octokitGql.graphql.defaults({ headers });

async function getStatsForOrgMembers(query, variables = {}, summary = {
  totalCommitContributions: 0,
  totalIssueContributions: 0,
  totalPullRequestContributions: 0,
  totalPullRequestReviewContributions: 0,
  totalRepositoryContributions: 0,
  totalGists: 0
}) {
  const result = await graphql({ query, org, maxMembers, ...variables });

  result?.organization?.membersWithRole?.edges
    ?.forEach(edge => {
      summary.totalCommitContributions +=
        edge.node.contributionsCollection.totalCommitContributions;
      summary.totalIssueContributions +=
        edge.node.contributionsCollection.totalIssueContributions;
      summary.totalPullRequestContributions +=
        edge.node.contributionsCollection.totalPullRequestContributions;
      summary.totalPullRequestReviewContributions +=
        edge.node.contributionsCollection.totalPullRequestReviewContributions;
      summary.totalRepositoryContributions +=
        edge.node.contributionsCollection.totalRepositoryContributions;
      summary.totalGists += edge.node.gists.totalCount;
    });

  if (!result?.organization?.membersWithRole?.pageInfo?.hasNextPage) {
    return summary;
  } else {
    const lastCursor = result.organization.membersWithRole.pageInfo.endCursor
    return getStatsForOrgMembers(followupQuery, { lastCursor }, summary);
  }
}

/**
 * Fetch Contributors data from GitHub
 * @param {*} configData see https://www.11ty.dev/docs/data-js/#arguments-to-global-data-files
 * @return {Promise<*>}
 */
module.exports = async function israelContributors(_configData) {
  const cache = new AssetCache('github_graphql_contributions');

  console.log('Preparing GitHub Contributor data...')
  if (cache.isCacheValid('1d')) {
    console.log('  ...cache hit!');
    return cache.getCachedValue();
  } else {
    console.log('  ...cache miss, fetching...');
    const result = await getStatsForOrgMembers(initialQuery);
    cache.save(result, 'json');
    return result;
  }
}
