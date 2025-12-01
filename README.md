# Moodle Kaltura Video Downloader

A Firefox extension that makes it easy to download Kaltura videos from Moodle. With one click, copy an ffmpeg command to download any video.

<img width="1410" height="930" alt="CleanShot 2025-12-01 at 12 34 38@2x" src="https://github.com/user-attachments/assets/1808e556-061a-47e7-a871-8ec3de455efa" />

## Features

- Automatically detects Kaltura videos on Moodle pages
- Adds a clean copy button overlay on each video
- Copies ffmpeg download command to clipboard
- Captures video URLs from network requests
- Simple, unobtrusive design with clear visual feedback

## Installation

### Option 1: Load Temporary Extension (for testing)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the extension directory and select `manifest.json`
5. The extension is now loaded and will work until Firefox is restarted

### Option 2: Install Permanently (requires signing)

For permanent installation, the extension needs to be signed by Mozilla:

1. Create a free account at [addons.mozilla.org](https://addons.mozilla.org)
2. Go to Developer Hub and submit the extension
3. Once approved, install from the addon store

## Usage

1. Navigate to a Moodle page with Kaltura videos (e.g., `moodle.zhaw.ch`)
2. **Important:** Click play on each video and let it load for a few seconds
3. Look for the "⎘ Copy" button on the top-right of the video player
4. Click the button to copy the ffmpeg command to your clipboard
5. Open a terminal and paste the command
6. The video will download to `~/Downloads/`

### Example

When you click the download button, the filename will be based on the page title. For example, if the page title is:
```
STS_HS25_BL: Kapitel 6 - Methode der kleinsten Quadrate: Kapitel 6 - Teil 1 | Moodle ZHAW
```

You'll get a command like:
```bash
ffmpeg -i 'https://api.kaltura.switch.ch/p/111/sp/11100/playManifest/entryId/0_dwokpxlc/.../a.m3u8' -c copy ~/Downloads/sts_hs25_bl_kapitel_6_methode_der_kleinsten_quadrate_kapitel_6_teil_1_2024-12-01_a3f8c29d.mp4
```

The filename is automatically normalized and unique:
- Removes " | Moodle ZHAW" suffix
- Converts colons to underscores
- Removes invalid filename characters
- Converts spaces to underscores
- Converts to lowercase
- Adds current date
- **Adds unique 8-character hash of video URL (prevents overwriting files with same title)**

## Requirements

- Firefox browser
- ffmpeg installed on your system (for downloading videos)
  - macOS: `brew install ffmpeg`
  - Linux: `apt install ffmpeg` or `yum install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org)

## Permissions

The extension requires these permissions:

- `clipboardWrite`: To copy ffmpeg commands to clipboard
- `webRequest`: To capture video URLs from network traffic
- `<all_urls>`: To intercept Kaltura API requests across different domains

## Development

### Running Tests

```bash
npm test
```

All tests should pass before making changes.

### Project Structure

```
.
├── manifest.json       # Extension configuration
├── background.js       # Captures video URLs from network
├── content.js          # Detects videos and adds buttons
├── content.css         # Styles for download button
├── test/
│   └── content.test.js # Test suite
├── icons/              # Extension icons (add your own)
└── README.md           # This file
```

## Troubleshooting

**Button shows "Play video first"**
- The video URL is captured when the video starts playing
- Click play on the video and wait 3-5 seconds for it to load
- Open the browser console (F12) and check for "[Kaltura Downloader] Captured video URL" messages
- If you don't see capture messages, reload the extension in `about:debugging`
- Try pausing and playing the video again

**ffmpeg command fails**
- Make sure ffmpeg is installed: `ffmpeg -version`
- Check that you have write permissions to `~/Downloads/`
- The video URL might have expired (try playing the video again)
- Some videos may be DRM-protected and cannot be downloaded

**Button doesn't appear**
- Refresh the Moodle page
- Check that the extension is enabled in `about:addons`
- Open browser console (F12) and look for any errors
- Make sure you're on a Moodle page with Kaltura videos

**Debug mode**
- Open browser console (F12)
- You should see "[Kaltura Downloader]" log messages
- Check if requests are being intercepted
- Check if entry IDs are being extracted correctly

## Notes

- Filenames are guaranteed unique (using URL hash) - no accidental overwrites
- Video URLs may expire after some time
- Some videos might be DRM-protected and won't download
- Large videos may take a while to download
- The extension works on all Moodle domains

## License

MIT
