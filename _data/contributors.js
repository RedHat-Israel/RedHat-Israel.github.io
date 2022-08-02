const { graphql } = require('@octokit/graphql');

const ORG_NAME = 'RedHat-Israel';
const MAX_ORG_CONTRIBUTORS = 100; // modify this if/when we have more then 100 members

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
  // this is the "straight-forward" version of the query
  // at the end of this file we commented out the more specific version of this query
  let query = `
    {
      organization(login: "${ORG_NAME}") {
        membersWithRole(first: ${MAX_ORG_CONTRIBUTORS}) {
          edges {
            node {
              login
              name
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                }
              }
            }
          }
        }
      }
    }
  `;

  // REQUIRED: set token from a Secret into the SITE_GITHUB_TOKEN environment variable in the CI workflow
  // token requirements: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql
  const result = await graphql(query, {
    headers: {
      authorization: `bearer ${process.env.SITE_GITHUB_TOKEN}`,
    }
  });

  // example node print:
  // {"login":"TomerFi","name":"Tomer Figenblat","contributionsCollection":{"contributionCalendar":{"totalContributions":1679}}}
  result.organization.membersWithRole.edges.forEach(
    edge => console.log(JSON.stringify(edge.node)));
}

module.exports = israelContributors;


// let query = `
// {
//   organization(login: "RedHat-Israel") {
//     membersWithRole(first: 100) {
//       edges {
//         node {
//           login
//           name
//           contributionsCollection {
//             totalCommitContributions
//             totalIssueContributions
//             totalPullRequestContributions
//             totalPullRequestReviewContributions

//             totalRepositoriesWithContributedCommits
//             totalRepositoriesWithContributedIssues
//             totalRepositoriesWithContributedPullRequests
//             totalRepositoriesWithContributedPullRequestReviews

//             totalRepositoryContributions

//             restrictedContributionsCount
//           }
//         }
//       }
//     }
//   }
// }
// `;
