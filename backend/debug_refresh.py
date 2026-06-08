
import requests
import time
import sqlite3

BASE_URL = "http://localhost:3001"
DB_PATH = "/mnt/i/AI/Trello_backend/backend/src/prisma/dev.db"

def check_db_token(email):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT refreshToken FROM User WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else None
    except Exception as e:
        return f"DB Error: {e}"

def test_refresh_flow():
    email = "debug_refresh@example.com"
    password = "password123"

    print("--- Step 1: Login ---")
    res = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    if res.status_code != 200:
        # Create user if not exists
        requests.post(f"{BASE_URL}/user", json={"email": email, "password": password})
        res = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    
    data = res.json()
    token = data.get("token")
    refresh_token = data.get("refreshToken")
    print(f"Login success. RefreshToken received: {refresh_token[:20]}...")

    db_token = check_db_token(email)
    print(f"Token in DB: {db_token[:20] if db_token else 'None'}...")
    
    if db_token != refresh_token:
        print("!!! ERROR: Token in DB does not match token sent to client !!!")

    print("\n--- Step 2: Refresh Token ---")
    # We use the refresh_token we got from login
    res = requests.post(f"{BASE_URL}/refresh", json={"refreshToken": refresh_token})
    print(f"Refresh response: {res.status_code}, {res.text}")
    
    if res.status_code == 200:
        new_data = res.json()
        new_refresh_token = new_data.get("refreshToken")
        print(f"Refresh success. New RefreshToken: {new_refresh_token[:20]}...")
        
        db_token_new = check_db_token(email)
        print(f"New Token in DB: {db_token_new[:20] if db_token_new else 'None'}...")
        
        if db_token_new != new_refresh_token:
            print("!!! ERROR: New token not saved to DB !!!")
    else:
        print("REFRESH FAILED")

if __name__ == "__main__":
    test_refresh_flow()
