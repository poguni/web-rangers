// 한국어 조사 자동 선택(받침 여부): josa("개구리", "이/가") → "개구리가"
type Pair = "이/가" | "을/를" | "은/는" | "과/와";

function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

export function josa(word: string, pair: Pair): string {
  const [withFinal, withoutFinal] = pair.split("/");
  return word + (hasFinalConsonant(word) ? withFinal : withoutFinal);
}
