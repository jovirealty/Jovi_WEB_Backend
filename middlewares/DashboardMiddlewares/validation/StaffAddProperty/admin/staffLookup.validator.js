module.exports = function staffLookupValidator(req, res, next) {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' (email or name) is required." });
  }

  // quick sanity checks
  if (q.includes("@")) {
    // loose email sanity check; DB does the real match case-insensitively
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q);
    if (!ok) return res.status(400).json({ error: "Please provide a valid email format." });
  } else if (q.length < 2) {
    return res.status(400).json({ error: "Name query must be at least 2 characters." });
  }

  next();
};
