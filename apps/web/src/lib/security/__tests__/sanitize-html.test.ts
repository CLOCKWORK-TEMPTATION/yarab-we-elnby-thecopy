/**
 * Security Tests for HTML Sanitization
 * 
 * Tests for CodeQL issue #1319 - Incomplete multi-character sanitization
 */

import { describe, it, expect } from 'vitest';
import { stripHtmlTags, escapeHtml, createSafeStyleObject } from '../sanitize-html';

describe('stripHtmlTags - Security Tests', () => {
  describe('CodeQL Issue #1319 - Incomplete multi-character sanitization', () => {
    it('should prevent multi-character bypass attacks', () => {
      // Test case: nested tags that could bypass sequential replace operations
      const malicious = '<scr<script>ipt>alert("xss")</scr</script>ipt>';
      const result = stripHtmlTags(malicious);
      
      // Should not contain any unescaped angle brackets
      expect(result).not.toMatch(/[<>]/);
      expect(result).toBe('');
    });

    it('should handle double-nested script tags', () => {
      const malicious = '<<script>script>alert("xss")<</script>/script>';
      const result = stripHtmlTags(malicious);
      
      expect(result).not.toMatch(/[<>]/);
      expect(result).toBe('');
    });

    it('should escape remaining angle brackets after tag removal', () => {
      const input = '<script>alert(1)</script><';
      const result = stripHtmlTags(input);
      
      // The trailing < should be escaped
      expect(result).toContain('&lt;');
      expect(result).not.toMatch(/[<>]/);
    });

    it('should handle already-encoded content safely', () => {
      const encoded = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = stripHtmlTags(encoded);
      
      // Should preserve encoded entities
      expect(result).toBe(encoded);
    });

    it('should handle multiple angle brackets in sequence', () => {
      const malicious = '<<>><><>>';
      const result = stripHtmlTags(malicious);
      
      // All angle brackets should be escaped
      expect(result).not.toMatch(/[<>]/);
    });
  });

  describe('Standard XSS Attack Vectors', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const result = stripHtmlTags(malicious);
      
      expect(result).toBe('alert("xss")Hello');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove iframe tags', () => {
      const malicious = '<iframe src="javascript:alert(1)"></iframe>Content';
      const result = stripHtmlTags(malicious);
      
      expect(result).toBe('Content');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('</iframe>');
    });

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert(1)">Click me</div>';
      const result = stripHtmlTags(malicious);
      
      expect(result).toBe('Click me');
      expect(result).not.toContain('onclick');
    });

    it('should handle incomplete tags', () => {
      const malicious = '<script';
      const result = stripHtmlTags(malicious);
      
      // Incomplete tag should be removed/escaped
      expect(result).not.toMatch(/[<>]/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      expect(stripHtmlTags('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(stripHtmlTags(null as any)).toBe('');
      expect(stripHtmlTags(undefined as any)).toBe('');
    });

    it('should handle plain text without tags', () => {
      const text = 'This is plain text';
      expect(stripHtmlTags(text)).toBe(text);
    });

    it('should handle text with safe entities', () => {
      const text = 'Math: 5 &lt; 10 &amp;&amp; 10 &gt; 5';
      expect(stripHtmlTags(text)).toBe(text);
    });
  });
});

describe('escapeHtml - Security Tests', () => {
  it('should escape all HTML special characters', () => {
    const dangerous = '<script>alert("xss")&malicious</script>';
    const result = escapeHtml(dangerous);
    
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&amp;malicious&lt;&#x2F;script&gt;');
    expect(result).not.toMatch(/[<>"'&]/);
  });

  it('should escape forward slashes', () => {
    const text = '</script>';
    const result = escapeHtml(text);
    
    expect(result).toContain('&#x2F;');
  });
});

describe('createSafeStyleObject - Security Tests', () => {
  it('should filter out dangerous CSS properties', () => {
    const dangerous = 'color: red; behavior: url(malicious.htc); background: blue;';
    const result = createSafeStyleObject(dangerous);
    
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('background');
    expect(result).not.toHaveProperty('behavior');
  });

  it('should sanitize CSS values with url()', () => {
    const dangerous = 'background-image: url(javascript:alert(1));';
    const result = createSafeStyleObject(dangerous);
    
    // The dangerous value should be removed
    expect(result.backgroundImage || '').toBe('');
  });

  it('should sanitize CSS values with expression()', () => {
    const dangerous = 'width: expression(alert(1));';
    const result = createSafeStyleObject(dangerous);
    
    expect(result.width || '').toBe('');
  });
});
