// @ts-check
module.exports = function(eleventyConfig) {
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

