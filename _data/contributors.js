require('dotenv/config');
const { AssetCache } = require('@11ty/eleventy-fetch');
const { graphql } = require('@octokit/graphql');

// max members per query for avoiding gh internal timeouts, multiple queries will be performed
// token requirements: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql
const requestParams = {
  org: 'RedHat-Israel',
  maxMembers: 15,
  headers: {
    authorization: `bearer ${process.env.SITE_GITHUB_TOKEN}`,
  }
};

// fetching "max-per-page" 100 gists per member
const membersFragment = `#graphql
  fragment memberAttribs on OrganizationMemberConnection {
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
`;

const initialQuery = `#graphql
  query ($org: String!, $maxMembers: Int!) {
    organization (login: $org) {
      membersWithRole(first: $maxMembers) {
        ...memberAttribs
      }
    }
  }
  ${membersFragment}
`;

const followupQuery = `#graphql
  query ($org: String!, $maxMembers: Int!, $lastCursor: String!) {
    organization (login: $org) {
      membersWithRole(first: $maxMembers, after: $lastCursor) {
        ...memberAttribs
      }
    }
  }
  ${membersFragment}
`;

module.exports = israelContributors;

/**
 * Fetch Contributors data from GitHub
 * @param {*} configData see https://www.11ty.dev/docs/data-js/#arguments-to-global-data-files
 */
async function israelContributors(_configData) {
  const cache = new AssetCache('github_graphql_contributions');
  const summary = cache.isCacheValid('1d') ? cache.getCachedValue() : await getStatsForOrgMembers({ ...requestParams, query: initialQuery });
  return {
    ...summary,
  };
}

async function getStatsForOrgMembers(variables, summary) {
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
  const result = await graphql({ ...variables });

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
      { ...requestParams, query: followupQuery, lastCursor: result.organization.membersWithRole.pageInfo.endCursor },
      summary)
  }
  return summary;
}
