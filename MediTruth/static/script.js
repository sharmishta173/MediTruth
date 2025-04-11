document.addEventListener('DOMContentLoaded', function() {
    const checkBtn = document.getElementById('checkBtn');
    const medicalText = document.getElementById('medicalText');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const sourcesCard = document.getElementById('sourcesCard');
    const sourcesContent = document.getElementById('sourcesContent');
    
    checkBtn.addEventListener('click', checkForMisinformation);
    
    async function checkForMisinformation() {
        const text = medicalText.value.trim();
        
        if (!text) {
            alert('Please enter some medical information to check');
            return;
        }
        
        // Show loading state
        resultSection.classList.remove('hidden');
        resultContent.innerHTML = '<div class="loader"></div><p>Analyzing content...</p>';
        sourcesCard.classList.add('hidden');
        
        try {
            const response = await fetch('/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });
            
            const data = await response.json();
            
            // Display results
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            resultContent.innerHTML = `
                <div class="result-message">
                    <p>An error occurred while analyzing the text. Please try again.</p>
                </div>
            `;
        }
    }
    
    function displayResults(data) {
        const confidencePercent = Math.round(data.confidence * 100);
        let confidenceColor = '#6c63ff';
        
        if (data.is_misinfo) {
            confidenceColor = '#ff6b6b';
        } else {
            confidenceColor = '#51cf66';
        }
        
        resultContent.innerHTML = `
            <div class="result-message ${data.is_misinfo ? 'misinfo' : 'truth'}">
                <p>This content is <strong>${data.is_misinfo ? 'likely medical misinformation' : 'likely reliable medical information'}</strong></p>
            </div>
            <div class="confidence-info">
                <p>Confidence: ${confidencePercent}%</p>
                <div class="confidence-meter">
                    <div class="confidence-bar" style="width: ${confidencePercent}%; background: ${confidenceColor}"></div>
                </div>
            </div>
            ${data.is_misinfo ? '<p class="warning-text">⚠ This content appears to contain medical misinformation. Please consult reliable sources below.</p>' : '<p class="success-text">✅ This content appears to be reliable medical information.</p>'}
        `;
        
        // Show reliable sources if misinformation
        if (data.is_misinfo && data.reliable_sources.length > 0) {
            sourcesCard.classList.remove('hidden');
            sourcesContent.innerHTML = '';
            
            data.reliable_sources.forEach(source => {
                const sourceElement = document.createElement('div');
                sourceElement.className = 'source-item';
                sourceElement.innerHTML = `
                    <h3>${source.title}</h3>
                    <a href="${source.link}" target="_blank">Visit source</a>
                `;
                sourcesContent.appendChild(sourceElement);
            });
        } else if (data.is_misinfo) {
            sourcesCard.classList.remove('hidden');
            sourcesContent.innerHTML = '<p>No alternative sources found for this specific claim.</p>';
        }
    }
});