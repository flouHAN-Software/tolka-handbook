// Tolka konut poliçesi şartları. Metin özgündür; gerçek bir poliçeden alınmadı.
// 2024.2 sürümü 2026.1'den türetilir: yalnızca değişen maddeler aşağıda ayrıca yazılır.
import type { Clause, Doc, Section } from '../types';

const sections2026: Section[] = [
  {
    n: '1', title: 'About this policy', page: 3, clauses: [
      { n: '1.1', blocks: [{ t: 'p', text: 'This policy is a contract between you and Tolka Insurance DAC. It is made up of this policy wording, your schedule and any endorsements we send you. Please read them together.' }] },
      { n: '1.2', blocks: [{ t: 'p', text: 'We insure you for the events set out in this wording that happen during the **period of insurance**, as long as you have paid the premium.' }] },
      { n: '1.3', blocks: [{ t: 'p', text: 'You can cancel within 14 days of receiving your policy documents, or of the start of cover if that is later. We will refund the full premium, as long as you have not made a claim.' }] },
      { n: '1.4', blocks: [{ t: 'p', text: 'Words in bold have the meanings given in section 2.' }] }
    ]
  },
  {
    n: '2', title: 'Definitions', page: 5, clauses: [
      { n: '2.1', heading: 'Buildings', blocks: [{ t: 'p', text: 'The structure of your **home** and its permanent fixtures and fittings, including fitted kitchens and bathrooms, fixed floor coverings other than carpets, boundary walls, gates, fences, paths, driveways and patios within the boundary of the land shown on your schedule.' }] },
      { n: '2.2', heading: 'Contents', blocks: [{ t: 'p', text: 'Household goods and personal belongings that you own or are legally responsible for, including carpets, curtains and **valuables**. Contents does not include motor vehicles, caravans, boats, cash above €500, or anything that forms part of the **buildings**.' }] },
      { n: '2.3', heading: 'Excess', blocks: [{ t: 'p', text: 'The amount you pay towards each claim. The excess for each type of claim is shown in the section for that cover and on your schedule. We deduct it from the amount we pay you.' }] },
      { n: '2.4', heading: 'Home', blocks: [{ t: 'p', text: 'The private house or apartment at the address on your schedule, used only for domestic purposes.' }] },
      { n: '2.5', heading: 'Period of insurance', blocks: [{ t: 'p', text: 'The period shown on your schedule, and any further period for which you renew and we accept your premium.' }] },
      { n: '2.6', heading: 'Sudden', blocks: [{ t: 'p', text: 'Happening quickly and unexpectedly, at a time that can be identified.' }] },
      { n: '2.7', heading: 'Unoccupied', blocks: [{ t: 'p', text: 'Not lived in by you or a member of your family. Your **home** is lived in when someone sleeps there on a regular basis.' }] },
      { n: '2.8', heading: 'Valuables', blocks: [{ t: 'p', text: 'Jewellery, watches, items made of gold, silver or other precious metals, works of art, and collections of stamps or coins.' }] }
    ]
  },
  {
    n: '3', title: 'Buildings cover', page: 8, clauses: [
      { n: '3.1', blocks: [
        { t: 'p', text: 'We will pay for loss or damage to the **buildings** caused by any of the following, subject to the exclusions in each section and in section 12:' },
        { t: 'list', items: [
          { n: '(a)', text: 'fire, smoke, lightning, explosion or earthquake;' },
          { n: '(b)', text: 'storm or flood (section 5);' },
          { n: '(c)', text: 'freezing of water (section 6);' },
          { n: '(d)', text: 'escape of water or oil (section 7);' },
          { n: '(e)', text: 'subsidence, heave or landslip (section 8);' },
          { n: '(f)', text: 'theft or attempted theft (section 9);' },
          { n: '(g)', text: 'impact by a vehicle, an aircraft, a falling tree or a television aerial;' },
          { n: '(h)', text: 'malicious damage, other than by you or by anyone lawfully in your **home**.' }
        ] }
      ] },
      { n: '3.2', blocks: [{ t: 'p', text: 'The most we will pay is the buildings sum insured shown on your schedule. We will pay the cost of repairing or rebuilding to the same standard, but not a better one, using modern materials where suitable.' }] },
      { n: '3.3', blocks: [{ t: 'p', text: 'We will not reduce your sum insured after a claim, as long as you carry out the repairs we agree.' }] }
    ]
  },
  {
    n: '4', title: 'Contents cover', page: 11, clauses: [
      { n: '4.1', blocks: [{ t: 'p', text: 'We will pay for loss or damage to your **contents** in your **home** caused by any of the events listed in 3.1.' }] },
      { n: '4.2', blocks: [{ t: 'p', text: 'We will replace items as new, except clothing and household linen, for which we will make a deduction for wear and tear.' }] },
      { n: '4.3', blocks: [{ t: 'p', text: 'The most we will pay for any one item of **valuables** is €2,000, and €7,500 for all **valuables** together, unless the item is listed on your schedule.' }] },
      { n: '4.4', blocks: [{ t: 'p', text: '**Contents** in the garden or in a shed or outbuilding are covered up to €1,500 in total.' }] }
    ]
  },
  {
    n: '5', title: 'Storm and flood', page: 12, clauses: [
      { n: '5.1', blocks: [{ t: 'p', text: 'We will pay for loss or damage caused by storm or flood.' }] },
      { n: '5.2', blocks: [
        { t: 'p', text: 'We will not pay for:' },
        { t: 'list', items: [
          { n: '(a)', text: 'the first €400 of each claim;' },
          { n: '(b)', text: 'damage to fences, gates and hedges caused by storm;' },
          { n: '(c)', text: 'flood damage, if your schedule shows that flood cover does not apply to your **home**.' }
        ] }
      ] }
    ]
  },
  {
    n: '6', title: 'Freezing', page: 13, clauses: [
      { n: '6.1', blocks: [{ t: 'p', text: 'We will pay for damage to the **buildings** caused by water freezing in a fixed water or heating installation.' }] },
      { n: '6.2', blocks: [{ t: 'p', text: 'If your **home** is **unoccupied** for more than 45 days in a row between 1 November and 31 March, we will only pay under this section if the heating was kept on at 12°C or more, or the water was turned off at the mains and the system drained.' }] }
    ]
  },
  {
    n: '7', title: 'Escape of water', page: 14, clauses: [
      { n: '7.1', blocks: [{ t: 'p', text: 'We will pay for loss or damage to your **buildings** and **contents** caused by water or oil escaping **suddenly** from a fixed water or heating installation, a washing machine, dishwasher, fridge-freezer or water bed.' }] },
      { n: '7.2', blocks: [{ t: 'p', text: 'We will also pay the cost of removing and replacing any part of the **buildings** needed to find where the water escaped from, up to €2,500 in any one **period of insurance**.' }] },
      { n: '7.3', blocks: [
        { t: 'p', text: 'We will not pay for:' },
        { t: 'list', items: [
          { n: '(a)', text: 'the first €400 of each claim (your escape of water excess);' },
          { n: '(b)', text: 'damage caused by water escaping gradually over a period of time, where you knew about it, or could reasonably have been expected to know about it, and did not take reasonable steps to stop it;' },
          { n: '(c)', text: 'loss or damage while your **home** is **unoccupied** for more than 45 days in a row, unless the water was turned off at the mains and the system drained;' },
          { n: '(d)', text: 'the cost of repairing the installation or appliance the water escaped from, except under clause 7.2.' }
        ] }
      ] }
    ]
  },
  {
    n: '8', title: 'Subsidence, heave and landslip', page: 16, clauses: [
      { n: '8.1', blocks: [{ t: 'p', text: 'We will pay for loss or damage to the **buildings** caused by subsidence or heave of the site the **buildings** stand on, or by landslip.' }] },
      { n: '8.2', blocks: [
        { t: 'p', text: 'We will not pay for:' },
        { t: 'list', items: [
          { n: '(a)', text: 'the first €1,000 of each claim;' },
          { n: '(b)', text: 'damage caused by new structures settling, shrinking or bedding down in the first ten years after they were built;' },
          { n: '(c)', text: 'damage to patios, paths, driveways, walls, gates and fences, unless the house itself is damaged by the same cause at the same time;' },
          { n: '(d)', text: 'damage caused by coastal or river erosion;' },
          { n: '(e)', text: 'damage that started before your first **period of insurance** with us.' }
        ] }
      ] },
      { n: '8.3', blocks: [{ t: 'p', text: 'You must tell us before cover starts if you know of any cracking or movement in your **home**.' }] }
    ]
  },
  {
    n: '9', title: 'Theft', page: 18, clauses: [
      { n: '9.1', blocks: [{ t: 'p', text: 'We will pay for loss or damage caused by theft or attempted theft.' }] },
      { n: '9.2', blocks: [
        { t: 'p', text: 'We will not pay for:' },
        { t: 'list', items: [
          { n: '(a)', text: 'theft while your **home** is **unoccupied** for more than 45 days in a row;' },
          { n: '(b)', text: 'theft by anyone lawfully in your **home**, unless force was used to get in or out;' },
          { n: '(c)', text: 'theft from the garden of anything that was not secured to the ground or to the **buildings**;' },
          { n: '(d)', text: 'theft of **contents** from a shed or outbuilding, unless there are signs that someone broke in.' }
        ] }
      ] },
      { n: '9.3', blocks: [{ t: 'p', text: 'You must report any theft to An Garda Síochána within 24 hours of discovering it, and give us the incident number.' }] }
    ]
  },
  {
    n: '10', title: 'Accidental damage (optional)', page: 20, clauses: [
      { n: '10.1', blocks: [{ t: 'p', text: 'If your schedule shows accidental damage cover, we will pay for accidental damage to the **buildings** or **contents**.' }] },
      { n: '10.2', blocks: [
        { t: 'p', text: 'We will not pay for:' },
        { t: 'list', items: [
          { n: '(a)', text: 'the first €250 of each claim;' },
          { n: '(b)', text: 'damage caused by pets chewing, scratching, tearing or fouling;' },
          { n: '(c)', text: 'wear and tear, or damage that happens gradually;' },
          { n: '(d)', text: 'damage to clothing or contact lenses;' },
          { n: '(e)', text: 'damage while your **home** is let or sublet.' }
        ] }
      ] }
    ]
  },
  {
    n: '11', title: 'Alternative accommodation', page: 22, clauses: [
      { n: '11.1', blocks: [{ t: 'p', text: 'If your **home** cannot be lived in because of damage this policy covers, we will pay the reasonable cost of similar accommodation for you and your pets, and of storing your **contents**, until your **home** can be lived in again.' }] },
      { n: '11.2', blocks: [{ t: 'p', text: 'The most we will pay is €20,000 for any one claim.' }] },
      { n: '11.3', blocks: [{ t: 'p', text: 'Please agree the accommodation with us before you book it. In an emergency outside our opening hours, we will pay up to €250 a night for the first three nights without prior agreement.' }] }
    ]
  },
  {
    n: '12', title: 'General exclusions', page: 27, clauses: [
      { n: '12.1', blocks: [
        { t: 'p', text: 'This policy does not cover:' },
        { t: 'list', items: [
          { n: '(a)', text: 'loss or damage caused by wear and tear, rot, mould, damp or vermin, except mould or damp caused by an event this policy covers;' },
          { n: '(b)', text: 'loss or damage that happens gradually, unless a section of this policy says otherwise;' },
          { n: '(c)', text: 'the cost of maintenance, or of putting right faulty workmanship, design or materials;' },
          { n: '(d)', text: 'any loss of value after a repair;' },
          { n: '(e)', text: 'loss or damage you, or anyone acting for you, cause on purpose.' }
        ] }
      ] }
    ]
  },
  {
    n: '13', title: 'General conditions', page: 29, clauses: [
      { n: '13.1', blocks: [{ t: 'p', text: 'You must take reasonable care to prevent loss or damage, and keep your **home** in a good state of repair.' }] },
      { n: '13.2', blocks: [{ t: 'p', text: 'You must tell us within 30 days if you make structural changes to your **home**, start letting any part of it, or expect it to be **unoccupied** for more than 45 days in a row.' }] },
      { n: '13.3', blocks: [{ t: 'p', text: 'If any information you give us is not true and complete, we may reduce a claim payment in proportion to the premium we would have charged, or cancel the policy if we would not have insured you at all.' }] }
    ]
  },
  {
    n: '14', title: 'Making a claim', page: 31, clauses: [
      { n: '14.1', blocks: [{ t: 'p', text: 'Tell us as soon as you can after you discover the loss or damage.' }] },
      { n: '14.2', blocks: [{ t: 'p', text: 'Take reasonable steps to stop further damage. We will pay the reasonable cost of emergency repairs up to €500 without you asking us first. Please keep the receipts.' }] },
      { n: '14.3', blocks: [{ t: 'p', text: 'Keep damaged items until we have seen them or told you that you do not need to.' }] },
      { n: '14.4', blocks: [{ t: 'p', text: 'Do not admit responsibility, or agree to pay anyone, without our written agreement.' }] },
      { n: '14.5', blocks: [{ t: 'p', text: 'We may appoint a loss adjuster or a surveyor to inspect the damage before we make a decision.' }] }
    ]
  },
  {
    n: '15', title: 'If you are unhappy', page: 36, clauses: [
      { n: '15.1', blocks: [{ t: 'p', text: 'If you are unhappy with our service, please contact Customer Relations. We will acknowledge your complaint within five business days and keep you updated at least every 20 business days.' }] },
      { n: '15.2', blocks: [{ t: 'p', text: 'If you are not satisfied with our final response, or we have not given one within 40 business days, you can refer your complaint to the Financial Services and Pensions Ombudsman (FSPO). Doing so does not affect your legal rights.' }] }
    ]
  }
];

// 2024.2'de farklı olan maddeler (2026.1'de değişti)
const changed2024: Record<string, Clause> = {
  '6.2': { n: '6.2', blocks: [{ t: 'p', text: 'If your **home** is **unoccupied** for more than 30 days in a row between 1 November and 31 March, we will only pay under this section if the heating was kept on at 12°C or more, or the water was turned off at the mains and the system drained.' }] },
  '7.2': { n: '7.2', blocks: [{ t: 'p', text: 'We will also pay the cost of removing and replacing any part of the **buildings** needed to find where the water escaped from, up to €1,500 in any one **period of insurance**.' }] },
  '7.3': { n: '7.3', blocks: [
    { t: 'p', text: 'We will not pay for:' },
    { t: 'list', items: [
      { n: '(a)', text: 'the first €350 of each claim (your escape of water excess);' },
      { n: '(b)', text: 'damage caused by water escaping gradually over a period of time;' },
      { n: '(c)', text: 'loss or damage while your **home** is **unoccupied** for more than 30 days in a row, unless the water was turned off at the mains and the system drained;' },
      { n: '(d)', text: 'the cost of repairing the installation or appliance the water escaped from, except under clause 7.2.' }
    ] }
  ] },
  '9.2': { n: '9.2', blocks: [
    { t: 'p', text: 'We will not pay for:' },
    { t: 'list', items: [
      { n: '(a)', text: 'theft while your **home** is **unoccupied** for more than 30 days in a row;' },
      { n: '(b)', text: 'theft by anyone lawfully in your **home**, unless force was used to get in or out;' },
      { n: '(c)', text: 'theft from the garden of anything that was not secured to the ground or to the **buildings**;' },
      { n: '(d)', text: 'theft of **contents** from a shed or outbuilding, unless there are signs that someone broke in.' }
    ] }
  ] },
  '11.2': { n: '11.2', blocks: [{ t: 'p', text: 'The most we will pay is €15,000 for any one claim.' }] },
  '13.2': { n: '13.2', blocks: [{ t: 'p', text: 'You must tell us within 30 days if you make structural changes to your **home**, start letting any part of it, or expect it to be **unoccupied** for more than 30 days in a row.' }] }
};

// 2024 sürümünde sayfalar biraz önce başlıyor (iki sayfa kısa)
const sections2024: Section[] = sections2026.map((s) => ({
  ...s,
  page: Number(s.n) >= 7 ? s.page - 1 : s.page,
  clauses: s.clauses.map((c) => changed2024[c.n] ?? c)
}));

export const policy2026: Doc = {
  id: 'home-policy-2026',
  title: 'Home Insurance Policy Wording',
  kind: 'wording',
  version: '2026.1',
  file: 'TLK-HP-2026.1.pdf',
  pages: 38,
  inForce: '2026-03-01',
  reviewedOn: '2026-02-10',
  reviewDue: '2027-03-01',
  owner: { name: 'Gráinne Walsh', team: 'underwriting' },
  classification: 'public',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2026-02-12',
  status: 'ready',
  supersedes: 'home-policy-2024',
  sections: sections2026
};

export const policy2024: Doc = {
  ...policy2026,
  id: 'home-policy-2024',
  version: '2024.2',
  file: 'TLK-HP-2024.2.pdf',
  pages: 36,
  inForce: '2024-09-01',
  reviewedOn: '2024-08-05',
  reviewDue: '2026-03-01',
  added: '2024-08-07',
  supersedes: undefined,
  supersededBy: 'home-policy-2026',
  stillApplies: '2026-03-01',
  sections: sections2024
};
