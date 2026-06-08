import requests
import time

BASE_URL = "http://localhost:3001"

def test_refresh_token():
    email = "test_refresh@example.com"
    password = "password123"

    print("--- Step 1: Create User ---")
    res = requests.post(f"{BASE_URL}/user", json={"email": email, "password": password})
    print(f"Create user: {res.status_code}, {res.text}")

    print("\n--- Step 2: Login ---")
    res = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    if res.status_code != 200:
        print(f"Login failed: {res.status_code}, {res.text}")
        return
    
    data = res.json()
    token = data.get("token")
    refresh_token = data.get("refreshToken")
    print(f"Login success. Token and RefreshToken received.")

    print("\n--- Step 3: Verify Access Token ---")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/board/", headers=headers)
    print(f"Access protected route: {res.status_code}, {res.text}")

    print("\n--- Step 4: Refresh Token ---")
    # We send the refresh token in the body as expected by the server
    res = requests.post(f"{BASE_URL}/refresh", json={"refreshToken": refresh_token})
    print(f"Refresh request: {res.status_code}, {res.text}")
    
    if res.status_code != 200:
        print("REFRESH TOKEN FAILED!")
        return

    new_data = res.json()
    new_token = new_data.get("token")
    print(f"Refresh success. New token received.")

    print("\n--- Step 5: Verify New Access Token ---")
    headers = {"Authorization": f"Bearer {new_token}"}
    res = requests.get(f"{BASE_URL}/board/", headers=headers)
    print(f"Access protected route with new token: {res.status_code}, {res.text}")
    if res.status_code == 200:
        print("\nSUCCESS: Refresh token flow works perfectly!")
    else:
        print("\nFAILED: New token is invalid!")

if __name__ == "__main__":
    try:
        test_refresh_token()
    except Exception as e:
        print(f"Error during test: {e}")
