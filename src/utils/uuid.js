
function isValid(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function isNull(uuid) {
  if (!isValid(uuid))
    return true;
  return uuid === "00000000-0000-0000-0000-000000000000";
}

module.exports = {
  isValid,
  isNull
};
