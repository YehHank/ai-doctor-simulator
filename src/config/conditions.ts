export const medicalConditions: string[] = [
  "Common Cold",
  "Seasonal Allergies",
  "Mild Food Poisoning",
  "Tension Headache",
  "Insomnia",
  "Influenza (Flu)",
  "Gastroenteritis (Stomach Flu)",
  "Migraine",
  "Acid Reflux (GERD)",
  "Sinusitis",
];

export const getRandomCondition = (): string => {
  return medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
};
