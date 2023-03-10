const yaml = require("js-yaml");

const { DateTime } = require("luxon");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItEmoji = require("markdown-it-emoji");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const pluginNavigation = require("@11ty/eleventy-navigation");
const PostCSSPlugin = require("eleventy-plugin-postcss");
const RHDSPlugin = require("./_plugins/rhds.cjs");
const ImportMapPlugin = require("./_plugins/importMap.cjs");

/**
 * @see https://stackoverflow.com/a/12646864/2515275
 * @license CC-BY-NC-SA 2.0 Laurens Holst
 */
function shuffleCopyArray(array) {
  const copy = Array.from(array);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

module.exports = function(eleventyConfig) {
  // Copy the `assets` folder to the output
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("posts/assets");
  eleventyConfig.addPassthroughCopy({"node_modules/element-internals-polyfill/": "/assets/packages/"});

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(PostCSSPlugin);
  eleventyConfig.addPlugin(RHDSPlugin);
  eleventyConfig.addPlugin(ImportMapPlugin, {
    defaultProvider: 'nodemodules',
    localPackages: [
      'lit',
      'lit-html',
      'tslib',
      '@lit/reactive-element',
      '@patternfly/pfe-core',
      '@patternfly/elements',
      '@patternfly/elements/pf-accordion/pf-accordion.js',
      '@patternfly/elements/pf-button/pf-button.js',
      '@patternfly/elements/pf-card/pf-card.js',
      '@patternfly/elements/pf-icon/pf-icon.js',
      '@patternfly/elements/pf-modal/pf-modal.js',
      '@patternfly/elements/pf-panel/pf-panel.js',
      '@patternfly/elements/pf-spinner/BaseSpinner.js',
      '@patternfly/elements/pf-spinner/pf-spinner.js',
      '@patternfly/elements/pf-tabs/pf-tabs.js',
      '@patternfly/elements/pf-tooltip/BaseTooltip.js',
      '@patternfly/elements/pf-tooltip/pf-tooltip.js',
      '@rhds/elements',
      '@rhds/elements/rh-alert/rh-alert.js',
      '@rhds/elements/rh-cta/rh-cta.js',
      '@rhds/elements/rh-footer/rh-footer.js',
      '@rhds/elements/rh-navigation-secondary/rh-navigation-secondary.js',
      '@rhds/elements/rh-pagination/rh-pagination.js',
      '@rhds/elements/rh-stat/rh-stat.js',
      '@rhds/elements/rh-tag/rh-tag.js',
      '@rhds/tokens',
    ],
  });

  eleventyConfig.addFilter('importMapURLs', function(importMap) {
    const url = eleventyConfig.getFilter('url');
    const imports = Object.fromEntries(Object.entries(importMap.imports).map(([k, v]) => [k, url(v)]))
    const scopes = Object.fromEntries(Object.entries(importMap.scopes).map(([k, v]) => [url(k),
      Object.fromEntries(Object.entries(v).map(([_k, _v]) => [_k, url(_v)])),
    ]))
    return { imports, scopes };
  });

  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));

  eleventyConfig.addAsyncFilter('fetchGHRepo', async function(repo) {
    const [owner, name] = repo.split('/');
    const EleventyFetch = require('@11ty/eleventy-fetch');
    return EleventyFetch(`https://api.github.com/repos/${owner}/${name}`, {
      duration: '1d',
      type: 'json',
    });
  })

  eleventyConfig.addFilter("randomSort", /** @param {unknown[]} list */list =>
    shuffleCopyArray(list));

  eleventyConfig.addFilter("toDate", string => new Date(string));

  eleventyConfig.addFilter("readableDate", dateObj =>
    DateTime.fromJSDate(dateObj, {zone: 'Asia/Jerusalem', locale: 'he'})
      .toFormat("dd LLL yyyy"));

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('pick', /** @param {unknown[]} list */(list, count) =>
    Array.from(list).slice(0, count));

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if(!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
  }

  eleventyConfig.addFilter("filterTagList", filterTagList)

  // Create an array of all tags
  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return filterTagList([...tagSet]);
  });

  eleventyConfig.amendLibrary("md", md => md.use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "direct-link",
      symbol: "#"
    }),
    level: [1,2,3,4],
    slugify: eleventyConfig.getFilter("slugify")
  }).use(markdownItEmoji));

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
      "md",
      "njk",
      "html",
    ],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: "njk",

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "",
    // -----------------------------------------------------------------

    // These are all optional (defaults are shown):
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
