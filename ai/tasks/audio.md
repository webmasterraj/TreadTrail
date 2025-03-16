# Audio Cues Feature Implementation

## Overview

The TreadTrail app includes an audio cues feature that provides users with vocal guidance during workouts. This document outlines the implementation details, challenges, and next steps.

## Implementation Details

### 1. Audio Files Structure

- **Countdown Sound**: A standard 3-second beep countdown (`countdown.mp3`)
- **Segment-specific Voiceovers**: Audio files following the naming pattern `workout-{workoutId}-segment-{segmentIndex}.mp3`
- **Storage Location**: Files stored in:
  - Source code: `/src/assets/audio/`
  - Runtime: `FileSystem.documentDirectory + 'audio/'`

### 2. Data Structure

The `WorkoutSegment` interface in `/src/types/index.ts` has been extended to include audio metadata:

```typescript
export interface WorkoutSegment {
  // ... existing fields
  audio?: {
    file: string;     // Path to the audio file
    duration: number; // Duration of the voiceover audio in seconds
  };
}
```

### 3. Audio Sequence Timing

The app plays two sequential audio files before segment changes:

1. **Segment-specific voiceover**: Announces the next segment's details
2. **Countdown beep**: Plays a standard countdown that ends exactly when the segment changes

The timing sequence ensures the audio ends precisely at segment transition:

```typescript
// Example timing calculation
const voiceoverDuration = nextSegment.audio.duration; // From metadata
const countdownDuration = 3; // Fixed 3-second countdown
const pauseDuration = 1; // Pause between voiceover and countdown
const totalDuration = voiceoverDuration + pauseDuration + countdownDuration;

// Start playing when there are exactly totalDuration seconds left
if (timeUntilNextSegment <= totalDuration && 
    timeUntilNextSegment > totalDuration - 1) {
  // Play audio sequence...
}
```

### 4. Static Mapping for Audio Files

Audio files are managed using a static mapping approach:

1. **Static Registry**: All audio files are registered in a mapping object
2. **Lookup by Filename**: Audio files are looked up by filename at runtime
3. **Error Handling**: Gracefully handle missing audio files

This approach balances:
- Reliability (avoids URI protocol issues)
- Simplicity (straightforward implementation)
- Error tolerance (continues if audio files are missing)

## Challenges and Solutions

### 1. React Native Asset Bundling Limitations

**Problem**: React Native requires static paths for asset requires and has limitations with URL protocol handling.

**Solution**: We implemented a static mapping approach:
1. Create a mapping object that associates filenames with their require statements
2. Use this mapping to look up audio files at runtime by their filenames
3. This provides a level of indirection that allows segments to reference audio by filename
4. Future versions could extend this with more dynamic approaches

### 2. Audio Playback Timing

**Problem**: Ensuring countdown ends exactly at segment transition.

**Solution**: Precise timing calculations based on audio durations and careful scheduling.

### 3. Missing Audio Files

**Problem**: Some segments might not have corresponding audio files.

**Solution**: Implemented error handling to gracefully fallback when files are missing.

## Audio Generation

A script (`/scripts/generate_workout_audio.ts`) generates audio files using ElevenLabs API:

```bash
# Generate audio for all segments in all workouts
npm run generate-audio -- --key=YOUR_API_KEY --voice=alloy

# Generate audio for specific workout
npm run generate-audio -- --key=YOUR_API_KEY --workout=1

# Remove generated audio files
npm run generate-audio -- --remove
```

## Next Steps

1. **User Preferences**: Integrate audio toggle in Settings screen
2. **Complete Audio Library**: Generate audio files for all workout segments
3. **Performance Optimization**: Test audio loading and playback on different devices
4. **Error Handling Improvements**: Add better fallbacks for missing audio files
5. **Dynamic Asset Discovery**: Create a system to discover and copy new audio files at runtime
6. **API Integration**: Add functionality to download new audio files from a server
7. **Build-time Asset Management**: Consider creating a build script that generates a manifest of all available audio files

### Extending the Audio System

To add new audio files to the system for v1:

1. **Add to App Bundle**: Place new audio files in `src/assets/audio/`
2. **Update Static Mapping**: Add the new file to the `audioFiles` mapping in `WorkoutInProgressScreen.tsx`
3. **Reference by Name**: Files can be referenced using their filename in the `WorkoutSegment.audio.file` property

For future versions, consider:
1. **Directory-based approach**: Copy files to document directory for dynamic loading
2. **Remote file loading**: Load audio files from a server
3. **Auto-generated mapping**: Generate the audio mapping at build time

## Reference Implementation

Key files:
- `/src/hooks/useWorkoutAudio.ts`: Custom hook for audio playback
- `/src/screens/WorkoutInProgressScreen.tsx`: Hook integration with workout UI
- `/src/types/index.ts`: Audio metadata interface
- `/src/constants/workoutData.ts`: Segment audio data
- `/scripts/generate_workout_audio.ts`: Audio generation script