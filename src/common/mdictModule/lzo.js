var lzo1x = require(__dirname + "/lzo1x.js");

export default decompress = function (buf) {
  var state = { inputBuffer: new Uint8Array(buf) };
  var ret = lzo1x.decompress(state);
  return state.outputBuffer;
};
