/**
 * Strips keys that could be used for NoSQL operator injection ($gt, $where, …)
 * or prototype pollution (__proto__, constructor, prototype). Mutates objects
 * in place. Express 5 makes req.query a read-only getter, so — unlike
 * express-mongo-sanitize — this only touches req.body and req.params, which
 * covers every write path in this API (all routes read filters from the body).
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    value.forEach(sanitizeValue);
    return value;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".") || ["__proto__", "constructor", "prototype"].includes(key)) {
        delete value[key];
        continue;
      }
      sanitizeValue(value[key]);
    }
  }
  return value;
}

function sanitize(req, res, next) {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
}

module.exports = sanitize;
