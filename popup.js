document.addEventListener('DOMContentLoaded', function() {
    // Theme handling
    const themeToggle = document.getElementById('themeToggle');
    
    // Load saved theme preference
    chrome.storage.sync.get(['darkMode'], function(result) {
        const isDarkMode = result.darkMode || false;
        document.body.className = isDarkMode ? 'dark' : 'light';
    });

    // Theme toggle gi
    themeToggle.addEventListener('click', function() {
        const isDarkMode = document.body.className === 'dark';
        const newMode = isDarkMode ? 'light' : 'dark';
        document.body.className = newMode;
        chrome.storage.sync.set({ darkMode: !isDarkMode });
    });

document.getElementById('githubButton').addEventListener('click', function() {
    window.open('https://github.com/Chikiran/FEUT-Tools', '_blank');
});

// Function to set loading state (not always visible since it's pretty quick)
function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (isLoading) {
        button.classList.add('is-loading');
        button.disabled = true;
    } else {
        button.classList.remove('is-loading');
        button.disabled = false;
    }
}

    function displayError(message) {
        const results = document.getElementById('results');
        results.innerHTML = `<p class="error-message">${message}</p>`;
    }

    function displayGWA(midterm, final) {
        const midtermElement = document.getElementById('midtermGWA');
        const finalElement = document.getElementById('finalGWA');
        
        midtermElement.textContent = parseFloat(midterm).toFixed(2);
        finalElement.textContent = parseFloat(final).toFixed(2);
    }

    // Extract Schedule button
    document.getElementById('extractButton').addEventListener('click', function() {
        setLoading('extractButton', true);
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "extractSchedule"}, function(response) {
                setLoading('extractButton', false);
                
                if (chrome.runtime.lastError) {
                    displayError("Error: Unable to extract schedule. Make sure you're on the correct page.");
                    return;
                }
            });
        });
    });

    // Calculate GWA button
    document.getElementById('calculateGWAButton').addEventListener('click', function() {
        setLoading('calculateGWAButton', true);
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "calculateGWA"}, function(response) {
                setLoading('calculateGWAButton', false);
                
                if (chrome.runtime.lastError) {
                    displayError("Error: Make sure you're on the course card page");
                    return;
                }
                
                if (response && response.midtermGWA && response.finalGWA) {
                    displayGWA(response.midtermGWA, response.finalGWA);
                } else if (response && response.error) {
                    displayError(response.error);
                }
            });
        });
    });
});
