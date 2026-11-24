// Hasar birimi belgeleri: işlem talimatı, su hasarı rehberi, yetki limitleri, suistimal göstergeleri.
// Su hasarı rehberi bilerek eskimiş: 2025'te yazıldı, 2024.2 poliçesinin muafiyet ve limitlerini anlatıyor;
// gözden geçirme tarihi geçti. Asistan bu çelişkiyi yakalamalı, yönetici ekranı da göstermeli.
import type { Doc } from '../types';

export const claimsManual: Doc = {
  id: 'claims-manual',
  title: 'Claims Handling Manual',
  kind: 'manual',
  version: '4.2',
  file: 'Household Claims Manual v4.2.pdf',
  pages: 61,
  inForce: '2026-06-02',
  reviewedOn: '2026-06-02',
  reviewDue: '2026-12-02',
  owner: { name: 'Ruairí Nolan', team: 'household' },
  classification: 'confidential',
  audience: ['claims', 'siu', 'knowledge'],
  added: '2026-06-02',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'Scope', page: 3, clauses: [
        { n: '1.1', blocks: [{ t: 'p', text: 'This manual applies to buildings and contents claims under Tolka home policies. It does not apply to landlord or commercial policies.' }] },
        { n: '1.2', blocks: [{ t: 'p', text: 'Where this manual and the policy wording differ, the policy wording applies. Tell the manual owner so the manual can be corrected.' }] }
      ]
    },
    {
      n: '2', title: 'First notification of loss', page: 5, clauses: [
        { n: '2.1', blocks: [
          { t: 'p', text: 'On the first call, record:' },
          { t: 'list', items: [
            { n: '(a)', text: 'the date the loss happened and the date it was discovered, as two separate dates;' },
            { n: '(b)', text: 'the cause, in the customer’s own words;' },
            { n: '(c)', text: 'the rooms and items affected;' },
            { n: '(d)', text: 'what the customer has already done to stop further damage.' }
          ] }
        ] },
        { n: '2.2', blocks: [{ t: 'p', text: 'Ask whether the home is lived in at the moment and, if not, since when. This decides whether the unoccupancy exclusions apply.' }] },
        { n: '2.3', blocks: [{ t: 'p', text: 'Tell the customer which excess applies and that it is deducted from the settlement. The customer does not pay it to us.' }] },
        { n: '2.4', blocks: [{ t: 'p', text: 'Do not tell the customer on the first call whether the claim will be paid. Explain what happens next and when they will hear from us.' }] }
      ]
    },
    {
      n: '3', title: 'Checking cover', page: 8, clauses: [
        { n: '3.1', blocks: [{ t: 'p', text: 'Check that a policy was in force on the date of loss and that the premium for that period was paid.' }] },
        { n: '3.2', blocks: [{ t: 'p', text: 'The policy wording that applies is the one in force on the date the loss happened, not the date it was reported. Losses that happened before 1 March 2026 are handled under wording 2024.2, including its excesses and limits.' }] },
        { n: '3.3', blocks: [{ t: 'p', text: 'Where the date of loss cannot be established, for example with gradual damage, use the date the damage was discovered and record why on the claim.' }] }
      ]
    },
    {
      n: '4', title: 'Escape of water', page: 14, clauses: [
        { n: '4.1', blocks: [{ t: 'p', text: 'Confirm that the source of the leak has been repaired or isolated before drying starts.' }] },
        { n: '4.2', blocks: [{ t: 'p', text: 'If the source cannot be seen, instruct a panel plumber to trace it. Trace and access costs are paid under clause 7.2 of the policy and have their own limit.' }] },
        { n: '4.3', blocks: [{ t: 'p', text: 'Drying is carried out by a panel drying company. Do not start reinstatement until you have the drying certificate.' }] },
        { n: '4.4', heading: 'Typical drying times', blocks: [
          { t: 'table', head: ['Material', 'Typical drying time', 'Note'], rows: [
            ['Concrete floor with screed', '3 to 6 weeks', 'Longer in winter'],
            ['Suspended timber floor', '1 to 3 weeks', 'Lift boards if water is under them'],
            ['Plasterboard walls', '1 to 2 weeks', 'Replace if it has swollen or crumbles'],
            ['Solid block walls', '2 to 4 weeks', '']
          ] }
        ] },
        { n: '4.5', blocks: [{ t: 'p', text: 'Mould is covered only as part of escape of water damage the policy covers, not on its own (general exclusion 12.1(a)).' }] },
        { n: '4.6', heading: 'Gradual damage: could the customer have known?', blocks: [
          { t: 'p', text: 'Before you decline a claim under the gradual damage exclusion, record the evidence for each of these points:' },
          { t: 'list', items: [
            { n: '(1)', text: 'how long the damage would have taken to become visible, using the surveyor’s estimate where there is one;' },
            { n: '(2)', text: 'whether staining, swelling or a smell would have been noticeable in normal use of the room;' },
            { n: '(3)', text: 'what the customer says they noticed, and when.' }
          ] },
          { t: 'p', text: 'If the evidence does not clearly show that the customer knew or should have known, the exclusion does not apply under wording 2026.1. Refer borderline cases to your team leader before you write to the customer.' }
        ] }
      ]
    },
    {
      n: '5', title: 'Subsidence', page: 26, clauses: [
        { n: '5.1', blocks: [{ t: 'p', text: 'Refer every subsidence claim to the panel engineer before any decision. Do not accept or decline a subsidence claim on the phone.' }] },
        { n: '5.2', blocks: [{ t: 'p', text: 'The engineer usually monitors cracks for six to twelve months before repairs are agreed. Explain this to the customer at the start, and update them at least every two months.' }] },
        { n: '5.3', blocks: [{ t: 'p', text: 'The subsidence excess is €1,000 under both wordings.' }] }
      ]
    },
    {
      n: '6', title: 'Settlement', page: 33, clauses: [
        { n: '6.1', blocks: [{ t: 'p', text: 'For buildings damage, repair through a panel contractor is the default.' }] },
        { n: '6.2', blocks: [{ t: 'p', text: 'If the customer prefers a cash settlement, we pay what the repair would have cost us through our panel. Tell the customer this in writing before they agree.' }] },
        { n: '6.3', blocks: [{ t: 'p', text: 'For contents, replace items through our supplier network where possible. If the customer chooses cash, pay the price we would have paid, unless the customer cannot reasonably use our supplier.' }] },
        { n: '6.4', blocks: [{ t: 'p', text: 'If the settlement is above your authority, refer it as set out in the Delegated Authority Limits.' }] }
      ]
    },
    {
      n: '7', title: 'Declining a claim', page: 41, clauses: [
        { n: '7.1', blocks: [{ t: 'p', text: 'Decline in writing. Quote the clause and explain in plain language why it applies to this claim.' }] },
        { n: '7.2', blocks: [{ t: 'p', text: 'A team leader must check every decline of more than €5,000 before the letter is sent.' }] },
        { n: '7.3', blocks: [{ t: 'p', text: 'The letter must explain how to complain and the customer’s right to refer the complaint to the Financial Services and Pensions Ombudsman.' }] },
        { n: '7.4', blocks: [{ t: 'p', text: 'Where only part of a claim is excluded, pay the covered part without waiting for any dispute about the rest to be settled.' }] }
      ]
    },
    {
      n: '8', title: 'Customers in vulnerable circumstances', page: 49, clauses: [
        { n: '8.1', blocks: [{ t: 'p', text: 'If you notice signs that a customer may be in vulnerable circumstances, follow the guide Supporting Customers in Vulnerable Circumstances.' }] },
        { n: '8.2', blocks: [{ t: 'p', text: 'With the customer’s consent, add a support flag to the claim. Record the support they need, not their medical condition.' }] }
      ]
    },
    {
      n: '9', title: 'Suspected fraud', page: 55, clauses: [
        { n: '9.1', blocks: [{ t: 'p', text: 'If you have concerns about a claim, refer it to the Special Investigations Unit using the “Refer to SIU” option on the claim.' }] },
        { n: '9.2', blocks: [{ t: 'p', text: 'Do not tell the customer or their representatives that the claim has been referred.' }] },
        { n: '9.3', blocks: [{ t: 'p', text: 'Keep handling the claim as normal unless the unit tells you otherwise. Do not hold back emergency payments.' }] }
      ]
    }
  ]
};

export const eowGuide: Doc = {
  id: 'eow-guide',
  title: 'Escape of Water Claims Guide',
  kind: 'guide',
  version: '3.1',
  file: 'EoW guide 3.1.docx',
  pages: 12,
  inForce: '2025-04-14',
  reviewedOn: '2025-04-14',
  reviewDue: '2026-04-14',
  owner: { name: 'Eoin Farrell', team: 'household' },
  classification: 'internal',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2025-04-15',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'On the first call', page: 2, clauses: [
        { n: '1.1', blocks: [
          { t: 'p', text: 'Ask:' },
          { t: 'list', items: [
            { text: 'Where is the water coming from, and is it still leaking?' },
            { text: 'Has the water been turned off at the stopcock?' },
            { text: 'Is water near any sockets, switches or the fuse board?' },
            { text: 'Which rooms are affected?' },
            { text: 'When did you first notice it?' },
            { text: 'Is anyone in the home elderly, unwell or very young?' }
          ] }
        ] }
      ]
    },
    {
      n: '2', title: 'Stopping further damage', page: 4, clauses: [
        { n: '2.1', blocks: [{ t: 'p', text: 'Tell the customer to turn the water off at the stopcock. In most Irish homes it is under the kitchen sink.' }] },
        { n: '2.2', blocks: [{ t: 'p', text: 'If water is near sockets or the fuse board, tell the customer to switch the electricity off at the fuse board, but only if they can reach it without standing in water.' }] },
        { n: '2.3', blocks: [{ t: 'p', text: 'The customer can call their own emergency plumber. Emergency repairs are covered up to the emergency limit in the policy without asking us first.' }] }
      ]
    },
    {
      n: '3', title: 'Our panel', page: 6, clauses: [
        { n: '3.1', blocks: [
          { t: 'table', head: ['Service', 'Region', 'Company', 'Attendance target'], rows: [
            ['Plumbing and trace', 'Leinster', 'Brennan Plumbing & Heating', '4 hours in Dublin, 24 hours elsewhere'],
            ['Plumbing and trace', 'Munster', 'Carey & Daughters', '24 hours'],
            ['Drying', 'Leinster and Munster', 'Liffey Drying Services', 'Next business day'],
            ['Drying', 'Connacht and Ulster', 'Westdry', 'Next business day']
          ] }
        ] }
      ]
    },
    {
      n: '4', title: 'Excess and limits', page: 9, clauses: [
        { n: '4.1', blocks: [{ t: 'p', text: 'The escape of water excess is €350.' }] },
        { n: '4.2', blocks: [{ t: 'p', text: 'Trace and access is covered up to €1,500 in any one period of insurance.' }] },
        { n: '4.3', blocks: [{ t: 'p', text: 'Damage while the home is unoccupied for more than 30 days in a row is not covered unless the water was turned off and the system drained.' }] }
      ]
    },
    {
      n: '5', title: 'Letters', page: 11, clauses: [
        { n: '5.1', blocks: [{ t: 'p', text: 'Use letter template EW-02 to confirm the drying company and EW-05 to confirm that drying is complete.' }] }
      ]
    }
  ]
};

export const authorityLimits: Doc = {
  id: 'authority-limits',
  title: 'Delegated Authority Limits: Household Claims',
  kind: 'table',
  version: '2025',
  file: 'Authority limits 2025.xlsx',
  pages: 4,
  inForce: '2025-10-13',
  reviewedOn: '2025-10-13',
  reviewDue: '2026-10-12',
  owner: { name: 'Martina Quinn', team: 'leadership' },
  classification: 'confidential',
  audience: ['claims', 'siu', 'knowledge'],
  added: '2025-10-13',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'Settlement authority', page: 1, clauses: [
        { n: '1.1', heading: 'Limits by grade', blocks: [
          { t: 'table', head: ['Grade', 'Buildings', 'Contents', 'Alternative accommodation', 'Ex gratia'], rows: [
            ['Customer care agent', '–', '–', 'Emergency nights only (11.3 of the policy)', '–'],
            ['Claims handler', '€7,500', '€5,000', '€5,000', '€250'],
            ['Senior claims handler', '€25,000', '€15,000', '€10,000', '€1,000'],
            ['Team leader', '€50,000', '€30,000', 'Policy limit', '€2,500'],
            ['Claims manager', '€150,000', '€75,000', 'Policy limit', '€10,000'],
            ['Head of claims', 'Policy limit', 'Policy limit', 'Policy limit', '€25,000']
          ] }
        ] }
      ]
    },
    {
      n: '2', title: 'How the limits work', page: 2, clauses: [
        { n: '2.1', blocks: [{ t: 'p', text: 'Authority is measured on the total value of the claim before the excess is deducted, including fees.' }] },
        { n: '2.2', blocks: [{ t: 'p', text: 'Do not split a claim into several payments to stay within your authority.' }] },
        { n: '2.3', blocks: [{ t: 'p', text: 'Claims handlers can decline claims of up to €5,000. Above that, a team leader checks the decline before the letter is sent.' }] },
        { n: '2.4', blocks: [{ t: 'p', text: 'If the person with authority is absent, the next grade up approves.' }] }
      ]
    },
    {
      n: '3', title: 'Payments', page: 3, clauses: [
        { n: '3.1', blocks: [{ t: 'p', text: 'Pay contractors only against an invoice that names the claim number.' }] },
        { n: '3.2', blocks: [{ t: 'p', text: 'Before a cash settlement of more than €10,000, confirm the customer’s bank details by calling them back on the number held on the policy.' }] }
      ]
    }
  ]
};

export const fraudIndicators: Doc = {
  id: 'fraud-indicators',
  title: 'Fraud Indicators: Household',
  kind: 'guide',
  version: '3.0',
  file: 'SIU indicators household v3.pdf',
  pages: 9,
  inForce: '2026-01-19',
  reviewedOn: '2026-01-19',
  reviewDue: '2027-01-19',
  owner: { name: 'Aoife Doherty', team: 'siu' },
  classification: 'strict',
  audience: ['siu'],
  added: '2026-01-19',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'How to use this guide', page: 2, clauses: [
        { n: '1.1', blocks: [{ t: 'p', text: 'One indicator on its own is not evidence of fraud. Most claims with one indicator are genuine. Look for several indicators together, and record facts, not opinions.' }] },
        { n: '1.2', blocks: [{ t: 'p', text: 'Never accuse a customer, and never suggest to a customer that their claim is being investigated.' }] }
      ]
    },
    {
      n: '2', title: 'Indicators at first notification', page: 3, clauses: [
        { n: '2.1', blocks: [
          { t: 'list', items: [
            { n: '(a)', text: 'The claim is made within 60 days of the policy starting, or of an increase in the sum insured.' },
            { n: '(b)', text: 'The customer pushes for a fast cash settlement and resists an inspection.' },
            { n: '(c)', text: 'The account of how the loss happened changes between calls.' },
            { n: '(d)', text: 'High-value items are claimed without proof of ownership, or all receipts come from one retailer and carry recent dates.' },
            { n: '(e)', text: 'The customer has claimed for similar items before.' }
          ] }
        ] }
      ]
    },
    {
      n: '3', title: 'Indicators in escape of water claims', page: 5, clauses: [
        { n: '3.1', blocks: [
          { t: 'list', items: [
            { n: '(a)', text: 'The pattern of damage does not match the stated source.' },
            { n: '(b)', text: 'Moisture readings show the water is older than the customer says.' },
            { n: '(c)', text: 'The customer is reluctant to let our plumber trace the leak.' }
          ] }
        ] }
      ]
    },
    {
      n: '4', title: 'Working a referral', page: 7, clauses: [
        { n: '4.1', blocks: [{ t: 'p', text: 'Review each referral within two business days and tell the claims handler whether the unit is taking the case.' }] },
        { n: '4.2', blocks: [{ t: 'p', text: 'If the unit does not take the case, the handler settles the claim as normal and nothing is recorded against the customer.' }] }
      ]
    }
  ]
};
