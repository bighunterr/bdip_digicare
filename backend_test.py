#!/usr/bin/env python3
"""
Backend API Test Suite for Digicare BDIP - NEW ENDPOINTS ONLY
Tests Activities, Products, Proposals, Notifications, Global Search
"""

import requests
import json
import base64
from datetime import datetime, timedelta

# Base URL from .env
BASE_URL = "https://intelligence-hub-175.preview.emergentagent.com/api"

def test_activities_crud():
    """Test Activities CRUD endpoints"""
    print("\n" + "="*80)
    print("TEST: Activities CRUD")
    print("="*80)
    
    try:
        # 1. GET /api/activities - list all, verify sorted by scheduledAt asc
        print("\n1. GET /api/activities - list all")
        resp = requests.get(f"{BASE_URL}/activities", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        activities = resp.json()
        print(f"   ✓ Got {len(activities)} activities")
        
        # Verify UUIDs only (no MongoDB _id)
        if len(activities) > 0:
            first = activities[0]
            assert 'id' in first, "Missing 'id' field"
            assert '_id' not in first, "MongoDB _id should not be in response"
            print(f"   ✓ UUID validation passed (no _id)")
            
            # Verify sorted by scheduledAt ascending
            if len(activities) > 1:
                dates = [a.get('scheduledAt') for a in activities if a.get('scheduledAt')]
                if len(dates) > 1:
                    for i in range(len(dates)-1):
                        assert dates[i] <= dates[i+1], "Activities not sorted by scheduledAt ascending"
                    print(f"   ✓ Sorted by scheduledAt ascending")
        
        # 2. POST /api/activities - create new activity
        print("\n2. POST /api/activities - create new")
        scheduled_time = (datetime.now() + timedelta(days=5)).isoformat()
        new_activity = {
            "title": "Test Meeting with Client XYZ",
            "type": "Meeting",
            "organizationName": "Test Organization",
            "scheduledAt": scheduled_time,
            "owner": "Test Owner",
            "notes": "Important meeting to discuss project scope"
        }
        resp = requests.post(f"{BASE_URL}/activities", json=new_activity, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        created = resp.json()
        assert 'id' in created, "Missing 'id' in created activity"
        assert created.get('status') == 'Scheduled', f"Expected status 'Scheduled', got {created.get('status')}"
        assert created.get('title') == new_activity['title'], "Title mismatch"
        print(f"   ✓ Created activity with UUID: {created['id'][:8]}...")
        print(f"   ✓ Default status 'Scheduled' applied")
        
        activity_id = created['id']
        
        # 3. PATCH /api/activities/:id - update status to Done
        print("\n3. PATCH /api/activities/:id - update status")
        resp = requests.patch(f"{BASE_URL}/activities/{activity_id}", json={"status": "Done"}, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"   ✓ Updated activity status to Done")
        
        # Verify update
        resp = requests.get(f"{BASE_URL}/activities", timeout=30)
        activities = resp.json()
        updated = next((a for a in activities if a['id'] == activity_id), None)
        assert updated is not None, "Updated activity not found"
        assert updated['status'] == 'Done', f"Expected status 'Done', got {updated['status']}"
        print(f"   ✓ Verified status updated to Done")
        
        # 4. DELETE /api/activities/:id - delete activity
        print("\n4. DELETE /api/activities/:id - delete")
        resp = requests.delete(f"{BASE_URL}/activities/{activity_id}", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        assert result.get('deleted') == True, "Expected deleted: true"
        print(f"   ✓ Deleted activity")
        
        # Verify deletion
        resp = requests.get(f"{BASE_URL}/activities", timeout=30)
        activities = resp.json()
        deleted = next((a for a in activities if a['id'] == activity_id), None)
        assert deleted is None, "Activity should be deleted"
        print(f"   ✓ Verified activity deleted")
        
        print("\n✅ Activities CRUD: ALL TESTS PASSED")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Activities CRUD FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Activities CRUD ERROR: {e}")
        return False


def test_products_crud():
    """Test Products CRUD endpoints and verify 13 seeded products"""
    print("\n" + "="*80)
    print("TEST: Products CRUD")
    print("="*80)
    
    try:
        # 1. GET /api/products - verify 13 products from seed
        print("\n1. GET /api/products - verify 13 seeded products")
        resp = requests.get(f"{BASE_URL}/products", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        products = resp.json()
        print(f"   ✓ Got {len(products)} products")
        
        # Verify 13 products
        assert len(products) >= 13, f"Expected at least 13 products, got {len(products)}"
        print(f"   ✓ At least 13 products present")
        
        # Verify expected product names
        expected_names = [
            'SIMRS Digicare', 'IFMS Enterprise', 'ERP Enterprise Platform',
            'Smart Manufacturing Platform', 'Smart Campus Platform', 'Command Center',
            'GIS Platform', 'Network Infrastructure', 'CCTV AI Surveillance',
            'IoT Platform', 'RFID System', 'API Gateway', 'Mobile Super App'
        ]
        product_names = [p.get('name') for p in products]
        for expected in expected_names:
            assert expected in product_names, f"Expected product '{expected}' not found"
        print(f"   ✓ All 13 expected products found")
        
        # Verify UUID and fields
        if len(products) > 0:
            first = products[0]
            assert 'id' in first, "Missing 'id' field"
            assert '_id' not in first, "MongoDB _id should not be in response"
            assert 'name' in first, "Missing 'name' field"
            assert 'desc' in first, "Missing 'desc' field"
            assert 'modules' in first, "Missing 'modules' field"
            assert 'startingPrice' in first, "Missing 'startingPrice' field"
            assert 'subscription' in first, "Missing 'subscription' field"
            assert 'implWeeks' in first, "Missing 'implWeeks' field"
            assert 'target' in first, "Missing 'target' field"
            print(f"   ✓ UUID and all required fields present")
        
        # 2. POST /api/products - create custom product
        print("\n2. POST /api/products - create custom product")
        new_product = {
            "name": "Test Custom Product",
            "desc": "A test product for validation",
            "modules": ["Module A", "Module B"],
            "startingPrice": 5000000,
            "subscription": 250000,
            "implWeeks": 8,
            "target": ["Healthcare", "Education"]
        }
        resp = requests.post(f"{BASE_URL}/products", json=new_product, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        created = resp.json()
        assert 'id' in created, "Missing 'id' in created product"
        assert created.get('name') == new_product['name'], "Name mismatch"
        print(f"   ✓ Created product with UUID: {created['id'][:8]}...")
        
        product_id = created['id']
        
        # 3. PATCH /api/products/:id - update product
        print("\n3. PATCH /api/products/:id - update product")
        resp = requests.patch(f"{BASE_URL}/products/{product_id}", json={"startingPrice": 6000000}, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"   ✓ Updated product")
        
        # Verify update
        resp = requests.get(f"{BASE_URL}/products", timeout=30)
        products = resp.json()
        updated = next((p for p in products if p['id'] == product_id), None)
        assert updated is not None, "Updated product not found"
        assert updated['startingPrice'] == 6000000, f"Expected price 6000000, got {updated['startingPrice']}"
        print(f"   ✓ Verified price updated")
        
        # 4. DELETE /api/products/:id - delete product
        print("\n4. DELETE /api/products/:id - delete")
        resp = requests.delete(f"{BASE_URL}/products/{product_id}", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        assert result.get('deleted') == True, "Expected deleted: true"
        print(f"   ✓ Deleted product")
        
        # Verify deletion
        resp = requests.get(f"{BASE_URL}/products", timeout=30)
        products = resp.json()
        deleted = next((p for p in products if p['id'] == product_id), None)
        assert deleted is None, "Product should be deleted"
        print(f"   ✓ Verified product deleted")
        
        print("\n✅ Products CRUD: ALL TESTS PASSED")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Products CRUD FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Products CRUD ERROR: {e}")
        return False


def test_proposals_versioning():
    """Test Proposals versioned document storage"""
    print("\n" + "="*80)
    print("TEST: Proposals (Versioned Document Storage)")
    print("="*80)
    
    try:
        # 1. GET /api/proposals - list all (no content field)
        print("\n1. GET /api/proposals - list all (no content)")
        resp = requests.get(f"{BASE_URL}/proposals", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        proposals = resp.json()
        print(f"   ✓ Got {len(proposals)} proposals")
        
        # Verify no content field in list
        if len(proposals) > 0:
            for p in proposals:
                assert 'content' not in p, "Content field should not be in list response"
            print(f"   ✓ No content field in list (bandwidth optimization)")
        
        # 2. POST /api/proposals - create first version
        print("\n2. POST /api/proposals - create version 1")
        test_content = base64.b64encode(b"This is test proposal content v1").decode('utf-8')
        new_proposal = {
            "title": "Test Proposal ABC",
            "category": "Technical",
            "filename": "proposal_v1.pdf",
            "mimetype": "application/pdf",
            "content": test_content,
            "size": 1024
        }
        resp = requests.post(f"{BASE_URL}/proposals", json=new_proposal, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        created = resp.json()
        assert 'id' in created, "Missing 'id' in created proposal"
        assert created.get('version') == 1, f"Expected version 1, got {created.get('version')}"
        assert 'content' not in created, "Content should not be in POST response"
        print(f"   ✓ Created proposal version 1 with UUID: {created['id'][:8]}...")
        
        proposal_id_v1 = created['id']
        
        # 3. POST again with SAME title AND category - verify version 2
        print("\n3. POST /api/proposals - same title+category, expect version 2")
        test_content_v2 = base64.b64encode(b"This is test proposal content v2 - updated").decode('utf-8')
        new_proposal_v2 = {
            "title": "Test Proposal ABC",  # Same title
            "category": "Technical",  # Same category
            "filename": "proposal_v2.pdf",
            "mimetype": "application/pdf",
            "content": test_content_v2,
            "size": 2048
        }
        resp = requests.post(f"{BASE_URL}/proposals", json=new_proposal_v2, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        created_v2 = resp.json()
        assert created_v2.get('version') == 2, f"Expected version 2, got {created_v2.get('version')}"
        print(f"   ✓ Auto-incremented to version 2")
        
        proposal_id_v2 = created_v2['id']
        
        # 4. POST with same title but DIFFERENT category - should be version 1
        print("\n4. POST /api/proposals - same title, different category, expect version 1")
        new_proposal_v3 = {
            "title": "Test Proposal ABC",  # Same title
            "category": "Commercial",  # Different category
            "filename": "proposal_commercial.pdf",
            "mimetype": "application/pdf",
            "content": test_content,
            "size": 1024
        }
        resp = requests.post(f"{BASE_URL}/proposals", json=new_proposal_v3, timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        created_v3 = resp.json()
        assert created_v3.get('version') == 1, f"Expected version 1 (different category), got {created_v3.get('version')}"
        print(f"   ✓ Version 1 for different category (versioning scoped by title+category)")
        
        proposal_id_v3 = created_v3['id']
        
        # 5. GET /api/proposals/:id/download - verify returns base64 content
        print("\n5. GET /api/proposals/:id/download - verify base64 content")
        resp = requests.get(f"{BASE_URL}/proposals/{proposal_id_v2}/download", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        download = resp.json()
        assert 'id' in download, "Missing 'id' in download response"
        assert 'filename' in download, "Missing 'filename' in download response"
        assert 'mimetype' in download, "Missing 'mimetype' in download response"
        assert 'content' in download, "Missing 'content' in download response"
        assert download['content'] == test_content_v2, "Content mismatch"
        print(f"   ✓ Download returns base64 content")
        
        # 6. DELETE /api/proposals/:id - delete proposals
        print("\n6. DELETE /api/proposals/:id - delete")
        for pid in [proposal_id_v1, proposal_id_v2, proposal_id_v3]:
            resp = requests.delete(f"{BASE_URL}/proposals/{pid}", timeout=30)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print(f"   ✓ Deleted all test proposals")
        
        print("\n✅ Proposals: ALL TESTS PASSED")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Proposals FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Proposals ERROR: {e}")
        return False


def test_notifications():
    """Test Notifications endpoint"""
    print("\n" + "="*80)
    print("TEST: Notifications")
    print("="*80)
    
    try:
        # GET /api/notifications
        print("\n1. GET /api/notifications - verify types and levels")
        resp = requests.get(f"{BASE_URL}/notifications", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        notifications = resp.json()
        print(f"   ✓ Got {len(notifications)} notifications")
        
        # Verify structure
        if len(notifications) > 0:
            first = notifications[0]
            assert 'id' in first, "Missing 'id' field"
            assert 'type' in first, "Missing 'type' field"
            assert 'level' in first, "Missing 'level' field"
            assert 'title' in first, "Missing 'title' field"
            assert 'desc' in first, "Missing 'desc' field"
            assert 'at' in first, "Missing 'at' field"
            print(f"   ✓ All required fields present")
            
            # Verify types
            valid_types = ['overdue', 'upcoming', 'highvalue', 'risk']
            types_found = set(n['type'] for n in notifications)
            print(f"   ✓ Types found: {types_found}")
            for t in types_found:
                assert t in valid_types, f"Invalid type: {t}"
            
            # Verify levels
            valid_levels = ['high', 'medium', 'low']
            levels_found = set(n['level'] for n in notifications)
            print(f"   ✓ Levels found: {levels_found}")
            for l in levels_found:
                assert l in valid_levels, f"Invalid level: {l}"
            
            # Verify sorted by 'at' descending
            if len(notifications) > 1:
                dates = [n['at'] for n in notifications]
                for i in range(len(dates)-1):
                    assert dates[i] >= dates[i+1], "Notifications not sorted by 'at' descending"
                print(f"   ✓ Sorted by 'at' descending")
            
            # Verify max 20
            assert len(notifications) <= 20, f"Expected max 20 notifications, got {len(notifications)}"
            print(f"   ✓ Max 20 notifications enforced")
        
        print("\n✅ Notifications: ALL TESTS PASSED")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Notifications FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Notifications ERROR: {e}")
        return False


def test_global_search():
    """Test Global Search endpoint"""
    print("\n" + "="*80)
    print("TEST: Global Search")
    print("="*80)
    
    try:
        # 1. Search for "SIMRS" - should return matching opportunities
        print("\n1. GET /api/search?q=SIMRS - search opportunities")
        resp = requests.get(f"{BASE_URL}/search?q=SIMRS", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        assert 'opportunities' in result, "Missing 'opportunities' field"
        assert 'organizations' in result, "Missing 'organizations' field"
        assert 'activities' in result, "Missing 'activities' field"
        print(f"   ✓ All result categories present")
        
        opps = result['opportunities']
        print(f"   ✓ Found {len(opps)} opportunities matching 'SIMRS'")
        assert len(opps) > 0, "Expected at least 1 opportunity matching 'SIMRS'"
        
        # Verify no MongoDB _id
        for opp in opps:
            assert '_id' not in opp, "MongoDB _id should not be in response"
            assert 'id' in opp, "Missing 'id' field"
        print(f"   ✓ UUID validation passed (no _id)")
        
        # 2. Search for "Sardjito" - should return opportunities + organizations + activities
        print("\n2. GET /api/search?q=Sardjito - multi-category search")
        resp = requests.get(f"{BASE_URL}/search?q=Sardjito", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        opps = result['opportunities']
        orgs = result['organizations']
        acts = result['activities']
        
        print(f"   ✓ Opportunities: {len(opps)}")
        print(f"   ✓ Organizations: {len(orgs)}")
        print(f"   ✓ Activities: {len(acts)}")
        
        # Should find RSUP Dr. Sardjito organization
        assert len(orgs) > 0, "Expected at least 1 organization matching 'Sardjito'"
        sardjito_org = next((o for o in orgs if 'Sardjito' in o.get('name', '')), None)
        assert sardjito_org is not None, "Expected to find 'RSUP Dr. Sardjito' organization"
        print(f"   ✓ Found organization: {sardjito_org['name']}")
        
        # Should find activities with Sardjito
        assert len(acts) > 0, "Expected at least 1 activity matching 'Sardjito'"
        print(f"   ✓ Found activities with Sardjito")
        
        # 3. Search for non-existent term
        print("\n3. GET /api/search?q=nonexistentxyz - no results")
        resp = requests.get(f"{BASE_URL}/search?q=nonexistentxyz", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        assert len(result['opportunities']) == 0, "Expected empty opportunities"
        assert len(result['organizations']) == 0, "Expected empty organizations"
        assert len(result['activities']) == 0, "Expected empty activities"
        print(f"   ✓ Returns empty arrays for no matches")
        
        # 4. Search with no query parameter
        print("\n4. GET /api/search (no q) - empty arrays")
        resp = requests.get(f"{BASE_URL}/search", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        assert len(result['opportunities']) == 0, "Expected empty opportunities"
        assert len(result['organizations']) == 0, "Expected empty organizations"
        assert len(result['activities']) == 0, "Expected empty activities"
        print(f"   ✓ Returns empty arrays when no query")
        
        # 5. Case-insensitive search
        print("\n5. GET /api/search?q=simrs - case-insensitive")
        resp = requests.get(f"{BASE_URL}/search?q=simrs", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        assert len(result['opportunities']) > 0, "Case-insensitive search should find 'SIMRS'"
        print(f"   ✓ Case-insensitive matching works")
        
        print("\n✅ Global Search: ALL TESTS PASSED")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Global Search FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Global Search ERROR: {e}")
        return False


def test_seed_products():
    """Verify POST /api/seed still seeds 13 products"""
    print("\n" + "="*80)
    print("TEST: Seed Products (Idempotent)")
    print("="*80)
    
    try:
        # POST /api/seed
        print("\n1. POST /api/seed - verify products seeded")
        resp = requests.post(f"{BASE_URL}/seed", timeout=30)
        print(f"   Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        
        result = resp.json()
        print(f"   Response: {result}")
        
        # Should return products count (either seeded or already exists)
        if 'products' in result:
            products_count = result['products']
            assert products_count == 13, f"Expected 13 products, got {products_count}"
            print(f"   ✓ Products count: {products_count}")
        
        # Verify idempotent behavior
        if result.get('seeded') == False:
            print(f"   ✓ Idempotent: data already exists, returned seeded=false")
        elif result.get('seeded') == True:
            print(f"   ✓ Seeded new data successfully")
        
        # Verify products in database
        print("\n2. GET /api/products - verify 13 products exist")
        resp = requests.get(f"{BASE_URL}/products", timeout=30)
        products = resp.json()
        assert len(products) >= 13, f"Expected at least 13 products, got {len(products)}"
        print(f"   ✓ Verified {len(products)} products in database")
        
        print("\n✅ Seed Products: ALL TESTS PASSED")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Seed Products FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Seed Products ERROR: {e}")
        return False


def main():
    """Run all backend tests for NEW endpoints"""
    print("\n" + "="*80)
    print("DIGICARE BDIP - BACKEND API TEST SUITE (NEW ENDPOINTS)")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test NEW endpoints only
    results['Activities CRUD'] = test_activities_crud()
    results['Products CRUD'] = test_products_crud()
    results['Proposals'] = test_proposals_versioning()
    results['Notifications'] = test_notifications()
    results['Global Search'] = test_global_search()
    results['Seed Products'] = test_seed_products()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL BACKEND TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
