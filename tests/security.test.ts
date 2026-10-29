import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateTargetUrl } from '../src/server/security/urlGuard';
import { validateHostIp } from '../src/server/security/ipGuard';

describe('SSRF & URL Security Guards', () => {
  test('rejects localhost and 127.0.0.1', () => {
    const r1 = validateTargetUrl('http://localhost');
    assert.equal(r1.valid, false);

    const r2 = validateTargetUrl('http://127.0.0.1:8080');
    assert.equal(r2.valid, false);

    const r3 = validateTargetUrl('http://127.0.0.1');
    assert.equal(r3.valid, false);
  });

  test('rejects cloud metadata IP 169.254.169.254', () => {
    const res = validateTargetUrl('http://169.254.169.254/computeMetadata/v1/');
    assert.equal(res.valid, false);
  });

  test('rejects credentials in URL', () => {
    const res = validateTargetUrl('https://admin:password@example.com');
    assert.equal(res.valid, false);
  });

  test('rejects non-http protocols (file, ftp, gopher)', () => {
    const r1 = validateTargetUrl('file:///etc/passwd');
    assert.equal(r1.valid, false);

    const r2 = validateTargetUrl('gopher://127.0.0.1');
    assert.equal(r2.valid, false);
  });

  test('rejects private IPv4 ranges (10.x, 192.168.x, 172.16.x)', async () => {
    const r1 = await validateHostIp('10.0.0.1');
    assert.equal(r1.valid, false);

    const r2 = await validateHostIp('192.168.1.1');
    assert.equal(r2.valid, false);

    const r3 = await validateHostIp('172.16.0.5');
    assert.equal(r3.valid, false);
  });

  test('rejects loopback and unique-local IPv6', async () => {
    const r1 = await validateHostIp('::1');
    assert.equal(r1.valid, false);

    const r2 = await validateHostIp('fc00::1');
    assert.equal(r2.valid, false);
  });

  test('accepts valid public domain URLs', () => {
    const res = validateTargetUrl('https://example.com/blog');
    assert.equal(res.valid, true);
    assert.equal(res.url?.hostname, 'example.com');
  });
});
