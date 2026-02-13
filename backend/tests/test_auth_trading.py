"""
Backend API Tests for Trading AI Platform
Tests: Authentication, Registration, Login, Onboarding, Dashboard Access
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health endpoint tests"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health endpoint working")


class TestAuthentication:
    """Authentication tests: Registration, Login, JWT"""
    
    def test_register_new_user(self):
        """Test new user registration"""
        unique_email = f"test_user_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Test User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test User"
        assert "id" in data["user"]
        print(f"✅ Registration successful for {unique_email}")
        return data
    
    def test_login_with_registered_user(self):
        """Test login with newly registered user"""
        # First register
        unique_email = f"test_login_{int(time.time())}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Login Test User"
        })
        assert reg_response.status_code == 200
        
        # Then login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "Test123!"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        data = login_response.json()
        
        # Verify login response
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert "onboarding_completed" in data["user"]
        assert data["user"]["onboarding_completed"] == False  # New users have onboarding not completed
        print(f"✅ Login successful for {unique_email}")
        return data
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✅ Invalid credentials correctly rejected")
    
    def test_register_duplicate_email(self):
        """Test that duplicate email registration fails"""
        unique_email = f"test_dup_{int(time.time())}@test.com"
        
        # First registration
        first_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "First User"
        })
        assert first_response.status_code == 200
        
        # Second registration with same email
        second_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Second User"
        })
        assert second_response.status_code == 400
        print("✅ Duplicate email registration correctly rejected")


class TestOnboardingFlow:
    """Test onboarding questionnaire flow"""
    
    def test_new_user_onboarding_not_completed(self):
        """Verify new users have onboarding_completed = False"""
        unique_email = f"test_onboard_{int(time.time())}@test.com"
        
        # Register new user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Onboarding Test User"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Get user profile
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        data = me_response.json()
        
        assert data["user"]["onboarding_completed"] == False
        print("✅ New user has onboarding_completed = False")
        return token
    
    def test_save_questionnaire_assistant(self):
        """Test saving assistant questionnaire"""
        unique_email = f"test_quest_{int(time.time())}@test.com"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Questionnaire Test"
        })
        token = reg_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Save assistant questionnaire
        quest_response = requests.post(f"{BASE_URL}/api/users/questionnaire", 
            headers=headers,
            json={
                "questionnaire_type": "assistant",
                "answers": {
                    "trading_style": "day_trading",
                    "experience_level": "intermediate",
                    "markets": ["forex", "crypto"],
                    "sessions": ["london", "new_york"],
                    "difficulties": ["fomo", "overtrading"],
                    "known_approaches": ["ict", "price_action"]
                }
            })
        assert quest_response.status_code == 200
        print("✅ Assistant questionnaire saved successfully")
        return token, headers
    
    def test_complete_onboarding_flow(self):
        """Test completing full onboarding flow"""
        unique_email = f"test_complete_{int(time.time())}@test.com"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Complete Onboarding Test"
        })
        token = reg_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Save assistant questionnaire
        requests.post(f"{BASE_URL}/api/users/questionnaire", 
            headers=headers,
            json={
                "questionnaire_type": "assistant",
                "answers": {
                    "trading_style": "scalping",
                    "experience_level": "beginner",
                    "markets": ["forex"],
                    "sessions": ["asia"],
                    "difficulties": ["emotions"],
                    "known_approaches": ["price_action"]
                }
            })
        
        # Save educational questionnaire (completes onboarding)
        edu_response = requests.post(f"{BASE_URL}/api/users/questionnaire", 
            headers=headers,
            json={
                "questionnaire_type": "educational",
                "answers": {
                    "learning_style": "visual",
                    "knowledge_level": "beginner",
                    "known_approaches": ["price_action"]
                }
            })
        assert edu_response.status_code == 200
        
        # Verify onboarding is now completed
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        data = me_response.json()
        
        assert data["user"]["onboarding_completed"] == True, "Onboarding should be completed after educational questionnaire"
        print("✅ Full onboarding flow completed successfully")
        return token


class TestDashboardAccess:
    """Test dashboard data access after authentication"""
    
    def get_authenticated_user(self):
        """Helper to create and authenticate a user with completed onboarding"""
        unique_email = f"test_dash_{int(time.time())}@test.com"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Dashboard Test User"
        })
        token = reg_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Complete onboarding
        requests.post(f"{BASE_URL}/api/users/questionnaire", 
            headers=headers,
            json={"questionnaire_type": "assistant", "answers": {"trading_style": "day_trading", "experience_level": "intermediate", "markets": ["forex"], "sessions": ["london"], "difficulties": ["fomo"], "known_approaches": ["ict"]}})
        requests.post(f"{BASE_URL}/api/users/questionnaire", 
            headers=headers,
            json={"questionnaire_type": "educational", "answers": {"learning_style": "visual"}})
        
        return token, headers
    
    def test_get_trade_stats(self):
        """Test getting trade stats for dashboard"""
        token, headers = self.get_authenticated_user()
        
        response = requests.get(f"{BASE_URL}/api/trades/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total_trades" in data
        assert "winrate" in data
        assert "total_pnl" in data
        assert "plan_adherence" in data
        print("✅ Trade stats endpoint working")
    
    def test_get_heatmap_data(self):
        """Test getting heatmap data for dashboard"""
        token, headers = self.get_authenticated_user()
        
        response = requests.get(f"{BASE_URL}/api/trades/heatmap", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "trades" in data
        print("✅ Heatmap endpoint working")
    
    def test_get_duration_stats(self):
        """Test getting duration stats for dashboard"""
        token, headers = self.get_authenticated_user()
        
        response = requests.get(f"{BASE_URL}/api/trades/duration-stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "duration_stats" in data
        print("✅ Duration stats endpoint working")
    
    def test_protected_endpoint_without_token(self):
        """Test that protected endpoints reject requests without token"""
        response = requests.get(f"{BASE_URL}/api/trades/stats")
        assert response.status_code == 401
        print("✅ Protected endpoints correctly require authentication")


class TestSpecificUserCredentials:
    """Test with specific credentials from requirements"""
    
    def test_create_test_user_complete(self):
        """Create test user with completed onboarding"""
        # First try to login - if fails, register
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "complete@test.com",
            "password": "Test123!"
        })
        
        if login_response.status_code == 401:
            # Register user
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "complete@test.com",
                "password": "Test123!",
                "name": "Complete User"
            })
            assert reg_response.status_code == 200
            token = reg_response.json()["token"]
            
            # Complete onboarding
            headers = {"Authorization": f"Bearer {token}"}
            requests.post(f"{BASE_URL}/api/users/questionnaire", 
                headers=headers,
                json={"questionnaire_type": "assistant", "answers": {"trading_style": "day_trading", "experience_level": "intermediate", "markets": ["forex"], "sessions": ["london"], "difficulties": ["fomo"], "known_approaches": ["ict"]}})
            requests.post(f"{BASE_URL}/api/users/questionnaire", 
                headers=headers,
                json={"questionnaire_type": "educational", "answers": {"learning_style": "visual"}})
            
            print("✅ Created complete@test.com with completed onboarding")
        else:
            print("✅ User complete@test.com already exists")
        
        # Verify login works
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "complete@test.com",
            "password": "Test123!"
        })
        assert login_response.status_code == 200
        data = login_response.json()
        
        # Check onboarding status
        if not data["user"]["onboarding_completed"]:
            # Complete onboarding
            headers = {"Authorization": f"Bearer {data['token']}"}
            requests.post(f"{BASE_URL}/api/users/questionnaire", 
                headers=headers,
                json={"questionnaire_type": "assistant", "answers": {"trading_style": "day_trading", "experience_level": "intermediate", "markets": ["forex"], "sessions": ["london"], "difficulties": ["fomo"], "known_approaches": ["ict"]}})
            requests.post(f"{BASE_URL}/api/users/questionnaire", 
                headers=headers,
                json={"questionnaire_type": "educational", "answers": {"learning_style": "visual"}})
            print("✅ Completed onboarding for complete@test.com")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
