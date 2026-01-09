import { MuscleGroup } from '../enums';

export const CHEST_EXERCISES = [
  // --- Barbell ---
  {
    name: 'Barbell Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Incline Barbell Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Decline Barbell Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Guillotine Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Reverse Grip Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Floor Press (Barbell)',
    muscleGroup: MuscleGroup.CHEST,
  },

  // --- Dumbbell ---
  {
    name: 'Dumbbell Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Incline Dumbbell Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Decline Dumbbell Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Dumbbell Flys',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Incline Dumbbell Flys',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Dumbbell Pullover',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Svend Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Hex Press (Squeeze Press)',
    muscleGroup: MuscleGroup.CHEST,
  },

  // --- Machines & Cables ---
  {
    name: 'Cable Crossover (High to Low)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Cable Crossover (Low to High)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Standard Cable Flys (Middle)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Pec Deck Machine (Butterfly)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Machine Chest Press (Seated)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Hammer Strength Chest Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Smith Machine Bench Press',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Smith Machine Incline Press',
    muscleGroup: MuscleGroup.CHEST,
  },

  // --- Bodyweight ---
  {
    name: 'Push-Ups (Standard)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Wide Grip Push-Ups',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Incline Push-Ups',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Decline Push-Ups',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Dips (Chest Version)',
    muscleGroup: MuscleGroup.CHEST,
  },
  {
    name: 'Plyometric Push-Ups',
    muscleGroup: MuscleGroup.CHEST,
  },
];

export const BACK_EXERCISES = [
  // --- Vertical Pulls ---
  { name: 'Pull-Up (Wide Grip)', muscleGroup: MuscleGroup.BACK },
  { name: 'Chin-Up', muscleGroup: MuscleGroup.BACK },
  { name: 'Neutral Grip Pull-Up', muscleGroup: MuscleGroup.BACK },
  { name: 'Lat Pulldown (Wide Grip)', muscleGroup: MuscleGroup.BACK },
  { name: 'Lat Pulldown (Close Grip V-Bar)', muscleGroup: MuscleGroup.BACK },
  { name: 'Lat Pulldown (Reverse Grip)', muscleGroup: MuscleGroup.BACK },
  { name: 'Single-Arm Lat Pulldown', muscleGroup: MuscleGroup.BACK },
  { name: 'Straight-Arm Cable Pulldown', muscleGroup: MuscleGroup.BACK },
  { name: 'Assisted Pull-Up Machine', muscleGroup: MuscleGroup.BACK },

  // --- Horizontal Pulls / Rows ---
  { name: 'Bent Over Barbell Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Pendlay Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Yates Row', muscleGroup: MuscleGroup.BACK },
  { name: 'T-Bar Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Landmine Row', muscleGroup: MuscleGroup.BACK },
  { name: 'One-Arm Dumbbell Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Chest-Supported Dumbbell Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Kroc Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Seated Cable Row (Close Grip)', muscleGroup: MuscleGroup.BACK },
  { name: 'Seated Cable Row (Wide Grip)', muscleGroup: MuscleGroup.BACK },
  { name: 'Machine Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Inverted Row (Bodyweight)', muscleGroup: MuscleGroup.BACK },
  { name: 'Meadows Row', muscleGroup: MuscleGroup.BACK },
  { name: 'Renegade Row', muscleGroup: MuscleGroup.BACK },

  // --- Lower Back & Compound ---
  { name: 'Deadlift (Conventional)', muscleGroup: MuscleGroup.BACK },
  { name: 'Rack Pull', muscleGroup: MuscleGroup.BACK },
  { name: 'Hyperextension (Back Extension)', muscleGroup: MuscleGroup.BACK },
  { name: 'Superman', muscleGroup: MuscleGroup.BACK },

  // --- Traps & Rear Delts focus ---
  { name: 'Barbell Shrug', muscleGroup: MuscleGroup.BACK },
  { name: 'Dumbbell Shrug', muscleGroup: MuscleGroup.BACK },
];

export const LEGS_EXERCISES = [
  // --- Quads ---
  { name: 'Barbell Back Squat', muscleGroup: MuscleGroup.LEGS },
  { name: 'Front Squat', muscleGroup: MuscleGroup.LEGS },
  { name: 'Leg Press', muscleGroup: MuscleGroup.LEGS },
  { name: 'Hack Squat', muscleGroup: MuscleGroup.LEGS },
  { name: 'Leg Extension', muscleGroup: MuscleGroup.LEGS },
  { name: 'Bulgarian Split Squat', muscleGroup: MuscleGroup.LEGS },
  { name: 'Goblet Squat', muscleGroup: MuscleGroup.LEGS },
  { name: 'Walking Lunge', muscleGroup: MuscleGroup.LEGS },
  { name: 'Reverse Lunge', muscleGroup: MuscleGroup.LEGS },
  { name: 'Step-Up', muscleGroup: MuscleGroup.LEGS },
  { name: 'Sissy Squat', muscleGroup: MuscleGroup.LEGS },
  { name: 'Pistol Squat', muscleGroup: MuscleGroup.LEGS },

  // --- Hamstrings ---
  { name: 'Romanian Deadlift (Barbell)', muscleGroup: MuscleGroup.LEGS },
  { name: 'Romanian Deadlift (Dumbbell)', muscleGroup: MuscleGroup.LEGS },
  { name: 'Stiff-Leg Deadlift', muscleGroup: MuscleGroup.LEGS },
  { name: 'Lying Leg Curl', muscleGroup: MuscleGroup.LEGS },
  { name: 'Seated Leg Curl', muscleGroup: MuscleGroup.LEGS },
  { name: 'Nordic Hamstring Curl', muscleGroup: MuscleGroup.LEGS },
  { name: 'Glute-Ham Raise', muscleGroup: MuscleGroup.LEGS },
  { name: 'Good Morning', muscleGroup: MuscleGroup.LEGS },

  // --- Glutes ---
  { name: 'Barbell Hip Thrust', muscleGroup: MuscleGroup.LEGS },
  { name: 'Glute Bridge', muscleGroup: MuscleGroup.LEGS },
  { name: 'Cable Pull-Through', muscleGroup: MuscleGroup.LEGS },
  { name: 'Hip Abduction Machine', muscleGroup: MuscleGroup.LEGS },
  { name: 'Sumo Deadlift', muscleGroup: MuscleGroup.LEGS },

  // --- Calves ---
  { name: 'Standing Calf Raise', muscleGroup: MuscleGroup.LEGS },
  { name: 'Seated Calf Raise', muscleGroup: MuscleGroup.LEGS },
  { name: 'Donkey Calf Raise', muscleGroup: MuscleGroup.LEGS },
  { name: 'Leg Press Calf Raise', muscleGroup: MuscleGroup.LEGS },

  // --- Adductors ---
  { name: 'Hip Adduction Machine', muscleGroup: MuscleGroup.LEGS },
  { name: 'Copenhagen Plank', muscleGroup: MuscleGroup.LEGS },
];

export const SHOULDERS_EXERCISES = [
  // --- Overhead Presses ---
  {
    name: 'Overhead Barbell Press (Military Press)',
    muscleGroup: MuscleGroup.SHOULDERS,
  },
  { name: 'Seated Barbell Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Seated Dumbbell Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Arnold Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Push Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Behind the Neck Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Machine Shoulder Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Landmine Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Handstand Push-Ups', muscleGroup: MuscleGroup.SHOULDERS },

  // --- Side Delts ---
  { name: 'Dumbbell Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Cable Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Seated Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Machine Lateral Raise', muscleGroup: MuscleGroup.SHOULDERS },
  {
    name: 'Egyptian Lateral Raise (Cable)',
    muscleGroup: MuscleGroup.SHOULDERS,
  },
  { name: 'Upright Row (Barbell)', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Upright Row (Cable)', muscleGroup: MuscleGroup.SHOULDERS },

  // --- Front Delts ---
  { name: 'Dumbbell Front Raise', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Barbell Front Raise', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Plate Front Raise', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Cable Front Raise', muscleGroup: MuscleGroup.SHOULDERS },

  // --- Rear Delts ---
  {
    name: 'Bent-Over Dumbbell Reverse Fly',
    muscleGroup: MuscleGroup.SHOULDERS,
  },
  {
    name: 'Reverse Pec Deck (Machine Fly)',
    muscleGroup: MuscleGroup.SHOULDERS,
  },
  { name: 'Cable Rear Delt Fly', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Face Pull', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Lying Face Pull', muscleGroup: MuscleGroup.SHOULDERS },

  // --- Rotator Cuff ---
  {
    name: 'External Rotation (Cable/Dumbbell)',
    muscleGroup: MuscleGroup.SHOULDERS,
  },
  {
    name: 'Internal Rotation (Cable/Dumbbell)',
    muscleGroup: MuscleGroup.SHOULDERS,
  },
  { name: 'Cuban Press', muscleGroup: MuscleGroup.SHOULDERS },
];

export const BICEPS_EXERCISES = [
  // --- Barbell & EZ Bar ---
  { name: 'Barbell Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'EZ Bar Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Reverse Grip Barbell Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Drag Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: '21s (Barbell/EZ Bar)', muscleGroup: MuscleGroup.BICEPS },

  // --- Dumbbell ---
  { name: 'Standing Dumbbell Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Seated Dumbbell Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Hammer Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Incline Dumbbell Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Concentration Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Zottman Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Alternating Dumbbell Curl', muscleGroup: MuscleGroup.BICEPS },

  // --- Preacher & Support ---
  { name: 'Preacher Curl (Barbell/EZ Bar)', muscleGroup: MuscleGroup.BICEPS },
  { name: 'One-Arm Dumbbell Preacher Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Spider Curl', muscleGroup: MuscleGroup.BICEPS },

  // --- Cable & Machines ---
  { name: 'Cable Bicep Curl (Straight Bar)', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Rope Hammer Curl', muscleGroup: MuscleGroup.BICEPS },
  {
    name: 'Bayesian Curl (Behind-the-back Cable Curl)',
    muscleGroup: MuscleGroup.BICEPS,
  },
  { name: 'High Cable Curl (Crucifix Curl)', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Single Arm Cable Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Machine Bicep Curl', muscleGroup: MuscleGroup.BICEPS },
  { name: 'Preacher Curl Machine', muscleGroup: MuscleGroup.BICEPS },
];

export const TRICEPS_EXERCISES = [
  // --- Compound Presses ---
  { name: 'Close-Grip Barbell Bench Press', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Dips (Triceps Focus)', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Weighted Bench Dip', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'JM Press', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Floor Press (Close Grip)', muscleGroup: MuscleGroup.TRICEPS },

  // --- Lying Extensions ---
  { name: 'Skullcrushers (EZ Bar)', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Skullcrushers (Dumbbell)', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Dumbbell Rollback Extension', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Tate Press', muscleGroup: MuscleGroup.TRICEPS },

  // --- Overhead Extensions ---
  {
    name: 'Overhead Dumbbell Extension (Seated)',
    muscleGroup: MuscleGroup.TRICEPS,
  },
  {
    name: 'Overhead Dumbbell Extension (Standing)',
    muscleGroup: MuscleGroup.TRICEPS,
  },
  { name: 'Overhead Cable Extension (Rope)', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'French Press (Standing EZ Bar)', muscleGroup: MuscleGroup.TRICEPS },

  // --- Pushdowns & Cables ---
  { name: 'Triceps Cable Pushdown (Rope)', muscleGroup: MuscleGroup.TRICEPS },
  {
    name: 'Triceps Cable Pushdown (Straight Bar)',
    muscleGroup: MuscleGroup.TRICEPS,
  },
  { name: 'Triceps Cable Pushdown (V-Bar)', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Reverse Grip Cable Pushdown', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Single-Arm Cable Pushdown', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Cross-Body Cable Extension', muscleGroup: MuscleGroup.TRICEPS },

  // --- Dumbbell Kickbacks ---
  { name: 'Dumbbell Kickback', muscleGroup: MuscleGroup.TRICEPS },
  { name: 'Cable Kickback', muscleGroup: MuscleGroup.TRICEPS },
];

export const ABS_EXERCISES = [
  // --- Upper Abs & General ---
  { name: 'Crunch', muscleGroup: MuscleGroup.ABS },
  { name: 'Decline Bench Crunch', muscleGroup: MuscleGroup.ABS },
  { name: 'Cable Crunch (Kneeling)', muscleGroup: MuscleGroup.ABS },
  { name: 'Machine Ab Crunch', muscleGroup: MuscleGroup.ABS },
  { name: 'GHD Sit-Up', muscleGroup: MuscleGroup.ABS },
  { name: 'V-Up', muscleGroup: MuscleGroup.ABS },
  { name: 'Sit-Up', muscleGroup: MuscleGroup.ABS },

  // --- Lower Abs ---
  { name: 'Hanging Leg Raise', muscleGroup: MuscleGroup.ABS },
  { name: "Captain's Chair Leg Raise", muscleGroup: MuscleGroup.ABS },
  { name: 'Lying Leg Raise', muscleGroup: MuscleGroup.ABS },
  { name: 'Reverse Crunch', muscleGroup: MuscleGroup.ABS },
  { name: 'Dragon Flag', muscleGroup: MuscleGroup.ABS },
  { name: 'Flutter Kicks', muscleGroup: MuscleGroup.ABS },
  { name: 'Scissors', muscleGroup: MuscleGroup.ABS },

  // --- Obliques ---
  { name: 'Russian Twist', muscleGroup: MuscleGroup.ABS },
  { name: 'Cable Woodchopper', muscleGroup: MuscleGroup.ABS },
  { name: 'Side Plank', muscleGroup: MuscleGroup.ABS },
  { name: 'Bicycle Crunch', muscleGroup: MuscleGroup.ABS },
  { name: 'Side Bend (Dumbbell/Cable)', muscleGroup: MuscleGroup.ABS },
  { name: 'Heel Touch', muscleGroup: MuscleGroup.ABS },

  // --- Core Stability ---
  { name: 'Plank', muscleGroup: MuscleGroup.ABS },
  { name: 'Ab Wheel Rollout', muscleGroup: MuscleGroup.ABS },
  { name: 'Hollow Body Hold', muscleGroup: MuscleGroup.ABS },
  { name: 'Mountain Climber', muscleGroup: MuscleGroup.ABS },
  { name: 'Vacuum', muscleGroup: MuscleGroup.ABS },
];

export const CARDIO_EXERCISES = [
  // --- Machines ---
  { name: 'Treadmill Run', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Treadmill Incline Walk', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Elliptical Trainer', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Stationary Bike (Spinning)', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Recumbent Bike', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Rowing Machine', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Stair Climber (StairMaster)', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Assault Bike (Air Bike)', muscleGroup: MuscleGroup.CARDIO },
  { name: 'SkiErg', muscleGroup: MuscleGroup.CARDIO },
  { name: "Jacob's Ladder", muscleGroup: MuscleGroup.CARDIO },

  // --- Bodyweight & HIIT ---
  { name: 'Jump Rope', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Double Unders (Jump Rope)', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Burpees', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Jumping Jacks', muscleGroup: MuscleGroup.CARDIO },
  { name: 'High Knees', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Box Jumps', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Mountain Climbers', muscleGroup: MuscleGroup.CARDIO },

  // --- Outdoor & Functional ---
  { name: 'Running (Outdoor)', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Sprinting', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Battle Ropes', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Sled Push (Prowler)', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Heavy Bag Workout', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Shadow Boxing', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Bear Crawl', muscleGroup: MuscleGroup.CARDIO },
];

export const FULL_BODY_EXERCISES = [
  // --- Olympic Weightlifting ---
  { name: 'Clean and Jerk', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Snatch', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Power Clean', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Hang Clean', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Clean High Pull', muscleGroup: MuscleGroup.FULL_BODY },

  // --- Kettlebell ---
  { name: 'Kettlebell Swing (Russian)', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Kettlebell Swing (American)', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Turkish Get-Up', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Kettlebell Snatch', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Kettlebell Clean & Press', muscleGroup: MuscleGroup.FULL_BODY },

  // --- CrossFit & Functional ---
  { name: 'Thruster (Barbell)', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Thruster (Dumbbell)', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Devil Press', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Man Maker', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Wall Ball', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Cluster', muscleGroup: MuscleGroup.FULL_BODY },

  // --- Strongman & Carries ---
  { name: "Farmer's Walk", muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Yoke Walk', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Tire Flip', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Sled Pull', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Atlas Stone Lift', muscleGroup: MuscleGroup.FULL_BODY },

  // --- Calisthenics ---
  { name: 'Muscle-Up (Bar)', muscleGroup: MuscleGroup.FULL_BODY },
  { name: 'Muscle-Up (Rings)', muscleGroup: MuscleGroup.FULL_BODY },
];

export const INITIAL_EXERCISES = [
  ...CHEST_EXERCISES,
  ...BACK_EXERCISES,
  ...LEGS_EXERCISES,
  ...SHOULDERS_EXERCISES,
  ...BICEPS_EXERCISES,
  ...TRICEPS_EXERCISES,
  ...ABS_EXERCISES,
  ...CARDIO_EXERCISES,
  ...FULL_BODY_EXERCISES,
];
