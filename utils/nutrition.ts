export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface ProfileData {
  age: string;
  sex: Sex;
  height: string;
  weight: string;
  activity: ActivityLevel;
  goal: Goal;
}

export const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const activityLabels = {
  sedentary: { label: 'Sedentary', desc: 'Minimal movement (study/office)' },
  light: { label: 'Lightly Active', desc: 'Light exercise 1-3 days/wk' },
  moderate: { label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/wk' },
  active: { label: 'Very Active', desc: 'Hard exercise 6-7 days/wk' },
  veryActive: { label: 'Athlete', desc: 'Very hard exercise & physical job' },
};

export function calculateNutrition(profile: ProfileData) {
  const w = parseFloat(profile.weight);
  const h = parseFloat(profile.height);
  const a = parseInt(profile.age);

  if (!w || !h || !a) return { calories: 0, protein: 0, fat: 0, carbs: 0 };


  const bmr = profile.sex === 'male'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;


  const tdee = bmr * activityFactors[profile.activity];

  let targetCalories = tdee;
  if (profile.goal === 'lose') targetCalories = tdee - 450;
  if (profile.goal === 'gain') targetCalories = tdee + 450;

  const finalCal = Math.round(targetCalories);

  const protein = Math.round(w * 2.1);
  const fat = Math.round(w * 0.9);
  const remainingCal = finalCal - (protein * 4 + fat * 9);
  const carbs = Math.max(0, Math.round(remainingCal / 4));

  return { calories: finalCal, protein, fat, carbs };
}
