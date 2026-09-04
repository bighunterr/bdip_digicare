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
  { name: 'SIMRS Digicare', desc: 'End-to-end Hospital Information System with clinical, finance, pharmacy, and BPJS integration.', modules: ['Registration','Clinical','Pharmacy','Finance','BPJS','MedRec'], startingPrice: 750000000, subscription: 45000000, implWeeks: 12, target: ['Healthcare'],
    features: ['Full electronic medical records','BPJS integration certified','Multi-tenant for hospital groups','Mobile doctor & nurse app','Real-time bed management','Pharmacy inventory + narcotics tracking'],
    benefits: ['30% reduction in patient waiting time','15% increase in bed utilization','100% BPJS claim accuracy','Full paperless workflow'],
    useCases: ['Government tertiary hospitals (Type A/B)','Private hospital chains','Faskes rujukan BPJS'],
    techSpecs: 'Cloud-native, Kubernetes, PostgreSQL/Oracle, Kafka event bus, HL7 FHIR compliant' },
  { name: 'IFMS Enterprise', desc: 'Integrated Financial Management System for public sector budget, treasury, and audit.', modules: ['Budgeting','Treasury','Accounting','Audit'], startingPrice: 1500000000, subscription: 65000000, implWeeks: 20, target: ['Government','BUMN'],
    features: ['SIPD & SAKTI integration','Multi-year budget planning','Treasury single account (TSA)','Auto-generate audit trail','Real-time budget absorption dashboards'],
    benefits: ['Compliance with PP 12/2019','Faster budget disbursement (T+1)','Zero audit findings on treasury'],
    useCases: ['Kementerian / Lembaga','Pemda Provinsi & Kabupaten/Kota','BLU / BLUD'],
    techSpecs: 'Java Spring, PostgreSQL, integration bus, PKI-signed transactions' },
  { name: 'ERP Enterprise Platform', desc: 'Modern ERP with HR, finance, supply chain, and analytics on unified data model.', modules: ['HR','Finance','SCM','Analytics','Procurement'], startingPrice: 2000000000, subscription: 85000000, implWeeks: 24, target: ['Private Enterprise','BUMN'],
    features: ['Unified data model (HR, Finance, SCM)','Native AI copilot','Composable microservices','Low-code process designer'],
    benefits: ['22% opex reduction on average','3.4x faster monthly close','40% fewer manual reconciliations'],
    useCases: ['Manufacturing groups','Multi-entity conglomerates','State-owned enterprises (BUMN)'],
    techSpecs: 'React + Node microservices, event-driven, PostgreSQL + Snowflake analytics' },
  { name: 'Smart Manufacturing Platform', desc: 'IIoT + MES + predictive maintenance for factory-floor digitalisation.', modules: ['MES','OEE','Predictive Maintenance','Digital Twin'], startingPrice: 1800000000, subscription: 55000000, implWeeks: 18, target: ['Industrial Estate','Private Enterprise'],
    features: ['Real-time OEE dashboards','ML predictive maintenance','Digital twin of production line','Andon & downtime alerts','ISA-95 architecture'],
    benefits: ['12\u201318% OEE lift within 6 months','25% reduction in unplanned downtime','Full traceability per lot'],
    useCases: ['Automotive component manufacturers','FMCG bottling lines','Cement / steel plants'],
    techSpecs: 'OPC-UA, MQTT, Kafka, Grafana, TensorFlow serving' },
  { name: 'Smart Campus Platform', desc: 'Unified academic + facility + student experience platform for higher education.', modules: ['Academic','LMS','Facility','Student App'], startingPrice: 900000000, subscription: 35000000, implWeeks: 14, target: ['Education'],
    features: ['Modern LMS with proctoring','Digital student card + facility access','Class scheduling AI optimiser','Alumni & career portal'],
    benefits: ['30% higher student engagement','Fully paperless registration','Unified single-sign-on'],
    useCases: ['Universitas Negeri/Swasta','Politeknik','Sekolah Tinggi'],
    techSpecs: 'PWA + native mobile, SAML/OIDC SSO, LTI-compliant LMS' },
  { name: 'Command Center', desc: 'Enterprise command & control with video wall, geospatial ops, and AI-driven alerts.', modules: ['Video Wall','GIS','Alerting','Case Mgmt'], startingPrice: 3500000000, subscription: 0, implWeeks: 22, target: ['Government','Military'],
    features: ['Multi-source data fusion (CCTV, IoT, social)','AI anomaly detection','Geospatial common operating picture','Case & task orchestration','SOP playbooks'],
    benefits: ['Sub-minute incident response','360\u00b0 situational awareness','Unified command across agencies'],
    useCases: ['National command centers','Provincial disaster management','Military C4ISR'],
    techSpecs: 'Kafka streaming, Elastic, deck.gl geospatial, WebRTC video wall' },
  { name: 'GIS Platform', desc: 'Geospatial analytics with map layers, spatial analysis, and public dashboards.', modules: ['Basemap','Layers','Spatial Analytics','Dashboards'], startingPrice: 650000000, subscription: 22000000, implWeeks: 10, target: ['Government'],
    features: ['Vector & raster support','Spatial analytics (buffer, overlay, network)','Public portal builder','OGC-compliant services'],
    benefits: ['Faster tata ruang decisions','Transparent public dashboards','Integration with BPN & BIG'],
    useCases: ['Perencanaan tata ruang','Perizinan lokasi','Infrastruktur & utilitas'],
    techSpecs: 'PostGIS, GeoServer, MapLibre GL, WMS/WFS/WMTS' },
  { name: 'Network Infrastructure', desc: 'Data center + campus + WAN design & deployment with leading OEMs.', modules: ['Data Center','Campus LAN','SD-WAN','Wi-Fi'], startingPrice: 500000000, subscription: 0, implWeeks: 8, target: ['Government','Military','BUMN','Private Enterprise'],
    features: ['Cisco / Huawei / Fortinet certified engineers','SD-WAN with zero-touch provisioning','Wi-Fi 6/6E enterprise','Data center leaf-spine EVPN-VXLAN'],
    benefits: ['99.99% uptime SLA','40% WAN cost reduction with SD-WAN','Certified installation & 3-year support'],
    useCases: ['Kantor pusat & cabang','Kampus & rumah sakit','Data center Tier III'],
    techSpecs: 'Cisco Catalyst/Nexus, Huawei CloudEngine, Fortinet SD-WAN, HPE Aruba' },
  { name: 'CCTV AI Surveillance', desc: 'AI-powered CCTV with face, plate, anomaly and object recognition.', modules: ['Face Recognition','ANPR','Anomaly','VMS'], startingPrice: 850000000, subscription: 12000000, implWeeks: 8, target: ['Healthcare','Government','Industrial Estate'],
    features: ['Face recognition >99% accuracy','ANPR license plate reader','Loitering & crowd analytics','Watchlist alerting','Cloud + edge hybrid'],
    benefits: ['80% faster incident investigation','Automated compliance reporting','Reduced guard headcount'],
    useCases: ['Hospital patient safety','Kawasan industri security','Public order (perkotaan)'],
    techSpecs: 'NVIDIA Deepstream, ONVIF cameras, H.265 encoding, 30\u2011day cloud retention' },
  { name: 'IoT Platform', desc: 'Device management + telemetry + rules engine for industrial IoT.', modules: ['Device Mgmt','Telemetry','Rules','Analytics'], startingPrice: 400000000, subscription: 18000000, implWeeks: 6, target: ['Industrial Estate','BUMN'],
    features: ['LoRaWAN + NB-IoT + MQTT support','Digital twin per asset','Low-code rules engine','Grafana-based analytics'],
    benefits: ['10x faster IoT project rollout','Multi-protocol without custom code','Predictive maintenance ready'],
    useCases: ['Smart building','Utility metering','Environmental monitoring'],
    techSpecs: 'Eclipse Hono, TimescaleDB, Node-RED rules, Grafana' },
  { name: 'RFID System', desc: 'Asset tracking, patient wristband, and inventory RFID with reader network.', modules: ['Tag Provisioning','Reader Mgmt','Asset Ledger'], startingPrice: 350000000, subscription: 8000000, implWeeks: 6, target: ['Healthcare','Industrial Estate'],
    features: ['UHF + HF passive tag support','Fixed + handheld reader mgmt','Real-time location system (RTLS)'],
    benefits: ['95% inventory accuracy','60% faster stock take','Anti-loss patient wristband'],
    useCases: ['Rumah sakit asset & wristband','Warehouse pallet tracking','Retail apparel'],
    techSpecs: 'ISO 18000-6C UHF, GS1 EPCIS, Impinj/Zebra readers' },
  { name: 'API Gateway', desc: 'Enterprise API management with policy, security, and developer portal.', modules: ['Gateway','Dev Portal','Policy','Analytics'], startingPrice: 300000000, subscription: 15000000, implWeeks: 5, target: ['BUMN','Government','Private Enterprise'],
    features: ['OAuth2 / OIDC / mTLS','Rate limiting & quota','Developer self-serve portal','Full analytics & tracing'],
    benefits: ['Faster partner onboarding','Zero-trust API security','Unified monetisation'],
    useCases: ['Open Banking','Government service integration','B2B API monetisation'],
    techSpecs: 'Kong Enterprise, OPA policies, OpenTelemetry, Redis rate limits' },
  { name: 'Mobile Super App', desc: 'Composable mobile super app framework with micro-frontends and mini-programs.', modules: ['Shell','Mini-programs','Push','Analytics'], startingPrice: 1200000000, subscription: 40000000, implWeeks: 16, target: ['BUMN','Private Enterprise'],
    features: ['Mini-program runtime (React Native)','Feature flag & remote config','In-app push & campaign','Full observability'],
    benefits: ['3x faster new feature rollout','Multiple business units in one app','Data unification across services'],
    useCases: ['BUMN citizen super app','Retail loyalty + commerce','FinTech ecosystem app'],
    techSpecs: 'React Native, Metro bundler, Sentry, Amplitude, Firebase' },
];

const PARTNERS_SEED = [
  { name: 'Huawei', category: 'Network + Cloud', tier: 'Platinum', country: 'China', contactName: 'Kevin Wang', email: 'kevin.wang@huawei.com', phone: '+62 21 5000 1234', products: ['CloudEngine Switches','Kunpeng Servers','Cloud Stack','OceanStor Storage'], sla: '4-hour on-site response, 24x7 TAC', notes: 'Strategic partner for Command Center & Data Center' },
  { name: 'Cisco', category: 'Network + Security', tier: 'Platinum', country: 'USA', contactName: 'Andini Prasetyo', email: 'apraset@cisco.com', phone: '+62 21 5000 2000', products: ['Catalyst Switches','Nexus Data Center','Meraki Wi-Fi','ISE / Umbrella'], sla: 'NBD hardware replacement, Smart Net Total Care', notes: 'Gold Certified Integrator status' },
  { name: 'Fortinet', category: 'Security', tier: 'Gold', country: 'USA', contactName: 'Rico Setiawan', email: 'rico@fortinet.com', phone: '+62 21 5000 3300', products: ['FortiGate NGFW','FortiSIEM','FortiSwitch','FortiAP'], sla: 'FortiCare 24x7 with 4-hour hardware RMA', notes: 'Certified NSE 4-7 team' },
  { name: 'Mikrotik', category: 'Network', tier: 'Silver', country: 'Latvia', contactName: 'Bagus Riyanto', email: 'sales@mikrotik.co.id', phone: '+62 21 5000 4400', products: ['CCR Routers','CRS Switches','WAP AC','CHR Cloud Hosted'], sla: 'Depot replacement, community support', notes: 'Preferred for mid-market rollouts' },
  { name: 'Dell', category: 'Compute + Storage', tier: 'Platinum', country: 'USA', contactName: 'Melissa Handoko', email: 'melissa.h@dell.com', phone: '+62 21 5000 5500', products: ['PowerEdge Servers','PowerStore','PowerScale','APEX Cloud'], sla: 'ProSupport Plus 4-hour mission critical', notes: 'Titanium partner tier' },
  { name: 'HPE', category: 'Compute + Storage', tier: 'Gold', country: 'USA', contactName: 'Doni Kurniawan', email: 'doni@hpe.com', phone: '+62 21 5000 6600', products: ['ProLiant Gen11','GreenLake','Alletra Storage','SimpliVity'], sla: 'HPE Pointnext 24x7 CTR', notes: 'GreenLake consumption model available' },
  { name: 'Lenovo', category: 'Compute', tier: 'Gold', country: 'China', contactName: 'Sarah Lestari', email: 'slestari@lenovo.com', phone: '+62 21 5000 7700', products: ['ThinkSystem Servers','ThinkAgile HCI','ThinkStation','Storage DS Series'], sla: 'Premier Support 24x7', notes: 'Best value for enterprise refresh' },
  { name: 'Local Distributor', category: 'Various', tier: 'Silver', country: 'Indonesia', contactName: 'Distribution Team', email: 'ops@localdist.co.id', phone: '+62 21 5000 8888', products: ['Cabling','Racks','Accessories','Local support'], sla: 'Same-day pickup Jakarta area', notes: 'For low-value fast-turn items' },
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
  } else {
    // Upgrade existing product docs with richer detail fields if missing
    for (const p of CATALOG) {
      await db.collection('products').updateOne(
        { name: p.name, features: { $exists: false } },
        { $set: { features: p.features, benefits: p.benefits, useCases: p.useCases, techSpecs: p.techSpecs } }
      );
    }
  }
  
  // Always ensure partners are seeded
  const partnerCount = await db.collection('partners').countDocuments();
  if (partnerCount === 0) {
    const partnerDocs = PARTNERS_SEED.map(p => ({ id: uuidv4(), ...p, status: 'Active', createdAt: new Date() }));
    await db.collection('partners').insertMany(partnerDocs);
  }
  
  // Always ensure demo projects exist if opps exist but projects don't
  const oppList = await db.collection('opportunities').find({ stage: { $in: ['Implementation','Closed Won'] } }).toArray();
  const projCount = await db.collection('projects').countDocuments();
  if (projCount === 0 && oppList.length > 0) {
    const demoProjects = oppList.map(o => ({
      id: uuidv4(), name: o.projectName, opportunityId: o.id, organizationName: o.organizationName, product: o.product,
      status: o.stage === 'Closed Won' ? 'Support' : 'Implementation',
      progress: o.stage === 'Closed Won' ? 95 : 60,
      budget: o.value, startDate: new Date(Date.now() - 60*86400000), endDate: new Date(Date.now() + 90*86400000),
      businessOwner: o.businessOwner, technicalOwner: o.technicalOwner,
      deliverables: [
        { id: uuidv4(), title: 'Kick-off & requirements sign-off', status: 'Done', dueDate: new Date(Date.now() - 40*86400000) },
        { id: uuidv4(), title: 'Solution design document', status: 'Done', dueDate: new Date(Date.now() - 20*86400000) },
        { id: uuidv4(), title: 'Pilot deployment', status: o.stage === 'Closed Won' ? 'Done' : 'In Progress', dueDate: new Date(Date.now() + 10*86400000) },
        { id: uuidv4(), title: 'User acceptance test', status: o.stage === 'Closed Won' ? 'Done' : 'Pending', dueDate: new Date(Date.now() + 30*86400000) },
        { id: uuidv4(), title: 'Go-Live & handover', status: o.stage === 'Closed Won' ? 'In Progress' : 'Pending', dueDate: new Date(Date.now() + 60*86400000) }
      ],
      milestones: [
        { id: uuidv4(), title: 'Contract signed', at: new Date(Date.now() - 65*86400000), status: 'Done' },
        { id: uuidv4(), title: 'Requirements finalised', at: new Date(Date.now() - 30*86400000), status: 'Done' },
        { id: uuidv4(), title: 'Development complete', at: new Date(Date.now() + 15*86400000), status: 'In Progress' },
        { id: uuidv4(), title: 'Go-Live', at: new Date(Date.now() + 45*86400000), status: 'Pending' }
      ],
      internalNotes: `Project derived from opportunity: ${o.projectName}. Business owner ${o.businessOwner} leading. Weekly steerco every Monday.`,
      createdAt: new Date()
    }));
    if (demoProjects.length > 0) await db.collection('projects').insertMany(demoProjects);
  }
  
  if (count > 0) return { seeded: false, products: prodCount === 0 ? CATALOG.length : prodCount, partners: partnerCount === 0 ? PARTNERS_SEED.length : partnerCount, projects: projCount === 0 ? oppList.length : projCount };

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

  // Auto-create projects from Implementation / Closed Won opportunities
  const projectStages = ['Implementation','Closed Won'];
  const projectDocs = oppDocs.filter(o => projectStages.includes(o.stage)).map(o => ({
    id: uuidv4(),
    name: o.projectName,
    opportunityId: o.id,
    organizationName: o.organizationName,
    product: o.product,
    status: o.stage === 'Closed Won' ? 'Support' : 'Implementation',
    progress: o.stage === 'Closed Won' ? 95 : 60,
    budget: o.value,
    startDate: new Date(Date.now() - 60*86400000),
    endDate: new Date(Date.now() + 90*86400000),
    businessOwner: o.businessOwner,
    technicalOwner: o.technicalOwner,
    deliverables: [
      { id: uuidv4(), title: 'Kick-off & requirements sign-off', status: 'Done', dueDate: new Date(Date.now() - 40*86400000) },
      { id: uuidv4(), title: 'Solution design document', status: 'Done', dueDate: new Date(Date.now() - 20*86400000) },
      { id: uuidv4(), title: 'Pilot deployment', status: o.stage === 'Closed Won' ? 'Done' : 'In Progress', dueDate: new Date(Date.now() + 10*86400000) },
      { id: uuidv4(), title: 'User acceptance test', status: o.stage === 'Closed Won' ? 'Done' : 'Pending', dueDate: new Date(Date.now() + 30*86400000) },
      { id: uuidv4(), title: 'Go-Live & handover', status: o.stage === 'Closed Won' ? 'In Progress' : 'Pending', dueDate: new Date(Date.now() + 60*86400000) },
    ],
    milestones: [
      { id: uuidv4(), title: 'Contract signed', at: new Date(Date.now() - 65*86400000), status: 'Done' },
      { id: uuidv4(), title: 'Requirements finalised', at: new Date(Date.now() - 30*86400000), status: 'Done' },
      { id: uuidv4(), title: 'Development complete', at: new Date(Date.now() + 15*86400000), status: 'In Progress' },
      { id: uuidv4(), title: 'Go-Live', at: new Date(Date.now() + 45*86400000), status: 'Pending' },
    ],
    internalNotes: `Project derived from opportunity: ${o.projectName}. Business owner ${o.businessOwner} leading. Weekly steerco every Monday.`,
    createdAt: new Date()
  }));
  if (projectDocs.length > 0) await db.collection('projects').insertMany(projectDocs);

  return { seeded: true, organizations: orgDocs.length, opportunities: oppDocs.length, risks: riskDocs.length, activities: actDocs.length, products: CATALOG.length };
}

export { STAGES, INDUSTRIES, PRODUCTS, PARTNERS };
