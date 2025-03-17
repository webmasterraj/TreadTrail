import { WorkoutProgram } from '../types';
import { generateUniqueId } from '../utils/helpers';

// Default workout programs as specified in the PRD
export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    "id": "workout-1",
    "name": "Quick HIIT",
    "description": "Alternating 30-second Sprint intervals with 90-second Recovery periods. High intensity, perfect for a quick but effective workout.",
    "duration": 1200,
    "difficulty": "intermediate",
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "segments": [
      {
        "type": "base",
        "duration": 15,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-0.aac",
          "duration": 3.422
        }
      },
      {
        "type": "sprint",
        "duration": 15,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-1.aac",
          "duration": 2.115875
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-2.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-3.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-4.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-5.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-6.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-7.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-8.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-9.aac",
          "duration": 2.0375
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-10.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-11.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-12.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-13.aac",
          "duration": 1.98525
        }
      },
      {
        "type": "recovery",
        "duration": 90,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-14.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "workout-1-segment-15.aac",
          "duration": 1.750188
        }
      }
    ]
  },
  {
    "id": "workout-2",
    "name": "Fat Burn",
    "description": "Alternating Base and Run paces with gradually increasing inclines. Designed to maximize calorie burn through sustained effort.",
    "duration": 1800,
    "difficulty": "intermediate",
    "focus": "fat_burn",
    "favorite": false,
    "lastUsed": null,
    "segments": [
      {
        "type": "base",
        "duration": 120,
        "incline": 1,
        "audio": {
          "file": "workout-2-segment-0.aac",
          "duration": 2.951812
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 2,
        "audio": {
          "file": "workout-2-segment-1.aac",
          "duration": 3.186937
        }
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 2,
        "audio": {
          "file": "workout-2-segment-2.aac",
          "duration": 1.802437
        }
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 3
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 3
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 4
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 4
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 5
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 5
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 3
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 3
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 2
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1
      }
    ]
  },
  {
    "id": "workout-3",
    "name": "Endurance Builder",
    "description": "Longer intervals with Base and Run paces and varied inclines. Builds aerobic capacity and mental stamina.",
    "duration": 2700,
    "difficulty": "advanced",
    "focus": "endurance",
    "favorite": false,
    "lastUsed": null,
    "segments": [
      {
        "type": "base",
        "duration": 120,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 2
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 2
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 3
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 3
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 4
      },
      {
        "type": "run",
        "duration": 180,
        "incline": 4
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 3
      },
      {
        "type": "run",
        "duration": 240,
        "incline": 3
      },
      {
        "type": "base",
        "duration": 300,
        "incline": 2
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 2
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1
      }
    ]
  },
  {
    "id": "workout-4",
    "name": "Beginner Intro",
    "description": "Gentle introduction with mostly Base pace and brief Run intervals. Perfect for those new to interval training.",
    "duration": 900,
    "difficulty": "beginner",
    "focus": "endurance",
    "favorite": false,
    "lastUsed": null,
    "segments": [
      {
        "type": "recovery",
        "duration": 30,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 30,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 2
      },
      {
        "type": "run",
        "duration": 60,
        "incline": 2
      },
      {
        "type": "base",
        "duration": 180,
        "incline": 1
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1
      }
    ]
  },
  {
    "id": "workout-5",
    "name": "Speed Ladder",
    "description": "Progressive increases in pace from Recovery to Sprint. Challenges you to push your limits step by step.",
    "duration": 1500,
    "difficulty": "advanced",
    "focus": "hiit",
    "favorite": false,
    "lastUsed": null,
    "segments": [
      {
        "type": "base",
        "duration": 300,
        "incline": 1
      },
      {
        "type": "recovery",
        "duration": 60,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 1
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 1
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 1
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 120,
        "incline": 2
      },
      {
        "type": "run",
        "duration": 120,
        "incline": 2
      },
      {
        "type": "sprint",
        "duration": 60,
        "incline": 2
      },
      {
        "type": "recovery",
        "duration": 180,
        "incline": 1
      },
      {
        "type": "base",
        "duration": 60,
        "incline": 1
      },
      {
        "type": "run",
        "duration": 30,
        "incline": 1
      },
      {
        "type": "sprint",
        "duration": 30,
        "incline": 1
      },
      {
        "type": "recovery",
        "duration": 120,
        "incline": 1
      }
    ]
  }
];