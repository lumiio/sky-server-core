
function toArrayBuffer(typedArray) {
  var ab = new ArrayBuffer(typedArray.length);
  (new Uint8Array(ab)).set(typedArray);
  return ab;
}

function toTypedArray(arrayBuffer) {
  return new Uint8Array(arrayBuffer);
}

function fromBase64(string) {
  return Buffer.from(string, "base64").toString("utf8");
}

function toBase64(string) {
  return Buffer.from(string).toString("base64");
}

module.exports = {
  toArrayBuffer,
  toTypedArray,
  fromBase64,
  toBase64
}
