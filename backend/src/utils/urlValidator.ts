import { URL } from 'url';

/**
 * Private IP ranges that should be blocked for SSRF protection
 */
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' }, // localhost
  { start: '169.254.0.0', end: '169.254.255.255' }, // link-local
  { start: '0.0.0.0', end: '0.255.255.255' },
];

/**
 * Convert IP address to number for range checking
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return parts[0] * 256 * 256 * 256 + parts[1] * 256 * 256 + parts[2] * 256 + parts[3];
}

/**
 * Check if an IP address is in a private range
 */
function isPrivateIP(ip: string): boolean {
  const ipNum = ipToNumber(ip);
  return PRIVATE_IP_RANGES.some(range => {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    return ipNum >= startNum && ipNum <= endNum;
  });
}

/**
 * Validate URL for SSRF protection
 * @param urlString The URL to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateUrl(urlString: string): { isValid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: `Protocol "${url.protocol}" is not allowed. Only HTTP and HTTPS are permitted.`
      };
    }

    // Check for localhost variations
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return {
        isValid: false,
        error: 'Localhost and private IP addresses are not allowed for security reasons.'
      };
    }

    // Check for private IP addresses in hostname
    // Try to resolve hostname to IP (basic check for common patterns)
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(hostname)) {
      if (isPrivateIP(hostname)) {
        return {
          isValid: false,
          error: 'Private IP addresses are not allowed for security reasons.'
        };
      }
    }

    // Block common internal hostnames
    const blockedHostnames = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'internal',
      'local',
    ];
    
    if (blockedHostnames.some(blocked => hostname.includes(blocked))) {
      return {
        isValid: false,
        error: 'Internal hostnames are not allowed for security reasons.'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate and sanitize URL input from request body
 * This is a convenience function for route handlers
 */
export function validateUrlInput(url: unknown): { isValid: boolean; url?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string'
    };
  }

  const validation = validateUrl(url);
  if (!validation.isValid) {
    return validation;
  }

  return {
    isValid: true,
    url
  };
}

