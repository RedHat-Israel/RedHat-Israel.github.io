const { Octokit } = require('@octokit/rest');

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
  const octokit = new Octokit({
    auth: '',
    userAgent: `Eleventy v${configData.eleventy.version}`,
    timeZone: 'Asia/Jerusalem',
    // eslint-disable-next-line no-console
    log: { warn: console.warn, error: console.error, }
  });

  const { data } = await octokit.rest.users.list();

  // yadda yadda
}

module.exports = israelContributors;
