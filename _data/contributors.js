require('dotenv/config');
const { AssetCache } = require('@11ty/eleventy-fetch');
const { graphql } = require('@octokit/graphql');

const ORGANIZATION_NAME = 'RedHat-Israel'; // organization namespace
const MAX_CONTRIBUTORS = 100; // modify this if/when we have more then 100 members

/**
 * Fetch Contributor data from GitHub and elsewhere
 * @param {*} configData see https://www.11ty.dev/docs/data-js/#arguments-to-global-data-files
 * @example
 *     ```html
 *     <ul>{% for contributor in contributors %}
 *       <li>{{ contributor.name }}</li>{% endfor %}
 *     </ul>
 *     ```
 */
async function israelContributors(configData) {
  // REQUIRED: set token from a Secret into the SITE_GITHUB_TOKEN environment variable in the CI workflow
  // token requirements: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql
  const requestParams = {
    headers: {
      authorization: `bearer ${process.env.SITE_GITHUB_TOKEN}`,
    }
  };

  const query = `
    {
      organization (login: "${ORGANIZATION_NAME}") {
        membersWithRole(first: ${MAX_CONTRIBUTORS}) {
          nodes {
            contributionsCollection {
              hasAnyContributions
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
      }
    }
  `;

  const cache = new AssetCache('github_graphql_contributions');

  const result = cache.isCacheValid('1d') ? cache.getCachedValue() : await graphql(query, requestParams);

  const organizationContributionSummary = {
    totalCommitContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
    totalRepositoryContributions: 0,
    totalGists: 0
  };

  result?.organization?.membersWithRole?.nodes
    ?.filter(node => node.contributionsCollection.hasAnyContributions)
    ?.forEach(node => {
      organizationContributionSummary.totalCommitContributions +=
        node.contributionsCollection.totalCommitContributions;
      organizationContributionSummary.totalIssueContributions +=
        node.contributionsCollection.totalIssueContributions;
      organizationContributionSummary.totalPullRequestContributions +=
        node.contributionsCollection.totalPullRequestContributions;
      organizationContributionSummary.totalPullRequestReviewContributions +=
        node.contributionsCollection.totalPullRequestReviewContributions;
      organizationContributionSummary.totalRepositoryContributions +=
        node.contributionsCollection.totalRepositoryContributions;
      organizationContributionSummary.totalGists += node.gists.totalCount;
    });

  return {
    ...organizationContributionSummary,
  };
}

module.exports = israelContributors;
