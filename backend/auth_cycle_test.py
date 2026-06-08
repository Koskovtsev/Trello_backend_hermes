import requests
import json

BASE_URL = "http://localhost:3001"

def test_auth_cycle():
    email = "test_final@example.com"
    password = "password123"

    print("--- Step 1: User Creation ---")
    requests.post(f"{BASE_URL}/user", json={"email": email, "password": password})

    print("\n--- Step 2: Login ---")
    res_login = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    
    print(f"Login Content-Type: {res_login.headers.get('Content-Type')}")
    if "application/json" in res_login.headers.get('Content-Type', ''):
        print("FAIL: Response is JSON, should be text/plain")
    
    try:
        data = res_login.json()
        saved_refresh_token = data.get("refreshToken")
        print(f"Saved Refresh Token: {saved_refresh_token[:20]}...")
    except Exception as e:
        print(f"FAIL: Could not parse login response: {e}")
        return

    print("\n--- Step 3: Refresh Token Request ---")
    res_refresh = requests.post(f"{BASE_URL}/refresh", json={"refreshToken": saved_refresh_token})
    
    print(f"Refresh Content-Type: {res_refresh.headers.get('Content-Type')}")
    print(f"Refresh Status: {res_refresh.status_code}")
    print(f"Refresh Body: {res_refresh.text}")

    if res_refresh.status_code == 200:
        try:
            refresh_data = res_refresh.json()
            if "token" in refresh_data:
                print("\nSUCCESS: Token refreshed successfully!")
            else:
                print("\nFAIL: Response 200 but no token found")
        except Exception as e:
            print(f"\nFAIL: Could not parse refresh response: {e}")
    else:
        print(f"\nFAIL: Refresh failed with status {res_refresh.status_code}")

if __name__ == "__main__":
    test_auth_cycle()
