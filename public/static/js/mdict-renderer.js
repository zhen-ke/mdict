/*
 * A basic html renderer companioned with mdict-render.js to retrieve word's definition from a MDict dictionary.
 * By Feng Dihai <fengdh@gmail.com>, 2015/07/01
 *
 * For my wife, my kids and family to whom I'm in love with life.
 *
 * This is free software released under terms of the MIT License.
 * You can get a copy on http://opensource.org/licenses/MIT.
 *
 *
 * MDict software and its file format is developed by Rayman Zhang(张文伟),
 * read more on http://www.mdict.cn/ or http://www.octopus-studio.com/.
 */

/**
 * Usage:
 *   var fileList = ...; // FileList object
 *   var word = ...;     // word for lookup
 *   require(['mdict-parser', 'mdict-renderer'], function(MParser, MRenderer) {
 *      MParser(fileList).then(function(resources) {
 *         var mdict = MRenderer(resources),
 *             dict_desc = resources.description.mdx;
 *         mdict.lookup(word).then(function($content) {
 *            // use $content to display result
 *         });
 *      });
 *    });
 */
(function (root, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["jquery", "bluebird", "speex", "pcmdata", "bitstring"], factory);
  } else {
    // Browser globals
    factory(jQuery, Promise);
  }
})(this, function ($, Promise, SpeexLib, PCMDataLib) {
  var MIME = {
    css: "text/css",
    img: "image",
    jpg: "image/jpeg",
    png: "image/png",
    spx: "audio/x-speex",
    wav: "audio/wav",
    mp3: "audio/mp3",
    js: "text/javascript",
  };

  function getExtension(filename, defaultExt) {
    return /(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt;
  }

  // TODO: revoke unused resource, LRU
  // TODO: support for word variation
  return function createRenderer(resources) {
    var cache = (function createCache(mdd) {
      var repo = {};
      function get(id, load) {
        var entry = repo[id];
        if (!entry) {
          repo[id] = entry = new Promise(function (resolve, reject) {
            var will = mdd
              .then(function (lookup) {
                console.log("lookup: " + id);
                return lookup(id);
              })
              .then(load)
              .then(function (url) {
                console.log("url: " + url);
                resolve(url);
              })
              .catch((e) => reject(e));
          });
        }
        return entry;
      }

      return { get: get };
    })(resources["mdd"]);

    function loadData(mime, data) {
      // const test = String.fromCharCode.apply(null, data);
      // console.log(test);
      var blob = new Blob([data], { type: mime });
      return URL.createObjectURL(blob);
    }

    function loadAudio(ext, data) {
      if (ext === "spx") {
        var blob = decodeSpeex(String.fromCharCode.apply(null, data));
        return URL.createObjectURL(blob);
      } else {
        // 'spx'
        return loadData(MIME[ext] || "audio", data);
      }
    }

    // TODO: LRU cache: remove oldest one only after rendering.
    function replaceImage(index, img) {
      var $img = $(img);
      var src = $img.attr("src"),
        m = /^file:\/\/(.*)/.exec(src);
      if (m) {
        src = m[1];
      }
      cache.get(src, loadData.bind(null, MIME["img"])).then(function (url) {
        $img.attr({ src: url, src_: src });
      });
    }

    function playAudio(e, $a) {
      ($a || $(this)).find("audio")[0].play();
    }

    function renderAudio() {
      var $a = $(this);
      if ($a.attr("href_")) {
        playAudio($a);
      } else {
        var href = $a.attr("href"),
          res = href.substring(8);
        var ext = getExtension(res, "wav");
        cache.get(res, loadAudio.bind(null, ext)).then(function (url) {
          $a.append($("<audio>").attr({ src: url, src_: href })).on(
            "click",
            playAudio
          );
          setTimeout(playAudio.bind($a));
        });
      }
      return false;
    }

    function replaceAll(str, find, replace) {
      return str.replace(new RegExp(find, "g"), replace);
    }

    const JS_REG = /src=\"((\S+)\.js)\"/gi;
    const JS_REG_IDX = 1;
    const CSS_REG = /href=\"((\S+)\.css)\"/g;
    const CSS_REG_IDX = 1;

    function extractKeys(html, reg, idx) {
      let matches = html.matchAll(reg);
      const keySet = new Set();

      for (const match of matches) {
        let resourceKey = match[idx];
        keySet.add(resourceKey);
      }
      return [...keySet];
    }

    async function replaceCss(html) {
      try {
        const resourceKeys = extractKeys(html, CSS_REG, CSS_REG_IDX);
        const mddHerf = await Promise.all(
          resourceKeys.map((currentUrl) => {
            return cache
              .get(currentUrl, loadData.bind(null, MIME["css"]))
              .then((originUrl) => {
                return {
                  currentUrl,
                  originUrl,
                };
              })
              .catch((error) => {
                console.error(error);
                return {
                  currentUrl: "#",
                  originUrl: "#",
                };
              });
          })
        );
        mddHerf.map(
          (it) => (html = replaceAll(html, it.currentUrl, it.originUrl))
        );
        return html;
      } catch (error) {
        console.error(error);
      }
    }

    async function injectJS(html) {
      // var $el = $(el);
      // var src = $el.attr("src");
      // cache.get(src, loadData.bind(null, MIME["js"])).then(function (url) {
      //   $el.remove();
      //   $.ajax({ url: url, dataType: "script", cache: true });
      // });
      try {
        const resourceKeys = extractKeys(html, JS_REG, JS_REG_IDX);
        const mddHerf = await Promise.all(
          resourceKeys.map((currentUrl) => {
            return cache
              .get(currentUrl, loadData.bind(null, MIME["js"]))
              .then((originUrl) => {
                return {
                  currentUrl,
                  originUrl,
                };
              })
              .catch((error) => {
                console.error(error);
                return {
                  currentUrl: "#",
                  originUrl: "#",
                };
              });
          })
        );
        mddHerf.map(
          (it) => (html = replaceAll(html, it.currentUrl, it.originUrl))
        );
        console.log(mddHerf);
        return html;
      } catch (error) {
        console.error(error);
      }
    }

    function decodeSpeex(file) {
      var ogg = new Ogg(file, { file: true });
      ogg.demux();

      var header = Speex.parseHeader(ogg.frames[0]);
      console.log(header);

      var comment = new SpeexComment(ogg.frames[1]);
      console.log(comment.data);

      var spx = new Speex({
        quality: 8,
        mode: header.mode,
        rate: header.rate,
      });

      var waveData = PCMData.encode({
        sampleRate: header.rate,
        channelCount: header.nb_channels,
        bytesPerSample: 2,
        data: spx.decode(ogg.bitstream(), ogg.segments),
      });

      return new Blob([Speex.util.str2ab(waveData)], { type: "audio/wav" });
    }

    async function render($content) {
      if (resources["mdd"]) {
        const res = await injectJS($content);
        return await replaceCss(res);
        // $content.find("img[src]").each(replaceImage);

        // $content.find("link[rel=stylesheet]").each(replaceCss);

        // $content.find("script[src]").each(injectJS);

        // $content.find('a[href^="sound://"]').on("click", renderAudio);
      }
      return $content;
      // resolve entry:// link dynamically in mdict.js
      //      // rewrite in-page link
      //      $content.find('a[href^="entry://"]').each(function() {
      //        var $el = $(this), href = $el.attr('href');
      //        if (href.match('#')) {
      //          $el.attr('href', href.substring(8));
      //        }
      //      });
    }

    return {
      lookup: function lookup(query) {
        return (resources["mdx"] || resources["mdd"])
          .then(function (lookup) {
            return lookup(query);
          })
          .then(function (definitions) {
            console.log("lookup done!");
            var html = definitions.reduce((prev, txt) => prev + txt, "");
            return Promise.resolve(render(html));
          });
      },

      search: function (query) {
        return resources["mdx"].then(function (lookup) {
          return lookup(query);
        });
      },

      render: render,
    };
  };
});
