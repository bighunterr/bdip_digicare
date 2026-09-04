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

const CATALOG = [
  { name: 'SIMRS Digicare', desc: 'End-to-end Hospital Information System with clinical, finance, pharmacy, and BPJS integration.', modules: ['Registration','Clinical','Pharmacy','Finance','BPJS','MedRec'], startingPrice: 750000000, subscription: 45000000, implWeeks: 12, target: ['Healthcare'] },
  { name: 'IFMS Enterprise', desc: 'Integrated Financial Management System for public sector budget, treasury, and audit.', modules: ['Budgeting','Treasury','Accounting','Audit'], startingPrice: 1500000000, subscription: 65000000, implWeeks: 20, target: ['Government','BUMN'] },
  { name: 'ERP Enterprise Platform', desc: 'Modern ERP with HR, finance, supply chain, and analytics on unified data model.', modules: ['HR','Finance','SCM','Analytics','Procurement'], startingPrice: 2000000000, subscription: 85000000, implWeeks: 24, target: ['Private Enterprise','BUMN'] },
  { name: 'Smart Manufacturing Platform', desc: 'IIoT + MES + predictive maintenance for factory-floor digitalisation.', modules: ['MES','OEE','Predictive Maintenance','Digital Twin'], startingPrice: 1800000000, subscription: 55000000, implWeeks: 18, target: ['Industrial Estate','Private Enterprise'] },
  { name: 'Smart Campus Platform', desc: 'Unified academic + facility + student experience platform for higher education.', modules: ['Academic','LMS','Facility','Student App'], startingPrice: 900000000, subscription: 35000000, implWeeks: 14, target: ['Education'] },
  { name: 'Command Center', desc: 'Enterprise command & control with video wall, geospatial ops, and AI-driven alerts.', modules: ['Video Wall','GIS','Alerting','Case Mgmt'], startingPrice: 3500000000, subscription: 0, implWeeks: 22, target: ['Government','Military'] },
  { name: 'GIS Platform', desc: 'Geospatial analytics with map layers, spatial analysis, and public dashboards.', modules: ['Basemap','Layers','Spatial Analytics','Dashboards'], startingPrice: 650000000, subscription: 22000000, implWeeks: 10, target: ['Government'] },
  { name: 'Network Infrastructure', desc: 'Data center + campus + WAN design & deployment with leading OEMs.', modules: ['Data Center','Campus LAN','SD-WAN','Wi-Fi'], startingPrice: 500000000, subscription: 0, implWeeks: 8, target: ['Government','Military','BUMN','Private Enterprise'] },
  { name: 'CCTV AI Surveillance', desc: 'AI-powered CCTV with face, plate, anomaly and object recognition.', modules: ['Face Recognition','ANPR','Anomaly','VMS'], startingPrice: 850000000, subscription: 12000000, implWeeks: 8, target: ['Healthcare','Government','Industrial Estate'] },
  { name: 'IoT Platform', desc: 'Device management + telemetry + rules engine for industrial IoT.', modules: ['Device Mgmt','Telemetry','Rules','Analytics'], startingPrice: 400000000, subscription: 18000000, implWeeks: 6, target: ['Industrial Estate','BUMN'] },
  { name: 'RFID System', desc: 'Asset tracking, patient wristband, and inventory RFID with reader network.', modules: ['Tag Provisioning','Reader Mgmt','Asset Ledger'], startingPrice: 350000000, subscription: 8000000, implWeeks: 6, target: ['Healthcare','Industrial Estate'] },
  { name: 'API Gateway', desc: 'Enterprise API management with policy, security, and developer portal.', modules: ['Gateway','Dev Portal','Policy','Analytics'], startingPrice: 300000000, subscription: 15000000, implWeeks: 5, target: ['BUMN','Government','Private Enterprise'] },
  { name: 'Mobile Super App', desc: 'Composable mobile super app framework with micro-frontends and mini-programs.', modules: ['Shell','Mini-programs','Push','Analytics'], startingPrice: 1200000000, subscription: 40000000, implWeeks: 16, target: ['BUMN','Private Enterprise'] },
];

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
  
  // Always ensure products are seeded (even if opps exist)
  const prodCount = await db.collection('products').countDocuments();
  if (prodCount === 0) {
    const prodDocs = CATALOG.map(p => ({ id: uuidv4(), ...p, createdAt: new Date() }));
    await db.collection('products').insertMany(prodDocs);
  }
  
  if (count > 0) return { seeded: false, products: prodCount === 0 ? CATALOG.length : prodCount };

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

  return { seeded: true, organizations: orgDocs.length, opportunities: oppDocs.length, risks: riskDocs.length, activities: actDocs.length, products: CATALOG.length };
}

export { STAGES, INDUSTRIES, PRODUCTS, PARTNERS };
