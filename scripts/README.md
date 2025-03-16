# TreadTrail Scripts

This directory contains utility scripts for the TreadTrail application.

## Audio Generation Script

The `generate_workout_audio.ts` script generates audio cues for workout segments using the ElevenLabs API.

### Prerequisites

- Node.js and npm installed
- TypeScript and ts-node installed (`npm install -g typescript ts-node`)
- Required npm packages installed:
  - commander
  - axios
  - @types/node

### Installation

All dependencies can be installed by running:

```bash
npm install --save-dev commander axios typescript ts-node @types/node
```

### Usage

```bash
npx ts-node scripts/generate_workout_audio.ts [options]
```

#### Options

- `--api-key <key>`: ElevenLabs API key (default: included in script)
- `--voice <id>`: ElevenLabs voice ID (default: "tnSpp4vdxKPjI9w0GnoV" - Hope voice)
- `--limit <n>`: Limit the number of files to generate
- `--remove`: Remove audio files instead of generating them
- `--segment <id>`: Specific segment to remove (e.g., "workout-1-segment-2")

### Examples

Generate all missing audio files:
```bash
npx ts-node scripts/generate_workout_audio.ts
```

Generate only 2 audio files (for testing):
```bash
npx ts-node scripts/generate_workout_audio.ts --limit 2
```

Remove all generated audio files:
```bash
npx ts-node scripts/generate_workout_audio.ts --remove
```

Remove a specific audio file:
```bash
npx ts-node scripts/generate_workout_audio.ts --remove --segment workout-1-segment-0
```

### Security Note

For production use, it's recommended to use environment variables for the API key instead of hardcoding it in the script.

### Generated Audio Files

The script generates the following types of audio files:

1. **Segment Audio**: Audio cues for each workout segment (e.g., "Sprint pace for 30 seconds at 2 percent incline. In 5 4 3 2 1!")
2. **Transition Audio**: Audio cues for transitions between different pace types (e.g., "Changing from Recovery to Base pace...")
3. **Next Segment Audio**: Audio cues announcing the next segment (e.g., "Next up: Sprint pace for 30 seconds. Get ready!")

All audio files are stored in the `src/assets/audio` directory.
