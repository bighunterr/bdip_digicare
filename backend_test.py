#!/usr/bin/env python3
"""
Comprehensive backend API test for Digicare BDIP
Tests all endpoints: seed, dashboard, opportunities, organizations, stakeholders, risks, AI
"""
import requests
import json
import time
from datetime import datetime, timedelta

# Base URL from .env
BASE_URL = "https://intelligence-hub-175.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    print(f"✅ PASS: {test_name}")
    test_results["passed"].append(test_name)

def log_fail(test_name, reason):
    print(f"❌ FAIL: {test_name} - {reason}")
    test_results["failed"].append(f"{test_name}: {reason}")

def log_warning(test_name, reason):
    print(f"⚠️  WARNING: {test_name} - {reason}")
    test_results["warnings"].append(f"{test_name}: {reason}")

def print_summary():
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")
    print(f"⚠️  Warnings: {len(test_results['warnings'])}")
    
    if test_results['failed']:
        print("\nFailed Tests:")
        for fail in test_results['failed']:
            print(f"  - {fail}")
    
    if test_results['warnings']:
        print("\nWarnings:")
        for warn in test_results['warnings']:
            print(f"  - {warn}")
    
    print("="*80)

# Global storage for created IDs
created_ids = {
    "opportunity": None,
    "organization": None,
    "stakeholder": None,
    "risk": None
}

def test_seed_endpoint():
    """Test POST /api/seed"""
    print("\n" + "="*80)
    print("TEST 1: POST /api/seed")
    print("="*80)
    
    try:
        response = requests.post(f"{BASE_URL}/seed", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("POST /api/seed", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Check for seeded field
        if "seeded" not in data:
            log_fail("POST /api/seed", "Missing 'seeded' field in response")
            return
        
        # Check for count fields
        expected_counts = ["organizationsCount", "opportunitiesCount", "risksCount", "activitiesCount"]
        missing = [c for c in expected_counts if c not in data]
        if missing:
            log_warning("POST /api/seed", f"Missing count fields: {missing}")
        
        log_pass("POST /api/seed - Returns seeded status and counts")
        
    except Exception as e:
        log_fail("POST /api/seed", str(e))

def test_dashboard_endpoint():
    """Test GET /api/dashboard"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/dashboard")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/dashboard", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("GET /api/dashboard", f"Status {response.status_code}")
            return
        
        data = response.json()
        
        # Check main structure
        required_keys = ["kpis", "funnel", "byIndustry", "byPartner", "forecast", "monthlyAct", "todayMeetings", "upcomingDeadlines", "risks"]
        missing_keys = [k for k in required_keys if k not in data]
        if missing_keys:
            log_fail("GET /api/dashboard", f"Missing keys: {missing_keys}")
            return
        
        # Check KPIs structure
        kpis = data["kpis"]
        required_kpis = ["totalOpportunity", "activeProjects", "pipelineValue", "expectedRevenue", 
                        "winRate", "proposalSubmitted", "proposalAccepted", "followUpToday", 
                        "overdueActivity", "riskCount"]
        missing_kpis = [k for k in required_kpis if k not in kpis]
        if missing_kpis:
            log_fail("GET /api/dashboard", f"Missing KPIs: {missing_kpis}")
            return
        
        print(f"KPIs: {json.dumps(kpis, indent=2)}")
        log_pass("GET /api/dashboard - Returns all required KPIs and data structures")
        
    except Exception as e:
        log_fail("GET /api/dashboard", str(e))

def test_opportunities_crud():
    """Test GET/POST/PATCH/DELETE /api/opportunities"""
    print("\n" + "="*80)
    print("TEST 3: Opportunities CRUD")
    print("="*80)
    
    # POST - Create opportunity
    print("\n--- POST /api/opportunities ---")
    try:
        new_opp = {
            "projectName": "Kemenkeu Digital Transformation",
            "organizationName": "Kementerian Keuangan RI",
            "industry": "Government",
            "product": "Enterprise Platform",
            "partner": "Microsoft",
            "stage": "Discovery",
            "value": 15000000000,
            "mrr": 250000000,
            "probability": 40,
            "expectedClosing": (datetime.now() + timedelta(days=90)).isoformat(),
            "businessOwner": "Budi Santoso",
            "technicalOwner": "Ahmad Rizki",
            "notes": "High-priority government project for digital transformation"
        }
        
        response = requests.post(f"{BASE_URL}/opportunities", json=new_opp, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("POST /api/opportunities", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Created opportunity: {json.dumps(data, indent=2)}")
        
        # Verify UUID format
        if "id" not in data:
            log_fail("POST /api/opportunities", "Missing 'id' field")
            return
        
        if "_id" in data:
            log_fail("POST /api/opportunities", "Response contains MongoDB _id (should only have UUID 'id')")
            return
        
        created_ids["opportunity"] = data["id"]
        log_pass("POST /api/opportunities - Creates opportunity with UUID")
        
    except Exception as e:
        log_fail("POST /api/opportunities", str(e))
        return
    
    # GET - List opportunities
    print("\n--- GET /api/opportunities ---")
    try:
        response = requests.get(f"{BASE_URL}/opportunities", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("GET /api/opportunities", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Found {len(data)} opportunities")
        
        # Verify created opportunity is in list
        found = any(o["id"] == created_ids["opportunity"] for o in data)
        if not found:
            log_fail("GET /api/opportunities", "Created opportunity not found in list")
            return
        
        # Verify no _id in responses
        has_mongo_id = any("_id" in o for o in data)
        if has_mongo_id:
            log_fail("GET /api/opportunities", "Response contains MongoDB _id fields")
            return
        
        log_pass("GET /api/opportunities - Lists opportunities with UUIDs only")
        
    except Exception as e:
        log_fail("GET /api/opportunities", str(e))
        return
    
    # PATCH - Update opportunity (stage change for kanban)
    print("\n--- PATCH /api/opportunities/:id ---")
    try:
        update_data = {
            "stage": "Solution Design",
            "probability": 50,
            "notes": "Moved to Solution Design after successful discovery meeting"
        }
        
        response = requests.patch(
            f"{BASE_URL}/opportunities/{created_ids['opportunity']}", 
            json=update_data, 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("PATCH /api/opportunities/:id", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Updated opportunity: {json.dumps(data, indent=2)}")
        
        # Verify stage was updated
        if data.get("stage") != "Solution Design":
            log_fail("PATCH /api/opportunities/:id", "Stage not updated correctly")
            return
        
        log_pass("PATCH /api/opportunities/:id - Updates opportunity (kanban stage change)")
        
    except Exception as e:
        log_fail("PATCH /api/opportunities/:id", str(e))
        return
    
    # DELETE - Delete opportunity (will do this after bulk import test)
    print("\n--- DELETE /api/opportunities/:id (deferred until after bulk test) ---")

def test_opportunities_bulk_import():
    """Test POST /api/opportunities/bulk"""
    print("\n" + "="*80)
    print("TEST 4: POST /api/opportunities/bulk")
    print("="*80)
    
    try:
        # Excel-style bulk import with column names from Excel
        bulk_data = {
            "rows": [
                {
                    "Project Name": "BPJS Kesehatan SIMRS Upgrade",
                    "Category": "Healthcare",
                    "SOP Phase": "Proposal Submitted",
                    "Target Output": "Hospital Information System",
                    "Blind Spot": "Integration with legacy systems",
                    "Recommendation": "Conduct POC for integration",
                    "Documentation": "Technical specs available",
                    "Status": "Proposal Submitted",
                    "Description": "Upgrade SIMRS for 50 hospitals nationwide"
                },
                {
                    "Project Name": "Pertamina API Gateway",
                    "Category": "Energy",
                    "SOP Phase": "Negotiation",
                    "Target Output": "Enterprise API Platform",
                    "Blind Spot": "Security compliance requirements",
                    "Recommendation": "Engage security team early",
                    "Documentation": "RFP received",
                    "Status": "Negotiation"
                },
                {
                    "Project Name": "Astra ERP Modernization",
                    "Category": "Manufacturing",
                    "SOP Phase": "Implementation",
                    "Target Output": "Cloud ERP System",
                    "Description": "Migrate legacy ERP to cloud platform"
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/opportunities/bulk", json=bulk_data, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("POST /api/opportunities/bulk", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify inserted count
        if "inserted" not in data:
            log_fail("POST /api/opportunities/bulk", "Missing 'inserted' field")
            return
        
        if data["inserted"] != 3:
            log_fail("POST /api/opportunities/bulk", f"Expected 3 inserted, got {data['inserted']}")
            return
        
        # Verify rows appear in GET
        response = requests.get(f"{BASE_URL}/opportunities", timeout=30)
        if response.status_code == 200:
            opps = response.json()
            found_bpjs = any("BPJS Kesehatan" in o.get("projectName", "") for o in opps)
            found_pertamina = any("Pertamina" in o.get("projectName", "") for o in opps)
            found_astra = any("Astra" in o.get("projectName", "") for o in opps)
            
            if not (found_bpjs and found_pertamina and found_astra):
                log_fail("POST /api/opportunities/bulk", "Bulk imported rows not found in GET")
                return
        
        log_pass("POST /api/opportunities/bulk - Imports Excel-style data correctly")
        
    except Exception as e:
        log_fail("POST /api/opportunities/bulk", str(e))

def test_opportunities_delete():
    """Test DELETE /api/opportunities/:id"""
    print("\n" + "="*80)
    print("TEST 5: DELETE /api/opportunities/:id")
    print("="*80)
    
    if not created_ids["opportunity"]:
        log_fail("DELETE /api/opportunities/:id", "No opportunity ID to delete")
        return
    
    try:
        response = requests.delete(
            f"{BASE_URL}/opportunities/{created_ids['opportunity']}", 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("DELETE /api/opportunities/:id", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify deleted
        response = requests.get(f"{BASE_URL}/opportunities", timeout=30)
        if response.status_code == 200:
            opps = response.json()
            still_exists = any(o["id"] == created_ids["opportunity"] for o in opps)
            if still_exists:
                log_fail("DELETE /api/opportunities/:id", "Opportunity still exists after delete")
                return
        
        log_pass("DELETE /api/opportunities/:id - Deletes opportunity successfully")
        
    except Exception as e:
        log_fail("DELETE /api/opportunities/:id", str(e))

def test_organizations_crud():
    """Test GET/POST/PATCH/DELETE /api/organizations"""
    print("\n" + "="*80)
    print("TEST 6: Organizations CRUD")
    print("="*80)
    
    # POST - Create organization
    print("\n--- POST /api/organizations ---")
    try:
        new_org = {
            "name": "Bank Mandiri",
            "industry": "Financial Services",
            "tier": "Enterprise",
            "status": "Active",
            "address": "Jl. Jenderal Gatot Subroto Kav. 36-38, Jakarta",
            "website": "https://bankmandiri.co.id",
            "notes": "Top-tier banking client with multiple ongoing projects"
        }
        
        response = requests.post(f"{BASE_URL}/organizations", json=new_org, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("POST /api/organizations", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Created organization: {json.dumps(data, indent=2)}")
        
        # Verify UUID
        if "id" not in data or "_id" in data:
            log_fail("POST /api/organizations", "Invalid ID format (should be UUID only)")
            return
        
        created_ids["organization"] = data["id"]
        log_pass("POST /api/organizations - Creates organization with UUID")
        
    except Exception as e:
        log_fail("POST /api/organizations", str(e))
        return
    
    # GET - List organizations
    print("\n--- GET /api/organizations ---")
    try:
        response = requests.get(f"{BASE_URL}/organizations", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("GET /api/organizations", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Found {len(data)} organizations")
        
        # Verify created org is in list
        found = any(o["id"] == created_ids["organization"] for o in data)
        if not found:
            log_fail("GET /api/organizations", "Created organization not found")
            return
        
        log_pass("GET /api/organizations - Lists organizations correctly")
        
    except Exception as e:
        log_fail("GET /api/organizations", str(e))
        return
    
    # PATCH - Update organization
    print("\n--- PATCH /api/organizations/:id ---")
    try:
        update_data = {
            "tier": "Strategic",
            "notes": "Upgraded to strategic tier due to high deal value"
        }
        
        response = requests.patch(
            f"{BASE_URL}/organizations/{created_ids['organization']}", 
            json=update_data, 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("PATCH /api/organizations/:id", f"Status {response.status_code}")
            return
        
        log_pass("PATCH /api/organizations/:id - Updates organization")
        
    except Exception as e:
        log_fail("PATCH /api/organizations/:id", str(e))

def test_stakeholders_nested():
    """Test GET/POST /api/organizations/:id/stakeholders"""
    print("\n" + "="*80)
    print("TEST 7: Nested Stakeholders (under Organization)")
    print("="*80)
    
    if not created_ids["organization"]:
        log_fail("Nested stakeholders test", "No organization ID available")
        return
    
    # POST - Create stakeholder
    print("\n--- POST /api/organizations/:id/stakeholders ---")
    try:
        new_stakeholder = {
            "name": "Ibu Siti Nurhaliza",
            "title": "CIO",
            "email": "siti.nurhaliza@bankmandiri.co.id",
            "phone": "+62 21 5299 7777",
            "decisionMaker": True,
            "budgetOwner": True,
            "technicalPIC": False,
            "champion": True,
            "notes": "Key decision maker, very supportive of digital transformation"
        }
        
        response = requests.post(
            f"{BASE_URL}/organizations/{created_ids['organization']}/stakeholders", 
            json=new_stakeholder, 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("POST /api/organizations/:id/stakeholders", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Created stakeholder: {json.dumps(data, indent=2)}")
        
        # Verify UUID and organizationId
        if "id" not in data or "_id" in data:
            log_fail("POST /api/organizations/:id/stakeholders", "Invalid ID format")
            return
        
        if data.get("organizationId") != created_ids["organization"]:
            log_fail("POST /api/organizations/:id/stakeholders", "organizationId mismatch")
            return
        
        created_ids["stakeholder"] = data["id"]
        log_pass("POST /api/organizations/:id/stakeholders - Creates stakeholder")
        
    except Exception as e:
        log_fail("POST /api/organizations/:id/stakeholders", str(e))
        return
    
    # GET - List stakeholders for organization
    print("\n--- GET /api/organizations/:id/stakeholders ---")
    try:
        response = requests.get(
            f"{BASE_URL}/organizations/{created_ids['organization']}/stakeholders", 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("GET /api/organizations/:id/stakeholders", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Found {len(data)} stakeholders")
        
        # Verify created stakeholder is in list
        found = any(s["id"] == created_ids["stakeholder"] for s in data)
        if not found:
            log_fail("GET /api/organizations/:id/stakeholders", "Created stakeholder not found")
            return
        
        log_pass("GET /api/organizations/:id/stakeholders - Lists stakeholders")
        
    except Exception as e:
        log_fail("GET /api/organizations/:id/stakeholders", str(e))

def test_stakeholders_direct():
    """Test PATCH/DELETE /api/stakeholders/:id"""
    print("\n" + "="*80)
    print("TEST 8: Direct Stakeholder Operations")
    print("="*80)
    
    if not created_ids["stakeholder"]:
        log_fail("Direct stakeholder test", "No stakeholder ID available")
        return
    
    # PATCH - Update stakeholder
    print("\n--- PATCH /api/stakeholders/:id ---")
    try:
        update_data = {
            "title": "VP of Digital Transformation",
            "notes": "Promoted to VP, now has broader authority"
        }
        
        response = requests.patch(
            f"{BASE_URL}/stakeholders/{created_ids['stakeholder']}", 
            json=update_data, 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("PATCH /api/stakeholders/:id", f"Status {response.status_code}")
            return
        
        log_pass("PATCH /api/stakeholders/:id - Updates stakeholder")
        
    except Exception as e:
        log_fail("PATCH /api/stakeholders/:id", str(e))
    
    # DELETE - Delete stakeholder
    print("\n--- DELETE /api/stakeholders/:id ---")
    try:
        response = requests.delete(
            f"{BASE_URL}/stakeholders/{created_ids['stakeholder']}", 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("DELETE /api/stakeholders/:id", f"Status {response.status_code}")
            return
        
        # Verify deleted
        response = requests.get(
            f"{BASE_URL}/organizations/{created_ids['organization']}/stakeholders", 
            timeout=30
        )
        if response.status_code == 200:
            stakeholders = response.json()
            still_exists = any(s["id"] == created_ids["stakeholder"] for s in stakeholders)
            if still_exists:
                log_fail("DELETE /api/stakeholders/:id", "Stakeholder still exists after delete")
                return
        
        log_pass("DELETE /api/stakeholders/:id - Deletes stakeholder")
        
    except Exception as e:
        log_fail("DELETE /api/stakeholders/:id", str(e))

def test_organization_cascade_delete():
    """Test that deleting organization also deletes its stakeholders"""
    print("\n" + "="*80)
    print("TEST 9: Organization Cascade Delete")
    print("="*80)
    
    if not created_ids["organization"]:
        log_fail("Organization cascade delete", "No organization ID available")
        return
    
    try:
        # Create a new stakeholder to test cascade
        new_stakeholder = {
            "name": "Pak Bambang Wijaya",
            "title": "IT Manager",
            "email": "bambang@bankmandiri.co.id"
        }
        
        response = requests.post(
            f"{BASE_URL}/organizations/{created_ids['organization']}/stakeholders", 
            json=new_stakeholder, 
            timeout=30
        )
        
        if response.status_code != 200:
            log_warning("Organization cascade delete", "Could not create test stakeholder")
        else:
            test_stakeholder_id = response.json()["id"]
            print(f"Created test stakeholder: {test_stakeholder_id}")
        
        # Delete organization
        response = requests.delete(
            f"{BASE_URL}/organizations/{created_ids['organization']}", 
            timeout=30
        )
        print(f"Delete organization status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("DELETE /api/organizations/:id", f"Status {response.status_code}")
            return
        
        # Verify organization is deleted
        response = requests.get(f"{BASE_URL}/organizations", timeout=30)
        if response.status_code == 200:
            orgs = response.json()
            still_exists = any(o["id"] == created_ids["organization"] for o in orgs)
            if still_exists:
                log_fail("DELETE /api/organizations/:id", "Organization still exists")
                return
        
        # Verify stakeholders are also deleted (cascade)
        response = requests.get(
            f"{BASE_URL}/organizations/{created_ids['organization']}/stakeholders", 
            timeout=30
        )
        # This might return 404 or empty list, both are acceptable
        if response.status_code == 200:
            stakeholders = response.json()
            if len(stakeholders) > 0:
                log_fail("Organization cascade delete", "Stakeholders not deleted with organization")
                return
        
        log_pass("DELETE /api/organizations/:id - Cascades delete to stakeholders")
        
    except Exception as e:
        log_fail("Organization cascade delete", str(e))

def test_risks_crud():
    """Test GET/POST/PATCH/DELETE /api/risks"""
    print("\n" + "="*80)
    print("TEST 10: Risks CRUD")
    print("="*80)
    
    # POST - Create risk
    print("\n--- POST /api/risks ---")
    try:
        new_risk = {
            "category": "Technical",
            "title": "Legacy System Integration Failure",
            "severity": "High",
            "probability": "Medium",
            "status": "Open",
            "owner": "Ahmad Rizki",
            "dueDate": (datetime.now() + timedelta(days=30)).isoformat(),
            "impact": "Project delay of 4-6 weeks, potential contract penalties",
            "mitigation": "Establish dedicated integration team, conduct early POC"
        }
        
        response = requests.post(f"{BASE_URL}/risks", json=new_risk, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("POST /api/risks", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Created risk: {json.dumps(data, indent=2)}")
        
        # Verify UUID
        if "id" not in data or "_id" in data:
            log_fail("POST /api/risks", "Invalid ID format")
            return
        
        created_ids["risk"] = data["id"]
        log_pass("POST /api/risks - Creates risk with UUID")
        
    except Exception as e:
        log_fail("POST /api/risks", str(e))
        return
    
    # GET - List risks
    print("\n--- GET /api/risks ---")
    try:
        response = requests.get(f"{BASE_URL}/risks", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("GET /api/risks", f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Found {len(data)} risks")
        
        # Verify created risk is in list
        found = any(r["id"] == created_ids["risk"] for r in data)
        if not found:
            log_fail("GET /api/risks", "Created risk not found")
            return
        
        log_pass("GET /api/risks - Lists risks correctly")
        
    except Exception as e:
        log_fail("GET /api/risks", str(e))
        return
    
    # PATCH - Update risk
    print("\n--- PATCH /api/risks/:id ---")
    try:
        update_data = {
            "status": "In Progress",
            "mitigation": "Integration team established, POC scheduled for next week"
        }
        
        response = requests.patch(
            f"{BASE_URL}/risks/{created_ids['risk']}", 
            json=update_data, 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("PATCH /api/risks/:id", f"Status {response.status_code}")
            return
        
        log_pass("PATCH /api/risks/:id - Updates risk")
        
    except Exception as e:
        log_fail("PATCH /api/risks/:id", str(e))
    
    # DELETE - Delete risk
    print("\n--- DELETE /api/risks/:id ---")
    try:
        response = requests.delete(
            f"{BASE_URL}/risks/{created_ids['risk']}", 
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail("DELETE /api/risks/:id", f"Status {response.status_code}")
            return
        
        # Verify deleted
        response = requests.get(f"{BASE_URL}/risks", timeout=30)
        if response.status_code == 200:
            risks = response.json()
            still_exists = any(r["id"] == created_ids["risk"] for r in risks)
            if still_exists:
                log_fail("DELETE /api/risks/:id", "Risk still exists after delete")
                return
        
        log_pass("DELETE /api/risks/:id - Deletes risk successfully")
        
    except Exception as e:
        log_fail("DELETE /api/risks/:id", str(e))

def test_ai_endpoint():
    """Test POST /api/ai with all 7 task types"""
    print("\n" + "="*80)
    print("TEST 11: AI Assistant Endpoint (7 task types)")
    print("="*80)
    
    task_types = [
        {
            "task": "executive_insight",
            "context": {
                "totalOpportunities": 25,
                "activeProjects": 18,
                "pipelineValue": 125000000000,
                "topIndustries": ["Healthcare", "Government", "Financial Services"]
            }
        },
        {
            "task": "proposal_summary",
            "context": {
                "project": "Kemenkeu Digital Transformation",
                "organization": "Kementerian Keuangan RI",
                "product": "Enterprise Platform",
                "industry": "Government",
                "value_idr": 15000000000,
                "mrr_idr": 250000000
            }
        },
        {
            "task": "meeting_minutes",
            "context": {
                "organization": "Bank Mandiri",
                "attendees": "CIO, Head of IT, BD Lead",
                "topics": "Requirements review, solution demo, commercial discussion"
            }
        },
        {
            "task": "business_case",
            "context": {
                "project": "BPJS Kesehatan SIMRS Upgrade",
                "organization": "BPJS Kesehatan",
                "product": "Hospital Information System",
                "value_idr": 20000000000
            }
        },
        {
            "task": "risk_mitigation",
            "context": {
                "risk": "Legacy system integration complexity",
                "impact": "Project delay, potential penalties",
                "probability": "Medium"
            }
        },
        {
            "task": "health_score",
            "context": {
                "project": "Pertamina API Gateway",
                "organization": "Pertamina",
                "stage": "Negotiation",
                "probability": 65,
                "value_idr": 12000000000
            }
        },
        {
            "task": "next_followup",
            "context": {
                "project": "Astra ERP Modernization",
                "organization": "Astra International",
                "stage": "Solution Design",
                "lastContact": "2 weeks ago"
            }
        }
    ]
    
    for test_case in task_types:
        task = test_case["task"]
        context = test_case["context"]
        
        print(f"\n--- Testing task: {task} ---")
        try:
            response = requests.post(
                f"{BASE_URL}/ai", 
                json={"task": task, "context": context}, 
                timeout=60  # AI calls can take longer
            )
            print(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                log_fail(f"POST /api/ai ({task})", f"Status {response.status_code}")
                continue
            
            data = response.json()
            
            # Check required fields
            if "text" not in data:
                log_fail(f"POST /api/ai ({task})", "Missing 'text' field")
                continue
            
            if "model" not in data:
                log_fail(f"POST /api/ai ({task})", "Missing 'model' field")
                continue
            
            text = data["text"]
            model = data["model"]
            
            print(f"Model used: {model}")
            print(f"Response length: {len(text)} chars")
            print(f"Response preview: {text[:200]}...")
            
            # Verify response is substantial (>100 chars as per requirement)
            if len(text) < 100:
                log_fail(f"POST /api/ai ({task})", f"Response too short ({len(text)} chars, expected >100)")
                continue
            
            # Check model field
            if model not in ["gpt-5", "gpt-4o"]:
                if model == "demo fallback":
                    log_fail(f"POST /api/ai ({task})", "Using demo fallback instead of real LLM (budget issue?)")
                else:
                    log_warning(f"POST /api/ai ({task})", f"Unexpected model: {model}")
            
            # Check for warning field
            if "warning" in data:
                log_warning(f"POST /api/ai ({task})", f"Warning present: {data['warning']}")
            
            log_pass(f"POST /api/ai ({task}) - Returns substantial response with correct model")
            
            # Small delay between AI calls to avoid rate limiting
            time.sleep(2)
            
        except Exception as e:
            log_fail(f"POST /api/ai ({task})", str(e))

def main():
    print("="*80)
    print("DIGICARE BDIP BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    print("="*80)
    
    # Run all tests in sequence
    test_seed_endpoint()
    test_dashboard_endpoint()
    test_opportunities_crud()
    test_opportunities_bulk_import()
    test_opportunities_delete()
    test_organizations_crud()
    test_stakeholders_nested()
    test_stakeholders_direct()
    test_organization_cascade_delete()
    test_risks_crud()
    test_ai_endpoint()
    
    # Print summary
    print_summary()
    
    print(f"\nCompleted at: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
