/**
 *  https://github.com/jeka-kiselyov/mdict
 *  Very rude refactoring of https://github.com/fengdh/mdict-js to make it work with node.js by Jeka Kiselyov ( https://github.com/jeka-kiselyov ).
 *  Done enough to make it work for my project(with predefined dictionaries). Though tested with few .mdx files only.
 *  There may be some bugs for other dictionaries. Please check.
 *  Please feel free to post pull requests with optimizations, unit tests etc.
 *  Released under terms of the MIT License, as original library
 */

import mdictParser from "./mdict-parser";
import Promise from "bluebird";

const dictionary = function (filenames) {
  return new Promise(function (resolve, reject) {
    mdictParser(filenames)
      .then(function (resources) {
        return resources.mdx;
      })
      .then(function (mdx) {
        resolve({
          lookup: function (string) {
            return mdx(string);
          },
          search: function (params) {
            if (typeof params === "string" || params instanceof String) {
              params = {
                phrase: params,
              };
            }

            params = params || {};
            params.phrase = params.phrase || "";
            params.max = params.max || 10;
            params.follow = params.follow || false;

            return mdx(params);
          },
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default dictionary;
