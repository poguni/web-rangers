// 기기 설정(PRD 9.3 webrangers.v1.settings): 교사 PIN. 학생의 실수 진입을 막는 용도라 간단한 해시만 씀(F10-1)
const SETTINGS_KEY = "webrangers.v1.settings";
const UNLOCK_KEY = "webrangers.v1.teacher";

interface Settings {
  pinHash?: string;
}

function read(): Settings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Settings;
  } catch {
    return {};
  }
}

/** FNV-1a: PIN을 그대로 저장하지 않으려는 것뿐, 보안용 암호화는 아님 */
export function hashPin(pin: string): string {
  let h = 0x811c9dc5;
  for (const ch of `webrangers:${pin}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

export const hasPin = () => Boolean(read().pinHash);
export const checkPin = (pin: string) => read().pinHash === hashPin(pin);

export function setPin(pin: string) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...read(), pinHash: hashPin(pin) }));
}

/** 교사 메뉴를 한 번 열면 브라우저를 닫을 때까지 열려 있음 */
export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setUnlocked(on: boolean) {
  try {
    if (on) sessionStorage.setItem(UNLOCK_KEY, "1");
    else sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    // 무시: 이번 화면에서만 열림
  }
}
