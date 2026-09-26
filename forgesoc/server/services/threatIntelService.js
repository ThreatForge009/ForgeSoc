/**
 * AbuseIPDB reputation lookups. Get a free API key at https://www.abuseipdb.com/api
 * (1,000 checks/day on the free tier) and set ABUSEIPDB_API_KEY in .env.
 *
 * This code makes a real HTTPS call — it just can't be exercised inside the
 * sandbox this project was scaffolded in (no outbound network to
 * api.abuseipdb.com there). It will work as soon as you run the server
 * somewhere with normal internet access and a valid key.
 */
const API_URL = 'https://api.abuseipdb.com/api/v2/check';
const cache = new Map(); // ip -> { data, expiresAt } — 1hr TTL, keeps free-tier quota alive
const TTL_MS = 60 * 60 * 1000;

const isConfigured = () => Boolean(process.env.ABUSEIPDB_API_KEY);

const checkIp = async (ip) => {
  if (!isConfigured()) return null;

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await fetch(`${API_URL}?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
      headers: {
        Key: process.env.ABUSEIPDB_API_KEY,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`AbuseIPDB lookup failed for ${ip}: HTTP ${res.status}`);
      return null;
    }

    const body = await res.json();
    const data = {
      abuseConfidenceScore: body.data?.abuseConfidenceScore ?? 0,
      totalReports: body.data?.totalReports ?? 0,
      countryCode: body.data?.countryCode ?? null,
      isTor: body.data?.isTor ?? false,
      isp: body.data?.isp ?? null,
    };

    cache.set(ip, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  } catch (err) {
    console.error(`AbuseIPDB lookup error for ${ip}:`, err.message);
    return null;
  }
};

module.exports = { checkIp, isConfigured };
