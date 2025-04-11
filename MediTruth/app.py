from flask import Flask, render_template, request, jsonify
from transformers import pipeline
import requests
from bs4 import BeautifulSoup
import numpy as np
import pandas as pd

app = Flask(_name_)

# Load the misinformation detection model
misinfo_model = pipeline("text-classification", model="digitalepidemiologylab/covid-twitter-bert-v2-mnli")

# Trusted medical sources
TRUSTED_SOURCES = [
    "who.int", "cdc.gov", "nih.gov", "mayoclinic.org", 
    "webmd.com", "healthline.com", "medlineplus.gov"
]

def get_reliable_sources(query):
    """Search for reliable medical information from trusted sources"""
    results = []
    for source in TRUSTED_SOURCES:
        try:
            url = f"https://www.google.com/search?q=site:{source}+{query}"
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            for g in soup.find_all('div', class_='g'):
                anchor = g.find('a')
                if anchor and 'href' in anchor.attrs:
                    link = anchor['href']
                    title = g.find('h3').text if g.find('h3') else "No title"
                    results.append({'title': title, 'link': link})
        except Exception as e:
            print(f"Error searching {source}: {e}")
    
    return results[:5]  # Return top 5 results

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/check', methods=['POST'])
def check_text():
    data = request.get_json()
    text = data['text']
    
    # Analyze the text for misinformation
    result = misinfo_model(text)
    
    # Determine if it's likely misinformation (label is 'misinformation' and score > 0.7)
    is_misinfo = result[0]['label'] == 'misinformation' and result[0]['score'] > 0.7
    
    # Get reliable sources if it's misinformation
    reliable_sources = []
    if is_misinfo:
        keywords = " ".join(text.split()[:5])  # Use first few words as search query
        reliable_sources = get_reliable_sources(keywords)
    
    return jsonify({
        'is_misinfo': is_misinfo,
        'confidence': float(result[0]['score']),
        'reliable_sources': reliable_sources
    })

if _name_ == '_main_':
    app.run(**debug=True)