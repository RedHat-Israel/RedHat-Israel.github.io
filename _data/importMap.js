// @ts-check

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
  'lit/experimental-hydrate-support.js',
  'lit/experimental-hydrate.js',
  'lit/static-html.js',
];

const CDN_DEPS = [
  ...LIT_DEPS,
  ...PFE_DEPS,
];

module.exports = async function(configData) {
  console.log('Generating import map...');
  const { Generator } = await import('@jspm/generator');

  const generator = new Generator({ env: ['production', 'browser', 'module'] });

  await generator.install([
    ...CDN_DEPS,
  ]);

  const map = generator.getMap();

  const pathPrefix = configData.pathPrefix ?? process.env.ELEVENTY_PATH_PREFIX ?? "/red-hat-israel-site/"
  map.imports['@rhds/elements'] = `/${pathPrefix}assets/@rhds/elements/rhds.min.js`.replace('//', '/');
  map.imports['@rhds/elements/'] = `/${pathPrefix}assets/@rhds/elements/elements/`.replace('//', '/');

  console.log('  ...Done!');
  return map;
};

