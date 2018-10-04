import util from 'handlebars-utils';

export default function(a, b, options) {
  if (arguments.length === 2) {
    options = b;
    b = options.hash.compare;
  }
  return util.value(a === b, this, options);
};