const { graphql } = require('@octokit/graphql');

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
  const authGraph = graphql.defaults({
    headers: {
      authorization: `bearer ${process.env.GH_TOKEN}`,
    }
  });

  let query = `
    {
      organization(login: "RedHat-Israel") {
        membersWithRole(first: 100) {
          edges {
            node {
              login
              name
              contributionsCollection {
                pullRequestContributions {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await authGraph(query);

  // result.organization.membersWithRole.edges.forEach(
  //   edge => console.log(edge.node)
  // );
}

module.exports = israelContributors;
