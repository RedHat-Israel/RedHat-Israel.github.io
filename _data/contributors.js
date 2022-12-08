const { contributions } = require('rh-il-org-stats')

/**
 * Fetch Contributors data from GitHub
 * @param {*} configData see https://www.11ty.dev/docs/data-js/#arguments-to-global-data-files
 * @return {*}
 */
module.exports = function(_configData) {
  return contributions();
}
