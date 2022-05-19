define("mdict-parseXml", function () {
  return function (str) {
    return new DOMParser().parseFromString(str, "text/xml");
  };
});
