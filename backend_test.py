#!/usr/bin/env python3
"""
Backend API Test Suite for Digicare BDIP - NEW ENDPOINTS ONLY
Tests Projects, Partners, Partner Documents, and Products Single Fetch
"""

import requests
import json
import base64
import os
from datetime import datetime

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://intelligence-hub-175.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def test_seed_endpoint():
    """Test POST /api/seed to ensure demo data exists"""
    print("=" * 80)
    print("TEST SUITE 1: SEED ENDPOINT")
    print("=" * 80)
    
    try:
        response = requests.post(f"{API_URL}/seed", timeout=30)
        data = response.json()
        
        # Should return seeded status
        has_seeded_field = 'seeded' in data
        print_test(
            "POST /api/seed returns seeded status",
            has_seeded_field,
            f"Response: {json.dumps(data, indent=2)}"
        )
        
        # Should have products count
        has_products = 'products' in data
        print_test(
            "Seed response includes products count",
            has_products,
            f"Products: {data.get('products', 'N/A')}"
        )
        
        # Should have partners count
        has_partners = 'partners' in data
        print_test(
            "Seed response includes partners count",
            has_partners,
            f"Partners: {data.get('partners', 'N/A')}"
        )
        
        return True
    except Exception as e:
        print_test("POST /api/seed", False, f"Error: {str(e)}")
        return False

def test_projects_crud():
    """Test Projects CRUD endpoints"""
    print("=" * 80)
    print("TEST SUITE 2: PROJECTS CRUD")
    print("=" * 80)
    
    project_id = None
    
    try:
        # 1. GET /api/projects - should return auto-seeded projects
        response = requests.get(f"{API_URL}/projects", timeout=10)
        projects = response.json()
        
        is_list = isinstance(projects, list)
        print_test(
            "GET /api/projects returns list",
            is_list,
            f"Got {len(projects) if is_list else 0} projects"
        )
        
        if is_list and len(projects) > 0:
            # Verify first project structure
            p = projects[0]
            required_fields = ['id', 'name', 'organizationName', 'product', 'status', 'progress', 
                             'budget', 'startDate', 'endDate', 'businessOwner', 'technicalOwner', 
                             'deliverables', 'milestones', 'internalNotes']
            has_all_fields = all(field in p for field in required_fields)
            
            print_test(
                "Project has all required fields",
                has_all_fields,
                f"Fields: {', '.join(required_fields[:5])}... (checking {len(required_fields)} total)"
            )
            
            # Verify UUID format (not MongoDB _id)
            has_uuid = 'id' in p and isinstance(p['id'], str) and len(p['id']) == 36
            has_no_mongo_id = '_id' not in p
            print_test(
                "Project uses UUID (not MongoDB _id)",
                has_uuid and has_no_mongo_id,
                f"ID format: {p.get('id', 'N/A')[:8]}..."
            )
            
            # Verify deliverables is array
            deliverables_is_array = isinstance(p.get('deliverables'), list)
            print_test(
                "Deliverables is array",
                deliverables_is_array,
                f"Deliverables count: {len(p.get('deliverables', []))}"
            )
            
            # Verify milestones is array
            milestones_is_array = isinstance(p.get('milestones'), list)
            print_test(
                "Milestones is array",
                milestones_is_array,
                f"Milestones count: {len(p.get('milestones', []))}"
            )
            
            # Verify progress is number 0-100
            progress = p.get('progress', -1)
            progress_valid = isinstance(progress, (int, float)) and 0 <= progress <= 100
            print_test(
                "Progress is number 0-100",
                progress_valid,
                f"Progress: {progress}"
            )
            
            # Store first project ID for single fetch test
            project_id = p.get('id')
        
        # 2. GET /api/projects/:id - single project fetch
        if project_id:
            response = requests.get(f"{API_URL}/projects/{project_id}", timeout=10)
            single_project = response.json()
            
            is_single = isinstance(single_project, dict) and 'id' in single_project
            print_test(
                f"GET /api/projects/:id returns single project",
                is_single,
                f"Project name: {single_project.get('name', 'N/A')}"
            )
        
        # 3. POST /api/projects - create new project
        new_project_data = {
            "name": "Test Project Alpha",
            "organizationName": "PT Test Corporation",
            "product": "SIMRS Digicare",
            "businessOwner": "John Doe",
            "budget": 5000000000,
            "status": "Planning"
        }
        
        response = requests.post(f"{API_URL}/projects", json=new_project_data, timeout=10)
        created_project = response.json()
        
        has_id = 'id' in created_project
        has_uuid = has_id and isinstance(created_project['id'], str) and len(created_project['id']) == 36
        print_test(
            "POST /api/projects creates project with UUID",
            has_uuid,
            f"Created ID: {created_project.get('id', 'N/A')[:8]}..."
        )
        
        # Verify defaults
        has_default_deliverables = created_project.get('deliverables') == []
        has_default_milestones = created_project.get('milestones') == []
        has_default_progress = created_project.get('progress') == 0
        
        print_test(
            "POST creates with default empty arrays and progress=0",
            has_default_deliverables and has_default_milestones and has_default_progress,
            f"deliverables: {created_project.get('deliverables')}, milestones: {created_project.get('milestones')}, progress: {created_project.get('progress')}"
        )
        
        created_id = created_project.get('id')
        
        # 4. PATCH /api/projects/:id - update with nested arrays
        if created_id:
            update_data = {
                "status": "Development",
                "progress": 40,
                "deliverables": [
                    {"id": "test-deliv-1", "title": "Test Deliverable", "status": "Done", "dueDate": "2026-06-01"}
                ]
            }
            
            response = requests.patch(f"{API_URL}/projects/{created_id}", json=update_data, timeout=10)
            updated_project = response.json()
            
            status_updated = updated_project.get('status') == 'Development'
            progress_updated = updated_project.get('progress') == 40
            deliverables_updated = len(updated_project.get('deliverables', [])) == 1
            
            print_test(
                "PATCH /api/projects/:id updates fields including nested arrays",
                status_updated and progress_updated and deliverables_updated,
                f"Status: {updated_project.get('status')}, Progress: {updated_project.get('progress')}, Deliverables: {len(updated_project.get('deliverables', []))}"
            )
        
        # 5. DELETE /api/projects/:id
        if created_id:
            response = requests.delete(f"{API_URL}/projects/{created_id}", timeout=10)
            delete_result = response.json()
            
            deleted = delete_result.get('deleted') == True
            print_test(
                "DELETE /api/projects/:id removes project",
                deleted,
                f"Response: {delete_result}"
            )
            
            # Verify deletion
            response = requests.get(f"{API_URL}/projects/{created_id}", timeout=10)
            not_found = response.status_code == 404 or response.json().get('error')
            print_test(
                "Deleted project not found in subsequent GET",
                not_found,
                f"Status: {response.status_code}"
            )
        
        return True
    except Exception as e:
        print_test("Projects CRUD", False, f"Error: {str(e)}")
        return False

def test_partners_crud():
    """Test Partners CRUD endpoints"""
    print("=" * 80)
    print("TEST SUITE 3: PARTNERS CRUD")
    print("=" * 80)
    
    partner_id = None
    
    try:
        # 1. GET /api/partners - should return 8 seeded partners
        response = requests.get(f"{API_URL}/partners", timeout=10)
        partners = response.json()
        
        is_list = isinstance(partners, list)
        has_8_partners = len(partners) >= 8 if is_list else False
        
        print_test(
            "GET /api/partners returns 8 seeded partners",
            has_8_partners,
            f"Got {len(partners) if is_list else 0} partners"
        )
        
        if is_list and len(partners) > 0:
            # Verify expected partner names
            partner_names = [p.get('name') for p in partners]
            expected_names = ['Huawei', 'Cisco', 'Fortinet', 'Mikrotik', 'Dell', 'HPE', 'Lenovo', 'Local Distributor']
            has_expected = all(name in partner_names for name in expected_names)
            
            print_test(
                "Partners include expected names (Huawei, Cisco, Fortinet, etc.)",
                has_expected,
                f"Found: {', '.join(partner_names[:4])}..."
            )
            
            # Verify first partner structure
            p = partners[0]
            required_fields = ['id', 'name', 'category', 'tier', 'country', 'contactName', 
                             'email', 'phone', 'products', 'sla', 'notes', 'status']
            has_all_fields = all(field in p for field in required_fields)
            
            print_test(
                "Partner has all required fields",
                has_all_fields,
                f"Fields: {', '.join(required_fields[:5])}... (checking {len(required_fields)} total)"
            )
            
            # Verify UUID format
            has_uuid = 'id' in p and isinstance(p['id'], str) and len(p['id']) == 36
            has_no_mongo_id = '_id' not in p
            print_test(
                "Partner uses UUID (not MongoDB _id)",
                has_uuid and has_no_mongo_id,
                f"ID format: {p.get('id', 'N/A')[:8]}..."
            )
            
            # Verify products is array
            products_is_array = isinstance(p.get('products'), list)
            print_test(
                "Products field is array",
                products_is_array,
                f"Products count: {len(p.get('products', []))}"
            )
            
            # Store first partner ID for tests
            partner_id = p.get('id')
        
        # 2. GET /api/partners/:id - single partner fetch
        if partner_id:
            response = requests.get(f"{API_URL}/partners/{partner_id}", timeout=10)
            single_partner = response.json()
            
            is_single = isinstance(single_partner, dict) and 'id' in single_partner
            print_test(
                f"GET /api/partners/:id returns single partner",
                is_single,
                f"Partner name: {single_partner.get('name', 'N/A')}"
            )
        
        # 3. POST /api/partners - create new partner
        new_partner_data = {
            "name": "Test Partner Inc",
            "category": "Network",
            "tier": "Silver",
            "country": "ID",
            "products": ["Product X", "Product Y"]
        }
        
        response = requests.post(f"{API_URL}/partners", json=new_partner_data, timeout=10)
        created_partner = response.json()
        
        has_id = 'id' in created_partner
        has_uuid = has_id and isinstance(created_partner['id'], str) and len(created_partner['id']) == 36
        print_test(
            "POST /api/partners creates partner with UUID",
            has_uuid,
            f"Created ID: {created_partner.get('id', 'N/A')[:8]}..."
        )
        
        created_partner_id = created_partner.get('id')
        
        # 4. PATCH /api/partners/:id - update partner
        if created_partner_id:
            update_data = {
                "tier": "Gold",
                "notes": "Upgraded to Gold tier"
            }
            
            response = requests.patch(f"{API_URL}/partners/{created_partner_id}", json=update_data, timeout=10)
            update_result = response.json()
            
            updated = update_result.get('updated') == True
            print_test(
                "PATCH /api/partners/:id updates partner",
                updated,
                f"Response: {update_result}"
            )
        
        # 5. DELETE /api/partners/:id (will test cascade delete with documents later)
        # For now, just verify delete works
        if created_partner_id:
            response = requests.delete(f"{API_URL}/partners/{created_partner_id}", timeout=10)
            delete_result = response.json()
            
            deleted = delete_result.get('deleted') == True
            print_test(
                "DELETE /api/partners/:id removes partner",
                deleted,
                f"Response: {delete_result}"
            )
        
        return True
    except Exception as e:
        print_test("Partners CRUD", False, f"Error: {str(e)}")
        return False

def test_partner_documents():
    """Test Partner Documents endpoints"""
    print("=" * 80)
    print("TEST SUITE 4: PARTNER DOCUMENTS")
    print("=" * 80)
    
    try:
        # First, get a partner ID to work with
        response = requests.get(f"{API_URL}/partners", timeout=10)
        partners = response.json()
        
        if not partners or len(partners) == 0:
            print_test("Partner Documents", False, "No partners found to test documents")
            return False
        
        partner_id = partners[0]['id']
        doc_id = None
        
        # 1. POST /api/partners/:id/documents - upload document
        sample_content = base64.b64encode(b"Sample PDF content for testing").decode('utf-8')
        
        doc_data = {
            "title": "SLA Agreement 2026",
            "category": "SLA",
            "filename": "sla_2026.pdf",
            "mimetype": "application/pdf",
            "size": 1024,
            "content": sample_content
        }
        
        response = requests.post(f"{API_URL}/partners/{partner_id}/documents", json=doc_data, timeout=10)
        created_doc = response.json()
        
        has_id = 'id' in created_doc
        has_uuid = has_id and isinstance(created_doc['id'], str) and len(created_doc['id']) == 36
        no_content_in_response = 'content' not in created_doc
        
        print_test(
            "POST /api/partners/:id/documents creates document with UUID",
            has_uuid,
            f"Created doc ID: {created_doc.get('id', 'N/A')[:8]}..."
        )
        
        print_test(
            "POST response does NOT include content field",
            no_content_in_response,
            "Content field excluded from response (bandwidth optimization)"
        )
        
        doc_id = created_doc.get('id')
        
        # 2. GET /api/partners/:id/documents - list documents WITHOUT content
        response = requests.get(f"{API_URL}/partners/{partner_id}/documents", timeout=10)
        docs_list = response.json()
        
        is_list = isinstance(docs_list, list)
        print_test(
            "GET /api/partners/:id/documents returns list",
            is_list,
            f"Got {len(docs_list) if is_list else 0} documents"
        )
        
        if is_list and len(docs_list) > 0:
            # Verify content field is NOT in list response
            has_no_content = all('content' not in doc for doc in docs_list)
            print_test(
                "Document list does NOT include content field (bandwidth optimization)",
                has_no_content,
                "All documents in list exclude content field"
            )
        
        # 3. GET /api/partner-docs/:docId/download - download with content
        if doc_id:
            response = requests.get(f"{API_URL}/partner-docs/{doc_id}/download", timeout=10)
            download_doc = response.json()
            
            has_content = 'content' in download_doc
            has_filename = 'filename' in download_doc
            has_mimetype = 'mimetype' in download_doc
            
            print_test(
                "GET /api/partner-docs/:docId/download returns document WITH content",
                has_content and has_filename and has_mimetype,
                f"Fields: content={has_content}, filename={has_filename}, mimetype={has_mimetype}"
            )
            
            # Verify content matches
            content_matches = download_doc.get('content') == sample_content
            print_test(
                "Downloaded content matches uploaded content",
                content_matches,
                f"Content length: {len(download_doc.get('content', ''))}"
            )
        
        # 4. DELETE /api/partner-docs/:docId - delete document
        if doc_id:
            response = requests.delete(f"{API_URL}/partner-docs/{doc_id}", timeout=10)
            delete_result = response.json()
            
            deleted = delete_result.get('deleted') == True
            print_test(
                "DELETE /api/partner-docs/:docId removes document",
                deleted,
                f"Response: {delete_result}"
            )
        
        # 5. Test cascade delete: create partner with document, then delete partner
        # Create new partner
        new_partner = {
            "name": "Cascade Test Partner",
            "category": "Test",
            "tier": "Silver",
            "country": "ID",
            "products": []
        }
        response = requests.post(f"{API_URL}/partners", json=new_partner, timeout=10)
        cascade_partner = response.json()
        cascade_partner_id = cascade_partner.get('id')
        
        # Create document for this partner
        doc_data2 = {
            "title": "Test Doc for Cascade",
            "category": "Test",
            "filename": "test.pdf",
            "mimetype": "application/pdf",
            "size": 100,
            "content": base64.b64encode(b"test").decode('utf-8')
        }
        response = requests.post(f"{API_URL}/partners/{cascade_partner_id}/documents", json=doc_data2, timeout=10)
        cascade_doc = response.json()
        cascade_doc_id = cascade_doc.get('id')
        
        # Delete partner (should cascade delete documents)
        response = requests.delete(f"{API_URL}/partners/{cascade_partner_id}", timeout=10)
        
        # Try to fetch the document - should be gone
        response = requests.get(f"{API_URL}/partner-docs/{cascade_doc_id}/download", timeout=10)
        try:
            response_data = response.json()
            doc_not_found = response.status_code == 404 or response_data.get('error')
        except:
            # If JSON parsing fails, check status code
            doc_not_found = response.status_code == 404
        
        print_test(
            "CASCADE DELETE: Deleting partner also deletes associated documents",
            doc_not_found,
            f"Document fetch status: {response.status_code}"
        )
        
        return True
    except Exception as e:
        print_test("Partner Documents", False, f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_products_single_fetch():
    """Test Products single fetch and enriched fields"""
    print("=" * 80)
    print("TEST SUITE 5: PRODUCTS SINGLE FETCH & ENRICHMENT")
    print("=" * 80)
    
    try:
        # 1. GET /api/products - get list to find a product ID
        response = requests.get(f"{API_URL}/products", timeout=10)
        print(f"DEBUG: Products response status: {response.status_code}")
        print(f"DEBUG: Products response text (first 200 chars): {response.text[:200]}")
        products = response.json()
        
        is_list = isinstance(products, list)
        has_products = len(products) > 0 if is_list else False
        
        print_test(
            "GET /api/products returns product list",
            has_products,
            f"Got {len(products) if is_list else 0} products"
        )
        
        if not has_products:
            print_test("Products Single Fetch", False, "No products found")
            return False
        
        # Find SIMRS Digicare product
        simrs_product = next((p for p in products if p.get('name') == 'SIMRS Digicare'), None)
        
        if not simrs_product:
            print_test("Find SIMRS Digicare", False, "SIMRS Digicare product not found")
            return False
        
        product_id = simrs_product.get('id')
        
        # 2. GET /api/products/:id - single product fetch
        response = requests.get(f"{API_URL}/products/{product_id}", timeout=10)
        single_product = response.json()
        
        is_single = isinstance(single_product, dict) and 'id' in single_product
        print_test(
            "GET /api/products/:id returns single product",
            is_single,
            f"Product name: {single_product.get('name', 'N/A')}"
        )
        
        # 3. Verify enriched fields (features, benefits, useCases, techSpecs)
        has_features = 'features' in single_product and isinstance(single_product.get('features'), list)
        has_benefits = 'benefits' in single_product and isinstance(single_product.get('benefits'), list)
        has_use_cases = 'useCases' in single_product and isinstance(single_product.get('useCases'), list)
        has_tech_specs = 'techSpecs' in single_product and isinstance(single_product.get('techSpecs'), str)
        
        print_test(
            "Product has enriched 'features' field (array)",
            has_features,
            f"Features count: {len(single_product.get('features', []))}"
        )
        
        print_test(
            "Product has enriched 'benefits' field (array)",
            has_benefits,
            f"Benefits count: {len(single_product.get('benefits', []))}"
        )
        
        print_test(
            "Product has enriched 'useCases' field (array)",
            has_use_cases,
            f"Use cases count: {len(single_product.get('useCases', []))}"
        )
        
        print_test(
            "Product has enriched 'techSpecs' field (string)",
            has_tech_specs,
            f"Tech specs length: {len(single_product.get('techSpecs', ''))}"
        )
        
        # Verify UUID format
        has_uuid = 'id' in single_product and isinstance(single_product['id'], str) and len(single_product['id']) == 36
        has_no_mongo_id = '_id' not in single_product
        print_test(
            "Product uses UUID (not MongoDB _id)",
            has_uuid and has_no_mongo_id,
            f"ID format: {single_product.get('id', 'N/A')[:8]}..."
        )
        
        # 4. Verify enrichment for all products in list
        all_enriched = all(
            'features' in p and 'benefits' in p and 'useCases' in p and 'techSpecs' in p
            for p in products
        )
        
        print_test(
            "ALL products in list have been enriched with new fields",
            all_enriched,
            f"Checked {len(products)} products"
        )
        
        return True
    except Exception as e:
        print_test("Products Single Fetch", False, f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "=" * 80)
    print("DIGICARE BDIP - NEW ENDPOINTS BACKEND TEST SUITE")
    print("Testing: Projects, Partners, Partner Documents, Products Single Fetch")
    print("=" * 80 + "\n")
    
    results = []
    
    # Run all test suites
    results.append(("Seed Endpoint", test_seed_endpoint()))
    results.append(("Projects CRUD", test_projects_crud()))
    results.append(("Partners CRUD", test_partners_crud()))
    results.append(("Partner Documents", test_partner_documents()))
    results.append(("Products Single Fetch", test_products_single_fetch()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {passed}/{total} test suites passed")
    print("=" * 80 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
