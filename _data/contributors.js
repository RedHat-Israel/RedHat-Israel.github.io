/* eslint-disable no-undef */
const { graphql } = require('@octokit/graphql');

const ORGANIZATION_NAME = 'RedHat-Israel'; // organization namespace
const MAX_ORG_CONTRIBUTORS = 100; // modify this if/when we have more then 100 members
const NUM_YEARS_CONTRIBUTING = 3; // number of years until today to search for contributions

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

  const now = new Date();

  let queries = ''; // organization query operations will be concatenated here
  let numYears = NUM_YEARS_CONTRIBUTING;

  // concatenate a query operation per year, each query operation is names yX
  // (X being the year starting the current fetch)
  while (numYears > 0) {
    const currentDateTime = new Date(now);
    currentDateTime.setFullYear(now.getFullYear() - numYears);

    queries += `
      y${currentDateTime.getFullYear()}: organization (login: "${ORGANIZATION_NAME}") {
        membersWithRole(first: ${MAX_ORG_CONTRIBUTORS}) {
          edges {
            node {
              login
              name
              contributionsCollection (from: "${currentDateTime.toISOString().split('.')[0]}") {
                contributionCalendar {
                  totalContributions
                }
              }
            }
          }
        }
      }
    `;

    numYears--;
  }

  const result = await graphql(`{ ${queries} }`, requestParams);
  const resultMap = new Map(Object.entries(result));
  const members = new Map();
  resultMap.forEach((organization, _year) => {
    organization.membersWithRole.edges.forEach(edge => {
      const { login } = edge.node;
      const { name } = edge.node || '';
      const { totalContributions } = edge.node.contributionsCollection.contributionCalendar;

      if (totalContributions > 0 ) {
        if (members.has(login)) {
          const existingLoginInfo = members.get(login);
          existingLoginInfo.totalContributions += totalContributions;
        } else {
          const newLoginInfo = {
            'name': name,
            'totalContributions': totalContributions
          };
          members.set(login, newLoginInfo);
        }
      }
    });
  });

  // eslint-disable-next-line no-console
  console.log(members);
  // example of a member from the members map,
  // the login is the key, and the name and totalContributions are the value:
  //
  // 'TomerFi' => { name: 'Tomer Figenblat', totalContributions: 7845 }
}

module.exports = israelContributors;
