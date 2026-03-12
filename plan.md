# Audio Reverse PWA - Implementation Plan

## Overview
A Progressive Web App that records audio from microphone and plays it back in reverse, with additional playback controls.

## Architecture

### File Structure
```
/
├── index.html          # Main HTML file
├── style.css           # Styles with dark theme
├── app.js              # Main application logic
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker for offline support
└️ icons/                # App icons (optional, can use emoji)
```

### Core Features

#### 1. Recording (Red Button)
- **Icon**: 🔴 / ⏹️
- **States**: "Start Recording" / "Stop Recording"
- Uses `MediaRecorder` API for recording
- Stores audio in memory as `Blob`

#### 2. Normal Playback (Green Button)
- **Icon**: ▶️ / ⏹️
- **States**: "Play Normal" / "Stop Playing"
- Uses `AudioContext` for playback

#### 3. Reverse Playback (Blue Button)
- **Icon**: ◀️ / ⏹️
- **States**: "Play Reverse" / "Stop Playing"
- Reverses audio buffer before playback

#### 4. Menu (Fullscreen Overlay)
- **Icon**: ☰
- **Options**:
  - 🔁 Loop toggle
  - ⚡ Playback speed (0.5x, 1x, 2x)
  - 🎵 Pitch shift (semitones)

### Technical Implementation

#### Audio Processing Flow
```
Recording:
Mic → MediaRecorder → Blob → ArrayBuffer → AudioBuffer

Playback:
AudioBuffer → AudioContext → Destination (speakers)

Reverse:
AudioBuffer → Reverse samples → AudioBuffer → Playback
```

#### AudioBuffer Reversal Algorithm
```javascript
// For each channel in the buffer
const reverseBuffer = (buffer) => {
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    data.reverse();
  }
  return buffer;
};
```

#### Pitch Shifting
Using `PlaybackRateControl` with `detune` property:
- `detune` in cents (100 cents = 1 semitone)
- Positive = higher pitch, Negative = lower pitch

### UI/UX Design

#### Dark Theme Colors
- Background: `#121212`
- Surface: `#1e1e1e`
- Text: `#ffffff`
- Red: `#ff4444`
- Green: `#44ff44`
- Blue: `#4444ff`
- Accent: `#bb86fc`

#### Native App Feel
- `overscroll-behavior: none` - prevent scroll bounce
- `user-select: none` - prevent text selection
- `-webkit-touch-callout: none` - prevent iOS callout
- `-webkit-user-drag: none` - prevent drag
- `touch-action: manipulation` - optimize for touch

#### Responsive Layout
- Flexbox centered layout
- Large touch targets (min 80px)
- Viewport meta tag for mobile
- Safe area insets for notched devices

### PWA Requirements

#### Manifest
- `name`: "Audio Reverse"
- `short_name`: "Reverse"
- `display`: "standalone"
- `theme_color`: "#121212"
- `background_color`: "#121212"
- Icons (can use generated or emoji-based)

#### Service Worker
- Cache all assets on install
- Serve from cache on fetch
- Enable offline functionality

### Browser APIs Used
- `MediaRecorder` - Recording audio
- `AudioContext` - Audio processing and playback
- `navigator.mediaDevices.getUserMedia` - Microphone access
- Service Worker API - Offline support
- Web App Manifest - Installability

### Mobile Considerations
- Request microphone permission on user gesture
- Handle audio context suspension on mobile
- Optimize for touch interactions
- Prevent zoom on double-tap
- Handle orientation changes

### Error Handling
- Microphone permission denied
- Audio context not supported
- Recording errors
- Playback errors

## Implementation Order
1. Create HTML structure with semantic elements
2. Add CSS with dark theme and native app styles
3. Implement recording functionality
4. Implement normal playback
5. Implement reverse playback
6. Add menu with options
7. Create manifest.json
8. Create service worker
9. Test on mobile and desktop
10. Polish UI/UX
