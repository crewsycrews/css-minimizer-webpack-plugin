const cssnano = require('cssnano');

/*
 * We bring to the line here, because when passing result from the worker,
 * the warning.toString is replaced with native Object.toString
 * */
function warningsToString(warnings) {
  return warnings.map((i) => i.toString());
}

const minify = async (options) => {
  const {
    name,
    input,
    minimizerOptions,
    map,
    inputSourceMap,
    minify: minifyFn,
  } = options;

  const postcssOptions = { to: name, from: name };

  if (minifyFn) {
    const result = await minifyFn(
      { [name]: input },
      inputSourceMap,
      minimizerOptions
    );

    return {
      // TODO remove `css` in future major release
      code: result.code || result.css,
      map: result.map,
      warnings: warningsToString(result.warnings || []),
    };
  }

  if (inputSourceMap) {
    // TODO remove `inline` value for the `sourceMap` option
    postcssOptions.map = {
      annotation: false,
      inline: false,
      prev: inputSourceMap,
      ...map,
    };
  }

  const result = await cssnano.process(input, postcssOptions, minimizerOptions);

  return {
    code: result.css,
    map: result.map,
    warnings: warningsToString(result.warnings()),
  };
};

async function transform(options) {
  // 'use strict' => this === undefined (Clean Scope)
  // Safer for possible security issues, albeit not critical at all here
  // eslint-disable-next-line no-new-func, no-param-reassign
  options = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    `'use strict'\nreturn ${options}`
  )(exports, require, module, __filename, __dirname);

  const result = await minify(options);

  if (result.error) {
    throw result.error;
  } else {
    return result;
  }
}

module.exports.minify = minify;
module.exports.transform = transform;
