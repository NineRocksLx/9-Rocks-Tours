#!/usr/bin/env python3
import requests
import json
import os
import sys
import time
from datetime import datetime, timedelta
import random
import uuid

# Read backend URL from frontend/.env
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

API_URL = f"{BACKEND_URL}/api"
print(f"Testing API at: {API_URL}")

# Test data for tours
def create_test_tour():
    return {
        "name": {
            "pt": "Tour Gastronômico em Lisboa",
            "en": "Lisbon Food Tour",
            "es": "Tour Gastronómico en Lisboa"
        },
        "description": {
            "pt": "Explore os sabores autênticos de Lisboa neste tour gastronômico inesquecível. Visite mercados locais, prove petiscos tradicionais e descubra a rica história culinária portuguesa.",
            "en": "Explore the authentic flavors of Lisbon in this unforgettable food tour. Visit local markets, taste traditional snacks, and discover Portugal's rich culinary history.",
            "es": "Explore los sabores auténticos de Lisboa en este inolvidable tour gastronómico. Visite mercados locales, pruebe aperitivos tradicionales y descubra la rica historia culinaria portuguesa."
        },
        "short_description": {
            "pt": "Descubra os melhores sabores de Lisboa",
            "en": "Discover Lisbon's best flavors",
            "es": "Descubra los mejores sabores de Lisboa"
        },
        "location": "Lisboa, Portugal",
        "duration_hours": 3.5,
        "price": 65.0,
        "max_participants": 12,
        "tour_type": "gastronomic",
        "images": ["https://example.com/lisbon-food-1.jpg", "https://example.com/lisbon-food-2.jpg"],
        "availability_dates": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            for i in range(1, 30, 2)
        ],
        "route_description": {
            "pt": "Começamos no Mercado da Ribeira, seguimos para o Bairro Alto e terminamos em Alfama.",
            "en": "We start at Mercado da Ribeira, continue to Bairro Alto, and finish in Alfama.",
            "es": "Comenzamos en el Mercado da Ribeira, continuamos hasta el Bairro Alto y terminamos en Alfama."
        },
        "includes": {
            "pt": "Todas as degustações, guia local, água mineral",
            "en": "All tastings, local guide, mineral water",
            "es": "Todas las degustaciones, guía local, agua mineral"
        },
        "excludes": {
            "pt": "Transporte para o ponto de encontro, gorjetas",
            "en": "Transportation to meeting point, gratuities",
            "es": "Transporte al punto de encuentro, propinas"
        }
    }

def create_test_cultural_tour():
    return {
        "name": {
            "pt": "Tour Cultural no Porto",
            "en": "Porto Cultural Tour",
            "es": "Tour Cultural en Oporto"
        },
        "description": {
            "pt": "Descubra a rica história e cultura do Porto neste tour fascinante. Visite monumentos históricos, explore ruas medievais e aprenda sobre a evolução desta cidade encantadora.",
            "en": "Discover Porto's rich history and culture in this fascinating tour. Visit historical monuments, explore medieval streets, and learn about the evolution of this charming city.",
            "es": "Descubra la rica historia y cultura de Oporto en este fascinante recorrido. Visite monumentos históricos, explore calles medievales y aprenda sobre la evolución de esta encantadora ciudad."
        },
        "short_description": {
            "pt": "Explore a história e cultura do Porto",
            "en": "Explore Porto's history and culture",
            "es": "Explore la historia y cultura de Oporto"
        },
        "location": "Porto, Portugal",
        "duration_hours": 4.0,
        "price": 55.0,
        "max_participants": 15,
        "tour_type": "cultural",
        "images": ["https://example.com/porto-culture-1.jpg", "https://example.com/porto-culture-2.jpg"],
        "availability_dates": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            for i in range(2, 31, 3)
        ],
        "route_description": {
            "pt": "Começamos na Ribeira, visitamos a Livraria Lello, a Torre dos Clérigos e terminamos na Avenida dos Aliados.",
            "en": "We start at Ribeira, visit Livraria Lello, Clérigos Tower, and finish at Avenida dos Aliados.",
            "es": "Comenzamos en Ribeira, visitamos la Librería Lello, la Torre de los Clérigos y terminamos en la Avenida de los Aliados."
        },
        "includes": {
            "pt": "Guia local, entradas para monumentos, água mineral",
            "en": "Local guide, monument entrance fees, mineral water",
            "es": "Guía local, entradas a monumentos, agua mineral"
        },
        "excludes": {
            "pt": "Transporte para o ponto de encontro, refeições, gorjetas",
            "en": "Transportation to meeting point, meals, gratuities",
            "es": "Transporte al punto de encuentro, comidas, propinas"
        }
    }

# Test data for bookings
def create_test_booking(tour_id, selected_date):
    return {
        "tour_id": tour_id,
        "customer_name": "Maria Silva",
        "customer_email": "maria.silva@example.com",
        "customer_phone": "+351912345678",
        "selected_date": selected_date,
        "participants": 2,
        "special_requests": "Preferência por comida vegetariana",
        "payment_method": "paypal"
    }

# Helper functions
def print_separator():
    print("\n" + "="*80 + "\n")

def print_response(response):
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def run_test(test_func):
    print_separator()
    print(f"Running test: {test_func.__name__}")
    try:
        test_func()
        print(f"✅ Test passed: {test_func.__name__}")
    except Exception as e:
        print(f"❌ Test failed: {test_func.__name__}")
        print(f"Error: {str(e)}")
        if hasattr(e, 'response'):
            print_response(e.response)
    print_separator()

# Test basic endpoints
def test_root_endpoint():
    response = requests.get(f"{API_URL}/")
    print_response(response)
    assert response.status_code == 200
    assert "message" in response.json()
    assert "9 Rocks Tours API" in response.json()["message"]

def test_health_check():
    response = requests.get(f"{API_URL}/health")
    print_response(response)
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()
    assert "version" in response.json()

# Test tour CRUD operations
def test_create_tour():
    tour_data = create_test_tour()
    response = requests.post(f"{API_URL}/tours", json=tour_data)
    print_response(response)
    assert response.status_code == 200
    assert "id" in response.json()
    assert response.json()["name"]["pt"] == tour_data["name"]["pt"]
    assert response.json()["name"]["en"] == tour_data["name"]["en"]
    assert response.json()["name"]["es"] == tour_data["name"]["es"]
    return response.json()["id"]

def test_create_cultural_tour():
    tour_data = create_test_cultural_tour()
    response = requests.post(f"{API_URL}/tours", json=tour_data)
    print_response(response)
    assert response.status_code == 200
    assert "id" in response.json()
    assert response.json()["name"]["pt"] == tour_data["name"]["pt"]
    return response.json()["id"]

def test_get_tours():
    response = requests.get(f"{API_URL}/tours")
    print_response(response)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if len(response.json()) > 0:
        assert "id" in response.json()[0]
        assert "name" in response.json()[0]
    return response.json()

def test_get_tour_by_id(tour_id):
    response = requests.get(f"{API_URL}/tours/{tour_id}")
    print_response(response)
    assert response.status_code == 200
    assert response.json()["id"] == tour_id
    return response.json()

def test_update_tour(tour_id):
    update_data = {
        "price": 70.0,
        "max_participants": 10,
        "short_description": {
            "pt": "Descubra os sabores autênticos de Lisboa - ATUALIZADO",
            "en": "Discover authentic Lisbon flavors - UPDATED",
            "es": "Descubra los sabores auténticos de Lisboa - ACTUALIZADO"
        }
    }
    response = requests.put(f"{API_URL}/tours/{tour_id}", json=update_data)
    print_response(response)
    assert response.status_code == 200
    assert response.json()["id"] == tour_id
    assert response.json()["price"] == update_data["price"]
    assert response.json()["max_participants"] == update_data["max_participants"]
    assert response.json()["short_description"]["pt"] == update_data["short_description"]["pt"]
    assert response.json()["short_description"]["en"] == update_data["short_description"]["en"]
    assert response.json()["short_description"]["es"] == update_data["short_description"]["es"]

def test_get_tour_not_found():
    fake_id = str(uuid.uuid4())
    response = requests.get(f"{API_URL}/tours/{fake_id}")
    print_response(response)
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"].lower()

def test_delete_tour(tour_id):
    response = requests.delete(f"{API_URL}/tours/{tour_id}")
    print_response(response)
    assert response.status_code == 200
    assert "message" in response.json()
    assert "deleted" in response.json()["message"].lower()
    
    # Verify it's really deleted
    response = requests.get(f"{API_URL}/tours/{tour_id}")
    assert response.status_code == 404

# Test booking CRUD operations
def test_create_booking(tour_id, selected_date):
    booking_data = create_test_booking(tour_id, selected_date)
    response = requests.post(f"{API_URL}/bookings", json=booking_data)
    print_response(response)
    assert response.status_code == 200
    assert "id" in response.json()
    assert response.json()["tour_id"] == tour_id
    assert response.json()["customer_name"] == booking_data["customer_name"]
    assert response.json()["customer_email"] == booking_data["customer_email"]
    assert response.json()["selected_date"] == selected_date
    assert "total_amount" in response.json()
    return response.json()["id"]

def test_get_bookings():
    response = requests.get(f"{API_URL}/bookings")
    print_response(response)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if len(response.json()) > 0:
        assert "id" in response.json()[0]
        assert "tour_id" in response.json()[0]
    return response.json()

def test_get_booking_by_id(booking_id):
    response = requests.get(f"{API_URL}/bookings/{booking_id}")
    print_response(response)
    assert response.status_code == 200
    assert response.json()["id"] == booking_id
    return response.json()

def test_update_booking(booking_id):
    update_data = {
        "status": "confirmed",
        "payment_status": "paid",
        "payment_transaction_id": "PAY-" + str(uuid.uuid4())
    }
    response = requests.put(f"{API_URL}/bookings/{booking_id}", json=update_data)
    print_response(response)
    assert response.status_code == 200
    assert response.json()["id"] == booking_id
    assert response.json()["status"] == update_data["status"]
    assert response.json()["payment_status"] == update_data["payment_status"]
    assert response.json()["payment_transaction_id"] == update_data["payment_transaction_id"]

def test_create_booking_invalid_tour():
    fake_tour_id = str(uuid.uuid4())
    booking_data = create_test_booking(fake_tour_id, datetime.now().strftime("%Y-%m-%d"))
    response = requests.post(f"{API_URL}/bookings", json=booking_data)
    print_response(response)
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"].lower()

# Test admin endpoints
def test_admin_login_success():
    login_data = {
        "username": "admin",
        "password": "9rocks2025"
    }
    response = requests.post(f"{API_URL}/admin/login", json=login_data)
    print_response(response)
    assert response.status_code == 200
    assert "token" in response.json()
    assert response.json()["message"] == "Login successful"
    return response.json()["token"]

def test_admin_login_failure():
    login_data = {
        "username": "admin",
        "password": "wrongpassword"
    }
    response = requests.post(f"{API_URL}/admin/login", json=login_data)
    print_response(response)
    assert response.status_code == 401
    assert "detail" in response.json()
    assert "invalid" in response.json()["detail"].lower()

def test_admin_stats():
    response = requests.get(f"{API_URL}/admin/stats")
    print_response(response)
    assert response.status_code == 200
    assert "total_bookings" in response.json()
    assert "total_revenue" in response.json()
    assert "bookings_by_tour" in response.json()
    assert "bookings_by_date" in response.json()
    assert "bookings_by_status" in response.json()

def test_admin_export_bookings():
    response = requests.get(f"{API_URL}/admin/export/bookings")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Content Type: {response.headers.get('Content-Type')}")
    print(f"Content Disposition: {response.headers.get('Content-Disposition')}")
    
    assert response.status_code == 200
    assert response.headers.get('Content-Type') == "text/csv"
    assert "attachment; filename=bookings.csv" in response.headers.get('Content-Disposition', '')
    
    # Print first few lines of CSV
    lines = response.text.strip().split('\n')
    for i in range(min(5, len(lines))):
        print(lines[i])

# Main test sequence
def run_all_tests():
    print("Starting 9 Rocks Tours API Tests")
    print(f"API URL: {API_URL}")
    
    # Test basic endpoints
    run_test(test_root_endpoint)
    run_test(test_health_check)
    
    # Test tour CRUD
    tour_id = run_test(test_create_tour)
    cultural_tour_id = run_test(test_create_cultural_tour)
    run_test(test_get_tours)
    
    if tour_id:
        run_test(lambda: test_get_tour_by_id(tour_id))
        run_test(lambda: test_update_tour(tour_id))
    
    run_test(test_get_tour_not_found)
    
    # Test booking CRUD
    booking_id = None
    if tour_id:
        # Get available date from tour
        tour = requests.get(f"{API_URL}/tours/{tour_id}").json()
        if tour and tour.get("availability_dates") and len(tour["availability_dates"]) > 0:
            selected_date = tour["availability_dates"][0]
            booking_id = run_test(lambda: test_create_booking(tour_id, selected_date))
    
    run_test(test_get_bookings)
    
    if booking_id:
        run_test(lambda: test_get_booking_by_id(booking_id))
        run_test(lambda: test_update_booking(booking_id))
    
    run_test(test_create_booking_invalid_tour)
    
    # Test admin endpoints
    run_test(test_admin_login_success)
    run_test(test_admin_login_failure)
    run_test(test_admin_stats)
    run_test(test_admin_export_bookings)
    
    # Clean up - delete test tour
    if cultural_tour_id:
        run_test(lambda: test_delete_tour(cultural_tour_id))
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    run_all_tests()