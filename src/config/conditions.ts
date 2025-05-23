
export const medicalConditions: string[] = [
  "普通感冒",
  "季節性過敏",
  "輕微食物中毒",
  "緊張性頭痛",
  "失眠",
  "流行性感冒",
  "腸胃炎",
  "偏頭痛",
  "胃食道逆流",
  "鼻竇炎",
];

export const getRandomCondition = (): string => {
  return medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
};
