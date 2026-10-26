// 00 시작: 학년·반·번호를 입력란에 쓰기(이름 입력란 없음), 손님으로 시작, 접속 QR 코드, 교사 메뉴(F1-1)
import { useRef, useState, type FormEvent } from "react";
import { AppBar } from "../components/common";
import { QrCode, QrDialog } from "../components/qr";
import { GUEST, studentLabel, useProgress } from "../store/progress";
import { josa } from "../utils/korean";

type Key = "g" | "c" | "n";
const FIELDS: { key: Key; name: string; unit: string; max: number; digits: number }[] = [
  { key: "g", name: "학년", unit: "학년", max: 6, digits: 1 },
  { key: "c", name: "반", unit: "반", max: 15, digits: 2 },
  { key: "n", name: "번호", unit: "번", max: 40, digits: 2 },
];

/** 입력값이 1~max 사이 정수이면 그 수, 아니면 null */
const valueOf = (s: string, max: number) => {
  const v = Number(s);
  return /^\d+$/.test(s) && v >= 1 && v <= max ? v : null;
};

export function StartScreen() {
  const login = useProgress((s) => s.login);
  const [text, setText] = useState<Record<Key, string>>({ g: "", c: "", n: "" });
  const [qrOpen, setQrOpen] = useState(false);
  const inputs = useRef<Partial<Record<Key, HTMLInputElement | null>>>({});
  const values = FIELDS.map((f) => valueOf(text[f.key], f.max));
  const ready = values.every((v) => v !== null);
  const key = ready ? values.join("-") : "";
  const wrong = FIELDS.find((f, i) => text[f.key] !== "" && values[i] === null);

  function change(k: Key, s: string, i: number) {
    const digits = s.replace(/\D/g, "").slice(0, FIELDS[i].digits);
    setText({ ...text, [k]: digits });
    // 칸을 다 채우면(또는 더 붙일 수 없는 수이면) 다음 칸으로
    const next = FIELDS[i + 1];
    if (next && digits.length > 0 && (digits.length === FIELDS[i].digits || Number(digits) * 10 > FIELDS[i].max)) inputs.current[next.key]?.focus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ready) login(key);
  }

  return (
    <div className="screen start" style={{ backgroundImage: "url(img/ui/ui-bg-start.webp)" }}>
      <AppBar>
        <a className="iconbtn" href="#/teacher" aria-label="교사 메뉴">
          🔒
        </a>
      </AppBar>
      <main className="body">
        <form className="panel start-card" onSubmit={submit}>
          <h1>탐험대원 번호를 써 주세요</h1>
          <p className="sub">학년, 반, 번호를 숫자로 써 주세요. 이름은 쓰지 않아요.</p>
          <div className="id-row">
            {FIELDS.map((f, i) => (
              <label key={f.key} className="id-field">
                <input
                  ref={(el) => {
                    inputs.current[f.key] = el;
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={f.digits}
                  value={text[f.key]}
                  aria-label={f.name}
                  aria-invalid={values[i] === null && text[f.key] !== ""}
                  autoFocus={i === 0}
                  onChange={(e) => change(f.key, e.target.value, i)}
                />
                <span>{f.unit}</span>
              </label>
            ))}
          </div>
          <p className="id-hint" role="status">
            {wrong && `${josa(wrong.name, "은/는")} 1부터 ${wrong.max}까지 쓸 수 있어요.`}
          </p>
          <button type="submit" className="btn gold" disabled={!ready}>
            {ready ? `${studentLabel(key)}으로 시작 →` : "번호를 모두 써 주세요"}
          </button>
          <button type="button" className="btn ghost" onClick={() => login(GUEST)}>
            손님으로 시작
          </button>
        </form>
        <button className="qr-chip" aria-label="접속 QR 코드 크게 보기" onClick={() => setQrOpen(true)}>
          <QrCode size={64} />
          <span>
            QR로
            <br />
            접속하기
          </span>
        </button>
      </main>
      {qrOpen && <QrDialog onClose={() => setQrOpen(false)} />}
    </div>
  );
}
