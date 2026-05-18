import { DownloadError } from './download-error';

/**
 * 验证 URL 是否可以安全下载，阻止私人/内部地址
 * 以防止 SSRF 攻击。
 *
 * @param url - The URL string to validate.
 * @throws DownloadError if the URL is unsafe.
 */
export function validateDownloadUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new DownloadError({
      url,
      message: `Invalid URL: ${url}`,
    });
  }

  // data：URL 是内联内容，因此它们不会触发网络获取或 SSRF 风险。
  if (parsed.protocol === 'data:') {
    return;
  }

  // 只允许http和https网络协议
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DownloadError({
      url,
      message: `URL scheme must be http, https, or data, got ${parsed.protocol}`,
    });
  }

  const hostname = parsed.hostname;

  // 阻止空主机名
  if (!hostname) {
    throw new DownloadError({
      url,
      message: `URL must have a hostname`,
    });
  }

  // 阻止 localhost 和 .local 域
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  ) {
    throw new DownloadError({
      url,
      message: `URL with hostname ${hostname} is not allowed`,
    });
  }

  // 检查 IPv6 地址（用 URL 中的括号括起来）
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const ipv6 = hostname.slice(1, -1);
    if (isPrivateIPv6(ipv6)) {
      throw new DownloadError({
        url,
        message: `URL with IPv6 address ${hostname} is not allowed`,
      });
    }
    return;
  }

  // 检查 IPv4 地址
  if (isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw new DownloadError({
        url,
        message: `URL with IP address ${hostname} is not allowed`,
      });
    }
    return;
  }
}

function isIPv4(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = Number(part);
    return (
      Number.isInteger(num) && num >= 0 && num <= 255 && String(num) === part
    );
  });
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 127.0.0.0/8
  if (a === 127) return true;
  // 169.254.0.0/16
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1（环回）
  if (normalized === '::1') return true;
  // ::（未指定）
  if (normalized === '::') return true;

  // 检查 IPv4 映射地址（::ffff:x.x.x.x 或 ::ffff:HHHH:HHHH）
  if (normalized.startsWith('::ffff:')) {
    const mappedPart = normalized.slice(7);
    // 点分十进制形式：::ffff:127.0.0.1
    if (isIPv4(mappedPart)) {
      return isPrivateIPv4(mappedPart);
    }
    // 十六进制形式：::ffff:7f00:1（URL 解析器对此进行规范化）
    const hexParts = mappedPart.split(':');
    if (hexParts.length === 2) {
      const high = parseInt(hexParts[0], 16);
      const low = parseInt(hexParts[1], 16);
      if (!isNaN(high) && !isNaN(low)) {
        const a = (high >> 8) & 0xff;
        const b = high & 0xff;
        const c = (low >> 8) & 0xff;
        const d = low & 0xff;
        return isPrivateIPv4(`${a}.${b}.${c}.${d}`);
      }
    }
  }

  // fc00::/7（唯一本地地址 - fc00:: 和 fd00::）
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // fe80::/10（链接本地）
  if (normalized.startsWith('fe80')) return true;

  return false;
}
