import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load env
env_path = Path('.env')
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY", "")
print(f"API Key: '{api_key}'")

if not api_key:
    print("No API Key found!")
    exit(1)

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
