import { v4 as uuidv4 } from 'uuid';
import { getDb } from './mongodb.js';

const STAGES = [
  'Prospecting','Discovery','Consultative Meeting','Solution Design',
  'Proposal Submitted','Negotiation','PO/SPK','Implementation','Closed Won','Closed Lost'
];

const INDUSTRIES = ['Healthcare','Military','Government','Education','Industrial Estate','BUMN','Private Enterprise'];

const PRODUCTS = ['SIMRS Digicare','IFMS Enterprise','ERP Enterprise Platform','Smart Manufacturing Platform','Smart Campus Platform','Command Center','GIS Platform','Network Infrastructure','CCTV AI Surveillance','IoT Platform','RFID System','API Gateway','Mobile Super App'];

const PARTNERS = ['Huawei','Cisco','Fortinet','Mikrotik','Dell','HPE','Lenovo','Local Distributor'];

const ORGS = [
  { name: 'RSUP Dr. Sardjito', industry: 'Healthcare', province: 'DI Yogyakarta', segment: 'Government Hospital' },
  { name: 'Kementerian Pertahanan RI', industry: 'Military', province: 'DKI Jakarta', segment: 'Ministry' },
  { name: 'Pemprov Jawa Barat', industry: 'Government', province: 'Jawa Barat', segment: 'Provincial Government' },
  { name: 'Universitas Indonesia', industry: 'Education', province: 'DKI Jakarta', segment: 'Public University' },
  { name: 'Kawasan Industri Jababeka', industry: 'Industrial Estate', province: 'Jawa Barat', segment: 'Industrial Park' },
  { name: 'PT Pertamina (Persero)', industry: 'BUMN', province: 'DKI Jakarta', segment: 'Energy' },
  { name: 'PT Astra International', industry: 'Private Enterprise', province: 'DKI Jakarta', segment: 'Conglomerate' },
  { name: 'RS Hasan Sadikin', industry: 'Healthcare', province: 'Jawa Barat', segment: 'Government Hospital' },
  { name: 'TNI Angkatan Laut', industry: 'Military', province: 'DKI Jakarta', segment: 'Armed Forces' },
  { name: 'PT Telkom Indonesia', industry: 'BUMN', province: 'DKI Jakarta', segment: 'Telecommunications' },
];

const OWNERS = ['Andi Wijaya','Sari Puspitasari','Rendra Adhipati','Maya Kusuma','Bagas Pratama','Dewi Anggraini'];

const OPPS = [
  { name: 'SIMRS Modernization – Sardjito', org: 'RSUP Dr. Sardjito', product: 'SIMRS Digicare', stage: 'Solution Design', value: 8500000000, mrr: 45000000, prob: 65 },
  { name: 'Command Center Kemhan', org: 'Kementerian Pertahanan RI', product: 'Command Center', stage: 'Proposal Submitted', value: 25000000000, mrr: 0, prob: 55 },
  { name: 'Smart City Jabar Phase 2', org: 'Pemprov Jawa Barat', product: 'GIS Platform', stage: 'Negotiation', value: 15000000000, mrr: 20000000, prob: 80 },
  { name: 'Smart Campus UI', org: 'Universitas Indonesia', product: 'Smart Campus Platform', stage: 'Consultative Meeting', value: 6200000000, mrr: 35000000, prob: 45 },
  { name: 'Jababeka IoT Rollout', org: 'Kawasan Industri Jababeka', product: 'IoT Platform', stage: 'Discovery', value: 4800000000, mrr: 25000000, prob: 30 },
  { name: 'Pertamina API Gateway', org: 'PT Pertamina (Persero)', product: 'API Gateway', stage: 'PO/SPK', value: 3200000000, mrr: 18000000, prob: 90 },
  { name: 'Astra ERP Enterprise', org: 'PT Astra International', product: 'ERP Enterprise Platform', stage: 'Implementation', value: 18000000000, mrr: 55000000, prob: 95 },
  { name: 'RSHS CCTV AI', org: 'RS Hasan Sadikin', product: 'CCTV AI Surveillance', stage: 'Prospecting', value: 2100000000, mrr: 8000000, prob: 20 },
  { name: 'TNI AL Network Backbone', org: 'TNI Angkatan Laut', product: 'Network Infrastructure', stage: 'Closed Won', value: 12500000000, mrr: 0, prob: 100 },
  { name: 'Telkom Mobile Super App', org: 'PT Telkom Indonesia', product: 'Mobile Super App', stage: 'Solution Design', value: 9500000000, mrr: 42000000, prob: 60 },
  { name: 'Sardjito RFID Asset', org: 'RSUP Dr. Sardjito', product: 'RFID System', stage: 'Discovery', value: 1800000000, mrr: 6000000, prob: 35 },
  { name: 'Kemhan Cybersecurity', org: 'Kementerian Pertahanan RI', product: 'Network Infrastructure', stage: 'Closed Lost', value: 7000000000, mrr: 0, prob: 0 },
];

const RISKS = [
  { category: 'Commercial', title: 'Client budget cut Q4', severity: 'High', probability: 'Medium', status: 'Open' },
  { category: 'Technical', title: 'Legacy system integration', severity: 'Medium', probability: 'High', status: 'Mitigating' },
  { category: 'Financial', title: 'Payment term > 90 days', severity: 'High', probability: 'Medium', status: 'Open' },
  { category: 'Partnership', title: 'Huawei stock delay', severity: 'Medium', probability: 'Medium', status: 'Mitigating' },
  { category: 'Compliance', title: 'ISO 27001 recert', severity: 'Low', probability: 'Low', status: 'Closed' },
  { category: 'Operational', title: 'Resource conflict Q3', severity: 'High', probability: 'High', status: 'Open' },
];

const ACTIVITIES = [
  { type: 'Meeting', title: 'Kickoff with Dirut Sardjito', org: 'RSUP Dr. Sardjito', when: -1 },
  { type: 'Demo', title: 'Command Center demo to Kemhan', org: 'Kementerian Pertahanan RI', when: 0 },
  { type: 'Proposal', title: 'Submit final proposal Jabar', org: 'Pemprov Jawa Barat', when: 0 },
  { type: 'Follow Up', title: 'Follow-up email UI', org: 'Universitas Indonesia', when: 1 },
  { type: 'Workshop', title: 'IoT design workshop Jababeka', org: 'Kawasan Industri Jababeka', when: 2 },
  { type: 'Visit', title: 'Site visit Pertamina Balikpapan', org: 'PT Pertamina (Persero)', when: 3 },
  { type: 'Call', title: 'Call CFO Astra', org: 'PT Astra International', when: -2 },
];

export async function seedIfEmpty() {
  const db = await getDb();
  const count = await db.collection('opportunities').countDocuments();
  if (count > 0) return { seeded: false };

  const orgDocs = ORGS.map(o => ({ id: uuidv4(), ...o, address: `${o.province}`, website: `www.${o.name.toLowerCase().replace(/[^a-z]/g,'')}.co.id`, budgetSource: 'APBN/APBD', status: 'Active', createdAt: new Date() }));
  await db.collection('organizations').insertMany(orgDocs);

  const orgMap = Object.fromEntries(orgDocs.map(o => [o.name, o.id]));

  const oppDocs = OPPS.map((o, i) => ({
    id: uuidv4(),
    projectName: o.name,
    organizationId: orgMap[o.org],
    organizationName: o.org,
    industry: orgDocs.find(x=>x.name===o.org)?.industry,
    product: o.product,
    partner: PARTNERS[i % PARTNERS.length],
    stage: o.stage,
    value: o.value,
    mrr: o.mrr,
    probability: o.prob,
    expectedClosing: new Date(Date.now() + (30 + i*10) * 86400000),
    businessOwner: OWNERS[i % OWNERS.length],
    technicalOwner: OWNERS[(i+2) % OWNERS.length],
    notes: '',
    createdAt: new Date()
  }));
  await db.collection('opportunities').insertMany(oppDocs);

  const riskDocs = RISKS.map(r => ({ id: uuidv4(), ...r, impact: r.severity, mitigation: 'Escalate to steerco, allocate contingency budget', owner: OWNERS[Math.floor(Math.random()*OWNERS.length)], dueDate: new Date(Date.now() + 21*86400000), createdAt: new Date() }));
  await db.collection('risks').insertMany(riskDocs);

  const actDocs = ACTIVITIES.map(a => ({ id: uuidv4(), ...a, organizationName: a.org, scheduledAt: new Date(Date.now() + a.when*86400000), owner: OWNERS[Math.floor(Math.random()*OWNERS.length)], status: a.when < 0 ? 'Done' : 'Scheduled', createdAt: new Date() }));
  await db.collection('activities').insertMany(actDocs);

  return { seeded: true, organizations: orgDocs.length, opportunities: oppDocs.length, risks: riskDocs.length, activities: actDocs.length };
}

export { STAGES, INDUSTRIES, PRODUCTS, PARTNERS };
