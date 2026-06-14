import MealsPage from "./page";

type RawSearchParams = {
  [key: string]: string | string[] | undefined;
};

type MealsSearchParams = {
  mealQ?: string;
  dishQ?: string;
  foodQ?: string;
  success?: string;
  error?: string;
};

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function MealsDefault({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const normalized: MealsSearchParams = {
    mealQ: toSingleValue(searchParams.mealQ),
    dishQ: toSingleValue(searchParams.dishQ),
    foodQ: toSingleValue(searchParams.foodQ),
    success: toSingleValue(searchParams.success),
    error: toSingleValue(searchParams.error),
  };

  return <MealsPage searchParams={Promise.resolve(normalized)} />;
}
