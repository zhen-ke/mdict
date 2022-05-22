export const REGEXP_STRIPKEY = {
  mdx: /[()., '/\\@_-]()/g,
  mdd: /([.][^.]*$)|[()., '/\\@_-]/g, // strip '.' before file extension that is keeping the last period
};

export const log = function () {
  console.log.apply(console, [].slice.apply(arguments));
};

export const getExtension = function (filename, defaultExt) {
  return /(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt;
};
