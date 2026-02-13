"""
Backtest API Test Suite
Tests for AI-assisted backtesting feature using GPT-5.2
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trader-dashboard-50.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "complete@test.com"
TEST_PASSWORD = "Test123!"


class TestBacktestAPI:
    """Test suite for Backtest API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        self.created_backtests = []
    
    def teardown_method(self, method):
        """Cleanup - delete test created backtests"""
        for bt_id in self.created_backtests:
            try:
                requests.delete(f"{BASE_URL}/api/backtest/{bt_id}", headers=self.headers)
            except:
                pass
    
    # ===== 1. BACKTEST LIST =====
    def test_get_backtest_list(self):
        """Test GET /api/backtest - List all backtests"""
        response = requests.get(f"{BASE_URL}/api/backtest", headers=self.headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "backtests" in data, "Response should contain 'backtests' key"
        assert isinstance(data["backtests"], list), "backtests should be a list"
        print(f"✓ Found {len(data['backtests'])} existing backtests")
    
    # ===== 2. BACKTEST CREATE WITH AI =====
    def test_create_backtest_with_ai_analysis(self):
        """Test POST /api/backtest - Create backtest with GPT-5.2 AI analysis"""
        backtest_data = {
            "name": "TEST_BOS_FVG_Strategy",
            "strategy_description": "Stratégie basée sur Break of Structure (BOS) et Fair Value Gap (FVG) sur les paires majeures Forex",
            "symbol": "EURUSD",
            "timeframe": "15m",
            "start_date": "2025-06-01",
            "end_date": "2025-06-30",
            "initial_capital": 10000.0,
            "risk_per_trade": 1.0,
            "entry_rules": [
                "BOS confirmé sur 15min",
                "FVG identifié dans la zone de demand/supply",
                "Entrée sur mitigation du FVG"
            ],
            "exit_rules": [
                "Take profit sur ratio R/R 1:2",
                "Stop loss sous le dernier low/high"
            ],
            "stop_loss_type": "fixed",
            "stop_loss_value": 1.0,
            "take_profit_type": "rr_ratio",
            "take_profit_value": 2.0
        }
        
        response = requests.post(f"{BASE_URL}/api/backtest", headers=self.headers, json=backtest_data)
        
        assert response.status_code == 200, f"Failed to create backtest: {response.text}"
        data = response.json()
        
        assert "id" in data, "Response should contain backtest id"
        assert "message" in data, "Response should contain success message"
        
        self.created_backtests.append(data["id"])
        print(f"✓ Backtest created with id: {data['id']}")
        
        # Verify AI analysis was generated
        if "ai_analysis" in data:
            print(f"✓ AI analysis included in response")
        
        return data["id"]
    
    # ===== 3. BACKTEST DETAIL =====
    def test_get_backtest_detail(self):
        """Test GET /api/backtest/{id} - Get full backtest details"""
        # First create a backtest
        backtest_id = self.test_create_backtest_with_ai_analysis()
        
        response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        
        assert response.status_code == 200, f"Failed to get backtest: {response.text}"
        data = response.json()
        
        # Verify all expected fields are present
        expected_fields = ["id", "name", "strategy_description", "symbol", "timeframe", 
                          "start_date", "end_date", "initial_capital", "risk_per_trade",
                          "entry_rules", "exit_rules", "stop_loss_type", "stop_loss_value",
                          "take_profit_type", "take_profit_value", "status", "trades"]
        
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        assert data["name"] == "TEST_BOS_FVG_Strategy"
        assert data["symbol"] == "EURUSD"
        assert data["status"] in ["pending", "in_progress", "completed"]
        
        print(f"✓ Backtest details retrieved successfully")
        print(f"  - Name: {data['name']}")
        print(f"  - Status: {data['status']}")
        print(f"  - AI Analysis present: {'ai_analysis' in data and data['ai_analysis'] is not None}")
    
    # ===== 4. ADD TRADE TO BACKTEST =====
    def test_add_trade_to_backtest(self):
        """Test POST /api/backtest/{id}/trades - Add a trade"""
        # Create backtest first
        backtest_id = self.test_create_backtest_with_ai_analysis()
        
        trade_data = {
            "entry_date": "2025-06-05",
            "exit_date": "2025-06-05",
            "direction": "LONG",
            "entry_price": 1.0850,
            "exit_price": 1.0900,
            "pnl": 150.0,
            "pnl_percent": 1.5,
            "notes": "Setup BOS parfait sur session Londres"
        }
        
        response = requests.post(f"{BASE_URL}/api/backtest/{backtest_id}/trades", 
                                 headers=self.headers, json=trade_data)
        
        assert response.status_code == 200, f"Failed to add trade: {response.text}"
        data = response.json()
        
        assert "message" in data, "Response should contain message"
        assert "trade_id" in data, "Response should contain trade_id"
        
        print(f"✓ Trade added with id: {data['trade_id']}")
        
        # Verify trade was added by getting backtest detail
        detail_response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        detail_data = detail_response.json()
        
        assert len(detail_data["trades"]) == 1, "Backtest should have 1 trade"
        assert detail_data["trades"][0]["pnl"] == 150.0
        assert detail_data["status"] == "in_progress"
        
        print(f"✓ Trade verified in backtest (status: {detail_data['status']})")
        
        return backtest_id
    
    def test_add_multiple_trades(self):
        """Test adding multiple trades to a backtest"""
        backtest_id = self.test_create_backtest_with_ai_analysis()
        
        trades = [
            {"entry_date": "2025-06-05", "exit_date": "2025-06-05", "direction": "LONG", 
             "entry_price": 1.0850, "exit_price": 1.0900, "pnl": 150.0, "pnl_percent": 1.5},
            {"entry_date": "2025-06-10", "exit_date": "2025-06-10", "direction": "SHORT",
             "entry_price": 1.0900, "exit_price": 1.0870, "pnl": 90.0, "pnl_percent": 0.9},
            {"entry_date": "2025-06-15", "exit_date": "2025-06-15", "direction": "LONG",
             "entry_price": 1.0870, "exit_price": 1.0830, "pnl": -120.0, "pnl_percent": -1.2},
        ]
        
        for i, trade in enumerate(trades):
            response = requests.post(f"{BASE_URL}/api/backtest/{backtest_id}/trades",
                                     headers=self.headers, json=trade)
            assert response.status_code == 200, f"Failed to add trade {i+1}: {response.text}"
        
        # Verify all trades were added
        detail_response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        detail_data = detail_response.json()
        
        assert len(detail_data["trades"]) == 3, f"Expected 3 trades, got {len(detail_data['trades'])}"
        print(f"✓ Added {len(detail_data['trades'])} trades successfully")
        
        return backtest_id
    
    # ===== 5. CALCULATE RESULTS WITH AI =====
    def test_calculate_backtest_results(self):
        """Test POST /api/backtest/{id}/calculate - Calculate results with AI analysis"""
        # Create backtest and add trades
        backtest_id = self.test_add_multiple_trades()
        
        # Calculate results (this calls GPT-5.2 for analysis)
        response = requests.post(f"{BASE_URL}/api/backtest/{backtest_id}/calculate", 
                                 headers=self.headers, timeout=60)  # Long timeout for AI
        
        assert response.status_code == 200, f"Failed to calculate: {response.text}"
        data = response.json()
        
        # Verify all result fields
        expected_fields = ["total_trades", "winning_trades", "losing_trades", "winrate",
                          "total_pnl", "profit_factor", "max_drawdown", "roi", "equity_curve"]
        
        for field in expected_fields:
            assert field in data, f"Missing result field: {field}"
        
        print(f"✓ Backtest results calculated:")
        print(f"  - Total trades: {data['total_trades']}")
        print(f"  - Winrate: {data['winrate']}%")
        print(f"  - ROI: {data['roi']}%")
        print(f"  - Profit Factor: {data['profit_factor']}")
        print(f"  - Max Drawdown: {data['max_drawdown_percent']}%")
        
        # Check AI performance analysis
        if "ai_performance_analysis" in data and data["ai_performance_analysis"]:
            print(f"✓ AI Performance Analysis present (GPT-5.2)")
            print(f"  Preview: {data['ai_performance_analysis'][:200]}...")
        
        # Verify backtest is now completed
        detail_response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        detail_data = detail_response.json()
        
        assert detail_data["status"] == "completed", f"Expected status 'completed', got '{detail_data['status']}'"
        print(f"✓ Backtest status is now 'completed'")
    
    def test_calculate_requires_trades(self):
        """Test that calculate fails if no trades exist"""
        # Create empty backtest
        backtest_id = self.test_create_backtest_with_ai_analysis()
        
        response = requests.post(f"{BASE_URL}/api/backtest/{backtest_id}/calculate", 
                                 headers=self.headers)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Correctly rejected calculate without trades (400)")
    
    # ===== 6. DELETE BACKTEST =====
    def test_delete_backtest(self):
        """Test DELETE /api/backtest/{id} - Delete a backtest"""
        # Create a backtest to delete
        backtest_data = {
            "name": "TEST_Delete_Me",
            "strategy_description": "Test deletion",
            "symbol": "GBPUSD",
            "timeframe": "1h",
            "start_date": "2025-01-01",
            "end_date": "2025-01-31",
            "initial_capital": 5000.0,
            "risk_per_trade": 1.0,
            "entry_rules": ["Test"],
            "exit_rules": ["Test"],
            "stop_loss_type": "fixed",
            "stop_loss_value": 1.0,
            "take_profit_type": "fixed",
            "take_profit_value": 2.0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/backtest", headers=self.headers, json=backtest_data)
        backtest_id = create_response.json()["id"]
        
        # Delete the backtest
        delete_response = requests.delete(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        
        assert delete_response.status_code == 200, f"Failed to delete: {delete_response.text}"
        print(f"✓ Backtest deleted successfully")
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        assert get_response.status_code == 404, "Deleted backtest should return 404"
        print(f"✓ Confirmed backtest no longer exists (404)")
    
    def test_delete_nonexistent_backtest(self):
        """Test deleting a non-existent backtest returns 404"""
        response = requests.delete(f"{BASE_URL}/api/backtest/nonexistent-id-12345", headers=self.headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returned 404 for non-existent backtest")
    
    # ===== 7. DELETE TRADE FROM BACKTEST =====
    def test_delete_trade_from_backtest(self):
        """Test DELETE /api/backtest/{id}/trades/{trade_id} - Delete a trade"""
        # Create backtest and add a trade
        backtest_id = self.test_add_trade_to_backtest()
        
        # Get the trade id
        detail_response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        trades = detail_response.json()["trades"]
        trade_id = trades[0]["id"]
        
        # Delete the trade
        delete_response = requests.delete(f"{BASE_URL}/api/backtest/{backtest_id}/trades/{trade_id}", 
                                          headers=self.headers)
        
        assert delete_response.status_code == 200, f"Failed to delete trade: {delete_response.text}"
        print(f"✓ Trade deleted successfully")
        
        # Verify trade is gone
        detail_response = requests.get(f"{BASE_URL}/api/backtest/{backtest_id}", headers=self.headers)
        assert len(detail_response.json()["trades"]) == 0, "Trade should be deleted"
        print(f"✓ Confirmed trade no longer exists")


class TestBacktestAuth:
    """Test authentication for backtest endpoints"""
    
    def test_backtest_requires_auth(self):
        """Test that backtest endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/backtest")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"✓ Backtest list requires authentication")
    
    def test_backtest_create_requires_auth(self):
        """Test that creating backtest requires authentication"""
        response = requests.post(f"{BASE_URL}/api/backtest", json={"name": "Test"})
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"✓ Backtest create requires authentication")


class TestBacktestValidation:
    """Test input validation for backtest endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        self.created_backtests = []
    
    def teardown_method(self, method):
        """Cleanup"""
        for bt_id in self.created_backtests:
            try:
                requests.delete(f"{BASE_URL}/api/backtest/{bt_id}", headers=self.headers)
            except:
                pass
    
    def test_create_backtest_missing_fields(self):
        """Test validation for missing required fields"""
        # Missing required fields
        response = requests.post(f"{BASE_URL}/api/backtest", headers=self.headers, json={
            "name": "Test Only Name"
        })
        
        assert response.status_code == 422, f"Expected 422 for validation error, got {response.status_code}"
        print(f"✓ Validation correctly rejects incomplete data")
    
    def test_add_trade_invalid_direction(self):
        """Test that invalid trade direction is handled"""
        # First create a valid backtest
        backtest_data = {
            "name": "TEST_Validation",
            "strategy_description": "Test",
            "symbol": "EURUSD",
            "timeframe": "1h",
            "start_date": "2025-01-01",
            "end_date": "2025-01-31",
            "initial_capital": 10000,
            "risk_per_trade": 1.0,
            "entry_rules": ["Test"],
            "exit_rules": ["Test"],
            "stop_loss_type": "fixed",
            "stop_loss_value": 1.0,
            "take_profit_type": "fixed",
            "take_profit_value": 2.0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/backtest", headers=self.headers, json=backtest_data)
        backtest_id = create_response.json()["id"]
        self.created_backtests.append(backtest_id)
        
        # Try to add trade with missing fields
        response = requests.post(f"{BASE_URL}/api/backtest/{backtest_id}/trades", 
                                 headers=self.headers, json={"direction": "LONG"})
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✓ Trade validation correctly rejects incomplete data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
