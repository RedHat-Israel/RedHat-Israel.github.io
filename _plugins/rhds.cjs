// @ts-check
const path = require('node:path');
const fs = require('node:fs');
const { copyFile } = fs.promises;

module.exports = function(eleventyConfig) {
  eleventyConfig.on('eleventy.before', async (e) => {
    console.log('Copying base RHDS styles...');
    const globalStylesIn = path.join(require.resolve('@rhds/tokens'), '..', '..', 'css', 'global.css');
    const globalStylesOut = path.join(process.cwd(), 'assets', 'css', 'rhds.css');
    if (!fs.existsSync(globalStylesOut)) {
      await copyFile( globalStylesIn, globalStylesOut);
    }
    console.log('  ...done');
  });

  eleventyConfig.addFilter('hasUrl', function(children, url) {
    function isActive(entry) {
      return entry.url === url || (entry.children ?? []).some(x => isActive(x));
    }
    return children.some(x => isActive(x));
  });

  eleventyConfig.addPairedShortcode('alert', function(content, {
    state = 'info',
    title = 'Note:',
  } = {}) {
    return `

<rh-alert state="${state}">
  <h3 slot="header">${title}</h3>

${content}


</rh-alert>

`;
  });
};

