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

  eleventyConfig.addGlobalData('importMap', async function(configData) {
    const PFE_DEPS = [
      'tslib',
      '@patternfly/pfe-core',
      '@patternfly/pfe-core/decorators.js',
      '@patternfly/pfe-core/controllers/cascade-controller.js',
      '@patternfly/pfe-core/controllers/color-context.js',
      '@patternfly/pfe-core/controllers/css-variable-controller.js',
      '@patternfly/pfe-core/controllers/light-dom-controller.js',
      '@patternfly/pfe-core/controllers/logger.js',
      '@patternfly/pfe-core/controllers/perf-controller.js',
      '@patternfly/pfe-core/controllers/property-observer-controller.js',
      '@patternfly/pfe-core/controllers/slot-controller.js',
      '@patternfly/pfe-core/controllers/style-controller.js',
      '@patternfly/pfe-core/decorators/bound.js',
      '@patternfly/pfe-core/decorators/cascades.js',
      '@patternfly/pfe-core/decorators/color-context.js',
      '@patternfly/pfe-core/decorators/deprecation.js',
      '@patternfly/pfe-core/decorators/initializer.js',
      '@patternfly/pfe-core/decorators/observed.js',
      '@patternfly/pfe-core/decorators/pfelement.js',
      '@patternfly/pfe-core/decorators/time.js',
      '@patternfly/pfe-core/decorators/trace.js',
      '@patternfly/pfe-core/functions/debounce.js',
      '@patternfly/pfe-core/functions/deprecatedCustomEvent.js',
      '@patternfly/pfe-core/functions/random.js',
      '@patternfly/pfe-icon@next',
      '@patternfly/pfe-modal@next',
      '@patternfly/pfe-accordion@next',
      '@patternfly/pfe-tooltip@next',
      '@patternfly/pfe-tooltip@next/BaseTooltip.js',
    ];

    const LIT_DEPS = [
      'lit',
      'lit/async-directive.js',
      'lit/decorators.js',
      'lit/directive-helpers.js',
      'lit/directive.js',
      'lit/directives/class-map.js',
      'lit/directives/if-defined.js',
      'lit/experimental-hydrate-support.js',
      'lit/experimental-hydrate.js',
      'lit/static-html.js',
    ];

    const CDN_DEPS = [
      ...LIT_DEPS,
      ...PFE_DEPS,
    ];

    console.log('Generating import map...');
    const { Generator } = await import('@jspm/generator');

    const generator = new Generator({ env: ['production', 'browser', 'module'] });

    await generator.install([
      ...CDN_DEPS,
    ]);

    const map = generator.getMap();

    const pathPrefix = configData?.pathPrefix ?? process.env.ELEVENTY_PATH_PREFIX ?? '';
    map.imports['@rhds/elements'] = `/${pathPrefix}/assets/@rhds/elements/rhds.min.js`.replaceAll('//', '/');
    map.imports['@rhds/elements/'] = `/${pathPrefix}/assets/@rhds/elements/elements/`.replaceAll('//', '/');

    console.log('  ...Done!');
    return map;
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

