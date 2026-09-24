import random
import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# CORS — only allow requests from LutealShield frontend
CORS(app, origins=["https://lutealshield.netlify.app", "http://localhost:3000"])

# Rate limiting — max 20 Bloomy requests per minute per user
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["20 per minute"]
)

# Health check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "LutealShield API"})

# Bloomy endpoint
@app.route("/api/bloomy", methods=["POST"])
@limiter.limit("20 per minute")
def bloomy():
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "Invalid request"}), 400

    user_message = data.get("message", "")
    zone = data.get("zone", "green")
    symptoms = data.get("symptoms", [])
    pocket = data.get("pocket", [])

    # Build context
    symptoms_text = ", ".join(symptoms) if symptoms else "not specified"
    pocket_text = "\n".join([f"- {p}" for p in pocket]) if pocket else "none saved yet"

    system_prompt = f"""You are Bloomy, a warm and grounding companion for someone living with PMDD.

Current zone: {zone.upper()} ZONE
User's known symptoms: {symptoms_text}
Their personal affirmations and anchors:
{pocket_text}

Your role:
- Reflect their own words and strengths back to them
- Be warm, brief, and grounding — never clinical
- Never give medical advice or diagnoses
- If they express suicidal thoughts, gently acknowledge and share: SADAG 0800 567 567
- Speak like a trusted friend who understands PMDD deeply
- Keep responses under 100 words unless the user needs more

User says: {user_message}"""
    FALLBACK_RESPONSES = [
        "You've survived every hard day before this one. Your 100% survival rate is still intact. The storm is hormonal, not factual — it will pass.",
        "Right now your nervous system is in survival mode. That's not weakness, that's chemistry. Take one breath. You don't have to solve everything tonight.",
        "The feelings are real but they are temporary. Your steady-self wrote you a message on a good day — it's waiting for you in your Pocket."
    ]

    last_error = None
    for attempt in range(3):
        try:
            chat = client.chats.create(model="gemini-3.6-flash")
            response = chat.send_message(system_prompt)
            return jsonify({"response": response.text})
        except Exception as e:
            last_error = e
            print(f"Bloomy attempt {attempt + 1} failed: {e}")
            if "503" in str(e) and attempt < 2:
                time.sleep(10)
                continue
            break

    return jsonify({"response": random.choice(FALLBACK_RESPONSES)})


if __name__ == "__main__":
    app.run(debug=False)