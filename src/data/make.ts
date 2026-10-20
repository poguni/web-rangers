// 강·바다 데이터용 생물 카드 만들기(숲 데이터의 sp()와 같은 모양)
import type { Review, Species, Theme } from "./types";

export function speciesMaker(theme: Theme, sources: string[], review: Review[]) {
  return (
    key: string,
    name: string,
    role: Species["role"],
    layer: number,
    habitat: string,
    fact: string,
    prey: [string, number][] = [],
    extra: Partial<Species> = {},
  ): Species => ({
    id: `${theme}.${key}`,
    theme,
    name,
    role,
    layer,
    image: `img/${theme}/${theme}-${key}`,
    habitat,
    fact,
    prey: prey.map(([id, preference]) => ({ id: `${theme}.${id}`, preference })),
    sources,
    review,
    ...extra,
  });
}
