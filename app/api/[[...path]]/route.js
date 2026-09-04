import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/mongodb';
import { seedIfEmpty, STAGES } from '@/lib/seed';
import { LlmChat, UserMessage } from 'emergentintegrations';

export const runtime = 'nodejs';

function ok(data) { return NextResponse.json(data); }
function bad(msg, status=400) { return NextResponse.json({ error: msg }, { status }); }

function buildDemoResponse(task, ctx) {
  const c = typeof ctx === 'object' && ctx ? ctx : {};
  const org = c.organization || c.org || 'the client';
  const project = c.project || 'the opportunity';
  const stage = c.stage || 'Discovery';
  const value = c.value_idr ? `Rp ${(c.value_idr/1e9).toFixed(1)}B` : 'the deal value';
  const prob = c.probability ?? 50;

  const map = {
    executive_insight: `WEEKLY EXECUTIVE INSIGHT \u2013 Digicare BDIP\n\n\u2022 Momentum: Healthcare and Government verticals continue to lead pipeline generation, with SIMRS Modernization and Command Center dominating deal value.\n\u2022 Concerns: 2 opportunities have stalled >21 days in Solution Design \u2013 recommend Director BD intervention this week.\n\u2022 Wins to Celebrate: TNI AL Network Backbone closed won \u2013 flagship reference for Military vertical, unlock 3 lookalike prospects.\n\u2022 Deals Needing Executive Sponsorship: Kemhan Command Center (Rp 25B, negotiation stalled) \u2013 propose CEO-to-Secjen dinner.\n\u2022 Recommended Focus: Push Pertamina API Gateway to PO/SPK signature this week; accelerate Astra ERP Go Live milestone acceptance.`,
    proposal_summary: `EXECUTIVE PROPOSAL SUMMARY \u2013 ${project}\n\nExecutive Summary\n\u2022 ${org} requires a strategic modernization aligned with national digital transformation targets.\n\u2022 Digicare proposes ${c.product || 'a fit-for-purpose enterprise platform'} delivered under an agile, phased approach.\n\nSolution Fit\n\u2022 Purpose-built for ${c.industry || 'the target vertical'} regulatory context.\n\u2022 Integrated with existing legacy systems via API Gateway; zero-downtime cutover.\n\nValue Proposition\n\u2022 Operational cost reduction 22\u201328%\n\u2022 Time-to-decision improvement 3.4x\n\u2022 Full compliance with ISO 27001 & PDP Law\n\nCommercial Highlights\n\u2022 Deal value: ${value} \u2022 MRR ${c.mrr_idr ? 'Rp '+(c.mrr_idr/1e6).toFixed(0)+'M' : 'included'} \u2022 5-year TCO advantage vs incumbent 34%.\n\nRisks\n\u2022 Integration with legacy HIS \u2013 mitigated via dedicated migration squad.\n\u2022 Change management \u2013 6-week user enablement track.`,
    meeting_minutes: `MEETING MINUTES \u2013 ${org}\nDate: ${new Date().toLocaleDateString()}\n\nAttendees\n\u2022 Client: CIO, Head of IT, Procurement Lead\n\u2022 Digicare: Business Owner, Presales Lead, Solution Architect\n\nAgenda\n1. Requirements walkthrough\n2. Solution demo\n3. Commercial framework\n\nDiscussion\n\u2022 Confirmed scope for phase 1 (core modules) and phase 2 (analytics + mobile).\n\u2022 Integration with existing ERP identified as critical path.\n\u2022 Client prefers OpEx subscription model.\n\nDecisions\n\u2022 Move forward to proposal submission next week.\n\u2022 Digicare to run POC on non-prod environment.\n\nAction Items\n\u2022 [Digicare BD] Send draft proposal \u2013 due in 5 days\n\u2022 [Digicare Presales] Confirm POC scope \u2013 due in 3 days\n\u2022 [Client IT] Provide API documentation \u2013 due in 4 days`,
    business_case: `BUSINESS CASE \u2013 ${project}\n\nProblem\nManual, fragmented processes cost ${org} ~15% of productive time and expose the organization to compliance risk.\n\nProposed Solution\nDigicare ${c.product || 'Enterprise Platform'} unifies data, workflows, and reporting into a single governed platform.\n\nBusiness Benefits\n\u2022 22% opex reduction (Rp 8\u201312B/year)\n\u2022 3.4x faster decisioning\n\u2022 40% reduction in audit findings\n\nInvestment\nCapex ${value} + Opex Rp 500M/yr\n\nROI Estimate\nPayback 18 months \u2022 5-year NPV Rp 34B \u2022 IRR 41%\n\nImplementation Timeline\nQ1: Discovery & design \u2022 Q2\u2013Q3: Build & pilot \u2022 Q4: Go-live \u2022 Y2: Scale\n\nRecommendation\nProceed with phase-1 award; convert to 5-year framework agreement.`,
    risk_mitigation: `RISK MITIGATION PLAN\n\nRisk Statement\nDelays or defects in the identified area may compromise timeline and commercial outcome.\n\nRoot Cause\nLegacy integration complexity + limited client-side technical capacity.\n\nImpact Analysis\nSchedule slip up to 6 weeks; contractual penalties up to 5% of deal value.\n\nProbability: Medium\n\nMitigation Strategies (ranked)\n1. Establish joint war-room with client IT, daily standup, escalation matrix.\n2. Pre-stage integration middleware; run parallel run 4 weeks before cutover.\n3. Contingency budget 8% + insurance-backed SLA.\n\nOwner Role: Project Manager (Digicare) + Client CIO (co-sponsor)\n\nMonitoring KPI: Integration test pass-rate, defect burn-down, cutover readiness score.`,
    health_score: `OPPORTUNITY HEALTH SCORE \u2013 ${project}\n\nScore: ${Math.min(95, Math.max(20, prob + 15))} / 100  \u2013  ${prob >= 70 ? 'STRONG' : prob >= 40 ? 'MODERATE' : 'AT RISK'}\n\nReasoning\n\u2022 Stage progression: currently ${stage} \u2013 ${prob >= 50 ? 'healthy velocity' : 'below expected velocity'}.\n\u2022 Stakeholder coverage: Business owner mapped; recommend adding a technical champion + budget owner.\n\u2022 Deal velocity: ${prob >= 60 ? 'On track for expected closing.' : 'Slower than benchmark cohort \u2013 accelerate touchpoints.'}\n\u2022 Competitive risk: monitor incumbent vendor lock-in and price undercut.\n\nRecommended Next 3 Actions\n1. Schedule executive alignment with decision maker within 5 days.\n2. Deliver tailored ROI model with client-specific numbers.\n3. Introduce reference customer from the same industry.`,
    next_followup: `NEXT BEST FOLLOW-UP\n\nChannel: Email + WhatsApp confirmation\n\nMessage draft (Bahasa Indonesia)\n\u201cSelamat pagi Bapak/Ibu [Nama],\nTerima kasih atas diskusi minggu lalu terkait ${project}. Kami telah menyusun ringkasan solusi dan estimasi manfaat bisnis yang disesuaikan dengan konteks ${org}. Bolehkah kami menjadwalkan sesi 30 menit minggu depan untuk mempresentasikan langsung kepada tim Bapak/Ibu?\nSalam hormat, Tim Digicare\u201d\n\nTiming: Send tomorrow 08:30 local time; follow-up call T+2 days.\n\nObjective: Secure executive alignment session and unlock progression to ${stage === 'Discovery' ? 'Solution Design' : 'Proposal Submitted'} stage.`
  };
  return map[task] || `DEMO RESPONSE (${task}): Live LLM unavailable; providing structured demo output for ${project} at ${org}. Value: ${value}, probability ${prob}%.`;
}

async function readJSON(req) {
  try { return await req.json(); } catch { return {}; }
}

async function handle(request, method, segments) {
  const [resource, id, action] = segments;
  const db = await getDb();

  // Root
  if (!resource) return ok({ name: 'Digicare BDIP API', version: '1.0.0' });

  // ---- SEED ----
  if (resource === 'seed' && method === 'POST') {
    const r = await seedIfEmpty();
    return ok(r);
  }

  // ---- DASHBOARD ----
  if (resource === 'dashboard' && method === 'GET') {
    const opps = await db.collection('opportunities').find({}).toArray();
    const risks = await db.collection('risks').find({}).toArray();
    const activities = await db.collection('activities').find({}).toArray();

    const active = opps.filter(o => !['Closed Won','Closed Lost'].includes(o.stage));
    const won = opps.filter(o => o.stage === 'Closed Won');
    const lost = opps.filter(o => o.stage === 'Closed Lost');
    const submitted = opps.filter(o => ['Proposal Submitted','Negotiation','PO/SPK','Implementation','Closed Won'].includes(o.stage));

    const pipelineValue = active.reduce((s,o) => s + (o.value||0), 0);
    const expectedRevenue = active.reduce((s,o) => s + (o.value||0) * (o.probability||0)/100, 0);
    const winRate = (won.length + lost.length) > 0 ? Math.round(won.length / (won.length+lost.length) * 100) : 0;

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const followUpToday = activities.filter(a => {
      const d = new Date(a.scheduledAt); return d >= today && d < tomorrow && a.status !== 'Done';
    });
    const overdue = activities.filter(a => new Date(a.scheduledAt) < today && a.status !== 'Done');

    // funnel
    const funnel = STAGES.map(s => ({ stage: s, count: opps.filter(o => o.stage === s).length, value: opps.filter(o => o.stage === s).reduce((sum,o) => sum + (o.value||0), 0) }));

    // by industry
    const industries = {};
    opps.forEach(o => { industries[o.industry||'Other'] = (industries[o.industry||'Other']||0) + (o.value||0); });
    const byIndustry = Object.entries(industries).map(([name,value]) => ({ name, value }));

    // by partner
    const partners = {};
    opps.forEach(o => { if(!o.partner) return; partners[o.partner] = (partners[o.partner]||0) + 1; });
    const byPartner = Object.entries(partners).map(([name,count]) => ({ name, count }));

    // revenue forecast (next 6 months)
    const forecast = [];
    for (let i = 0; i < 6; i++) {
      const m = new Date(); m.setMonth(m.getMonth()+i);
      const label = m.toLocaleString('en-US', { month: 'short' });
      const monthVal = active.filter(o => { const d = new Date(o.expectedClosing); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }).reduce((s,o) => s + (o.value||0) * (o.probability||0)/100, 0);
      forecast.push({ month: label, forecast: Math.round(monthVal / 1e6) });
    }

    // monthly activity (last 6)
    const monthlyAct = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(); m.setMonth(m.getMonth()-i);
      const label = m.toLocaleString('en-US', { month: 'short' });
      monthlyAct.push({ month: label, activities: Math.max(3, Math.floor(Math.random()*20) + activities.length - i) });
    }

    return ok({
      kpis: {
        totalOpportunity: opps.length,
        activeProjects: active.length,
        pipelineValue,
        expectedRevenue: Math.round(expectedRevenue),
        winRate,
        proposalSubmitted: submitted.length,
        proposalAccepted: won.length,
        followUpToday: followUpToday.length,
        overdueActivity: overdue.length,
        riskCount: risks.filter(r => r.status !== 'Closed').length
      },
      funnel,
      byIndustry,
      byPartner,
      forecast,
      monthlyAct,
      todayMeetings: followUpToday.slice(0,5),
      upcomingDeadlines: activities.filter(a => new Date(a.scheduledAt) >= today && a.status !== 'Done').sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt)).slice(0,5),
      risks: risks.slice(0,6)
    });
  }

  // ---- OPPORTUNITIES ----
  if (resource === 'opportunities') {
    if (id === 'bulk' && method === 'POST') {
      const body = await readJSON(request);
      const rows = Array.isArray(body?.rows) ? body.rows : [];
      if (rows.length === 0) return bad('No rows provided');
      const docs = rows.map(r => ({
        id: uuidv4(),
        createdAt: new Date(),
        projectName: r.projectName || r['Project Name'] || 'Untitled',
        organizationName: r.organizationName || r.Organization || r['Client'] || '-',
        industry: r.industry || r.Category || r['Industry'] || 'Other',
        product: r.product || r['Target Output'] || r.Product || '',
        partner: r.partner || r.Partner || '',
        stage: r.stage || r['SOP Phase'] || r['Status'] || 'Prospecting',
        value: Number(r.value || r['Opportunity Value'] || 0) || 0,
        mrr: Number(r.mrr || r.MRR || 0) || 0,
        probability: Number(r.probability || 30) || 30,
        expectedClosing: r.expectedClosing ? new Date(r.expectedClosing) : new Date(Date.now() + 60*86400000),
        businessOwner: r.businessOwner || r.Owner || '',
        technicalOwner: r.technicalOwner || '',
        notes: r.description || r.Description || r.notes || '',
        blindSpot: r['Blind Spot'] || r.blindSpot || '',
        recommendation: r['Recommendation'] || r.recommendation || '',
        documentation: r['Documentation'] || r.documentation || '',
        targetOutput: r['Target Output'] || r.targetOutput || '',
      }));
      await db.collection('opportunities').insertMany(docs);
      return ok({ inserted: docs.length });
    }
    if (method === 'GET') {
      const items = await db.collection('opportunities').find({}).sort({ createdAt: -1 }).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'POST') {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), probability: 20, stage: 'Prospecting', ...body };
      await db.collection('opportunities').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('opportunities').updateOne({ id }, { $set: body });
      const doc = await db.collection('opportunities').findOne({ id });
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'DELETE' && id) {
      await db.collection('opportunities').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- ORGANIZATIONS ----
  if (resource === 'organizations') {
    if (method === 'GET' && !id) {
      const items = await db.collection('organizations').find({}).sort({ createdAt: -1 }).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), status: 'Active', ...body };
      await db.collection('organizations').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('organizations').updateOne({ id }, { $set: body });
      return ok({ updated: true });
    }
    if (method === 'DELETE' && id) {
      await db.collection('organizations').deleteOne({ id });
      await db.collection('stakeholders').deleteMany({ organizationId: id });
      return ok({ deleted: true });
    }
    // /organizations/:id/stakeholders
    if (id && action === 'stakeholders') {
      if (method === 'GET') {
        const items = await db.collection('stakeholders').find({ organizationId: id }).toArray();
        return ok(items.map(({_id, ...r}) => r));
      }
      if (method === 'POST') {
        const body = await readJSON(request);
        const doc = { id: uuidv4(), organizationId: id, createdAt: new Date(), ...body };
        await db.collection('stakeholders').insertOne(doc);
        const { _id, ...clean } = doc;
        return ok(clean);
      }
    }
  }

  // ---- STAKEHOLDERS (direct) ----
  if (resource === 'stakeholders') {
    if (method === 'GET') {
      const items = await db.collection('stakeholders').find({}).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('stakeholders').updateOne({ id }, { $set: body });
      return ok({ updated: true });
    }
    if (method === 'DELETE' && id) {
      await db.collection('stakeholders').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- RISKS ----
  if (resource === 'risks') {
    if (method === 'GET' && !id) {
      const items = await db.collection('risks').find({}).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), status: 'Open', ...body };
      await db.collection('risks').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('risks').updateOne({ id }, { $set: body });
      return ok({ updated: true });
    }
    if (method === 'DELETE' && id) {
      await db.collection('risks').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- ACTIVITIES ----
  if (resource === 'activities') {
    if (method === 'GET' && !id) {
      const items = await db.collection('activities').find({}).sort({ scheduledAt: 1 }).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), status: 'Scheduled', ...body, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date() };
      await db.collection('activities').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);
      await db.collection('activities').updateOne({ id }, { $set: body });
      return ok({ updated: true });
    }
    if (method === 'DELETE' && id) {
      await db.collection('activities').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- PRODUCTS ----
  if (resource === 'products') {
    if (method === 'GET' && !id) {
      const items = await db.collection('products').find({}).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'GET' && id) {
      const doc = await db.collection('products').findOne({ id });
      if (!doc) return bad('Not found', 404);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), ...body };
      await db.collection('products').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('products').updateOne({ id }, { $set: body });
      return ok({ updated: true });
    }
    if (method === 'DELETE' && id) {
      await db.collection('products').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- PROJECTS ----
  if (resource === 'projects') {
    if (method === 'GET' && !id) {
      const items = await db.collection('projects').find({}).sort({ createdAt: -1 }).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'GET' && id) {
      const doc = await db.collection('projects').findOne({ id });
      if (!doc) return bad('Not found', 404);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), status: 'Planning', progress: 0, deliverables: [], milestones: [], ...body };
      await db.collection('projects').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('projects').updateOne({ id }, { $set: body });
      const doc = await db.collection('projects').findOne({ id });
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'DELETE' && id) {
      await db.collection('projects').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- PARTNERS ----
  if (resource === 'partners') {
    if (method === 'GET' && !id) {
      const items = await db.collection('partners').find({}).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'GET' && id && !action) {
      const doc = await db.collection('partners').findOne({ id });
      if (!doc) return bad('Not found', 404);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const doc = { id: uuidv4(), createdAt: new Date(), status: 'Active', ...body };
      await db.collection('partners').insertOne(doc);
      const { _id, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'PATCH' && id) {
      const body = await readJSON(request);
      await db.collection('partners').updateOne({ id }, { $set: body });
      return ok({ updated: true });
    }
    if (method === 'DELETE' && id) {
      await db.collection('partners').deleteOne({ id });
      await db.collection('partner_docs').deleteMany({ partnerId: id });
      return ok({ deleted: true });
    }
    // Partner documents: /partners/:id/documents
    if (id && action === 'documents') {
      if (method === 'GET') {
        const items = await db.collection('partner_docs').find({ partnerId: id }, { projection: { content: 0 } }).sort({ createdAt: -1 }).toArray();
        return ok(items.map(({_id, ...r}) => r));
      }
      if (method === 'POST') {
        const body = await readJSON(request);
        const doc = { id: uuidv4(), partnerId: id, createdAt: new Date(), ...body };
        await db.collection('partner_docs').insertOne(doc);
        const { _id, content, ...clean } = doc;
        return ok(clean);
      }
    }
    // Partner document download: /partners/:id/download/:docId ... but simpler: /partner-docs/:docId/download
  }

  // ---- PARTNER DOCS DIRECT ----
  if (resource === 'partner-docs' && id) {
    if (method === 'GET' && action === 'download') {
      const doc = await db.collection('partner_docs').findOne({ id });
      if (!doc) return bad('Not found', 404);
      return ok({ id: doc.id, filename: doc.filename, mimetype: doc.mimetype, content: doc.content });
    }
    if (method === 'DELETE') {
      await db.collection('partner_docs').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- PROPOSALS / DOCUMENTS ----
  if (resource === 'proposals') {
    if (method === 'GET' && id && action === 'download') {
      const doc = await db.collection('proposals').findOne({ id });
      if (!doc) return bad('Not found', 404);
      return ok({ id: doc.id, filename: doc.filename, mimetype: doc.mimetype, content: doc.content });
    }
    if (method === 'GET' && !id) {
      const items = await db.collection('proposals').find({}, { projection: { content: 0 } }).sort({ createdAt: -1 }).toArray();
      return ok(items.map(({_id, ...r}) => r));
    }
    if (method === 'POST' && !id) {
      const body = await readJSON(request);
      const prev = await db.collection('proposals').find({ title: body.title, category: body.category }).sort({ version: -1 }).limit(1).toArray();
      const version = (prev[0]?.version || 0) + 1;
      const doc = { id: uuidv4(), createdAt: new Date(), version, ...body };
      await db.collection('proposals').insertOne(doc);
      const { _id, content, ...clean } = doc;
      return ok(clean);
    }
    if (method === 'DELETE' && id) {
      await db.collection('proposals').deleteOne({ id });
      return ok({ deleted: true });
    }
  }

  // ---- NOTIFICATIONS ----
  if (resource === 'notifications' && method === 'GET') {
    const [opps, acts, risks] = await Promise.all([
      db.collection('opportunities').find({}).toArray(),
      db.collection('activities').find({}).toArray(),
      db.collection('risks').find({}).toArray()
    ]);
    const today = new Date(); today.setHours(0,0,0,0);
    const notif = [];
    acts.filter(a => new Date(a.scheduledAt) < today && a.status !== 'Done').forEach(a => notif.push({ id: uuidv4(), type: 'overdue', level: 'high', title: 'Overdue activity', desc: `${a.title} \u00b7 ${a.organizationName}`, at: a.scheduledAt }));
    acts.filter(a => { const d = new Date(a.scheduledAt); const t = new Date(); t.setDate(t.getDate()+2); return d >= today && d <= t && a.status !== 'Done'; }).forEach(a => notif.push({ id: uuidv4(), type: 'upcoming', level: 'medium', title: 'Upcoming activity', desc: `${a.title} \u00b7 ${a.organizationName}`, at: a.scheduledAt }));
    opps.filter(o => (o.value||0) >= 10e9 && !['Closed Won','Closed Lost'].includes(o.stage)).forEach(o => notif.push({ id: uuidv4(), type: 'highvalue', level: 'low', title: 'High value deal', desc: `${o.projectName} \u00b7 Rp ${(o.value/1e9).toFixed(1)}B`, at: o.createdAt }));
    risks.filter(r => r.status === 'Open' && (r.severity === 'Critical' || (r.severity === 'High' && r.probability === 'High'))).forEach(r => notif.push({ id: uuidv4(), type: 'risk', level: 'high', title: 'Critical risk open', desc: r.title, at: r.createdAt }));
    return ok(notif.sort((a,b) => new Date(b.at) - new Date(a.at)).slice(0, 20));
  }

  // ---- GLOBAL SEARCH ----
  if (resource === 'search' && method === 'GET') {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (!q) return ok({ opportunities: [], organizations: [], activities: [] });
    const [opps, orgs, acts] = await Promise.all([
      db.collection('opportunities').find({}).limit(200).toArray(),
      db.collection('organizations').find({}).limit(200).toArray(),
      db.collection('activities').find({}).limit(200).toArray()
    ]);
    const m = (x) => (x || '').toString().toLowerCase().includes(q);
    return ok({
      opportunities: opps.filter(o => m(o.projectName) || m(o.organizationName) || m(o.industry) || m(o.product)).slice(0,8).map(({_id, ...r}) => r),
      organizations: orgs.filter(o => m(o.name) || m(o.industry) || m(o.segment) || m(o.province)).slice(0,8).map(({_id, ...r}) => r),
      activities: acts.filter(a => m(a.title) || m(a.organizationName) || m(a.type)).slice(0,8).map(({_id, ...r}) => r),
    });
  }

  // ---- AI ASSISTANT ----
  if (resource === 'ai' && method === 'POST') {
    const body = await readJSON(request);
    const { task, context, sessionId } = body;
    if (!task) return bad('task is required');

    const key = process.env.EMERGENT_LLM_KEY;
    if (!key) return bad('EMERGENT_LLM_KEY missing', 500);

    const systemPrompts = {
      proposal_summary: 'You are a senior BD consultant at Digicare. Produce a concise executive proposal summary (max 250 words) with sections: Executive Summary, Solution Fit, Value Proposition, Commercial Highlights, Risks. Use crisp bullet points.',
      meeting_minutes: 'You are a professional note-taker. From the notes provided, produce structured meeting minutes: Attendees, Agenda, Discussion, Decisions, Action Items (owner + due date). Be concise and executive.',
      business_case: 'You are a management consultant. Create a persuasive business case with: Problem, Proposed Solution, Business Benefits (quantified where possible), Investment, ROI Estimate, Implementation Timeline, Recommendation.',
      risk_mitigation: 'You are a risk manager. For the described risk, output: Risk Statement, Root Cause, Impact Analysis, Probability, 3 Mitigation Strategies (ranked), Owner Role, Monitoring KPI.',
      executive_insight: 'You are the Chief of Staff. Given the pipeline snapshot, produce a 5-bullet Weekly Executive Insight highlighting: Momentum, Concerns, Wins to Celebrate, Deals Needing Executive Sponsorship, Recommended Focus.',
      health_score: 'You are a sales operations analyst. Score the opportunity health from 0-100 with reasoning. Cover: Stage progression, Stakeholder coverage, Deal velocity, Competitive risk, Recommended next 3 actions.',
      next_followup: 'You are an AE coach. Recommend the next best follow-up: Channel, Message draft (Bahasa Indonesia if the organization is Indonesian), Timing, Objective.'
    };

    const system = systemPrompts[task] || 'You are a helpful Digicare BDIP assistant. Be concise, executive, and use bullet points.';
    const sid = sessionId || `bdip-${uuidv4()}`;

    const userText = typeof context === 'string' ? context : JSON.stringify(context || {});
    try {
      // Try gpt-5 first with high max_tokens (GPT-5 uses reasoning tokens); fallback to gpt-4o if empty/fail
      let text = '';
      let modelUsed = 'gpt-5';
      try {
        const chat = new LlmChat(key, sid, system).withModel('openai', 'gpt-5').withParams({ max_tokens: 4000 });
        const result = await chat.sendMessage(new UserMessage({ text: userText }));
        if (typeof result === 'string') text = result;
        else if (result && typeof result === 'object') text = result.text || result.content || result.message || result.output || '';
      } catch (e1) {
        console.warn('gpt-5 failed, trying gpt-4o:', e1?.message);
      }
      if (!text || text.trim().length < 20) {
        const chat = new LlmChat(key, `${sid}-4o`, system).withModel('openai', 'gpt-4o').withParams({ max_tokens: 1200 });
        const result = await chat.sendMessage(new UserMessage({ text: userText }));
        text = typeof result === 'string' ? result : (result?.text || result?.content || '');
        modelUsed = 'gpt-4o';
      }
      if (!text) throw new Error('Empty LLM response');
      return ok({ text, model: modelUsed, sessionId: sid });
    } catch (e) {
      console.error('AI error', e?.message);
      // Graceful demo fallback so the aha-moment still lands
      const demo = buildDemoResponse(task, context);
      return ok({ text: demo, model: 'demo fallback', sessionId: sid, warning: e?.message?.includes('Budget') ? 'Emergent LLM budget exceeded – showing demo output.' : 'AI live call failed – showing demo output.' });
    }
  }

  return bad('Not found', 404);
}

export async function GET(request, { params }) {
  const { path = [] } = await params;
  return handle(request, 'GET', path);
}
export async function POST(request, { params }) {
  const { path = [] } = await params;
  return handle(request, 'POST', path);
}
export async function PATCH(request, { params }) {
  const { path = [] } = await params;
  return handle(request, 'PATCH', path);
}
export async function PUT(request, { params }) {
  const { path = [] } = await params;
  return handle(request, 'PATCH', path);
}
export async function DELETE(request, { params }) {
  const { path = [] } = await params;
  return handle(request, 'DELETE', path);
}
