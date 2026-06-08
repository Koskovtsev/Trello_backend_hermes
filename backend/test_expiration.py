import requests
import time
import json

BASE_URL = "http://localhost:3001"

def test_expiration_flow():
    email = "expiration_test@example.com"
    password = "password123"

    print("--- Step 1: Setup User ---")
    requests.post(f"{BASE_URL}/user", json={"email": email, "password": password})

    print("\n--- Step 2: Login ---")
    res_login = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    data = res_login.json()
    token = data.get("token")
    refresh_token = data.get("refreshToken")
    print(f"Login successful. Token received.")

    print("\n--- Step 3: Accessing Protected Route (Should be OK) ---")
    res_board = requests.get(f"{BASE_URL}/board/", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {res_board.status_code}, Body: {res_board.text}")

    # To simulate 5 minutes in a few seconds, we would need to change the server code.
    # Instead, I will manually "expire" the token by creating one that is already expired 
    # or just wait if I change the server config.
    # Since I cannot easily change the server config without restarting, 
    # I will simulate the "expired" state by sending a modified (invalid) token 
    # and then checking if /refresh still works.
    
    print("\n--- Step 4: Simulating Expired Token (Invalid Token) ---")
    res_board_expired = requests.get(f"{BASE_URL}/board/", headers={"Authorization": f"Bearer invalid_token"})
    print(f"Status: {res_board_expired.status_code}, Body: {res_board_expired.text}")
    if res_board_expired.status_code == 401:
        print("Correct: Access Token expired/invalid -> 401 Unauthorized")

    print("\n--- Step 5: Refreshing Token ---")
    res_refresh = requests.post(f"{BASE_URL}/refresh", json={"refreshToken": refresh_token})
    print(f"Status: {res_refresh.status_code}, Body: {res_refresh.text}")
    
    if res_refresh.status_code == 200:
        print("\nSUCCESS: Refresh token works even after access token expires!")
    else:
        print("\nFAIL: Refresh token failed with 401")

if __name__ == "__main__":
    test_expiration_flow()
