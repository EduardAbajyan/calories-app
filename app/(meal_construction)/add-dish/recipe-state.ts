export type GenerateRecipeState = {
  recipe: string;
  error: string | null;
  generated: boolean;
};

export const initialGenerateRecipeState: GenerateRecipeState = {
  recipe: "",
  error: null,
  generated: false,
};