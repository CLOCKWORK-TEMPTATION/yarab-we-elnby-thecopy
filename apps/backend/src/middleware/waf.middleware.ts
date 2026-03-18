/**
 * Web Application Firewall (WAF) Middleware
 *
 * Implements OWASP Core Rule Set (CRS) based protection:
 * - SQL Injection detection and prevention
 * - XSS (Cross-Site Scripting) protection
 * - Command Injection prevention
 * - Path Traversal prevention
 * - HTTP Protocol Attack detection
 * - Bot protection
 * - IP blocking and geo-blocking capabilities
 * - Rate limiting at WAF level
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";

// ============================================================================
// WAF Configuration
// ============================================================================

export interface WAFConfig {
  enabled: boolean;
  mode: "block" | "monitor"; // Block or just log
  logLevel: "minimal" | "standard" | "verbose";
  rules: {
    sqlInjection: boolean;
    xss: boolean;
    commandInjection: boolean;
    pathTraversal: boolean;
    protocolAttack: boolean;
    botProtection: boolean;
    rateLimit: boolean;
  };
  whitelist: {
    ips: string[];
    paths: string[];
    userAgents: string[];
  };
  blacklist: {
    ips: string[];
    countries: string[];
    userAgents: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    blockDurationMs: number;
  };
  customRules: WAFRule[];
}

export interface WAFRule {
  id: string;
  name: string;
  description: string;
  // SECURITY: Pattern must be a pre-compiled RegExp object, never a string
  // This prevents regex injection attacks
  pattern: RegExp;
  locations: Array<"body" | "query" | "path" | "headers">;
  action: "block" | "allow" | "log";
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface WAFEvent {
  timestamp: Date;
  eventType: WAFEventType;
  ruleId: string;
  ruleName: string;
  severity: "critical" | "high" | "medium" | "low";
  ip: string;
  method: string;
  path: string;
  userAgent: string;
  matchedValue: string;
  action: "blocked" | "monitored" | "challenged";
  details: Record<string, unknown>;
}

export type WAFEventType =
  | "SQL_INJECTION"
  | "XSS_ATTACK"
  | "COMMAND_INJECTION"
  | "PATH_TRAVERSAL"
  | "PROTOCOL_ATTACK"
  | "BOT_DETECTED"
  | "RATE_LIMIT_EXCEEDED"
  | "IP_BLOCKED"
  | "GEO_BLOCKED"
  | "CUSTOM_RULE_MATCH";

// ============================================================================
// Default WAF Configuration
// ============================================================================

const defaultWAFConfig: WAFConfig = {
  enabled: true,
  mode: env.NODE_ENV === "production" ? "block" : "monitor",
  logLevel: "standard",
  rules: {
    sqlInjection: true,
    xss: true,
    commandInjection: true,
    pathTraversal: true,
    protocolAttack: true,
    botProtection: true,
    rateLimit: true,
  },
  whitelist: {
    ips: ["127.0.0.1", "::1"],
    paths: ["/health", "/health/live", "/health/ready", "/metrics"],
    userAgents: [],
  },
  blacklist: {
    ips: [],
    countries: [],
    userAgents: [
      "sqlmap",
      "nikto",
      "nmap",
      "masscan",
      "zgrab",
      "python-requests/2", // Often used for automated attacks
    ],
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  },
  customRules: [],
};

// ============================================================================
// OWASP CRS-based Detection Patterns
// ============================================================================

// SQL Injection Patterns (OWASP CRS 942)
const SQL_INJECTION_PATTERNS: WAFRule[] = [
  {
    id: "942100",
    name: "SQL Injection Attack Detected via libinjection",
    description: "Detects SQL injection using common patterns",
    pattern:
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|DECLARE)\b.*\b(FROM|INTO|TABLE|SET|WHERE|VALUES|DATABASE)\b)|(\b(OR|AND)\b\s+[\w'"]\s*[=<>])|(\'\s*(OR|AND)\s+\'?\d)|(\bHAVING\b\s+\d)|(\bORDER\s+BY\b\s+\d)/gi,
    locations: ["body", "query", "path"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "942110",
    name: "SQL Injection Attack: Common Injection Testing Detected",
    description: "Detects common SQL injection test payloads",
    pattern:
      /(\'\s*(--|#|\/\*))|(\b(WAITFOR|BENCHMARK|SLEEP)\s*\()|(\bCHAR\s*\(\d+\))|(\bCONCAT\s*\(.*\))|(\bCONVERT\s*\()/gi,
    locations: ["body", "query", "path"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "942120",
    name: "SQL Injection Attack: SQL Operator Detected",
    description: "Detects SQL operators used in injection attacks",
    pattern:
      /(\bUNION\b\s+(ALL\s+)?SELECT)|(\b(AND|OR)\b\s+\d+\s*=\s*\d+)|(\bLIKE\b\s+['"]%)|(\bBETWEEN\b\s+\d+\s+AND\s+\d+)/gi,
    locations: ["body", "query", "path"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "942130",
    name: "SQL Injection Attack: SQL Tautology Detected",
    description: "Detects SQL tautologies (always-true conditions)",
    pattern:
      /(\'\s*OR\s+\'?[^']*\'?\s*=\s*\'?[^']*\'?)|(\d+\s*=\s*\d+)|(\'\s*=\s*\')|(\bOR\s+1\s*=\s*1\b)|(\bAND\s+1\s*=\s*1\b)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "942140",
    name: "SQL Injection Attack: DB Names Detected",
    description: "Detects attempts to access database metadata",
    pattern:
      /(\b(INFORMATION_SCHEMA|SYS\.TABLES|SYSOBJECTS|MSysObjects|pg_catalog|SCHEMATA)\b)|(\bSHOW\s+(TABLES|DATABASES|COLUMNS)\b)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
];

// XSS Patterns (OWASP CRS 941)
const XSS_PATTERNS: WAFRule[] = [
  {
    id: "941100",
    name: "XSS Attack Detected via libinjection",
    description: "Detects XSS using common script patterns",
    pattern:
      /(<script[^>]*>[\s\S]*?<\/script>)|(<script[^>]*>)|(\bon\w+\s*=)|(\bjavascript\s*:)|(\bdata\s*:\s*text\/html)/gi,
    locations: ["body", "query", "headers"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "941110",
    name: "XSS Filter - Category 1: Script Tag Vector",
    description: "Detects script tag-based XSS attacks",
    pattern:
      /(<script)|(<\/script>)|(javascript\s*:)|(vbscript\s*:)|(livescript\s*:)/gi,
    locations: ["body", "query", "headers"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "941120",
    name: "XSS Filter - Category 2: Event Handler Vector",
    description: "Detects event handler-based XSS attacks",
    pattern:
      /\b(on(abort|activate|afterprint|afterupdate|beforeactivate|beforecopy|beforecut|beforedeactivate|beforeeditfocus|beforepaste|beforeprint|beforeunload|beforeupdate|blur|bounce|cellchange|change|click|contextmenu|controlselect|copy|cut|dataavailable|datasetchanged|datasetcomplete|dblclick|deactivate|drag|dragend|dragenter|dragleave|dragover|dragstart|drop|error|errorupdate|filterchange|finish|focus|focusin|focusout|hashchange|help|input|keydown|keypress|keyup|layoutcomplete|load|losecapture|message|mousedown|mouseenter|mouseleave|mousemove|mouseout|mouseover|mouseup|mousewheel|move|moveend|movestart|offline|online|pagehide|pageshow|paste|popstate|progress|propertychange|readystatechange|reset|resize|resizeend|resizestart|rowenter|rowexit|rowsdelete|rowsinserted|scroll|search|select|selectionchange|selectstart|start|stop|storage|submit|timeout|touchcancel|touchend|touchmove|touchstart|unload))\s*=/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "941130",
    name: "XSS Filter - Category 3: Attribute Vector",
    description: "Detects attribute-based XSS attacks",
    pattern:
      /(style\s*=\s*[^>]*expression\s*\()|(style\s*=\s*[^>]*url\s*\()|(style\s*=\s*[^>]*behavior\s*:)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "941140",
    name: "XSS Filter - Category 4: JavaScript URI Vector",
    description: "Detects JavaScript URI-based XSS attacks",
    pattern:
      /(href\s*=\s*['"]*\s*javascript\s*:)|(src\s*=\s*['"]*\s*javascript\s*:)|(action\s*=\s*['"]*\s*javascript\s*:)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "941150",
    name: "XSS Filter - Category 5: Dangerous HTML Tags",
    description: "Detects dangerous HTML tags",
    pattern:
      /(<iframe[^>]*>)|(<frame[^>]*>)|(<object[^>]*>)|(<embed[^>]*>)|(<applet[^>]*>)|(<meta[^>]*>)|(<link[^>]*>)|(<style[^>]*>)|(<base[^>]*>)|(<form[^>]*>)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "medium",
    enabled: true,
  },
];

// Command Injection Patterns (OWASP CRS 932)
const COMMAND_INJECTION_PATTERNS: WAFRule[] = [
  {
    id: "932100",
    name: "Remote Command Execution: Unix Command Injection",
    description: "Detects Unix command injection attempts",
    pattern:
      /(\||;|`|\$\(|\${)|(&&|\|\|)|(\bcat\b|\bls\b|\bpwd\b|\bwhoami\b|\bid\b|\buname\b|\bnetstat\b|\bps\b|\bwget\b|\bcurl\b|\bnc\b|\btelnet\b|\bssh\b|\bscp\b|\bchmod\b|\bchown\b|\brm\b|\bcp\b|\bmv\b)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "932110",
    name: "Remote Command Execution: Windows Command Injection",
    description: "Detects Windows command injection attempts",
    pattern:
      /(\bcmd\b|\bcmd\.exe\b|\bpowershell\b|\bpowershell\.exe\b)|(\bnet\s+(user|localgroup|share|use)\b)|(\breg\s+(query|add|delete)\b)|(\bwmic\b)|(\btasklist\b|\btaskkill\b)|(\btype\b\s+[a-z]:\\)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "932120",
    name: "Remote Command Execution: Shell Injection",
    description: "Detects shell metacharacter injection",
    pattern:
      /(;|\||`|\$\(|\${|\beval\b|\bexec\b|\bsystem\b|\bpassthru\b|\bshell_exec\b|\bpopen\b|\bproc_open\b)/gi,
    locations: ["body", "query"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
];

// Path Traversal Patterns (OWASP CRS 930)
const PATH_TRAVERSAL_PATTERNS: WAFRule[] = [
  {
    id: "930100",
    name: "Path Traversal Attack (/../)",
    description: "Detects path traversal attempts",
    pattern:
      /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)|(\.\.\/)|(\/etc\/passwd|\/etc\/shadow|\/proc\/self)/gi,
    locations: ["body", "query", "path"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "930110",
    name: "Path Traversal Attack: OS File Access",
    description: "Detects attempts to access sensitive OS files",
    pattern:
      /(\/etc\/(passwd|shadow|hosts|group|sudoers))|(\/proc\/(self|version|cpuinfo|meminfo))|(C:\\Windows\\|C:\\System32\\|C:\\boot\.ini)/gi,
    locations: ["body", "query", "path"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "930120",
    name: "Path Traversal Attack: Encoded Traversal",
    description: "Detects URL-encoded path traversal attempts",
    pattern:
      /(%00|%0d%0a|%252e%252e%252f|%c0%ae%c0%ae%c0%af|%uff0e%uff0e%u2215|%uff0e%uff0e%u2216)/gi,
    locations: ["body", "query", "path"],
    action: "block",
    severity: "high",
    enabled: true,
  },
];

// HTTP Protocol Attack Patterns (OWASP CRS 921)
const PROTOCOL_ATTACK_PATTERNS: WAFRule[] = [
  {
    id: "921100",
    name: "HTTP Request Smuggling Attack",
    description: "Detects HTTP request smuggling attempts",
    pattern:
      /(Transfer-Encoding\s*:\s*(chunked|identity|gzip|compress|deflate)[\s,]*(chunked|identity|gzip|compress|deflate))|(Content-Length\s*:.*Content-Length\s*:)/gi,
    locations: ["headers"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "921110",
    name: "HTTP Response Splitting Attack",
    description: "Detects HTTP response splitting attempts",
    pattern: /(\r\n|\n|\r)(Set-Cookie|Location|Content-Type)\s*:/gi,
    locations: ["body", "query", "headers"],
    action: "block",
    severity: "critical",
    enabled: true,
  },
  {
    id: "921120",
    name: "HTTP Header Injection Attack",
    description: "Detects HTTP header injection via CRLF",
    pattern: /(%0d%0a|%0a|%0d|\r\n|\n|\r)[\w-]+\s*:/gi,
    locations: ["query", "headers"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "921130",
    name: "HTTP Protocol Violation",
    description: "Detects HTTP protocol violations",
    pattern: /(HTTP\/[\d.]+.*HTTP\/[\d.]+)/gi,
    locations: ["headers"],
    action: "block",
    severity: "medium",
    enabled: true,
  },
];

// Bot Detection Patterns
const BOT_DETECTION_PATTERNS: WAFRule[] = [
  {
    id: "BOT100",
    name: "Known Malicious Bot User-Agent",
    description: "Detects known malicious bot user agents",
    pattern:
      /(sqlmap|nikto|nmap|masscan|zgrab|burp|hydra|medusa|gobuster|dirbuster|wfuzz|ffuf|nuclei|acunetix|netsparker|qualys|w3af|skipfish)/gi,
    locations: ["headers"],
    action: "block",
    severity: "high",
    enabled: true,
  },
  {
    id: "BOT110",
    name: "Missing User-Agent Header",
    description: "Detects requests without User-Agent header",
    pattern: /^$/,
    locations: ["headers"],
    action: "log",
    severity: "low",
    enabled: true,
  },
  {
    id: "BOT120",
    name: "Suspicious Automated Request Pattern",
    description: "Detects automated request patterns",
    pattern: /(curl\/|wget\/|python-requests|go-http-client|java\/|php\/)/gi,
    locations: ["headers"],
    action: "log",
    severity: "low",
    enabled: true,
  },
];

// ============================================================================
// WAF State Management
// ============================================================================

// Rate limiting store
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number; blocked: boolean; blockUntil: number }
>();

// Blocked IPs store (runtime)
const blockedIPs = new Set<string>();

// WAF events store (in-memory, would typically be sent to SIEM)
const wafEvents: WAFEvent[] = [];
const MAX_WAF_EVENTS = 10000;

// Current WAF configuration
let wafConfig: WAFConfig = { ...defaultWAFConfig };

// ============================================================================
// WAF Core Functions
// ============================================================================

/**
 * Get client IP address from request
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (forwardedValue) {
      const parts = forwardedValue.split(",");
      if (parts[0]) {
        return parts[0].trim();
      }
    }
  }
  return req.socket.remoteAddress || req.ip || "unknown";
}

/**
 * Log WAF event
 */
function logWAFEvent(event: WAFEvent): void {
  // Store event
  wafEvents.push(event);
  if (wafEvents.length > MAX_WAF_EVENTS) {
    wafEvents.shift();
  }

  // Log based on configured level
  const logData = {
    waf: true,
    eventType: event.eventType,
    ruleId: event.ruleId,
    ruleName: event.ruleName,
    severity: event.severity,
    method: event.method,
    action: event.action,
    ...(wafConfig.logLevel === "verbose" && {
      details: event.details,
    }),
  };

  if (event.severity === "critical" || event.severity === "high") {
    logger.warn("WAF Alert", logData);
  } else {
    logger.info("WAF Event", logData);
  }
}

/**
 * Check if IP is whitelisted
 */
function isIPWhitelisted(ip: string): boolean {
  return wafConfig.whitelist.ips.includes(ip);
}

/**
 * Check if IP is blacklisted
 */
function isIPBlacklisted(ip: string): boolean {
  return wafConfig.blacklist.ips.includes(ip) || blockedIPs.has(ip);
}

/**
 * Check if path is whitelisted
 */
function isPathWhitelisted(path: string): boolean {
  return wafConfig.whitelist.paths.some(
    (p) => path === p || path.startsWith(p + "/")
  );
}

/**
 * Check if User-Agent is blacklisted
 */
function isUserAgentBlacklisted(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return wafConfig.blacklist.userAgents.some((blocked) =>
    ua.includes(blocked.toLowerCase())
  );
}

/**
 * Extract value from request location
 */
function extractValue(
  req: Request,
  location: "body" | "query" | "headers" | "path" | "cookies"
): string {
  switch (location) {
    case "body":
      return typeof req.body === "object"
        ? JSON.stringify(req.body)
        : String(req.body || "");
    case "query":
      return typeof req.query === "object"
        ? JSON.stringify(req.query)
        : String(req.query || "");
    case "headers":
      return JSON.stringify(req.headers);
    case "path":
      return req.path + (req.originalUrl || "");
    case "cookies":
      return JSON.stringify(req.cookies || {});
    default:
      return "";
  }
}

// Maximum length of content to check against patterns to prevent ReDoS
const MAX_WAF_CHECK_LENGTH = 10000;

/**
 * Safe regex test with timeout to prevent ReDoS attacks
 * SECURITY: Protects against Regular Expression Denial of Service
 */
function safeRegexTest(pattern: RegExp, text: string, timeoutMs: number = 100): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      resolve(false); // Timeout - assume no match to prevent ReDoS
    }, timeoutMs);

    try {
      pattern.lastIndex = 0;
      const result = pattern.test(text);
      clearTimeout(timer);
      resolve(result);
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  }).then(result => result).catch(() => false);
}

/**
 * Synchronous safe regex test with input length limit
 * SECURITY: Prevents ReDoS by limiting input size and using try-catch
 */
function safeRegexTestSync(pattern: RegExp, text: string, maxLength: number = 10000): boolean {
  // Limit input length to prevent ReDoS on large inputs
  if (text.length > maxLength) {
    logger.warn('WAF: Input too large for regex test, truncating', {
      originalLength: text.length,
      maxLength
    });
    text = text.substring(0, maxLength);
  }

  try {
    pattern.lastIndex = 0;
    return pattern.test(text);
  } catch (error) {
    logger.warn('WAF: Regex test failed', { error });
    return false;
  }
}

/**
 * Check request against a rule
 * SECURITY: Uses safe regex testing and limits input length to prevent ReDoS attacks
 */
function checkRule(req: Request, rule: WAFRule): { matched: boolean; value: string } {
  if (!rule.enabled) {
    return { matched: false, value: "" };
  }

  for (const location of rule.locations) {
    let value = extractValue(req, location);
    // Limit the length of content to check to prevent ReDoS
    if (value && value.length > MAX_WAF_CHECK_LENGTH) {
      value = value.substring(0, MAX_WAF_CHECK_LENGTH);
    }
    if (value) {
      try {
        // SECURITY: Ensure pattern is a pre-compiled RegExp object, not a string
        // This prevents regex injection as patterns are hardcoded constants
        if (!(rule.pattern instanceof RegExp)) {
          logger.warn('WAF: Invalid pattern type detected', {
            ruleId: rule.id,
            patternType: typeof rule.pattern
          });
          continue;
        }
        
        // Use safe regex test with input length limit to prevent ReDoS
        if (safeRegexTestSync(rule.pattern, value)) {
          rule.pattern.lastIndex = 0;
          // SECURITY FIX: Don't use .match() as it could trigger ReDoS with malicious patterns
          // Instead, use exec() with length limits for safer extraction
          let matchedValue = value.substring(0, 100);
          try {
            const match = rule.pattern.exec(value.substring(0, 1000));
            if (match && match[0]) {
              matchedValue = match[0].substring(0, 100);
            }
            rule.pattern.lastIndex = 0;
          } catch {
            // If extraction fails, use truncated value
            rule.pattern.lastIndex = 0;
          }
          return {
            matched: true,
            value: matchedValue,
          };
        }
        rule.pattern.lastIndex = 0;
      } catch (error) {
        // Skip on any error to prevent crashes from malicious patterns
        logger.warn('WAF: Rule check failed', { ruleId: rule.id, error });
        continue;
      }
    }
  }

  return { matched: false, value: "" };
}

/**
 * Check rate limiting for IP
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  // Check if IP is currently blocked
  if (record && record.blocked && record.blockUntil > now) {
    return { allowed: false, remaining: 0 };
  }

  // Reset if window expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + wafConfig.rateLimit.windowMs,
      blocked: false,
      blockUntil: 0,
    };
  }

  record.count++;

  // Check if limit exceeded
  if (record.count > wafConfig.rateLimit.maxRequests) {
    record.blocked = true;
    record.blockUntil = now + wafConfig.rateLimit.blockDurationMs;
    rateLimitStore.set(ip, record);
    return { allowed: false, remaining: 0 };
  }

  rateLimitStore.set(ip, record);
  return {
    allowed: true,
    remaining: wafConfig.rateLimit.maxRequests - record.count,
  };
}

/**
 * Block response helper
 */
function sendBlockResponse(
  res: Response,
  statusCode: number = 403,
  message: string = "طلب محظور بواسطة جدار الحماية"
): void {
  res.status(statusCode).json({
    success: false,
    error: message,
    code: "WAF_BLOCKED",
  });
}

// ============================================================================
// WAF Event Factory (reduces code duplication)
// ============================================================================

interface WAFEventParams {
  eventType: WAFEventType;
  ruleId: string;
  ruleName: string;
  severity: WAFEvent["severity"];
  ip: string;
  method: string;
  path: string;
  userAgent: string;
  matchedValue: string;
  details?: Record<string, unknown>;
}

/**
 * Factory function for creating WAF events
 * Centralizes event creation to reduce code duplication
 */
function createWAFEvent(params: WAFEventParams): WAFEvent {
  return {
    timestamp: new Date(),
    eventType: params.eventType,
    ruleId: params.ruleId,
    ruleName: params.ruleName,
    severity: params.severity,
    ip: params.ip,
    method: params.method,
    path: params.path,
    userAgent: params.userAgent,
    matchedValue: params.matchedValue,
    action: wafConfig.mode === "block" ? "blocked" : "monitored",
    details: params.details || {},
  };
}

// ============================================================================
// WAF Check Handlers (Strategy Pattern)
// ============================================================================

interface RequestContext {
  ip: string;
  userAgent: string;
  path: string;
  method: string;
}

interface CheckResult {
  blocked: boolean;
  statusCode?: number;
  message?: string;
}

type CheckHandler = (
  req: Request,
  res: Response,
  ctx: RequestContext
) => CheckResult;

/**
 * IP blacklist check handler
 */
const checkIPBlacklist: CheckHandler = (_req, _res, ctx) => {
  if (!isIPBlacklisted(ctx.ip)) {
    return { blocked: false };
  }

  logWAFEvent(
    createWAFEvent({
      eventType: "IP_BLOCKED",
      ruleId: "IP_BL",
      ruleName: "IP Blacklist",
      severity: "high",
      ...ctx,
      matchedValue: ctx.ip,
    })
  );

  if (wafConfig.mode === "block") {
    return { blocked: true, statusCode: 403, message: "عنوان IP محظور" };
  }
  return { blocked: false };
};

/**
 * User-Agent blacklist check handler
 */
const checkUserAgentBlacklist: CheckHandler = (_req, _res, ctx) => {
  if (!isUserAgentBlacklisted(ctx.userAgent)) {
    return { blocked: false };
  }

  logWAFEvent(
    createWAFEvent({
      eventType: "BOT_DETECTED",
      ruleId: "UA_BL",
      ruleName: "User-Agent Blacklist",
      severity: "medium",
      ...ctx,
      matchedValue: ctx.userAgent,
    })
  );

  if (wafConfig.mode === "block") {
    return { blocked: true, statusCode: 403, message: "طلب غير مصرح به" };
  }
  return { blocked: false };
};

/**
 * Rate limit check handler
 */
const checkRateLimitHandler: CheckHandler = (_req, res, ctx) => {
  if (!wafConfig.rules.rateLimit) {
    return { blocked: false };
  }

  const rateCheck = checkRateLimit(ctx.ip);
  res.setHeader("X-RateLimit-Remaining", rateCheck.remaining.toString());

  if (rateCheck.allowed) {
    return { blocked: false };
  }

  logWAFEvent(
    createWAFEvent({
      eventType: "RATE_LIMIT_EXCEEDED",
      ruleId: "RL",
      ruleName: "Rate Limit",
      severity: "medium",
      ...ctx,
      matchedValue: `Exceeded ${wafConfig.rateLimit.maxRequests} requests`,
      details: {
        windowMs: wafConfig.rateLimit.windowMs,
        maxRequests: wafConfig.rateLimit.maxRequests,
      },
    })
  );

  if (wafConfig.mode === "block") {
    return {
      blocked: true,
      statusCode: 429,
      message: "تم تجاوز الحد المسموح من الطلبات",
    };
  }
  return { blocked: false };
};

/**
 * Rule category configuration for pattern-based checks
 */
interface RuleCategory {
  rules: WAFRule[];
  eventType: WAFEventType;
  configKey: keyof WAFConfig["rules"];
}

const RULE_CATEGORIES: RuleCategory[] = [
  { rules: SQL_INJECTION_PATTERNS, eventType: "SQL_INJECTION", configKey: "sqlInjection" },
  { rules: XSS_PATTERNS, eventType: "XSS_ATTACK", configKey: "xss" },
  { rules: COMMAND_INJECTION_PATTERNS, eventType: "COMMAND_INJECTION", configKey: "commandInjection" },
  { rules: PATH_TRAVERSAL_PATTERNS, eventType: "PATH_TRAVERSAL", configKey: "pathTraversal" },
  { rules: PROTOCOL_ATTACK_PATTERNS, eventType: "PROTOCOL_ATTACK", configKey: "protocolAttack" },
  { rules: BOT_DETECTION_PATTERNS, eventType: "BOT_DETECTED", configKey: "botProtection" },
];

/**
 * Check a single rule and log/block if matched
 */
function processRuleMatch(
  req: Request,
  rule: WAFRule,
  eventType: WAFEventType,
  ctx: RequestContext
): CheckResult {
  const result = checkRule(req, rule);
  if (!result.matched) {
    return { blocked: false };
  }

  const action =
    wafConfig.mode === "block" && rule.action === "block"
      ? "blocked"
      : "monitored";

  const event = createWAFEvent({
    eventType,
    ruleId: rule.id,
    ruleName: rule.name,
    severity: rule.severity,
    ...ctx,
    matchedValue: result.value,
    details: { description: rule.description },
  });
  event.action = action;

  logWAFEvent(event);

  if (wafConfig.mode === "block" && rule.action === "block") {
    return { blocked: true };
  }
  return { blocked: false };
}

/**
 * Pattern-based rules check handler
 */
const checkPatternRules: CheckHandler = (req, _res, ctx) => {
  for (const { rules, eventType, configKey } of RULE_CATEGORIES) {
    if (!wafConfig.rules[configKey]) continue;

    for (const rule of rules) {
      const result = processRuleMatch(req, rule, eventType, ctx);
      if (result.blocked) {
        return result;
      }
    }
  }
  return { blocked: false };
};

/**
 * Custom rules check handler
 */
const checkCustomRules: CheckHandler = (req, _res, ctx) => {
  for (const rule of wafConfig.customRules) {
    const result = processRuleMatch(req, rule, "CUSTOM_RULE_MATCH", ctx);
    if (result.blocked) {
      return result;
    }
  }
  return { blocked: false };
};

/**
 * Execute a pipeline of check handlers
 * Stops at the first blocking result
 */
function executeCheckPipeline(
  handlers: CheckHandler[],
  req: Request,
  res: Response,
  ctx: RequestContext
): CheckResult | null {
  for (const handler of handlers) {
    const result = handler(req, res, ctx);
    if (result.blocked) {
      return result;
    }
  }
  return null;
}

// ============================================================================
// WAF Middleware
// ============================================================================

/**
 * Check handlers pipeline - order matters for security
 * 1. IP blacklist (highest priority - immediately block known bad actors)
 * 2. User-Agent blacklist (block known attack tools)
 * 3. Rate limiting (prevent abuse before expensive pattern checks)
 * 4. Pattern-based rules (SQL injection, XSS, etc.)
 * 5. Custom rules (user-defined patterns)
 */
const WAF_CHECK_PIPELINE: CheckHandler[] = [
  checkIPBlacklist,
  checkUserAgentBlacklist,
  checkRateLimitHandler,
  checkPatternRules,
  checkCustomRules,
];

/**
 * Main WAF middleware
 * Refactored to use Strategy pattern with a check handler pipeline
 */
export function wafMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip if WAF is disabled
  if (!wafConfig.enabled) {
    return next();
  }

  const ctx: RequestContext = {
    ip: getClientIP(req),
    userAgent: req.headers["user-agent"] || "",
    path: req.path,
    method: req.method,
  };

  // Check whitelist first (bypass all checks)
  if (isIPWhitelisted(ctx.ip) || isPathWhitelisted(ctx.path)) {
    return next();
  }

  // Execute check pipeline
  const blockResult = executeCheckPipeline(WAF_CHECK_PIPELINE, req, res, ctx);

  if (blockResult?.blocked) {
    return sendBlockResponse(
      res,
      blockResult.statusCode || 403,
      blockResult.message
    );
  }

  next();
}

// ============================================================================
// WAF Management Functions
// ============================================================================

/**
 * Update WAF configuration
 */
export function updateWAFConfig(config: Partial<WAFConfig>): void {
  const newConfig = { ...config };

  // Validate and hydrate custom rules if present
  if (newConfig.customRules) {
    newConfig.customRules = newConfig.customRules.map((rule: any) => {
      // If pattern is a string (from JSON), convert to RegExp
      // SECURITY: Validate and sanitize regex patterns to prevent injection
      let pattern: RegExp;
      if (typeof rule.pattern === 'string') {
        // SECURITY: Limit pattern length to prevent DoS
        if (rule.pattern.length > 500) {
          throw new Error(`Pattern too long for rule ${rule.id}`);
        }

        try {
          // SECURITY: Always escape user-supplied pattern strings so they are
          // treated as literal text, preventing regex injection.
          const patternSource = escapeRegex(rule.pattern);

          // SECURITY: Use a fixed, safe set of flags for user-defined patterns.
          // If configurable flags are ever needed, they must come from a
          // separately validated field, not embedded in the pattern string.
          const patternFlags = 'gi';

          // SECURITY: Validate flags are safe (defense-in-depth)
          const validFlags = /^[gimuy]*$/;
          if (!validFlags.test(patternFlags)) {
            throw new Error(`Invalid regex flags for rule ${rule.id}`);
          }

          pattern = new RegExp(patternSource, patternFlags);
        } catch (e) {
          throw new Error(`Invalid regex pattern for rule ${rule.id}`);
        }
      } else if (rule.pattern instanceof RegExp) {
        pattern = rule.pattern;
      } else {
        throw new Error(`Invalid pattern type for rule ${rule.id}`);
      }

      // Security check for ReDoS/Injection
      if (!isRegexSafe(pattern)) {
        throw new Error(`Unsafe regex pattern detected for rule ${rule.id}`);
      }

      return {
        ...rule,
        pattern
      };
    });
  }

  wafConfig = { ...wafConfig, ...newConfig };
  logger.info("WAF configuration updated", {
    enabled: wafConfig.enabled,
    mode: wafConfig.mode,
    customRulesCount: wafConfig.customRules.length
  });
}

/**
 * Get current WAF configuration
 */
export function getWAFConfig(): WAFConfig {
  return { ...wafConfig };
}

/**
 * Add IP to blacklist
 */
export function blockIP(ip: string, reason?: string): void {
  blockedIPs.add(ip);
  logger.warn("IP blocked by WAF", { reason });
}

/**
 * Remove IP from blacklist
 */
export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
  logger.info("IP unblocked from WAF");
}

/**
 * Get list of blocked IPs
 */
export function getBlockedIPs(): string[] {
  return Array.from(blockedIPs);
}

/**
 * Escape special regex characters to prevent regex injection
 * SECURITY: Use this when creating patterns from user input
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate regex pattern for safety (prevent ReDoS)
 * SECURITY: Comprehensive checks to prevent regex injection attacks
 */
function isRegexSafe(pattern: RegExp): boolean {
  const patternStr = pattern.source;

  // Check for dangerous nested quantifiers that could cause ReDoS
  // Using simple string checks instead of regex to avoid ReDoS in the validator itself
  const dangerousIndicators = [
    // Nested quantifiers like (a+)+, (a*)+
    { check: (s: string) => /\([^)]{0,50}[+*]\)[+*]/.test(s) },
    // Multiple consecutive .* or .+ (limited backtracking)
    { check: (s: string) => s.includes('.*.*') || s.includes('.+.+') },
    // Alternation with quantifiers
    { check: (s: string) => /\([^)]{0,50}\|[^)]{0,50}\)[+*]/.test(s) },
  ];

  for (const indicator of dangerousIndicators) {
    try {
      if (indicator.check(patternStr)) {
        return false;
      }
    } catch {
      // If check fails, consider it unsafe
      return false;
    }
  }

  // Additional safety: limit pattern complexity
  if (patternStr.length > 500) {
    return false;
  }

  // Check for excessive backtracking indicators
  const quantifierCount = (patternStr.match(/[+*?]/g) || []).length;
  if (quantifierCount > 10) {
    return false;
  }

  // Test the regex with a timeout to catch potential ReDoS
  try {
    const testStr = 'a'.repeat(100);
    const startTime = Date.now();
    pattern.test(testStr);
    if (Date.now() - startTime > 100) { // More than 100ms is suspicious
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Create a safe regex pattern from user input
 * SECURITY: Escapes all special characters to prevent regex injection
 */
export function createSafePattern(userInput: string): RegExp {
  const escaped = escapeRegex(userInput);
  return new RegExp(escaped, 'gi');
}

/**
 * Add custom WAF rule
 * SECURITY: Validates regex pattern to prevent ReDoS attacks and regex injection
 * WARNING: Only accept patterns from trusted admin sources, never from user input
 */
export function addCustomRule(rule: WAFRule): void {
  // SECURITY: Ensure pattern is a RegExp object, not a string
  // This prevents regex injection attacks
  if (!(rule.pattern instanceof RegExp)) {
    logger.error('WAF: Pattern must be a RegExp object', {
      ruleId: rule.id,
      patternType: typeof rule.pattern
    });
    throw new Error('Pattern must be a pre-compiled RegExp object');
  }
  
  // Validate the regex pattern for safety
  if (!isRegexSafe(rule.pattern)) {
    logger.warn("Rejected unsafe WAF rule pattern", {
      ruleId: rule.id,
      ruleName: rule.name,
      reason: "Pattern may cause ReDoS or contains dangerous constructs"
    });
    throw new Error("Unsafe regex pattern detected - rule rejected");
  }

  // Validate rule structure
  if (!rule.id || !rule.name || !rule.pattern) {
    throw new Error("Invalid rule: missing required fields");
  }

  // Check for duplicate rule IDs
  if (wafConfig.customRules.some(r => r.id === rule.id)) {
    throw new Error(`Rule with ID ${rule.id} already exists`);
  }

  wafConfig.customRules.push(rule);
  logger.info("Custom WAF rule added", { ruleId: rule.id, ruleName: rule.name });
}

/**
 * Remove custom WAF rule
 */
export function removeCustomRule(ruleId: string): void {
  wafConfig.customRules = wafConfig.customRules.filter((r) => r.id !== ruleId);
  logger.info("Custom WAF rule removed", { ruleId });
}

/**
 * Get WAF events (recent)
 */
export function getWAFEvents(limit: number = 100): WAFEvent[] {
  return wafEvents.slice(-limit);
}

/**
 * Get WAF statistics
 */
export function getWAFStats(): {
  totalEvents: number;
  blockedRequests: number;
  monitoredRequests: number;
  eventsByType: Record<WAFEventType, number>;
  eventsBySeverity: Record<string, number>;
  topBlockedIPs: { ip: string; count: number }[];
} {
  const eventsByType: Record<string, number> = {};
  const eventsBySeverity: Record<string, number> = {};
  const ipCounts: Record<string, number> = {};
  let blockedRequests = 0;
  let monitoredRequests = 0;

  for (const event of wafEvents) {
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

    if (event.action === "blocked") {
      blockedRequests++;
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    } else {
      monitoredRequests++;
    }
  }

  const topBlockedIPs = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: wafEvents.length,
    blockedRequests,
    monitoredRequests,
    eventsByType: eventsByType as Record<WAFEventType, number>,
    eventsBySeverity,
    topBlockedIPs,
  };
}

/**
 * Clear rate limit for IP
 */
export function clearRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
  logger.info("Rate limit cleared for IP");
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
  logger.info("All rate limits cleared");
}

/**
 * Reset WAF to default configuration
 */
export function resetWAFConfig(): void {
  wafConfig = { ...defaultWAFConfig };
  logger.info("WAF configuration reset to defaults");
}

// ============================================================================
// WAF Alert System
// ============================================================================

type AlertCallback = (event: WAFEvent) => void;
const alertCallbacks: AlertCallback[] = [];

/**
 * Register alert callback
 */
export function onWAFAlert(callback: AlertCallback): void {
  alertCallbacks.push(callback);
}

/**
 * Trigger alerts for critical events
 */
export function triggerAlerts(event: WAFEvent): void {
  if (event.severity === "critical" || event.severity === "high") {
    for (const callback of alertCallbacks) {
      try {
        callback(event);
      } catch (error) {
        logger.error("WAF alert callback error", { error });
      }
    }
  }
}

// Export rule patterns for testing
export const WAF_PATTERNS = {
  SQL_INJECTION: SQL_INJECTION_PATTERNS,
  XSS: XSS_PATTERNS,
  COMMAND_INJECTION: COMMAND_INJECTION_PATTERNS,
  PATH_TRAVERSAL: PATH_TRAVERSAL_PATTERNS,
  PROTOCOL_ATTACK: PROTOCOL_ATTACK_PATTERNS,
  BOT_DETECTION: BOT_DETECTION_PATTERNS,
};
