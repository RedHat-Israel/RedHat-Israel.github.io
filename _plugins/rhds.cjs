// @ts-check
const path = require('node:path');
const fs = require('node:fs');
const { copyFile, lstat, mkdir, readdir } = fs.promises;

async function copyRecursive(from, to) {
  await mkdir(to, { recursive: true });
  for (const element of await readdir(from)) {
    const _from = path.join(from, element);
    const _to = path.join(to, element);
    const stat = await lstat(_from);
    if (stat.isFile()) {
      await copyFile(_from, _to);
    } else {
      await copyRecursive(_from, _to);
    }
  }
}

module.exports = function(eleventyConfig) {
  eleventyConfig.on('eleventy.before', async (e) => {
    console.log('Copying base RHDS styles...');
    const globalStylesIn = path.join(require.resolve('@rhds/tokens'), '..', '..', 'css', 'global.css');
    const globalStylesOut = path.join(process.cwd(), 'assets', 'css', 'rhds.css');
    if (!fs.existsSync(globalStylesOut)) {
      await copyFile( globalStylesIn, globalStylesOut);
    }
    console.log('Copying RHDS elements assets...');
    const from = path.join(require.resolve('@rhds/elements'), '..');
    const to = path.join(process.cwd(), 'assets', '@rhds', 'elements');
    await copyRecursive(from, to);
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

