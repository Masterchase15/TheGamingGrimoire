import net from 'node:net';

// Behind Cloudflare every request reaches Railway from a Cloudflare edge server, so req.ip
// would be Cloudflare's address and the rate limiter would lump many visitors together.
// Cloudflare passes the visitor's real address in CF-Connecting-IP. That header is only
// trusted when the request really came from Cloudflare, so it can't be spoofed by someone
// connecting to Railway directly. Ranges from https://www.cloudflare.com/ips/
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
  '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
  '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
  '2a06:98c0::/29', '2c0f:f248::/32',
];

const cloudflare = new net.BlockList();
for (const range of CLOUDFLARE_RANGES) {
  const [addr, bits] = range.split('/');
  cloudflare.addSubnet(addr, Number(bits), net.isIPv6(addr) ? 'ipv6' : 'ipv4');
}

function fromCloudflare(ip) {
  if (!ip) return false;
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (net.isIPv4(v4)) return cloudflare.check(v4, 'ipv4');
  return net.isIPv6(ip) && cloudflare.check(ip, 'ipv6');
}

export function realClientIp(req, _res, next) {
  const visitor = req.get('cf-connecting-ip');
  if (visitor && net.isIP(visitor) && fromCloudflare(req.ip)) {
    Object.defineProperty(req, 'ip', { value: visitor, configurable: true });
    req.viaCloudflare = true;
  }
  next();
}
