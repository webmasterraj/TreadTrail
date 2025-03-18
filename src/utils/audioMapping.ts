import { Audio } from 'expo-av';

/**
 * Loads a segment audio file based on the filename
 * @param filename The audio file name to load
 * @returns A Promise that resolves to an Audio.Sound object or null if the file is not found
 */
export const loadSegmentAudio = async (filename: string): Promise<Audio.Sound | null> => {
  let segmentSound = new Audio.Sound();
  
  try {
    switch (filename) {
      // Baby Steps
      case 'baby-steps-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-0.aac'));
        break;
      case 'baby-steps-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-1.aac'));
        break;
      case 'baby-steps-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-2.aac'));
        break;
      case 'baby-steps-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-3.aac'));
        break;
      case 'baby-steps-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-4.aac'));
        break;
      case 'baby-steps-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-5.aac'));
        break;
      case 'baby-steps-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-6.aac'));
        break;
      case 'baby-steps-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-7.aac'));
        break;
      case 'baby-steps-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-8.aac'));
        break;
      case 'baby-steps-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-9.aac'));
        break;
      case 'baby-steps-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/baby-steps-segment-10.aac'));
        break;
      case 'starter-pack-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-0.aac'));
        break;
      case 'starter-pack-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-1.aac'));
        break;
      case 'starter-pack-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-2.aac'));
        break;
      case 'starter-pack-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-3.aac'));
        break;
      case 'starter-pack-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-4.aac'));
        break;
      case 'starter-pack-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-5.aac'));
        break;
      case 'starter-pack-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-6.aac'));
        break;
      case 'starter-pack-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-7.aac'));
        break;
      case 'starter-pack-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-8.aac'));
        break;
      case 'starter-pack-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-9.aac'));
        break;
      case 'starter-pack-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-10.aac'));
        break;
      case 'starter-pack-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-11.aac'));
        break;
      case 'starter-pack-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-12.aac'));
        break;
      case 'starter-pack-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-13.aac'));
        break;
      case 'starter-pack-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-14.aac'));
        break;
      case 'starter-pack-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/starter-pack-segment-15.aac'));
        break;
      case 'cardio-crescendo-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-0.aac'));
        break;
      case 'cardio-crescendo-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-1.aac'));
        break;
      case 'cardio-crescendo-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-2.aac'));
        break;
      case 'cardio-crescendo-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-3.aac'));
        break;
      case 'cardio-crescendo-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-4.aac'));
        break;
      case 'cardio-crescendo-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-5.aac'));
        break;
      case 'cardio-crescendo-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-6.aac'));
        break;
      case 'cardio-crescendo-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-7.aac'));
        break;
      case 'cardio-crescendo-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-8.aac'));
        break;
      case 'cardio-crescendo-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-9.aac'));
        break;
      case 'cardio-crescendo-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-10.aac'));
        break;
      case 'cardio-crescendo-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-11.aac'));
        break;
      case 'cardio-crescendo-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-12.aac'));
        break;
      case 'cardio-crescendo-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-13.aac'));
        break;
      case 'cardio-crescendo-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cardio-crescendo-segment-14.aac'));
        break;
      case 'sprint-tsunami-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-0.aac'));
        break;
      case 'sprint-tsunami-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-1.aac'));
        break;
      case 'sprint-tsunami-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-2.aac'));
        break;
      case 'sprint-tsunami-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-3.aac'));
        break;
      case 'sprint-tsunami-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-4.aac'));
        break;
      case 'sprint-tsunami-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-5.aac'));
        break;
      case 'sprint-tsunami-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-6.aac'));
        break;
      case 'sprint-tsunami-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-7.aac'));
        break;
      case 'sprint-tsunami-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-8.aac'));
        break;
      case 'sprint-tsunami-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-9.aac'));
        break;
      case 'sprint-tsunami-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-10.aac'));
        break;
      case 'sprint-tsunami-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-11.aac'));
        break;
      case 'sprint-tsunami-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-12.aac'));
        break;
      case 'sprint-tsunami-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-13.aac'));
        break;
      case 'sprint-tsunami-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/sprint-tsunami-segment-14.aac'));
        break;
      case 'perfectly-balanced-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-0.aac'));
        break;
      case 'perfectly-balanced-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-1.aac'));
        break;
      case 'perfectly-balanced-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-2.aac'));
        break;
      case 'perfectly-balanced-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-3.aac'));
        break;
      case 'perfectly-balanced-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-4.aac'));
        break;
      case 'perfectly-balanced-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-5.aac'));
        break;
      case 'perfectly-balanced-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-6.aac'));
        break;
      case 'perfectly-balanced-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-7.aac'));
        break;
      case 'perfectly-balanced-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-8.aac'));
        break;
      case 'perfectly-balanced-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-9.aac'));
        break;
      case 'perfectly-balanced-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-10.aac'));
        break;
      case 'perfectly-balanced-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-11.aac'));
        break;
      case 'perfectly-balanced-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-12.aac'));
        break;
      case 'perfectly-balanced-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-13.aac'));
        break;
      case 'perfectly-balanced-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-14.aac'));
        break;
      case 'perfectly-balanced-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/perfectly-balanced-segment-15.aac'));
        break;
      case 'the-flash-dash-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-0.aac'));
        break;
      case 'the-flash-dash-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-1.aac'));
        break;
      case 'the-flash-dash-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-2.aac'));
        break;
      case 'the-flash-dash-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-3.aac'));
        break;
      case 'the-flash-dash-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-4.aac'));
        break;
      case 'the-flash-dash-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-5.aac'));
        break;
      case 'the-flash-dash-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-6.aac'));
        break;
      case 'the-flash-dash-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-7.aac'));
        break;
      case 'the-flash-dash-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-8.aac'));
        break;
      case 'the-flash-dash-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-9.aac'));
        break;
      case 'the-flash-dash-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-10.aac'));
        break;
      case 'the-flash-dash-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-11.aac'));
        break;
      case 'the-flash-dash-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-12.aac'));
        break;
      case 'the-flash-dash-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-13.aac'));
        break;
      case 'the-flash-dash-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-14.aac'));
        break;
      case 'the-flash-dash-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-15.aac'));
        break;
      case 'the-flash-dash-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-flash-dash-segment-16.aac'));
        break;
      case 'the-speed-shuffle-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-0.aac'));
        break;
      case 'the-speed-shuffle-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-1.aac'));
        break;
      case 'the-speed-shuffle-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-2.aac'));
        break;
      case 'the-speed-shuffle-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-3.aac'));
        break;
      case 'the-speed-shuffle-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-4.aac'));
        break;
      case 'the-speed-shuffle-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-5.aac'));
        break;
      case 'the-speed-shuffle-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-6.aac'));
        break;
      case 'the-speed-shuffle-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-7.aac'));
        break;
      case 'the-speed-shuffle-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-8.aac'));
        break;
      case 'the-speed-shuffle-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-9.aac'));
        break;
      case 'the-speed-shuffle-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-10.aac'));
        break;
      case 'the-speed-shuffle-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-11.aac'));
        break;
      case 'the-speed-shuffle-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-segment-12.aac'));
        break
                      case 'chaos-run-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-0.aac'));
        break;
      case 'chaos-run-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-1.aac'));
        break;
      case 'chaos-run-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-10.aac'));
        break;
      case 'chaos-run-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-11.aac'));
        break;
      case 'chaos-run-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-12.aac'));
        break;
      case 'chaos-run-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-13.aac'));
        break;
      case 'chaos-run-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-14.aac'));
        break;
      case 'chaos-run-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-15.aac'));
        break;
      case 'chaos-run-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-2.aac'));
        break;
      case 'chaos-run-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-3.aac'));
        break;
      case 'chaos-run-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-4.aac'));
        break;
      case 'chaos-run-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-5.aac'));
        break;
      case 'chaos-run-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-6.aac'));
        break;
      case 'chaos-run-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-7.aac'));
        break;
      case 'chaos-run-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-8.aac'));
        break;
      case 'chaos-run-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/chaos-run-segment-9.aac'));
        break;
      case 'cruise-control-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cruise-control-segment-0.aac'));
        break;
      case 'cruise-control-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cruise-control-segment-1.aac'));
        break;
      case 'cruise-control-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cruise-control-segment-2.aac'));
        break;
      case 'cruise-control-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cruise-control-segment-3.aac'));
        break;
      case 'cruise-control-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/cruise-control-segment-4.aac'));
        break;
      case 'danger-zone-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-0.aac'));
        break;
      case 'danger-zone-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-1.aac'));
        break;
      case 'danger-zone-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-10.aac'));
        break;
      case 'danger-zone-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-11.aac'));
        break;
      case 'danger-zone-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-12.aac'));
        break;
      case 'danger-zone-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-13.aac'));
        break;
      case 'danger-zone-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-14.aac'));
        break;
      case 'danger-zone-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-15.aac'));
        break;
      case 'danger-zone-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-16.aac'));
        break;
      case 'danger-zone-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-17.aac'));
        break;
      case 'danger-zone-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-18.aac'));
        break;
      case 'danger-zone-segment-19.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-19.aac'));
        break;
      case 'danger-zone-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-2.aac'));
        break;
      case 'danger-zone-segment-20.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-20.aac'));
        break;
      case 'danger-zone-segment-21.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-21.aac'));
        break;
      case 'danger-zone-segment-22.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-22.aac'));
        break;
      case 'danger-zone-segment-23.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-23.aac'));
        break;
      case 'danger-zone-segment-24.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-24.aac'));
        break;
      case 'danger-zone-segment-25.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-25.aac'));
        break;
      case 'danger-zone-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-3.aac'));
        break;
      case 'danger-zone-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-4.aac'));
        break;
      case 'danger-zone-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-5.aac'));
        break;
      case 'danger-zone-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-6.aac'));
        break;
      case 'danger-zone-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-7.aac'));
        break;
      case 'danger-zone-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-8.aac'));
        break;
      case 'danger-zone-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/danger-zone-segment-9.aac'));
        break;
      case 'death-sentence-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-0.aac'));
        break;
      case 'death-sentence-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-1.aac'));
        break;
      case 'death-sentence-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-10.aac'));
        break;
      case 'death-sentence-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-11.aac'));
        break;
      case 'death-sentence-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-12.aac'));
        break;
      case 'death-sentence-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-13.aac'));
        break;
      case 'death-sentence-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-14.aac'));
        break;
      case 'death-sentence-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-15.aac'));
        break;
      case 'death-sentence-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-16.aac'));
        break;
      case 'death-sentence-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-17.aac'));
        break;
      case 'death-sentence-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-18.aac'));
        break;
      case 'death-sentence-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-2.aac'));
        break;
      case 'death-sentence-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-3.aac'));
        break;
      case 'death-sentence-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-4.aac'));
        break;
      case 'death-sentence-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-5.aac'));
        break;
      case 'death-sentence-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-6.aac'));
        break;
      case 'death-sentence-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-7.aac'));
        break;
      case 'death-sentence-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-8.aac'));
        break;
      case 'death-sentence-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/death-sentence-segment-9.aac'));
        break;
      case 'easy-breezy-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-0.aac'));
        break;
      case 'easy-breezy-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-1.aac'));
        break;
      case 'easy-breezy-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-2.aac'));
        break;
      case 'easy-breezy-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-3.aac'));
        break;
      case 'easy-breezy-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-4.aac'));
        break;
      case 'easy-breezy-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-5.aac'));
        break;
      case 'easy-breezy-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-6.aac'));
        break;
      case 'easy-breezy-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-breezy-segment-7.aac'));
        break;
      case 'easy-elevation-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-0.aac'));
        break;
      case 'easy-elevation-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-1.aac'));
        break;
      case 'easy-elevation-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-10.aac'));
        break;
      case 'easy-elevation-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-11.aac'));
        break;
      case 'easy-elevation-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-12.aac'));
        break;
      case 'easy-elevation-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-13.aac'));
        break;
      case 'easy-elevation-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-14.aac'));
        break;
      case 'easy-elevation-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-15.aac'));
        break;
      case 'easy-elevation-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-16.aac'));
        break;
      case 'easy-elevation-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-17.aac'));
        break;
      case 'easy-elevation-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-18.aac'));
        break;
      case 'easy-elevation-segment-19.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-19.aac'));
        break;
      case 'easy-elevation-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-2.aac'));
        break;
      case 'easy-elevation-segment-20.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-20.aac'));
        break;
      case 'easy-elevation-segment-21.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-21.aac'));
        break;
      case 'easy-elevation-segment-22.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-22.aac'));
        break;
      case 'easy-elevation-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-3.aac'));
        break;
      case 'easy-elevation-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-4.aac'));
        break;
      case 'easy-elevation-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-5.aac'));
        break;
      case 'easy-elevation-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-6.aac'));
        break;
      case 'easy-elevation-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-7.aac'));
        break;
      case 'easy-elevation-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-8.aac'));
        break;
      case 'easy-elevation-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/easy-elevation-segment-9.aac'));
        break;
      case 'fury-road-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-0.aac'));
        break;
      case 'fury-road-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-1.aac'));
        break;
      case 'fury-road-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-10.aac'));
        break;
      case 'fury-road-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-11.aac'));
        break;
      case 'fury-road-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-12.aac'));
        break;
      case 'fury-road-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-13.aac'));
        break;
      case 'fury-road-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-14.aac'));
        break;
      case 'fury-road-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-15.aac'));
        break;
      case 'fury-road-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-16.aac'));
        break;
      case 'fury-road-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-17.aac'));
        break;
      case 'fury-road-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-18.aac'));
        break;
      case 'fury-road-segment-19.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-19.aac'));
        break;
      case 'fury-road-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-2.aac'));
        break;
      case 'fury-road-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-3.aac'));
        break;
      case 'fury-road-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-4.aac'));
        break;
      case 'fury-road-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-5.aac'));
        break;
      case 'fury-road-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-6.aac'));
        break;
      case 'fury-road-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-7.aac'));
        break;
      case 'fury-road-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-8.aac'));
        break;
      case 'fury-road-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/fury-road-segment-9.aac'));
        break;
      case 'hill-thrills-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-0.aac'));
        break;
      case 'hill-thrills-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-1.aac'));
        break;
      case 'hill-thrills-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-10.aac'));
        break;
      case 'hill-thrills-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-11.aac'));
        break;
      case 'hill-thrills-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-12.aac'));
        break;
      case 'hill-thrills-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-13.aac'));
        break;
      case 'hill-thrills-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-14.aac'));
        break;
      case 'hill-thrills-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-15.aac'));
        break;
      case 'hill-thrills-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-16.aac'));
        break;
      case 'hill-thrills-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-17.aac'));
        break;
      case 'hill-thrills-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-18.aac'));
        break;
      case 'hill-thrills-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-2.aac'));
        break;
      case 'hill-thrills-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-3.aac'));
        break;
      case 'hill-thrills-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-4.aac'));
        break;
      case 'hill-thrills-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-5.aac'));
        break;
      case 'hill-thrills-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-6.aac'));
        break;
      case 'hill-thrills-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-7.aac'));
        break;
      case 'hill-thrills-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-8.aac'));
        break;
      case 'hill-thrills-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/hill-thrills-segment-9.aac'));
        break;
      case 'killing-me-softly-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-0.aac'));
        break;
      case 'killing-me-softly-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-1.aac'));
        break;
      case 'killing-me-softly-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-2.aac'));
        break;
      case 'killing-me-softly-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-3.aac'));
        break;
      case 'killing-me-softly-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-4.aac'));
        break;
      case 'killing-me-softly-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-5.aac'));
        break;
      case 'killing-me-softly-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-6.aac'));
        break;
      case 'killing-me-softly-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/killing-me-softly-segment-7.aac'));
        break;
      case 'long-way-home-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-0.aac'));
        break;
      case 'long-way-home-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-1.aac'));
        break;
      case 'long-way-home-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-2.aac'));
        break;
      case 'long-way-home-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-3.aac'));
        break;
      case 'long-way-home-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-4.aac'));
        break;
      case 'long-way-home-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-5.aac'));
        break;
      case 'long-way-home-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/long-way-home-segment-6.aac'));
        break;
      case 'mount-shasta-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-0.aac'));
        break;
      case 'mount-shasta-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-1.aac'));
        break;
      case 'mount-shasta-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-10.aac'));
        break;
      case 'mount-shasta-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-11.aac'));
        break;
      case 'mount-shasta-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-12.aac'));
        break;
      case 'mount-shasta-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-13.aac'));
        break;
      case 'mount-shasta-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-14.aac'));
        break;
      case 'mount-shasta-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-15.aac'));
        break;
      case 'mount-shasta-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-16.aac'));
        break;
      case 'mount-shasta-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-17.aac'));
        break;
      case 'mount-shasta-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-2.aac'));
        break;
      case 'mount-shasta-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-3.aac'));
        break;
      case 'mount-shasta-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-4.aac'));
        break;
      case 'mount-shasta-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-5.aac'));
        break;
      case 'mount-shasta-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-6.aac'));
        break;
      case 'mount-shasta-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-7.aac'));
        break;
      case 'mount-shasta-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-8.aac'));
        break;
      case 'mount-shasta-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/mount-shasta-segment-9.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-0.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-1.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-10.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-11.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-2.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-3.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-4.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-5.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-6.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-7.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-8.aac'));
        break;
      case 'pharaoh\'s-challenge-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pharaoh\'s-challenge-segment-9.aac'));
        break;
      case 'pulse-pounder-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-0.aac'));
        break;
      case 'pulse-pounder-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-1.aac'));
        break;
      case 'pulse-pounder-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-10.aac'));
        break;
      case 'pulse-pounder-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-11.aac'));
        break;
      case 'pulse-pounder-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-12.aac'));
        break;
      case 'pulse-pounder-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-13.aac'));
        break;
      case 'pulse-pounder-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-14.aac'));
        break;
      case 'pulse-pounder-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-15.aac'));
        break;
      case 'pulse-pounder-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-16.aac'));
        break;
      case 'pulse-pounder-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-17.aac'));
        break;
      case 'pulse-pounder-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-18.aac'));
        break;
      case 'pulse-pounder-segment-19.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-19.aac'));
        break;
      case 'pulse-pounder-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-2.aac'));
        break;
      case 'pulse-pounder-segment-20.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-20.aac'));
        break;
      case 'pulse-pounder-segment-21.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-21.aac'));
        break;
      case 'pulse-pounder-segment-22.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-22.aac'));
        break;
      case 'pulse-pounder-segment-23.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-23.aac'));
        break;
      case 'pulse-pounder-segment-24.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-24.aac'));
        break;
      case 'pulse-pounder-segment-25.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-25.aac'));
        break;
      case 'pulse-pounder-segment-26.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-26.aac'));
        break;
      case 'pulse-pounder-segment-27.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-27.aac'));
        break;
      case 'pulse-pounder-segment-28.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-28.aac'));
        break;
      case 'pulse-pounder-segment-29.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-29.aac'));
        break;
      case 'pulse-pounder-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-3.aac'));
        break;
      case 'pulse-pounder-segment-30.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-30.aac'));
        break;
      case 'pulse-pounder-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-4.aac'));
        break;
      case 'pulse-pounder-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-5.aac'));
        break;
      case 'pulse-pounder-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-6.aac'));
        break;
      case 'pulse-pounder-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-7.aac'));
        break;
      case 'pulse-pounder-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-8.aac'));
        break;
      case 'pulse-pounder-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pulse-pounder-segment-9.aac'));
        break;
      case 'pyramid-power-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-0.aac'));
        break;
      case 'pyramid-power-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-1.aac'));
        break;
      case 'pyramid-power-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-10.aac'));
        break;
      case 'pyramid-power-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-11.aac'));
        break;
      case 'pyramid-power-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-12.aac'));
        break;
      case 'pyramid-power-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-13.aac'));
        break;
      case 'pyramid-power-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-2.aac'));
        break;
      case 'pyramid-power-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-3.aac'));
        break;
      case 'pyramid-power-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-4.aac'));
        break;
      case 'pyramid-power-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-5.aac'));
        break;
      case 'pyramid-power-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-6.aac'));
        break;
      case 'pyramid-power-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-7.aac'));
        break;
      case 'pyramid-power-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-8.aac'));
        break;
      case 'pyramid-power-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/pyramid-power-segment-9.aac'));
        break;
      case 'rainier-roller-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-0.aac'));
        break;
      case 'rainier-roller-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-1.aac'));
        break;
      case 'rainier-roller-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-10.aac'));
        break;
      case 'rainier-roller-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-11.aac'));
        break;
      case 'rainier-roller-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-2.aac'));
        break;
      case 'rainier-roller-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-3.aac'));
        break;
      case 'rainier-roller-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-4.aac'));
        break;
      case 'rainier-roller-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-5.aac'));
        break;
      case 'rainier-roller-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-6.aac'));
        break;
      case 'rainier-roller-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-7.aac'));
        break;
      case 'rainier-roller-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-8.aac'));
        break;
      case 'rainier-roller-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/rainier-roller-segment-9.aac'));
        break;
      case 'the-gentle-push-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-0.aac'));
        break;
      case 'the-gentle-push-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-1.aac'));
        break;
      case 'the-gentle-push-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-2.aac'));
        break;
      case 'the-gentle-push-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-3.aac'));
        break;
      case 'the-gentle-push-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-4.aac'));
        break;
      case 'the-gentle-push-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-5.aac'));
        break;
      case 'the-gentle-push-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-6.aac'));
        break;
      case 'the-gentle-push-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-7.aac'));
        break;
      case 'the-gentle-push-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-gentle-push-segment-8.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-0.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-1.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-10.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-10.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-11.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-11.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-12.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-12.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-13.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-13.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-14.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-14.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-15.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-15.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-16.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-16.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-17.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-17.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-18.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-18.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-2.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-3.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-4.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-5.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-5.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-6.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-6.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-7.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-7.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-8.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-8.aac'));
        break;
      case 'the-speed-shuffle-ultra-segment-9.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/the-speed-shuffle-ultra-segment-9.aac'));
        break;
      case 'triple-seven-segment-0.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/triple-seven-segment-0.aac'));
        break;
      case 'triple-seven-segment-1.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/triple-seven-segment-1.aac'));
        break;
      case 'triple-seven-segment-2.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/triple-seven-segment-2.aac'));
        break;
      case 'triple-seven-segment-3.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/triple-seven-segment-3.aac'));
        break;
      case 'triple-seven-segment-4.aac':
        segmentSound = new Audio.Sound();
        await segmentSound.loadAsync(require('../assets/audio/triple-seven-segment-4.aac'));
        break;
      // Add more cases as needed for other workout segments
      default:
        segmentSound = new Audio.Sound();
    }
    return segmentSound;
  } catch (error) {
    console.error(`Error loading audio file ${filename}:`, error);
    return null;
  }
};
