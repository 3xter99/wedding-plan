export const DEFAULT_CATEGORIES = [
  "АгроУсадьба",
  "Кейтеринг",
  "Декор",
  "Одежда",
  "Фото/видео",
  "Музыка",
  "Прочее",
] as const;

export type BudgetCategory = (typeof DEFAULT_CATEGORIES)[number];
