const geoip = require('geoip-lite');

/**
 * Real, offline GeoIP lookup (no API key, no external network call).
 * geoip-lite ships a bundled MaxMind-derived database that's updated with
 * each npm release. For production-grade accuracy, swap this for a live
 * MaxMind GeoLite2 subscription or an IPinfo API call — the interface below
 * stays the same either way, so nothing else in the app needs to change.
 */
const lookup = (ip) => {
  // Private/reserved ranges won't resolve — expected for internal IPs (192.168.x.x etc.)
  const result = geoip.lookup(ip);
  if (!result) return null;

  return {
    ip,
    lat: result.ll[0],
    lng: result.ll[1],
    country: result.country,
    region: result.region,
    city: result.city || null,
    timezone: result.timezone,
  };
};

const lookupBatch = (ips) => {
  const out = {};
  for (const ip of ips) {
    out[ip] = lookup(ip);
  }
  return out;
};

module.exports = { lookup, lookupBatch };
