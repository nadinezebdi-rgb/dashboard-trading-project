#!/usr/bin/env python3
"""
Backend API Testing for French Trading Platform
Tests all endpoints including auth, trades, questionnaires, AI features, and payments
"""
import requests
import json
import sys
import uuid
from datetime import datetime

class TradingPlatformTester:
    def __init__(self, base_url="https://e127-stage-preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, response=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat()
        }
        
        if response:
            result["status_code"] = response.status_code if hasattr(response, 'status_code') else None
            result["response_data"] = response.json() if hasattr(response, 'json') else str(response)
        
        if error:
            result["error"] = str(error)
            
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if error:
            print(f"   Error: {error}")
        return success

    def make_request(self, method, endpoint, data=None, files=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        if files:
            headers.pop('Content-Type', None)  # Remove for file uploads
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request error: {e}")
            return None

    def test_health_check(self):
        """Test health endpoint"""
        response = self.make_request('GET', 'health')
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('status') == 'healthy'
            return self.log_result("Health Check", success, response)
        return self.log_result("Health Check", False, response)

    def test_register_user(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_data = {
            "name": "Test Trader",
            "email": test_email,
            "password": "TestPassword123!"
        }
        
        response = self.make_request('POST', 'auth/register', test_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get('token') and data.get('user'):
                self.token = data['token']
                self.user_id = data['user']['id']
                self.test_email = test_email
                return self.log_result("User Registration", True, response)
        return self.log_result("User Registration", False, response)

    def test_login_user(self):
        """Test user login"""
        if not hasattr(self, 'test_email'):
            return self.log_result("User Login", False, error="No registered user to test login")
            
        login_data = {
            "email": self.test_email,
            "password": "TestPassword123!"
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get('token') and data.get('user'):
                return self.log_result("User Login", True, response)
        return self.log_result("User Login", False, response)

    def test_get_current_user(self):
        """Test get current user info"""
        if not self.token:
            return self.log_result("Get Current User", False, error="No auth token")
            
        response = self.make_request('GET', 'auth/me')
        if response and response.status_code == 200:
            data = response.json()
            if data.get('user'):
                return self.log_result("Get Current User", True, response)
        return self.log_result("Get Current User", False, response)

    def test_save_questionnaire(self):
        """Test saving questionnaire data"""
        if not self.token:
            return self.log_result("Save Questionnaire", False, error="No auth token")
            
        questionnaire_data = {
            "questionnaire_type": "assistant",
            "answers": {
                "trading_style": "day_trading",
                "experience_level": "intermediate", 
                "markets": ["crypto", "forex"],
                "sessions": ["london", "new_york"],
                "difficulties": ["fomo", "overtrading"]
            }
        }
        
        response = self.make_request('POST', 'users/questionnaire', questionnaire_data)
        if response and response.status_code == 200:
            return self.log_result("Save Questionnaire", True, response)
        return self.log_result("Save Questionnaire", False, response)

    def test_get_questionnaires(self):
        """Test getting user questionnaires"""
        if not self.token:
            return self.log_result("Get Questionnaires", False, error="No auth token")
            
        response = self.make_request('GET', 'users/questionnaires')
        if response and response.status_code == 200:
            data = response.json()
            if 'questionnaires' in data:
                return self.log_result("Get Questionnaires", True, response)
        return self.log_result("Get Questionnaires", False, response)

    def test_create_trade(self):
        """Test creating a trade entry"""
        if not self.token:
            return self.log_result("Create Trade", False, error="No auth token")
            
        trade_data = {
            "symbol": "EURUSD",
            "direction": "LONG",
            "entry_price": 1.0850,
            "exit_price": 1.0920,
            "quantity": 1.0,
            "pnl": 70.0,
            "setup_type": "Support/Resistance",
            "notes": "Test trade entry",
            "session": "london",
            "respected_plan": True,
            "emotions": "Calm and focused",
            "errors": []
        }
        
        response = self.make_request('POST', 'trades', trade_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get('id'):
                self.trade_id = data['id']
                return self.log_result("Create Trade", True, response)
        return self.log_result("Create Trade", False, response)

    def test_get_trades(self):
        """Test getting user trades"""
        if not self.token:
            return self.log_result("Get Trades", False, error="No auth token")
            
        response = self.make_request('GET', 'trades?limit=10')
        if response and response.status_code == 200:
            data = response.json()
            if 'trades' in data:
                return self.log_result("Get Trades", True, response)
        return self.log_result("Get Trades", False, response)

    def test_get_trade_stats(self):
        """Test getting trade statistics"""
        if not self.token:
            return self.log_result("Get Trade Stats", False, error="No auth token")
            
        response = self.make_request('GET', 'trades/stats')
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ['total_trades', 'winrate', 'total_pnl', 'plan_adherence']
            if all(field in data for field in required_fields):
                return self.log_result("Get Trade Stats", True, response)
        return self.log_result("Get Trade Stats", False, response)

    def test_get_heatmap_data(self):
        """Test getting heatmap data"""
        if not self.token:
            return self.log_result("Get Heatmap Data", False, error="No auth token")
            
        response = self.make_request('GET', 'trades/heatmap')
        if response and response.status_code == 200:
            data = response.json()
            if 'trades' in data:
                return self.log_result("Get Heatmap Data", True, response)
        return self.log_result("Get Heatmap Data", False, response)

    def test_ai_setup_analysis(self):
        """Test AI setup analysis (requires Emergent LLM key)"""
        if not self.token:
            return self.log_result("AI Setup Analysis", False, error="No auth token")
            
        analysis_data = {
            "symbol": "EURUSD",
            "timeframe": "1H", 
            "notes": "Testing AI analysis",
            "screenshot_base64": ""  # Empty for now since we don't have real screenshot
        }
        
        response = self.make_request('POST', 'ai/analyze-setup', analysis_data)
        if response:
            if response.status_code == 200:
                data = response.json()
                if data.get('analysis'):
                    return self.log_result("AI Setup Analysis", True, response)
            elif response.status_code == 500:
                # Expected if AI service is not available
                return self.log_result("AI Setup Analysis", False, response, "AI service may be unavailable")
        return self.log_result("AI Setup Analysis", False, response)

    def test_ai_coaching(self):
        """Test AI coaching feature"""
        if not self.token:
            return self.log_result("AI Coaching", False, error="No auth token")
            
        coaching_data = {
            "message": "Comment puis-je améliorer ma discipline de trading?",
            "context": "coaching"
        }
        
        response = self.make_request('POST', 'ai/coaching', coaching_data)
        if response:
            if response.status_code == 200:
                data = response.json()
                if data.get('response'):
                    return self.log_result("AI Coaching", True, response)
            elif response.status_code == 500:
                # Expected if AI service is not available
                return self.log_result("AI Coaching", False, response, "AI service may be unavailable")
        return self.log_result("AI Coaching", False, response)

    def test_daily_briefing(self):
        """Test daily AI briefing"""
        if not self.token:
            return self.log_result("Daily Briefing", False, error="No auth token")
            
        response = self.make_request('GET', 'ai/daily-briefing')
        if response:
            if response.status_code == 200:
                data = response.json()
                if data.get('briefing'):
                    return self.log_result("Daily Briefing", True, response)
            elif response.status_code == 500:
                # Expected if AI service is not available
                return self.log_result("Daily Briefing", False, response, "AI service may be unavailable")
        return self.log_result("Daily Briefing", False, response)

    def test_payment_plans(self):
        """Test getting payment plans"""
        response = self.make_request('GET', 'payments/plans')
        if response and response.status_code == 200:
            data = response.json()
            if data.get('plans'):
                return self.log_result("Payment Plans", True, response)
        return self.log_result("Payment Plans", False, response)

    def test_create_checkout(self):
        """Test creating Stripe checkout session"""
        if not self.token:
            return self.log_result("Create Checkout", False, error="No auth token")
            
        checkout_data = {
            "plan": "starter",
            "origin_url": "https://e127-stage-preview.emergentagent.com"
        }
        
        response = self.make_request('POST', 'payments/checkout', checkout_data)
        if response:
            if response.status_code == 200:
                data = response.json()
                if data.get('url') and data.get('session_id'):
                    self.checkout_session_id = data['session_id']
                    return self.log_result("Create Checkout", True, response)
            elif response.status_code == 500:
                # Expected if Stripe is not properly configured
                return self.log_result("Create Checkout", False, response, "Stripe may be misconfigured")
        return self.log_result("Create Checkout", False, response)

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for French Trading Platform")
        print("=" * 60)
        
        # Basic functionality tests
        self.test_health_check()
        self.test_register_user()
        self.test_login_user() 
        self.test_get_current_user()
        
        # User profile tests
        self.test_save_questionnaire()
        self.test_get_questionnaires()
        
        # Trading functionality tests
        self.test_create_trade()
        self.test_get_trades()
        self.test_get_trade_stats()
        self.test_get_heatmap_data()
        
        # AI features tests (may fail if service unavailable)
        self.test_ai_setup_analysis()
        self.test_ai_coaching()
        self.test_daily_briefing()
        
        # Payment tests
        self.test_payment_plans()
        self.test_create_checkout()
        
        # Print results
        print("\n" + "=" * 60)
        print(f"🏁 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

    def get_detailed_results(self):
        """Return detailed test results"""
        return {
            "summary": {
                "tests_run": self.tests_run,
                "tests_passed": self.tests_passed,
                "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
            },
            "results": self.test_results
        }

def main():
    tester = TradingPlatformTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = tester.get_detailed_results()
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())