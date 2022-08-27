require('dotenv/config');
const { AssetCache } = require('@11ty/eleventy-fetch');
const { graphql } = require('@octokit/graphql');

const ORGANIZATION_NAME = 'RedHat-Israel'; // organization namespace
const MAX_CONTRIBUTORS_FETCH = 20;
// REQUIRED: set token from a Secret into the SITE_GITHUB_TOKEN environment variable in the CI workflow
// token requirements: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql
const REQUEST_PARAMS = {
  headers: {
    authorization: `bearer ${process.env.SITE_GITHUB_TOKEN}`,
  }
};


module.exports = israelContributors;

/**
 * Fetch Contributors data from GitHub
 * @param {*} configData see https://www.11ty.dev/docs/data-js/#arguments-to-global-data-files
 */
async function israelContributors(_configData) {
  const cache = new AssetCache('github_graphql_contributions');
  const summary = cache.isCacheValid('1d') ? cache.getCachedValue() : await getStatsForOrgMembers(`first: ${MAX_CONTRIBUTORS_FETCH}`);
  return {
    ...summary,
  };
}

async function getStatsForOrgMembers(members, summary) {
  if (!summary) {
    summary = {
      totalCommitContributions: 0,
      totalIssueContributions: 0,
      totalPullRequestContributions: 0,
      totalPullRequestReviewContributions: 0,
      totalRepositoryContributions: 0,
      totalGists: 0
    };
  }

  // NOTE: fetching "max-per-page" 100 gists per member
  const query = `
    {
      organization (login: "${ORGANIZATION_NAME}") {
        membersWithRole(${members}) {
          edges {
            node {
              contributionsCollection {
                totalCommitContributions
                totalIssueContributions
                totalPullRequestContributions
                totalPullRequestReviewContributions
                totalRepositoryContributions
              }
              gists (first: 100) {
                totalCount
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  const result = await graphql(query, REQUEST_PARAMS);

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

  if (result?.organization?.membersWithRole?.pageInfo?.hasNextPage) {
    return getStatsForOrgMembers(
      `first: ${MAX_CONTRIBUTORS_FETCH}, after: "${result.organization.membersWithRole.pageInfo.endCursor}"`,
      summary)
  }
  return summary;
}
