const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const pluginNavigation = require("@11ty/eleventy-navigation");
const PostCSSPlugin = require("eleventy-plugin-postcss");

  async function copyRecursive(from, to) {
    const { copyFile, lstat, mkdir, readdir } = fs.promises;
    await mkdir(to, {recursive: true});
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
  // Copy the `assets` folder to the output
  eleventyConfig.addPassthroughCopy("assets");

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(PostCSSPlugin);
  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));

  eleventyConfig.addFilter("readableDate", dateObj =>
    DateTime.fromJSDate(dateObj, {zone: 'Asia/Jerusalem', locale: 'he'})
      .toFormat("dd LLL yyyy"));

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

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

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "direct-link",
      symbol: "#"
    }),
    level: [1,2,3,4],
    slugify: eleventyConfig.getFilter("slugify")
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  eleventyConfig.on('eleventy.before', async () => {
    const { copyFile } = fs.promises;
    console.log('Copying base RHDS styles...');
    const globalStylesIn = path.join(require.resolve('@rhds/tokens'), '..','..','css', 'global.css');
    const globalStylesOut = path.join(__dirname, 'assets', 'css', 'rhds.css');
    if (!fs.existsSync(globalStylesOut))
      await copyFile( globalStylesIn, globalStylesOut);
    console.log('Copying RHDS elements assets...');
    const from = path.join(require.resolve('@rhds/elements'), '..');
    const to = path.join(__dirname, 'assets', '@rhds', 'elements');
    await copyRecursive(from, to);
    console.log('  ...done')
  })

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

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
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/red-hat-israel-site/",
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
