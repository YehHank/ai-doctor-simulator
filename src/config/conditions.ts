
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
  "糖尿病",
  "高血壓",
  "脂肪肝",
  "骨質疏鬆症",
  "關節炎",
  "憂鬱症",
  "焦慮症",
  "便秘",
  "氣喘",
  "消化性潰瘍",
  "蕁麻疹",
  "濕疹",
  "痛風",
  "帶狀皰疹",
  "甲狀腺功能低下",
  "中耳炎",
  "急性支氣管炎",
  "過敏性鼻炎", // 雖然已有季節性過敏，但過敏性鼻炎更明確
  "尿道感染",
  "貧血"
];

export const getRandomCondition = (): string => {
  return medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
};

