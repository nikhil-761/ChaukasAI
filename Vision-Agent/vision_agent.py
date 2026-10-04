import os
import base64
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("KODEKEY_API_KEY")

if not api_key:
    raise ValueError("KODEKEY_API_KEY is missing from .env")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.ai.kodekloud.com/v1"
)


def analyze_image(image_path):

    with open(image_path, "rb") as image_file:
        image_data = base64.b64encode(
            image_file.read()
        ).decode("utf-8")

    response = client.chat.completions.create(
        model="google/gemini-3.5-flash",

        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are Chaukas AI, a civic problem detection agent.

Analyze this image and identify any civic problem.

Return:

Problem detected:
Category:
Problem type:
Severity: Low, Medium, or High:
Description:
Confidence:
"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        }
                    }
                ]
            }
        ],

        temperature=0
    )

    return response.choices[0].message.content