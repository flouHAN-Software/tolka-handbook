// Belge kütüphanesinin veri modeli.
// Metin içinde **kelime** tanımlı terimi (kalın) gösterir; belge görüntüleyici ve arama bunu bilir.

export type RoleId = 'care' | 'claims' | 'siu' | 'knowledge';
export type Team = 'underwriting' | 'household' | 'siu' | 'care' | 'relations' | 'leadership' | 'knowledge';
export type Classification = 'public' | 'internal' | 'confidential' | 'strict';
export type DocKind = 'wording' | 'ipid' | 'manual' | 'guide' | 'table' | 'procedure' | 'callguide' | 'list';

export type Block =
  | { t: 'p'; text: string }
  | { t: 'list'; items: { n?: string; text: string }[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'note'; text: string };

/** Madde: aramada ve alıntıda en küçük birim (ör. 7.3) */
export interface Clause {
  n: string;
  heading?: string;
  blocks: Block[];
}

export interface Section {
  n: string;
  title: string;
  page: number;
  clauses: Clause[];
}

export interface Person {
  name: string;
  team: Team;
}

export interface Doc {
  id: string;
  title: string;
  kind: DocKind;
  version: string;
  file: string;
  pages: number;
  /** ISO tarih */
  inForce: string;
  reviewedOn: string;
  reviewDue: string;
  owner: Person;
  classification: Classification;
  /** Belgeyi açabilen roller */
  audience: RoleId[];
  /** Kütüphaneye eklenme tarihi */
  added: string;
  /** Hazır, işleniyor ya da okunamadı */
  status: 'ready' | 'processing' | 'failed';
  /** Okunamadıysa nedeni (taranmış, parolalı, bozuk, boş) */
  failReason?: 'scan' | 'password' | 'unreadable' | 'empty';
  /** Bu tarayıcıda kullanıcının eklediği belge */
  uploaded?: boolean;
  /** İşlenen belgede kaçıncı sayfada olduğu (açılış anı) */
  readingPage?: number;
  /** Önceki / sonraki sürüm ve önceki sürümün hâlâ geçerli olduğu durum */
  supersedes?: string;
  supersededBy?: string;
  stillApplies?: string;
  sections: Section[];
}

/** Uygulamanın "bugünü": belgelerin gözden geçirme durumu buna göre hesaplanır */
export const DEMO_TODAY = '2026-11-24';
