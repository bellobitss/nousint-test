// Starfield background effect, randomized
(function() {
    const style = document.createElement('style');
    const stars = [];
    const numStars = 150;

    const isRedMode = document.querySelector('link[href*="redindex.css"]') !== null;

    const starColor = isRedMode ? "255, 142, 197" : "177, 218, 250";
    
    for (let i = 0; i < numStars; i++) {
        const x = Math.floor(Math.random() * 100); 
        const y = Math.floor(Math.random() * 100); 

        const alpha = (0.5 + Math.random() * 0.5).toFixed(2);
        
        const size = Math.random() > 0.8 ? '3px 3px' : '2px 2px';

        stars.push(`radial-gradient(${size} at ${x}% ${y}%, rgba(${starColor}, ${alpha}), rgba(${starColor}, 0))`);
    }

    style.innerHTML = `
        @keyframes star-flicker {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
        
        .starfield::before {
            background-image: ${stars.join(', ')};
            background-size: 100% 100%;
            background-repeat: no-repeat;
            animation: star-flicker 4s infinite ease-in-out;
            /* Enhance rendering */
            image-rendering: -webkit-optimize-contrast;
            background-position: center;
        }
    `;
    document.head.appendChild(style);
})();
// note: this was the original standalone project built before creating the rest of the site! :3
// SCANNER
const scanBtn = document.getElementById('scanBtn');
const postInput = document.getElementById('postInput');
const imageUpload = document.getElementById('imageUpload');
const fileName = document.getElementById('fileName');
const resultsArea = document.getElementById('resultsArea');
const aiFeedback = document.getElementById('aiFeedback');
const threatSwitch = document.getElementById('threatSwitch');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function validateFile(file) {
    if (!file) return { valid: true };
    
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: 'Only JPG, PNG, and WEBP files allowed.' };
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: 'Invalid file type.' };
    }
    
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
    }
    
    return { 
        valid: true 
    };
}

function showError(message) {
    if (resultsArea) 
        resultsArea.classList.remove('hidden');
    if (aiFeedback) 
        aiFeedback.innerText = message;
}

if (imageUpload) {
    imageUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const validation = validateFile(this.files[0]);
            if (!validation.valid) {
                showError(validation.error);
                this.value = '';
                fileName.innerText = "";
                return;
            }
            fileName.innerText = "Selected: " + this.files[0].name;
        } else {
            fileName.innerText = "";
        }
    });
}

if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
        const text = document.getElementById('postInput').value;
        const file = document.getElementById('imageUpload').files[0];

        if (!text && !file) {
            showError("Add some content first!");
            return;
        }

        const validation = validateFile(file);
        if (!validation.valid) {
            showError("Unsupported file type. Only JPG, PNG, and WEBP files are allowed.");
            return;
        }

        scanBtn.innerText = "Analyzing Post...";
        scanBtn.disabled = true;

        const formData = new FormData();
        formData.append("caption", text);
        if (file) formData.append("image", file);
        if (threatSwitch && threatSwitch.checked) formData.append("toggleThreat", true);

        try {
            const response = await fetch("/scan", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (resultsArea) 
                resultsArea.classList.remove('hidden');
            if (aiFeedback) 
                aiFeedback.innerText = data.analysis;

        } catch (error) {
            showError(error.message || "An error occurred during scanning");
        } finally {
            scanBtn.innerText = "SCAN YOUR POST";
            scanBtn.disabled = false;
        }
    });
}