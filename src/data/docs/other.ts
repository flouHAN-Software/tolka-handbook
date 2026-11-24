// Müşteri belgesi, müşteri hizmetleri rehberleri, şikâyet prosedürü (işleniyor) ve okunamayan taranmış PDF.
// Şikâyet süreleri kurumun kendi iç hedefleri olarak yazıldı; düzenleyicinin kuralı diye sunulmuyor.
import type { Doc } from '../types';

export const ipid: Doc = {
  id: 'ipid-2026',
  title: 'Home Insurance Product Information Document',
  kind: 'ipid',
  version: '2026.1',
  file: 'TLK-HP-IPID-2026.1.pdf',
  pages: 2,
  inForce: '2026-03-01',
  reviewedOn: '2026-02-10',
  reviewDue: '2027-03-01',
  owner: { name: 'Gráinne Walsh', team: 'underwriting' },
  classification: 'public',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2026-02-12',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'What is this type of insurance?', page: 1, clauses: [
        { n: '1.1', blocks: [{ t: 'p', text: 'Home insurance covering the buildings and contents of your private home against fire, storm, flood, escape of water, theft and other events named in the policy. This document is a summary; the full terms are in the policy wording.' }] }
      ]
    },
    {
      n: '2', title: 'What is not insured?', page: 1, clauses: [
        { n: '2.1', blocks: [
          { t: 'list', items: [
            { text: 'Wear and tear, and damage that happens gradually.' },
            { text: 'Accidental damage, unless you choose to add it.' },
            { text: 'Damage while your home is unoccupied for more than 45 days in a row, for some events.' },
            { text: 'Motor vehicles, caravans and boats.' }
          ] }
        ] }
      ]
    },
    {
      n: '3', title: 'What are my obligations?', page: 2, clauses: [
        { n: '3.1', blocks: [
          { t: 'list', items: [
            { text: 'Give us true and complete information, and tell us about changes.' },
            { text: 'Keep your home in a good state of repair.' },
            { text: 'Tell us about a claim as soon as you can, and report any theft to An Garda Síochána.' }
          ] }
        ] }
      ]
    },
    {
      n: '4', title: 'How do I cancel?', page: 2, clauses: [
        { n: '4.1', blocks: [{ t: 'p', text: 'You can cancel within 14 days of receiving your documents and get a full refund, as long as you have not made a claim. After that, you can cancel at any time and we will refund the premium for the unused period.' }] }
      ]
    }
  ]
};

export const callGuide: Doc = {
  id: 'care-call-guide',
  title: 'Customer Care Call Guide',
  kind: 'callguide',
  version: '7',
  file: 'Care call guide v7.docx',
  pages: 14,
  inForce: '2026-05-11',
  reviewedOn: '2026-05-11',
  reviewDue: '2027-05-11',
  owner: { name: 'Siobhán Kehoe', team: 'care' },
  classification: 'internal',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2026-05-11',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'Checking who you are speaking to', page: 2, clauses: [
        { n: '1.1', blocks: [{ t: 'p', text: 'Ask for the full name, date of birth and Eircode held on the policy. Do not discuss the policy with anyone else unless there is a third-party authority on file.' }] },
        { n: '1.2', blocks: [{ t: 'p', text: 'If the caller cannot pass the checks, you can still give general information and take a message, but nothing about the policy or claim.' }] }
      ]
    },
    {
      n: '2', title: 'New claim calls', page: 5, clauses: [
        { n: '2.1', blocks: [{ t: 'p', text: 'Open the claim and record the first notification details set out by the claims team. Give the customer the claim number before the call ends.' }] },
        { n: '2.2', blocks: [{ t: 'p', text: 'Tell the customer that a claims handler will call them within one business day. For escape of water and fire, the handler calls the same day.' }] },
        { n: '2.3', blocks: [{ t: 'p', text: 'If the home cannot be lived in tonight, you can arrange emergency accommodation for up to three nights within the policy limit. Everything after that is arranged by the claims handler.' }] }
      ]
    },
    {
      n: '3', title: 'What not to say', page: 9, clauses: [
        { n: '3.1', blocks: [
          { t: 'list', items: [
            { text: 'Do not tell the customer whether the claim will be paid.' },
            { text: 'Do not quote settlement amounts.' },
            { text: 'Do not mention checks or investigations of any kind.' }
          ] }
        ] }
      ]
    },
    {
      n: '4', title: 'Complaints on the phone', page: 12, clauses: [
        { n: '4.1', blocks: [{ t: 'p', text: 'If the customer is unhappy, log a complaint even if you resolve it on the call. Follow the Complaints Handling Procedure.' }] }
      ]
    }
  ]
};

export const complaints: Doc = {
  id: 'complaints-procedure',
  title: 'Complaints Handling Procedure',
  kind: 'procedure',
  version: '5.0',
  file: 'Complaints procedure v5.0.pdf',
  pages: 16,
  inForce: '2026-11-23',
  reviewedOn: '2026-11-23',
  reviewDue: '2027-11-23',
  owner: { name: 'Orla Brady', team: 'relations' },
  classification: 'internal',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2026-11-24',
  status: 'processing',
  readingPage: 9,
  sections: [
    {
      n: '1', title: 'What counts as a complaint', page: 2, clauses: [
        { n: '1.1', blocks: [{ t: 'p', text: 'Any expression of dissatisfaction, spoken or written, about our products or service, whether or not the customer uses the word “complaint”.' }] }
      ]
    },
    {
      n: '2', title: 'Our timelines', page: 4, clauses: [
        { n: '2.1', blocks: [
          { t: 'table', head: ['Step', 'Our target'], rows: [
            ['Written acknowledgement', 'Within 5 business days'],
            ['Update to the customer', 'At least every 20 business days'],
            ['Final response', 'Within 40 business days']
          ] }
        ] },
        { n: '2.2', blocks: [{ t: 'p', text: 'If we cannot give a final response within 40 business days, write to the customer to explain why, tell them when to expect it, and tell them they can refer the complaint to the Financial Services and Pensions Ombudsman.' }] },
        { n: '2.3', blocks: [{ t: 'p', text: 'A complaint resolved to the customer’s satisfaction within five business days still has to be recorded.' }] }
      ]
    },
    {
      n: '3', title: 'The final response letter', page: 9, clauses: [
        { n: '3.1', blocks: [{ t: 'p', text: 'The letter explains what we found, what we will do, and the customer’s right to refer the complaint to the Ombudsman within six years of the event, with the Ombudsman’s contact details.' }] }
      ]
    }
  ]
};

export const vulnerable: Doc = {
  id: 'vulnerable-customers',
  title: 'Supporting Customers in Vulnerable Circumstances',
  kind: 'guide',
  version: '2.2',
  file: 'Vulnerable customers 2.2.pdf',
  pages: 10,
  inForce: '2026-03-02',
  reviewedOn: '2026-03-02',
  reviewDue: '2027-03-02',
  owner: { name: 'Orla Brady', team: 'relations' },
  classification: 'internal',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2026-03-02',
  status: 'ready',
  sections: [
    {
      n: '1', title: 'Who may be vulnerable', page: 2, clauses: [
        { n: '1.1', blocks: [{ t: 'p', text: 'Anyone can be in vulnerable circumstances, sometimes only for a while: illness, bereavement, money worries, age, difficulty with English, or the shock of the event itself, such as a flood.' }] }
      ]
    },
    {
      n: '2', title: 'What to do', page: 4, clauses: [
        { n: '2.1', blocks: [
          { t: 'list', items: [
            { text: 'Offer more time, and a named handler if the claim will take a while.' },
            { text: 'Ask how the customer would like us to contact them, and use that.' },
            { text: 'Offer to speak to a family member or friend, with the customer’s consent.' }
          ] }
        ] },
        { n: '2.2', blocks: [{ t: 'p', text: 'If an older or unwell customer has no heating or water after an insured event, arrange alternative accommodation the same day, within your authority.' }] }
      ]
    },
    {
      n: '3', title: 'Recording', page: 7, clauses: [
        { n: '3.1', blocks: [{ t: 'p', text: 'Record only with the customer’s consent. Record the support they need, not their diagnosis or personal story.' }] }
      ]
    }
  ]
};

export const surveyorPanel: Doc = {
  id: 'surveyor-panel',
  title: 'Surveyor Panel 2025',
  kind: 'list',
  version: '2025',
  file: 'Surveyor Panel 2025.pdf',
  pages: 7,
  inForce: '2026-01-06',
  reviewedOn: '2026-01-06',
  reviewDue: '2027-01-06',
  owner: { name: 'Ruairí Nolan', team: 'household' },
  classification: 'internal',
  audience: ['care', 'claims', 'siu', 'knowledge'],
  added: '2026-11-20',
  status: 'failed',
  sections: []
};
