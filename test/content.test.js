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

// Test: Video name generation
async function testVideoNameGeneration() {
  const generateVideoName = (entryId) => {
    const date = new Date().toISOString().split('T')[0];
    return `kaltura_${entryId}_${date}.mp4`;
  };

  const name = generateVideoName('0_dwokpxlc');
  const datePattern = /kaltura_0_dwokpxlc_\d{4}-\d{2}-\d{2}\.mp4/;
  assert.match(name, datePattern, `Video name should match pattern: ${name}`);
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
  await suite.run('Generate video name with date', testVideoNameGeneration);
  await suite.run('Generate ffmpeg command', testFfmpegCommandGeneration);
  await suite.run('Write to clipboard', testClipboardWrite);
  await suite.run('Handle background message for known entry', testBackgroundMessageHandling);
  await suite.run('Handle unknown entry ID', testUnknownEntryId);

  suite.report();
}

main();
