import os
import requests

api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    print("Please set OPENROUTER_API_KEY")
    exit(1)

print("Listing available free models from OpenRouter...")
try:
    response = requests.get("https://openrouter.ai/api/v1/models")
    if response.status_code == 200:
        models = response.json().get('data', [])
        # Filter for free models or just list all
        free_models = [m for m in models if ':free' in m.get('id', '')]
        
        if free_models:
            print(f"Found {len(free_models)} free models:")
            for m in free_models:
                print(f"ID: {m['id']}, Name: {m.get('name', 'N/A')}")
        else:
            print("No free models found. Listing first 10 models:")
            for m in models[:10]:
                print(f"ID: {m['id']}, Name: {m.get('name', 'N/A')}")
    else:
        print(f"Error: OpenRouter API returned status {response.status_code}")
except Exception as e:
    print(f"Error listing models: {e}")
