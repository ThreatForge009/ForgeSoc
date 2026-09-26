const geo = require('../services/geoService');

// GET /api/geo/batch?ips=1.2.3.4,5.6.7.8
exports.batchLookup = (req, res) => {
  const ips = String(req.query.ips || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  res.json(geo.lookupBatch(ips));
};

// GET /api/geo/:ip
exports.lookup = (req, res) => {
  const result = geo.lookup(req.params.ip);
  if (!result) return res.status(404).json({ message: 'No GeoIP data (private/reserved range or unrecognized IP)' });
  res.json(result);
};
