// Sorunun içindeki hasar tarihini bulur: "20 February 2026", "20 Feb 2026", "20/02/2026", "20 Şubat 2026".
// Bulunan tarih poliçe şartlarının hangi sürümünün geçerli olduğunu belirler (Hasar İşlem Talimatı 3.2).

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  oca: 1, şub: 2, sub: 2, nis: 4, haz: 6, tem: 7, ağu: 8, agu: 8, eyl: 9, eki: 10, kas: 11, ara: 12
};

const iso = (y: number, m: number, d: number) => {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export function findDate(text: string): string | null {
  const t = text.toLocaleLowerCase('tr');
  let m = /(\d{1,2})\s+([a-zçğıöşü]{3,9})\.?\s+(\d{4})/.exec(t);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 4)] ?? MONTHS[m[2].slice(0, 3)];
    if (mon) return iso(+m[3], mon, +m[1]);
  }
  m = /(\d{1,2})[/.](\d{1,2})[/.](\d{4})/.exec(t);
  if (m) return iso(+m[3], +m[2], +m[1]);
  return null;
}
