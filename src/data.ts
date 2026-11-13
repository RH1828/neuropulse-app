import type { Condition } from './sim'

export type Aisle = 'Produce' | 'Protein' | 'Dairy & eggs' | 'Pantry'
export interface Ingredient {
  item: string
  week: string // weekly quantity
  aisle: Aisle
}
export interface Meal {
  id: string
  slot: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'
  time: string
  name: string
  why: string
  nutrients: string[]
  prepMin: number
  steps: string[]
  ingredients: Ingredient[]
}
export interface Exercise {
  id: string
  name: string
  seconds: number
  goal: string
  cues: string[]
}
export interface RoutineItem {
  id: string
  text: string
}
export interface Routine {
  id: 'morning' | 'afternoon' | 'evening'
  label: string
  window: string
  note: string
  items: RoutineItem[]
}
export type TaskCat = 'health' | 'living' | 'care'
export type WindowKind = 'physical' | 'focus' | 'rest'
export interface Task {
  id: string
  text: string
  cat: TaskCat
  time?: string
  window?: WindowKind
  done?: boolean
}
export interface Profile {
  dietName: string
  dietTip: string
  keyNutrient: string
  meals: Meal[]
  prepPlan: string[]
  exercises: Exercise[]
  routines: Routine[]
  tasks: Task[]
  /** Neural stability 0–100 from 6 AM to 10 PM, one value per hour (17 values). */
  dayCurve: number[]
  windows: Record<WindowKind, string>
}

export const NUTRIENT_INFO: Record<string, string> = {
  'Omega-3': 'Healthy fats that protect brain cells and calm inflammation.',
  Polyphenols: 'Plant antioxidants (berries, olive oil, tea) that protect neurons.',
  Magnesium: 'Helps nerves fire smoothly. Low levels can raise seizure risk.',
  Tyrosine: 'Building block your brain uses to make dopamine.',
  Fiber: 'Keeps digestion regular, which helps medicine absorb on time.',
  'Vitamin E': 'Antioxidant that protects brain cell membranes.',
  'Healthy fats': 'Steady fuel that keeps blood sugar and brain activity even.',
  'Low-glycemic': 'Releases energy slowly, avoiding blood-sugar swings.',
  Potassium: 'Helps control blood pressure after a stroke.',
  'B vitamins': 'Support nerve repair and energy.',
  Protein: 'Repairs muscle and supports recovery.',
  Flavonoids: 'Berry and citrus compounds linked to better memory and blood flow.',
}

export const PROFILES: Record<Condition, Profile> = {
  pd: {
    dietName: 'MIND diet + protein timing',
    dietTip:
      'Take levodopa 30–60 min before meals, and save most protein for dinner so it does not block the medicine.',
    keyNutrient: 'Tyrosine',
    meals: [
      {
        id: 'pd-b',
        slot: 'Breakfast',
        time: '8:30 AM',
        name: 'Blueberry walnut oatmeal',
        why: 'Low protein so your morning medicine absorbs well. Fiber helps with constipation.',
        nutrients: ['Polyphenols', 'Omega-3', 'Fiber'],
        prepMin: 8,
        steps: ['Simmer ½ cup oats in 1 cup water for 5 minutes.', 'Top with ½ cup blueberries and 1 tbsp chopped walnuts.', 'Finish with a pinch of cinnamon.'],
        ingredients: [
          { item: 'Rolled oats', week: '1 canister (18 oz)', aisle: 'Pantry' },
          { item: 'Blueberries', week: '3 pints', aisle: 'Produce' },
          { item: 'Walnuts', week: '8 oz bag', aisle: 'Pantry' },
          { item: 'Cinnamon', week: '1 jar', aisle: 'Pantry' },
        ],
      },
      {
        id: 'pd-l',
        slot: 'Lunch',
        time: '12:30 PM',
        name: 'Mediterranean veggie grain bowl',
        why: 'Colorful vegetables and olive oil give antioxidants with light protein.',
        nutrients: ['Polyphenols', 'Vitamin E', 'Fiber'],
        prepMin: 15,
        steps: ['Warm 1 cup cooked farro or brown rice.', 'Add cucumber, cherry tomatoes, spinach and roasted peppers.', 'Dress with olive oil and lemon; sprinkle with sunflower seeds.'],
        ingredients: [
          { item: 'Farro or brown rice', week: '2 lb bag', aisle: 'Pantry' },
          { item: 'Cucumbers', week: '3', aisle: 'Produce' },
          { item: 'Cherry tomatoes', week: '2 pints', aisle: 'Produce' },
          { item: 'Baby spinach', week: '2 large tubs', aisle: 'Produce' },
          { item: 'Extra-virgin olive oil', week: '1 bottle', aisle: 'Pantry' },
          { item: 'Sunflower seeds', week: '1 small bag', aisle: 'Pantry' },
        ],
      },
      {
        id: 'pd-s',
        slot: 'Snack',
        time: '3:30 PM',
        name: 'Apple slices + green tea',
        why: 'Hydrating, gentle and full of antioxidants between doses.',
        nutrients: ['Polyphenols', 'Fiber'],
        prepMin: 3,
        steps: ['Slice one apple.', 'Brew a cup of green tea and let it cool slightly.'],
        ingredients: [
          { item: 'Apples', week: '7', aisle: 'Produce' },
          { item: 'Green tea bags', week: '1 box', aisle: 'Pantry' },
        ],
      },
      {
        id: 'pd-d',
        slot: 'Dinner',
        time: '6:30 PM',
        name: 'Baked salmon, quinoa & broccoli',
        why: 'Your main protein meal. Salmon gives omega-3s and tyrosine for dopamine.',
        nutrients: ['Omega-3', 'Tyrosine', 'Protein'],
        prepMin: 25,
        steps: ['Bake a 5 oz salmon fillet at 400°F for 12–15 minutes.', 'Cook ½ cup quinoa.', 'Roast broccoli with olive oil and garlic.'],
        ingredients: [
          { item: 'Salmon fillets', week: '4 × 5 oz', aisle: 'Protein' },
          { item: 'Quinoa', week: '1 lb bag', aisle: 'Pantry' },
          { item: 'Broccoli', week: '3 heads', aisle: 'Produce' },
          { item: 'Garlic', week: '1 bulb', aisle: 'Produce' },
        ],
      },
    ],
    prepPlan: [
      'Sunday: cook a big batch of farro and quinoa; store in 5 containers.',
      'Wash and chop cucumbers, peppers and broccoli.',
      'Portion walnuts and sunflower seeds into small cups.',
      'Set pill organizer next to the oats so medicine comes first.',
    ],
    exercises: [
      { id: 'pd-1', name: 'BIG reach and step', seconds: 60, goal: 'Bigger, bolder movement', cues: ['Stand tall, feet apart.', 'Step forward and reach both arms up and out as BIG as you can.', 'Return and switch legs. Think "big".'] },
      { id: 'pd-2', name: 'Sit-to-stand', seconds: 45, goal: 'Leg strength', cues: ['Scoot to the edge of a firm chair.', 'Nose over toes, push up tall.', 'Sit back down slowly.'] },
      { id: 'pd-3', name: 'Heel-to-toe balance walk', seconds: 60, goal: 'Balance and fall prevention', cues: ['Walk along a counter for support.', 'Place heel right in front of toes.', 'Eyes forward, slow and steady.'] },
      { id: 'pd-4', name: 'Big arm swings', seconds: 45, goal: 'Loosen stiffness', cues: ['March in place.', 'Swing arms wide and high.', 'Count out loud to keep a rhythm.'] },
    ],
    routines: [
      { id: 'morning', label: 'Morning', window: '8:30 – 11:00 AM', note: 'Peak "on" time after your morning dose. Best time for exercise.', items: [
        { id: 'm1', text: 'Take morning medicine (8:00 AM)' },
        { id: 'm2', text: 'BIG movement session, 15 min' },
        { id: 'm3', text: 'Balance walk' },
        { id: 'm4', text: 'Drink 2 glasses of water' },
      ] },
      { id: 'afternoon', label: 'Afternoon', window: '2:00 – 4:00 PM', note: 'Second stable window. Good for errands and hobbies.', items: [
        { id: 'a1', text: 'Midday medicine (12:00 PM)' },
        { id: 'a2', text: 'Handwriting practice, 10 min' },
        { id: 'a3', text: 'Short walk outside' },
      ] },
      { id: 'evening', label: 'Evening', window: 'After 6:00 PM', note: 'Signals get less steady. Keep things calm.', items: [
        { id: 'e1', text: 'Gentle stretching, 10 min' },
        { id: 'e2', text: 'Screens off by 9:30 PM' },
        { id: 'e3', text: 'Lay out clothes for tomorrow' },
      ] },
    ],
    tasks: [
      { id: 't1', text: 'Take levodopa', cat: 'health', time: '8:00 AM' },
      { id: 't2', text: 'BIG movement session', cat: 'health', window: 'physical' },
      { id: 't3', text: 'Log tremor in check-in', cat: 'health', time: '8:00 PM' },
      { id: 't4', text: 'Grocery run', cat: 'living', window: 'physical' },
      { id: 't5', text: 'Pay electric bill online', cat: 'living', window: 'focus' },
      { id: 't6', text: 'Water the plants', cat: 'living' },
      { id: 't7', text: 'Refill-port visit with Dr. Okafor', cat: 'care', time: 'Dec 22, 10:00 AM' },
      { id: 't8', text: 'Speech therapy (telehealth)', cat: 'care', time: 'Thu, 2:30 PM' },
    ],
    dayCurve: [55, 62, 80, 90, 92, 86, 72, 66, 78, 86, 84, 70, 60, 55, 50, 48, 52],
    windows: { physical: '9 – 11 AM', focus: '2 – 4 PM', rest: '7 – 10 PM' },
  },

  epilepsy: {
    dietName: 'Low-glycemic, modified Atkins style',
    dietTip:
      'Eat at regular times and never skip meals. Steady blood sugar means steadier brain activity.',
    keyNutrient: 'Magnesium',
    meals: [
      {
        id: 'ep-b',
        slot: 'Breakfast',
        time: '7:30 AM',
        name: 'Spinach & feta egg scramble with avocado',
        why: 'High in healthy fat and protein with almost no sugar spike.',
        nutrients: ['Healthy fats', 'Magnesium', 'Low-glycemic'],
        prepMin: 10,
        steps: ['Whisk 2 eggs.', 'Wilt a handful of spinach in olive oil, add eggs and stir gently.', 'Top with feta and serve with ½ avocado.'],
        ingredients: [
          { item: 'Eggs', week: '1 dozen', aisle: 'Dairy & eggs' },
          { item: 'Baby spinach', week: '2 large tubs', aisle: 'Produce' },
          { item: 'Feta cheese', week: '6 oz', aisle: 'Dairy & eggs' },
          { item: 'Avocados', week: '4', aisle: 'Produce' },
        ],
      },
      {
        id: 'ep-l',
        slot: 'Lunch',
        time: '12:00 PM',
        name: 'Grilled chicken salad with pumpkin seeds',
        why: 'Pumpkin seeds are one of the best sources of magnesium.',
        nutrients: ['Magnesium', 'Protein', 'Healthy fats'],
        prepMin: 12,
        steps: ['Slice pre-grilled chicken breast.', 'Toss romaine, cucumber and olive oil vinaigrette.', 'Top with 2 tbsp pumpkin seeds.'],
        ingredients: [
          { item: 'Chicken breasts', week: '2 lb', aisle: 'Protein' },
          { item: 'Romaine hearts', week: '3', aisle: 'Produce' },
          { item: 'Cucumbers', week: '2', aisle: 'Produce' },
          { item: 'Pumpkin seeds', week: '8 oz bag', aisle: 'Pantry' },
          { item: 'Extra-virgin olive oil', week: '1 bottle', aisle: 'Pantry' },
        ],
      },
      {
        id: 'ep-s',
        slot: 'Snack',
        time: '3:30 PM',
        name: 'Almonds + string cheese',
        why: 'Keeps blood sugar even through the afternoon.',
        nutrients: ['Magnesium', 'Healthy fats'],
        prepMin: 1,
        steps: ['Portion a small handful (¼ cup) of almonds.', 'Pair with one string cheese.'],
        ingredients: [
          { item: 'Almonds', week: '1 lb bag', aisle: 'Pantry' },
          { item: 'String cheese', week: '1 pack (12)', aisle: 'Dairy & eggs' },
        ],
      },
      {
        id: 'ep-d',
        slot: 'Dinner',
        time: '6:30 PM',
        name: 'Salmon, cauliflower mash & asparagus',
        why: 'Omega-3s may help calm overactive brain signals.',
        nutrients: ['Omega-3', 'Low-glycemic', 'Protein'],
        prepMin: 25,
        steps: ['Bake salmon at 400°F for 12–15 minutes.', 'Steam cauliflower and mash with butter.', 'Roast asparagus with olive oil.'],
        ingredients: [
          { item: 'Salmon fillets', week: '4 × 5 oz', aisle: 'Protein' },
          { item: 'Cauliflower', week: '2 heads', aisle: 'Produce' },
          { item: 'Asparagus', week: '2 bunches', aisle: 'Produce' },
          { item: 'Butter', week: '1 stick', aisle: 'Dairy & eggs' },
        ],
      },
    ],
    prepPlan: [
      'Sunday: grill all chicken breasts and slice into 5 portions.',
      'Portion almonds into ¼-cup bags.',
      'Steam and mash cauliflower; freeze in 4 portions.',
      'Set 3 meal-time alarms so no meal gets skipped.',
    ],
    exercises: [
      { id: 'ep-1', name: 'Box breathing', seconds: 120, goal: 'Lower stress, a common trigger', cues: ['Breathe in for 4.', 'Hold for 4.', 'Breathe out for 4, hold for 4. Repeat.'] },
      { id: 'ep-2', name: 'Slow vagal breathing', seconds: 180, goal: 'Calm the nervous system', cues: ['Breathe in through the nose for 5 seconds.', 'Breathe out slowly for 5 seconds.', 'About 6 breaths per minute.'] },
      { id: 'ep-3', name: 'Cat-cow and child’s pose', seconds: 90, goal: 'Release tension', cues: ['On hands and knees, arch and round your back slowly.', 'Sit back into child’s pose.', 'Breathe slowly the whole time.'] },
      { id: 'ep-4', name: 'Body-scan relaxation', seconds: 120, goal: 'Better sleep tonight', cues: ['Lie down and close your eyes.', 'Relax from your toes up to your head.', 'Notice each area, then let it go.'] },
    ],
    routines: [
      { id: 'morning', label: 'Morning', window: '7:00 – 10:00 AM', note: 'Wake at the same time every day. Regular sleep protects against seizures.', items: [
        { id: 'm1', text: 'Take seizure medicine (7:30 AM)' },
        { id: 'm2', text: 'Breakfast within 1 hour of waking' },
        { id: 'm3', text: 'Box breathing, 2 min' },
      ] },
      { id: 'afternoon', label: 'Afternoon', window: '10:00 AM – 1:00 PM', note: 'Most stable stretch of your day. Use it for focus work.', items: [
        { id: 'a1', text: 'Gentle yoga or walk, 20 min' },
        { id: 'a2', text: 'Lunch on time' },
        { id: 'a3', text: 'Stress check: rate it in the journal' },
      ] },
      { id: 'evening', label: 'Evening', window: 'After 8:00 PM', note: 'Being tired lowers your seizure threshold. Wind down early.', items: [
        { id: 'e1', text: 'Evening medicine (7:30 PM)' },
        { id: 'e2', text: 'Slow vagal breathing, 3 min' },
        { id: 'e3', text: 'In bed by 10:30 PM' },
      ] },
    ],
    tasks: [
      { id: 't1', text: 'Take morning medicine', cat: 'health', time: '7:30 AM' },
      { id: 't2', text: 'Breathing session', cat: 'health', window: 'rest' },
      { id: 't3', text: 'Log any auras in journal', cat: 'health' },
      { id: 't4', text: 'Work on school project', cat: 'living', window: 'focus' },
      { id: 't5', text: 'Meal prep for tomorrow', cat: 'living', window: 'physical' },
      { id: 't6', text: 'Ask a friend for a ride Thursday', cat: 'living' },
      { id: 't7', text: 'EEG review with Dr. Okafor', cat: 'care', time: 'Mon, 9:00 AM' },
      { id: 't8', text: 'Pharmacy refill pickup', cat: 'care', time: 'Fri' },
    ],
    dayCurve: [70, 74, 80, 86, 90, 92, 88, 84, 80, 78, 76, 74, 70, 66, 62, 58, 56],
    windows: { physical: '4 – 6 PM', focus: '10 AM – 1 PM', rest: '8 – 10 PM' },
  },

  stroke: {
    dietName: 'Anti-inflammatory, low-sodium recovery plan',
    dietTip:
      'Keep salt under 1,500 mg a day to protect blood pressure. Choose soft foods if swallowing is hard.',
    keyNutrient: 'Omega-3',
    meals: [
      {
        id: 'st-b',
        slot: 'Breakfast',
        time: '8:00 AM',
        name: 'Berry, spinach & flax smoothie',
        why: 'Soft, easy to swallow, and full of brain-protecting flavonoids.',
        nutrients: ['Flavonoids', 'Omega-3', 'Fiber'],
        prepMin: 5,
        steps: ['Blend 1 cup mixed berries, a handful of spinach and 1 tbsp ground flax.', 'Add ¾ cup plain Greek yogurt and a splash of milk.', 'Blend until smooth.'],
        ingredients: [
          { item: 'Frozen mixed berries', week: '2 bags', aisle: 'Produce' },
          { item: 'Baby spinach', week: '1 large tub', aisle: 'Produce' },
          { item: 'Ground flaxseed', week: '1 bag', aisle: 'Pantry' },
          { item: 'Plain Greek yogurt', week: '32 oz tub', aisle: 'Dairy & eggs' },
        ],
      },
      {
        id: 'st-l',
        slot: 'Lunch',
        time: '12:30 PM',
        name: 'Low-sodium lentil vegetable soup',
        why: 'Plant protein and B vitamins for nerve repair, without extra salt.',
        nutrients: ['B vitamins', 'Potassium', 'Fiber'],
        prepMin: 35,
        steps: ['Sauté onion, carrot and celery in olive oil.', 'Add 1 cup lentils, no-salt broth and diced tomatoes.', 'Simmer 25 minutes; season with herbs, not salt.'],
        ingredients: [
          { item: 'Dry lentils', week: '1 lb bag', aisle: 'Pantry' },
          { item: 'Carrots, celery, onion', week: '1 bag each', aisle: 'Produce' },
          { item: 'No-salt vegetable broth', week: '2 cartons', aisle: 'Pantry' },
          { item: 'No-salt diced tomatoes', week: '2 cans', aisle: 'Pantry' },
        ],
      },
      {
        id: 'st-s',
        slot: 'Snack',
        time: '3:30 PM',
        name: 'Banana + unsalted walnuts',
        why: 'Potassium helps manage blood pressure.',
        nutrients: ['Potassium', 'Omega-3'],
        prepMin: 1,
        steps: ['Peel a banana.', 'Pair with a small handful of unsalted walnuts.'],
        ingredients: [
          { item: 'Bananas', week: '7', aisle: 'Produce' },
          { item: 'Unsalted walnuts', week: '8 oz bag', aisle: 'Pantry' },
        ],
      },
      {
        id: 'st-d',
        slot: 'Dinner',
        time: '6:00 PM',
        name: 'Baked trout, sweet potato & greens',
        why: 'Omega-3s and antioxidants support healing brain tissue.',
        nutrients: ['Omega-3', 'Potassium', 'Vitamin E'],
        prepMin: 30,
        steps: ['Bake trout with lemon and dill at 400°F for 12 minutes.', 'Roast cubed sweet potato for 25 minutes.', 'Sauté kale with garlic and olive oil until soft.'],
        ingredients: [
          { item: 'Trout fillets', week: '4', aisle: 'Protein' },
          { item: 'Sweet potatoes', week: '4', aisle: 'Produce' },
          { item: 'Kale', week: '2 bunches', aisle: 'Produce' },
          { item: 'Lemons', week: '3', aisle: 'Produce' },
        ],
      },
    ],
    prepPlan: [
      'Sunday: make a big pot of lentil soup; freeze in 5 portions.',
      'Pre-pack smoothie bags (berries + spinach + flax) for 5 days.',
      'Use pre-cut vegetables if hand strength is limited.',
      'Ask a family member to help with chopping and heavy pots.',
    ],
    exercises: [
      { id: 'st-1', name: 'Finger taps and spreads', seconds: 60, goal: 'Fine-motor control', cues: ['Rest your hand on the table.', 'Tap each finger to your thumb, one by one.', 'Then spread all fingers wide. Repeat.'] },
      { id: 'st-2', name: 'Coin pickup', seconds: 90, goal: 'Grip and dexterity', cues: ['Spread 10 coins on the table.', 'Pick up each one with your weaker hand.', 'Drop it into a cup.'] },
      { id: 'st-3', name: 'Mirror hand opening', seconds: 120, goal: 'Rewire movement (neuroplasticity)', cues: ['Place a mirror so it reflects your strong hand.', 'Open and close the strong hand while watching the mirror.', 'Try to move the weaker hand at the same time.'] },
      { id: 'st-4', name: 'Supported sit-to-stand', seconds: 60, goal: 'Leg strength and balance', cues: ['Hold a sturdy counter or walker.', 'Stand up evenly on both legs.', 'Sit down slowly with control.'] },
    ],
    routines: [
      { id: 'morning', label: 'Morning', window: '10:00 AM – 12:00 PM', note: 'Most energy and steadiest signals. Do your hardest therapy here.', items: [
        { id: 'm1', text: 'Blood pressure check' },
        { id: 'm2', text: 'Hand dexterity reps, 15 min' },
        { id: 'm3', text: 'Mirror therapy, 10 min' },
        { id: 'm4', text: 'Take medicines with breakfast' },
      ] },
      { id: 'afternoon', label: 'Afternoon', window: '1:00 – 3:00 PM', note: 'Fatigue is common after a stroke. Plan a rest here.', items: [
        { id: 'a1', text: 'Rest or nap, 30 min' },
        { id: 'a2', text: 'Speech or word-game practice' },
        { id: 'a3', text: 'Short supported walk' },
      ] },
      { id: 'evening', label: 'Evening', window: 'After 7:00 PM', note: 'Keep it calm so your brain can recover overnight.', items: [
        { id: 'e1', text: 'Gentle range-of-motion stretches' },
        { id: 'e2', text: 'Evening medicines' },
        { id: 'e3', text: 'Lights out by 10:00 PM' },
      ] },
    ],
    tasks: [
      { id: 't1', text: 'Check blood pressure', cat: 'health', time: '8:00 AM' },
      { id: 't2', text: 'Hand therapy reps', cat: 'health', window: 'physical' },
      { id: 't3', text: 'Take blood thinner', cat: 'health', time: '8:00 PM' },
      { id: 't4', text: 'Write a short letter by hand', cat: 'living', window: 'focus' },
      { id: 't5', text: 'Fold laundry (seated)', cat: 'living', window: 'physical' },
      { id: 't6', text: 'Video call with grandkids', cat: 'living', window: 'rest' },
      { id: 't7', text: 'Occupational therapy', cat: 'care', time: 'Tue, 11:00 AM' },
      { id: 't8', text: 'Refill-port visit with Dr. Okafor', cat: 'care', time: 'Dec 22, 10:00 AM' },
    ],
    dayCurve: [58, 64, 70, 78, 86, 90, 84, 68, 60, 64, 70, 72, 68, 62, 58, 55, 54],
    windows: { physical: '10 AM – 12 PM', focus: '4 – 6 PM', rest: '1 – 3 PM' },
  },
}

export const WINDOW_LABEL: Record<WindowKind, string> = {
  physical: 'Best for movement',
  focus: 'Best for focus',
  rest: 'Best for rest',
}

/** Sample last 7 nights. */
export const SAMPLE_SLEEP = [
  { hours: 6.1, quality: 2, stability: 71 },
  { hours: 7.4, quality: 4, stability: 86 },
  { hours: 5.6, quality: 2, stability: 64 },
  { hours: 7.8, quality: 4, stability: 89 },
  { hours: 8.0, quality: 5, stability: 92 },
  { hours: 6.6, quality: 3, stability: 77 },
  { hours: 7.5, quality: 4, stability: 87 },
]

export const CLINICIAN = 'Dr. Amara Okafor'
