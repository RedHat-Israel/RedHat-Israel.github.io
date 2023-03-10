// @ts-check
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

module.exports = function(eleventyConfig, {
  inputMap = undefined,
  defaultProvider = undefined,
  localPackages = [],
} = {}) {
  const cwd = process.cwd();

  const specs = localPackages.map(spec => ({
    spec,
    packageName: spec.replace(/^@/, '$').replace(/@.*$/, '').replace(/^\$/, '@')
  }));

  // copy over local packages
  for (const { packageName } of specs) {
    eleventyConfig.addPassthroughCopy({ [`node_modules/${packageName}`]: `/assets/packages/${packageName}` });
  }

  // HACK: copy lit transitive deps
  // this might not be necessary if we flatten to a single lit version
  for (const packageName of ['lit-html', 'lit-element']) {
    eleventyConfig.addPassthroughCopy({ [`node_modules/${packageName}`]: `/assets/packages/${packageName}` });
  }
  // ENDHACK

  eleventyConfig.addGlobalData('importMap', async function importMap() {
    performance.mark('importMap-start');

    const { Generator } = await import('@jspm/generator');

    const generator = new Generator({
      env: ['production', 'browser', 'module'],
      defaultProvider,
      inputMap,
      providers: {
        ...Object.fromEntries(specs.map(x => [x.packageName, 'nodemodules'])),
      },
    });

    await generator.install(localPackages);
    performance.mark('importMap-afterLocalPackages');

    generator.importMap
      .flatten()
      .replace(pathToFileURL(join(cwd, 'node_modules/')).href, '/assets/packages/')
      .combineSubpaths()

    const json = generator.importMap.toJSON();

    Object.entries(json.scopes).forEach(([k, v]) => {
      Object.entries(v).forEach(([K, V]) => {
        json.scopes[k][K] = V.replace('./node_modules', '/assets/packages')
      });
    });

    json.scopes['/assets/packages/']['@patternfly/pfe-core'] = '/assets/packages/@patternfly/pfe-core/core.js';

    Object.assign(json.imports ?? {}, {
      'element-internals-polyfill': '/assets/packages/element-internals-polyfill/dist/index.js',
    });

    performance.mark('importMap-end');

    logPerf();

    return json;
  });
};

function logPerf() {
  // We should log performance regressions
  /* eslint-disable no-console */
  const chalk = require('chalk');
  const TOTAL = performance.measure('importMap-total', 'importMap-start', 'importMap-end');
  const RESOLVE = performance.measure('importMap-resolve', 'importMap-start', 'importMap-afterLocalPackages');
  if (TOTAL.duration > 2000) {
    console.log(
      `🦥 Import map generator done in ${chalk.red(TOTAL.duration)}ms\n`,
      `  Resolving local packages took ${chalk.red(RESOLVE.duration)}ms\n`,
    );
  } else if (TOTAL.duration > 1000) {
    console.log(
      `🐢 Import map generator done in ${chalk.yellow(TOTAL.duration)}ms\n`,
      `  Resolving local packages took ${chalk.yellow(RESOLVE.duration)}ms\n`,
    );
  } else {
    console.log(
      `⚡ Import map generator done in ${chalk.blue(TOTAL.duration)}ms\n`,
    );
  }
  /* eslint-enable no-console */
}

