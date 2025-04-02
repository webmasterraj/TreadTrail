import { WorkoutProgram } from '../types';
import { generateUniqueId } from '../utils/helpers';

// Default workout programs as specified in the PRD
export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    "id": "baby-steps",
    "name": "Baby Steps",
    "description": "A gentle intro to speed. Short runs, quick sprints, and plenty of recovery—perfect for beginners learning to push the pace.",
    "duration": 1020,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": false,
    "category": "Easy 🐣",
    "intensity": 1,
    "segments": [
      {
        "type": "recovery",
        "duration": 10,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-0.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "base",
        "duration": 15,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-1.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 15,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-2.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "recovery",
        "duration": 15,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-3.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-4.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-5.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-6.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-7.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-8.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-9.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "baby-steps-segment-10.aac",
          "duration": 2.272625
        }
      }
    ]
  },
  {
    "id": "starter-pack",
    "name": "Starter Pack",
    "description": "Perfect intro to interval training. 30-second pushes followed by generous recovery periods twice as long. Gradually increasing inclines add variety without overwhelming",
    "duration": 990,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Easy 🐣",
    "intensity": 1,
    "segments": [
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-0.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-1.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-2.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "starter-pack-segment-3.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-4.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "starter-pack-segment-5.aac",
          "duration": 3.108563
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-6.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-7.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-8.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 3,
        "audio": {
          "file": "starter-pack-segment-9.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-10.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 3,
        "audio": {
          "file": "starter-pack-segment-11.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-12.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-13.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-14.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "starter-pack-segment-15.aac",
          "duration": 1.906937
        }
      }
    ]
  },
  {
    "id": "easy-breezy",
    "name": "Easy Breezy",
    "description": "No stress, no struggle. This light and steady run keeps things fun, fluid, and totally doable, with gentle pace changes and easy recoveries. Perfect for recovery days or for beginners. Just breathe, run, and keep it breezy. 😌💨",
    "duration": 780,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Easy 🐣",
    "intensity": 1,
    "segments": [
      {
        "type": "recovery",
        "duration": 120,
        "incline": 5,
        "audio": {
          "file": "easy-breezy-segment-0.aac",
          "duration": 3.422
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 2,
        "audio": {
          "file": "easy-breezy-segment-1.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "easy-breezy-segment-2.aac",
          "duration": 3.892187
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "easy-breezy-segment-3.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "easy-breezy-segment-4.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "easy-breezy-segment-5.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "easy-breezy-segment-6.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "easy-breezy-segment-7.aac",
          "duration": 2.168125
        }
      }
    ]
  },
  {
    "id": "cardio-crescendo",
    "name": "Cardio Crescendo",
    "description": "This one builds like a symphony. Each round pushes a little harder, keeping you on your toes until the final cooldown.",
    "duration": 1380,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": false,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-0.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-1.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-2.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-3.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-4.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-5.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-6.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-7.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-8.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-9.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-10.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-11.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-12.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-13.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "cardio-crescendo-segment-14.aac",
          "duration": 2.272625
        }
      }
    ]
  },
  {
    "id": "sprint-tsunami",
    "name": "Sprint Tsunami",
    "description": "Speed comes in waves! Short sprints with quick recoveries. Just when you catch your breath—boom, another sprint! 🌪️",
    "duration": 1020,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 3,
    "segments": [
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-0.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-1.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-2.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-3.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-4.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-5.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-6.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-8.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-9.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-10.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-11.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-12.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-13.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "sprint-tsunami-segment-14.aac",
          "duration": 1.906937
        }
      }
    ]
  },
  {
    "id": "perfectly-balanced",
    "name": "Perfectly Balanced",
    "description": "Perfect harmony of work and recovery in this1:1 ratio workout. Every effort is matched with equal rest, creating a balanced challenge.",
    "duration": 1020,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 2,
    "segments": [
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-0.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-1.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-2.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-3.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-4.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "perfectly-balanced-segment-5.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-6.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "perfectly-balanced-segment-7.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-8.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-9.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-10.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-11.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-12.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-13.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-14.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "perfectly-balanced-segment-15.aac",
          "duration": 1.854688
        }
      }
    ]
  },
  {
    "id": "the-flash-dash",
    "name": "The Flash Dash",
    "description": "Blink, and you’ll miss it! Short bursts of effort keep your legs firing, while brief recovery windows challenge your stamina. Stay light on your feet, push the pace, and see if you can keep up—because this dash doesn’t slow down! 🚀🔥",
    "duration": 1140,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 8,
        "audio": {
          "file": "the-flash-dash-segment-0.aac",
          "duration": 3.47425
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-1.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-2.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-3.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-4.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-5.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-6.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-8.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-9.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-10.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-11.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-12.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-13.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-14.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-15.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 150,
        "incline": 2,
        "audio": {
          "file": "the-flash-dash-segment-16.aac",
          "duration": 3.004062
        }
      }
    ]
  },
  {
    "id": "the-speed-shuffle",
    "name": "The Speed Shuffle",
    "description": "Sprint, jog, recover—shuffle through the speeds and keep your legs guessing! 🔥 No overthinking, just shuffle, move, and go!",
    "duration": 1560,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-0.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-2.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-3.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-4.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-5.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-6.aac",
          "duration": 2.168125
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-7.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-8.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-9.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-10.aac",
          "duration": 2.690562
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-11.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-segment-12.aac",
          "duration": 2.272625
        }
      }
    ]
  },
  {
    "id": "the-speed-shuffle-ultra",
    "name": "The Speed Shuffle Ultra",
    "description": "Speed Shuffle Ultra takes everything you loved (and maybe hated) about the original and doubles down—more sprints, longer runs, and just enough recovery to keep you hanging on. No excuses—just shuffle, move, and go… again. 🚀🔥",
    "duration": 2100,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-0.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-1.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-2.aac",
          "duration": 2.690562
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-3.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-4.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-5.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-6.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-7.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-8.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-9.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-10.aac",
          "duration": 2.690562
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-11.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-12.aac",
          "duration": 2.168125
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-13.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-14.aac",
          "duration": 2.690562
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-15.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-16.aac",
          "duration": 2.690562
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-17.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-speed-shuffle-ultra-segment-18.aac",
          "duration": 2.168125
        }
      }
    ]
  },
  {
    "id": "the-gentle-push",
    "name": "The Gentle Push",
    "description": "Smooth, steady, and just enough effort to keep things interesting. 🌊 This run flows through comfortable paces, eases you in with a warm-up, and ends with a final push to wake up your legs.",
    "duration": 1050,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Trad HIIT 🏃🏼",
    "intensity": 1,
    "segments": [
      {
        "type": "recovery",
        "duration": 120,
        "incline": 5,
        "audio": {
          "file": "the-gentle-push-segment-0.aac",
          "duration": 3.422
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 2,
        "audio": {
          "file": "the-gentle-push-segment-1.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-2.aac",
          "duration": 3.160813
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-3.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-4.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-5.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-6.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-7.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "the-gentle-push-segment-8.aac",
          "duration": 2.168125
        }
      }
    ]
  },
  {
    "id": "pyramid-power",
    "name": "Pyramid Power",
    "description": "Climb the pyramid with progressive speed & incline—then descend back down. Short bursts, quick recoveries, and a final smooth finish.",
    "duration": 900,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": false,
    "category": "Hills ⛰",
    "intensity": 2,
    "segments": [
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-0.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 3,
        "audio": {
          "file": "pyramid-power-segment-1.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-2.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 45,
        "incline": 5,
        "audio": {
          "file": "pyramid-power-segment-3.aac",
          "duration": 3.57875
        }
      },
      {
        "type": "recovery",
        "duration": 45,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-4.aac",
          "duration": 3.78775
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 7,
        "audio": {
          "file": "pyramid-power-segment-5.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-6.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 8,
        "audio": {
          "file": "pyramid-power-segment-7.aac",
          "duration": 3.160813
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-8.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 45,
        "incline": 5,
        "audio": {
          "file": "pyramid-power-segment-9.aac",
          "duration": 3.57875
        }
      },
      {
        "type": "recovery",
        "duration": 45,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-10.aac",
          "duration": 3.78775
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 3,
        "audio": {
          "file": "pyramid-power-segment-11.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-12.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "pyramid-power-segment-13.aac",
          "duration": 1.906937
        }
      }
    ]
  },
  {
    "id": "hill-thrills",
    "name": "Hill Thrills",
    "description": "Climb your way to glory! This pyramid workout cranks inclines to 7% then lets you descend. 🏔️ With 2:1 work-to-recovery, your legs burn while calories melt. Get ready to conquer your own personal Everest!",
    "duration": 1140,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Hills ⛰",
    "intensity": 2,
    "segments": [
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-0.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "hill-thrills-segment-1.aac",
          "duration": 3.056312
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-2.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 4,
        "audio": {
          "file": "hill-thrills-segment-3.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-4.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 5,
        "audio": {
          "file": "hill-thrills-segment-5.aac",
          "duration": 3.056312
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-6.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 6,
        "audio": {
          "file": "hill-thrills-segment-7.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-8.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 7,
        "audio": {
          "file": "hill-thrills-segment-9.aac",
          "duration": 3.108563
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-10.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 6,
        "audio": {
          "file": "hill-thrills-segment-11.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-12.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 5,
        "audio": {
          "file": "hill-thrills-segment-13.aac",
          "duration": 3.056312
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-14.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 4,
        "audio": {
          "file": "hill-thrills-segment-15.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-16.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "hill-thrills-segment-17.aac",
          "duration": 3.056312
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "hill-thrills-segment-18.aac",
          "duration": 3.186937
        }
      }
    ]
  },
  {
    "id": "mount-shasta",
    "name": "Mount Shasta",
    "description": "This workout sends you climbing through escalating inclines while mixing paces for maximum burn. 🏔️ The midsection hits you with rapid-fire intervals at a jaw-dropping 14% grade that will test your limits. Finish strong knowing you conquered a mountain without leaving the gym!",
    "duration": 1200,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Hills ⛰",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 150,
        "incline": 5,
        "audio": {
          "file": "mount-shasta-segment-0.aac",
          "duration": 4.310187
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 5,
        "audio": {
          "file": "mount-shasta-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 7,
        "audio": {
          "file": "mount-shasta-segment-2.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 7,
        "audio": {
          "file": "mount-shasta-segment-3.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 10,
        "audio": {
          "file": "mount-shasta-segment-4.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 12,
        "audio": {
          "file": "mount-shasta-segment-5.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 12,
        "audio": {
          "file": "mount-shasta-segment-6.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 13,
        "audio": {
          "file": "mount-shasta-segment-7.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 6,
        "audio": {
          "file": "mount-shasta-segment-8.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 6,
        "audio": {
          "file": "mount-shasta-segment-9.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 14,
        "audio": {
          "file": "mount-shasta-segment-10.aac",
          "duration": 3.84
        }
      },
      {
        "type": "base",
        "duration": 30,
        "incline": 14,
        "audio": {
          "file": "mount-shasta-segment-11.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 14,
        "audio": {
          "file": "mount-shasta-segment-12.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 14,
        "audio": {
          "file": "mount-shasta-segment-13.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 14,
        "audio": {
          "file": "mount-shasta-segment-14.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 8,
        "audio": {
          "file": "mount-shasta-segment-15.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 5,
        "audio": {
          "file": "mount-shasta-segment-16.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 5,
        "audio": {
          "file": "mount-shasta-segment-17.aac",
          "duration": 2.272625
        }
      }
    ]
  },
  {
    "id": "rainier-roller",
    "name": "Rainier Roller",
    "description": "This workout alternates between moderate climbs and exhilarating sprint summits, reaching an 8% peak that'll fire up your quads. 🌋 Just when you think you've reached the top, another incline appears! Finish with your legs trembling and your endorphins soaring.",
    "duration": 1200,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Hills ⛰",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 2,
        "audio": {
          "file": "rainier-roller-segment-0.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 3,
        "audio": {
          "file": "rainier-roller-segment-1.aac",
          "duration": 3.160813
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 4,
        "audio": {
          "file": "rainier-roller-segment-2.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 4,
        "audio": {
          "file": "rainier-roller-segment-3.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "rainier-roller-segment-4.aac",
          "duration": 3.056312
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 6,
        "audio": {
          "file": "rainier-roller-segment-5.aac",
          "duration": 3.004062
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "rainier-roller-segment-6.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "sprint",
        "duration": 120,
        "incline": 7,
        "audio": {
          "file": "rainier-roller-segment-7.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "rainier-roller-segment-8.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "sprint",
        "duration": 120,
        "incline": 8,
        "audio": {
          "file": "rainier-roller-segment-9.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 6,
        "audio": {
          "file": "rainier-roller-segment-10.aac",
          "duration": 3.108563
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 5,
        "audio": {
          "file": "rainier-roller-segment-11.aac",
          "duration": 3.422
        }
      }
    ]
  },
  {
    "id": "easy-elevation",
    "name": "Easy Elevation",
    "description": "Climb without the struggle! Brief moments of running mix with gentle hills that appear just when you're ready. 🌄 Like a fun hike with friends rather than a mountain expedition - you'll conquer small peaks and enjoy the journey with plenty of breathing room in between",
    "duration": 1140,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Hills ⛰",
    "intensity": 1,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-0.aac",
          "duration": 3.5265
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 20,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-2.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 40,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-3.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 20,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-4.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 40,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-5.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 20,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-6.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 40,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-7.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 20,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-8.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 40,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-9.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 20,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-10.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "recovery",
        "duration": 40,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-11.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "easy-elevation-segment-12.aac",
          "duration": 3.604875
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-13.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "easy-elevation-segment-14.aac",
          "duration": 3.604875
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-15.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "easy-elevation-segment-16.aac",
          "duration": 3.604875
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-17.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "easy-elevation-segment-18.aac",
          "duration": 3.709375
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-19.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "easy-elevation-segment-20.aac",
          "duration": 3.709375
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "easy-elevation-segment-21.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "recovery",
        "duration": 150,
        "incline": 1,
        "audio": {
          "file": "easy-elevation-segment-22.aac",
          "duration": 4.179563
        }
      }
    ]
  },
  {
    "id": "pharaoh's-challenge",
    "name": "Pharaoh's Challenge",
    "description": "A royal test of endurance and speed! Start with a steady climb, build momentum with faster strides, then push through intense sprints before descending back to recovery. This pyramid-style workout will have you feeling like an ancient ruler—minus the gold, but with plenty of sweat! 🔥💪",
    "duration": 1980,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Hills ⛰",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 300,
        "incline": 7,
        "audio": {
          "file": "pharaoh's-challenge-segment-0.aac",
          "duration": 3.57875
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 3,
        "audio": {
          "file": "pharaoh's-challenge-segment-1.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 5,
        "audio": {
          "file": "pharaoh's-challenge-segment-2.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "run",
        "duration": 150,
        "incline": 3,
        "audio": {
          "file": "pharaoh's-challenge-segment-3.aac",
          "duration": 3.996687
        }
      },
      {
        "type": "run",
        "duration": 150,
        "incline": 5,
        "audio": {
          "file": "pharaoh's-challenge-segment-4.aac",
          "duration": 4.022812
        }
      },
      {
        "type": "sprint",
        "duration": 120,
        "incline": 3,
        "audio": {
          "file": "pharaoh's-challenge-segment-5.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "sprint",
        "duration": 120,
        "incline": 5,
        "audio": {
          "file": "pharaoh's-challenge-segment-6.aac",
          "duration": 3.108563
        }
      },
      {
        "type": "run",
        "duration": 150,
        "incline": 3,
        "audio": {
          "file": "pharaoh's-challenge-segment-7.aac",
          "duration": 3.996687
        }
      },
      {
        "type": "run",
        "duration": 150,
        "incline": 5,
        "audio": {
          "file": "pharaoh's-challenge-segment-8.aac",
          "duration": 4.022812
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 3,
        "audio": {
          "file": "pharaoh's-challenge-segment-9.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 5,
        "audio": {
          "file": "pharaoh's-challenge-segment-10.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 3,
        "audio": {
          "file": "pharaoh's-challenge-segment-11.aac",
          "duration": 3.422
        }
      }
    ]
  },
  {
    "id": "killing-me-softly",
    "name": "Killing Me Softly",
    "description": "This workout starts off gentle, luring you into a false sense of security—then slowly turns up the heat. 😈With long intervals and just enough base pace, this one burns in the best way.",
    "duration": 1860,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Endurance 💪🏽",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-0.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-2.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-3.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-4.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-5.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-6.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "killing-me-softly-segment-7.aac",
          "duration": 1.906937
        }
      }
    ]
  },
  {
    "id": "cruise-control",
    "name": "Cruise Control",
    "description": "Settle into a comfortably hard pace, teaching your legs to keep pushing without burning out.",
    "duration": 1800,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Endurance 💪🏽",
    "intensity": 1,
    "segments": [
      {
        "type": "recovery",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "cruise-control-segment-0.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "cruise-control-segment-1.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 900,
        "incline": 2,
        "audio": {
          "file": "cruise-control-segment-2.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "cruise-control-segment-3.aac",
          "duration": 3.239125
        }
      },
      {
        "type": "recovery",
        "duration": 240,
        "incline": 1,
        "audio": {
          "file": "cruise-control-segment-4.aac",
          "duration": 2.220375
        }
      }
    ]
  },
  {
    "id": "triple-seven",
    "name": "Triple Seven",
    "description": "Three perfect 7-minute chunks that build from comfortable to challenging! Start with steady Base pace, level up to energizing Run pace, then hit your power mode with Sprint. 🚀",
    "duration": 1500,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Endurance 💪🏽",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "triple-seven-segment-0.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "base",
        "duration": 420,
        "incline": 1,
        "audio": {
          "file": "triple-seven-segment-1.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "run",
        "duration": 420,
        "incline": 1,
        "audio": {
          "file": "triple-seven-segment-2.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "sprint",
        "duration": 420,
        "incline": 1,
        "audio": {
          "file": "triple-seven-segment-3.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "triple-seven-segment-4.aac",
          "duration": 2.168125
        }
      }
    ]
  },
  {
    "id": "long-way-home",
    "name": "Long Way Home",
    "description": "Not all who wander are lost… but this run will have you questioning your route! 🚦 A mix of endurance bursts, and all-out sprints—because apparently, you love the scenic route. And by the end, you’ll be wondering… why didn’t I just take the shortcut? 😅🏡💨",
    "duration": 1620,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Endurance 💪🏽",
    "intensity": 2,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 5,
        "audio": {
          "file": "long-way-home-segment-0.aac",
          "duration": 3.422
        }
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "long-way-home-segment-1.aac",
          "duration": 3.108563
        }
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "long-way-home-segment-2.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "long-way-home-segment-3.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "sprint",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "long-way-home-segment-4.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 1,
        "audio": {
          "file": "long-way-home-segment-5.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 2,
        "audio": {
          "file": "long-way-home-segment-6.aac",
          "duration": 3.291375
        }
      }
    ]
  },
  {
    "id": "death-sentence",
    "name": "Death Sentence",
    "description": "No mercy. Short recoveries, relentless sprints, and barely enough time to breathe. Just when your legs beg for a break—another sprint hits. You’ll survive… probably. 😈🔥",
    "duration": 1380,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Death 💀",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-0.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-2.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-3.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-4.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-5.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-6.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-7.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-8.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "sprint",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-9.aac",
          "duration": 2.821187
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-10.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-11.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-12.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-13.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-14.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-15.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-16.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-17.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "death-sentence-segment-18.aac",
          "duration": 2.168125
        }
      }
    ]
  },
  {
    "id": "pulse-pounder",
    "name": "Pulse Pounder",
    "description": "This run isn’t here to entertain you. Sprint through fast bursts, power up relentless inclines, and hold on through barely-there recoveries. Your legs will scream, your heart will hammer, and by the end, you’ll know exactly why it’s called the Pulse Pounder.",
    "duration": 1860,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Death 💀",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-0.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "base",
        "duration": 150,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-1.aac",
          "duration": 2.768937
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-2.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 5,
        "audio": {
          "file": "pulse-pounder-segment-3.aac",
          "duration": 3.996687
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 5,
        "audio": {
          "file": "pulse-pounder-segment-4.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 5,
        "audio": {
          "file": "pulse-pounder-segment-5.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 5,
        "audio": {
          "file": "pulse-pounder-segment-6.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 5,
        "audio": {
          "file": "pulse-pounder-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-8.aac",
          "duration": 3.056312
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-9.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-10.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-11.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "pulse-pounder-segment-12.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 12,
        "audio": {
          "file": "pulse-pounder-segment-13.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "pulse-pounder-segment-14.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "pulse-pounder-segment-15.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "pulse-pounder-segment-16.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "pulse-pounder-segment-17.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 12,
        "audio": {
          "file": "pulse-pounder-segment-18.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 6,
        "audio": {
          "file": "pulse-pounder-segment-19.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "base",
        "duration": 30,
        "incline": 6,
        "audio": {
          "file": "pulse-pounder-segment-20.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 5,
        "audio": {
          "file": "pulse-pounder-segment-21.aac",
          "duration": 3.108563
        }
      },
      {
        "type": "base",
        "duration": 30,
        "incline": 4,
        "audio": {
          "file": "pulse-pounder-segment-22.aac",
          "duration": 3.291375
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 4,
        "audio": {
          "file": "pulse-pounder-segment-23.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 3,
        "audio": {
          "file": "pulse-pounder-segment-24.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 2,
        "audio": {
          "file": "pulse-pounder-segment-25.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 0,
        "audio": {
          "file": "pulse-pounder-segment-26.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 0,
        "audio": {
          "file": "pulse-pounder-segment-27.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 0,
        "audio": {
          "file": "pulse-pounder-segment-28.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "sprint",
        "duration": 120,
        "incline": 0,
        "audio": {
          "file": "pulse-pounder-segment-29.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 0,
        "audio": {
          "file": "pulse-pounder-segment-30.aac",
          "duration": 2.951812
        }
      }
    ]
  },
  {
    "id": "chaos-run",
    "name": "Chaos Run",
    "description": "No patterns, no warnings—just pure, unpredictable mayhem. 🔥 One minute you're cruising, the next you're sprinting for your life. Just when you think you've figured it out, the pace shifts again. Can you handle it? 😈🚀",
    "duration": 1350,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Death 💀",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-0.aac",
          "duration": 3.36975
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-1.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-2.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-3.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-4.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-5.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-6.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-8.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-9.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-10.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "sprint",
        "duration": 45,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-11.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-12.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-13.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "sprint",
        "duration": 45,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-14.aac",
          "duration": 2.272625
        }
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1,
        "audio": {
          "file": "chaos-run-segment-15.aac",
          "duration": 2.272625
        }
      }
    ]
  },
  {
    "id": "fury-road",
    "name": "Fury Road",
    "description": "No brakes, no mercy—just full-throttle sprints and relentless speed shifts. One moment you’re cruising, the next you’re gunning it like you’re escaping the apocalypse. Hold on tight, because this road only leads one way—forward.",
    "duration": 1290,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Death 💀",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-0.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-2.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 45,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-3.aac",
          "duration": 2.220375
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-4.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-5.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-6.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 75,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-8.aac",
          "duration": 2.821187
        }
      },
      {
        "type": "sprint",
        "duration": 20,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-9.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-10.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "sprint",
        "duration": 40,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-11.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-12.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-13.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-14.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-15.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-16.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-17.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-18.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "fury-road-segment-19.aac",
          "duration": 2.168125
        }
      }
    ]
  },
  {
    "id": "danger-zone",
    "name": "Danger Zone",
    "description": "The sprints start off spaced out, giving you time to breathe—but not for long. With each round, the breaks shrink, the speed stacks, and before you know it, you’re deep in the Danger Zone. Buckle up. 😈💨",
    "duration": 1830,
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "premium": true,
    "category": "Death 💀",
    "intensity": 3,
    "segments": [
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-0.aac",
          "duration": 3.343625
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-1.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-2.aac",
          "duration": 2.690562
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-3.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-4.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-5.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-6.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-8.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-9.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-10.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-11.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "base",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-12.aac",
          "duration": 1.933062
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-13.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-14.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-15.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "base",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-16.aac",
          "duration": 2.742812
        }
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-17.aac",
          "duration": 1.697937
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-18.aac",
          "duration": 1.854688
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-19.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "run",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-20.aac",
          "duration": 2.638313
        }
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-21.aac",
          "duration": 1.750188
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-22.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-23.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-24.aac",
          "duration": 1.906937
        }
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "danger-zone-segment-25.aac",
          "duration": 2.168125
        }
      }
    ]
  }
];