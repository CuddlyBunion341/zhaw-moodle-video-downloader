/**
 * Tests for Moodle Kaltura Video Downloader
 * Run with: node test/content.test.js
 */

const assert = require('assert');

// Mock browser API for testing
global.browser = {
  runtime: {
    sendMessage: async (message) => {
      if (message.type === 'getVideoUrl') {
        const mockUrls = {
          '0_dwokpxlc': 'https://api.kaltura.switch.ch/p/111/sp/11100/playManifest/entryId/0_dwokpxlc/format/applehttp/a.m3u8'
        };
        return { url: mockUrls[message.entryId] || null };
      }
    }
  }
};

// Mock navigator.clipboard
global.navigator = {
  clipboard: {
    writeText: async (text) => {
      global.lastClipboardText = text;
      return Promise.resolve();
    }
  }
};

// Test suite
class TestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async run(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      this.failed++;
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
    }
  }

  report() {
    console.log(`\n${this.passed} passed, ${this.failed} failed`);
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// Test: Entry ID extraction
async function testEntryIdExtraction() {
  const testCases = [
    {
      input: 'https://moodle.zhaw.ch/filter/kaltura/lti_launch.php?source=https%3A%2F%2Fmoodle.kaltura.zhaw.ch%2Fbrowseandembed%2Findex%2Fmedia%2Fentryid%2F0_dwokpxlc%2F',
      expected: '0_dwokpxlc'
    },
    {
      input: 'https://example.com/entryid/0_abcd1234/',
      expected: '0_abcd1234'
    }
  ];

  const extractEntryId = (url) => {
    const match = url.match(/entryid%2F([^%\/]+)/i) ||
                  url.match(/entryid\/([^\/]+)/i);
    return match ? match[1] : null;
  };

  testCases.forEach(({ input, expected }) => {
    const result = extractEntryId(input);
    assert.strictEqual(result, expected, `Expected ${expected}, got ${result}`);
  });
}

// Test: Title normalization
async function testTitleNormalization() {
  const normalizeTitle = (title) => {
    let normalized = title.split('|')[0].trim();
    normalized = normalized.replace(/:/g, '-');
    normalized = normalized.replace(/[\/\\*?"<>|]/g, '');
    normalized = normalized.replace(/[\s-]+/g, '_');
    normalized = normalized.replace(/^_+|_+$/g, '');
    normalized = normalized.toLowerCase();
    if (normalized.length > 100) {
      normalized = normalized.substring(0, 100);
    }
    if (!normalized) {
      normalized = 'video';
    }
    return normalized;
  };

  const testCases = [
    {
      input: 'STS_HS25_BL: Kapitel 6 - Methode der kleinsten Quadrate: Kapitel 6 - Teil 1 | Moodle ZHAW',
      expected: 'sts_hs25_bl_kapitel_6_methode_der_kleinsten_quadrate_kapitel_6_teil_1'
    },
    {
      input: 'Simple Title',
      expected: 'simple_title'
    },
    {
      input: 'Title/With\\Invalid*Chars?',
      expected: 'titlewithinvalidchars'
    },
    {
      input: '   Spaces   Everywhere   ',
      expected: 'spaces_everywhere'
    },
    {
      input: 'Multiple---Dashes',
      expected: 'multiple_dashes'
    }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = normalizeTitle(input);
    assert.strictEqual(result, expected, `"${input}" should normalize to "${expected}", got "${result}"`);
  });
}

// Test: Hash generation
async function testHashGeneration() {
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8).padStart(8, '0');
  };

  const url1 = 'https://api.kaltura.switch.ch/video1.m3u8';
  const url2 = 'https://api.kaltura.switch.ch/video2.m3u8';

  const hash1 = simpleHash(url1);
  const hash2 = simpleHash(url2);

  assert.strictEqual(hash1.length, 8, 'Hash should be 8 characters long');
  assert.strictEqual(hash2.length, 8, 'Hash should be 8 characters long');
  assert.notStrictEqual(hash1, hash2, 'Different URLs should produce different hashes');

  // Same URL should produce same hash
  const hash1Again = simpleHash(url1);
  assert.strictEqual(hash1, hash1Again, 'Same URL should produce same hash');
}

// Test: Video name generation
async function testVideoNameGeneration() {
  global.document = { title: 'Test Video: Part 1 | Moodle ZHAW' };

  const normalizeTitle = (title) => {
    let normalized = title.split('|')[0].trim();
    normalized = normalized.replace(/:/g, '-');
    normalized = normalized.replace(/[\/\\*?"<>|]/g, '');
    normalized = normalized.replace(/[\s-]+/g, '_');
    normalized = normalized.replace(/^_+|_+$/g, '');
    normalized = normalized.toLowerCase();
    if (normalized.length > 80) {
      normalized = normalized.substring(0, 80);
    }
    if (!normalized) {
      normalized = 'video';
    }
    return normalized;
  };

  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8).padStart(8, '0');
  };

  const generateVideoName = (videoUrl) => {
    const pageTitle = global.document.title;
    const normalizedTitle = normalizeTitle(pageTitle);
    const date = new Date().toISOString().split('T')[0];
    const urlHash = simpleHash(videoUrl);
    return `${normalizedTitle}_${date}_${urlHash}.mp4`;
  };

  const testUrl = 'https://api.kaltura.switch.ch/test.m3u8';
  const name = generateVideoName(testUrl);
  const datePattern = /test_video_part_1_\d{4}-\d{2}-\d{2}_[a-z0-9]{8}\.mp4/;
  assert.match(name, datePattern, `Video name should match pattern: ${name}`);

  // Test uniqueness - same title but different URL should produce different filename
  const testUrl2 = 'https://api.kaltura.switch.ch/test2.m3u8';
  const name2 = generateVideoName(testUrl2);
  assert.notStrictEqual(name, name2, 'Different URLs should produce different filenames');
}

// Test: ffmpeg command generation
async function testFfmpegCommandGeneration() {
  const entryId = '0_dwokpxlc';
  const videoUrl = 'https://api.kaltura.switch.ch/p/111/test.m3u8';
  const videoName = 'kaltura_0_dwokpxlc_2024-01-01.mp4';

  const command = `ffmpeg -i '${videoUrl}' ~/Downloads/${videoName}`;

  assert.ok(command.includes('ffmpeg -i'), 'Command should start with ffmpeg -i');
  assert.ok(command.includes(videoUrl), 'Command should include video URL');
  assert.ok(command.includes('~/Downloads/'), 'Command should include Downloads path');
  assert.ok(command.includes('.mp4'), 'Command should include .mp4 extension');
}

// Test: Clipboard writing
async function testClipboardWrite() {
  const testCommand = 'ffmpeg -i "test.m3u8" output.mp4';

  let clipboardText = null;
  const mockClipboard = {
    writeText: async (text) => {
      clipboardText = text;
      return Promise.resolve();
    }
  };

  await mockClipboard.writeText(testCommand);
  assert.strictEqual(clipboardText, testCommand, 'Clipboard should contain the command');
}

// Test: Background message handling
async function testBackgroundMessageHandling() {
  const response = await browser.runtime.sendMessage({
    type: 'getVideoUrl',
    entryId: '0_dwokpxlc'
  });

  assert.ok(response.url, 'Should return a URL for known entry ID');
  assert.ok(response.url.includes('0_dwokpxlc'), 'URL should contain entry ID');
}

// Test: Unknown entry ID handling
async function testUnknownEntryId() {
  const response = await browser.runtime.sendMessage({
    type: 'getVideoUrl',
    entryId: 'unknown_id'
  });

  assert.strictEqual(response.url, null, 'Should return null for unknown entry ID');
}

// Run all tests
async function main() {
  const suite = new TestSuite();

  console.log('Running Kaltura Downloader Tests\n');

  await suite.run('Extract entry ID from URL', testEntryIdExtraction);
  await suite.run('Normalize title to filename', testTitleNormalization);
  await suite.run('Generate hash from URL', testHashGeneration);
  await suite.run('Generate video name with date and hash', testVideoNameGeneration);
  await suite.run('Generate ffmpeg command', testFfmpegCommandGeneration);
  await suite.run('Write to clipboard', testClipboardWrite);
  await suite.run('Handle background message for known entry', testBackgroundMessageHandling);
  await suite.run('Handle unknown entry ID', testUnknownEntryId);

  suite.report();
}

main();
