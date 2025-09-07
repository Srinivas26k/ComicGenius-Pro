// Import the Google GenAI library
import { GoogleGenAI } from '@google/genai';

class ComicGeniusPro {
    constructor() {
        this.apiKey = '';
        this.characterImage = null;
        this.characterDescription = '';
        this.panels = [];
        this.isDrawing = false;
        this.isDrawingMode = true; // Toggle between drawing and erasing
        
        // Canvas elements
        this.canvas = document.getElementById('characterCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize canvas
        this.initializeCanvas();
    }
    
    setupEventListeners() {
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Button events
        document.getElementById('drawCharacterBtn').addEventListener('click', () => this.saveCharacterSketch());
        document.getElementById('generateCharacterBtn').addEventListener('click', () => this.generateCharacter());
        document.getElementById('clearCharacterBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('generateComicBtn').addEventListener('click', () => this.generateComic());
        document.getElementById('downloadComicBtn').addEventListener('click', () => this.downloadComic());
        
        // API key input
        document.getElementById('apiKey').addEventListener('change', (e) => {
            this.apiKey = e.target.value;
        });
        
        // Character description
        document.getElementById('characterDescription').addEventListener('input', (e) => {
            this.characterDescription = e.target.value;
        });
    }
    
    initializeCanvas() {
        // Fill canvas with white background
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add canvas border
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.isDrawingMode ? '#000000' : '#FFFFFF';
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.initializeCanvas();
        this.characterImage = null;
    }
    
    saveCharacterSketch() {
        // Get canvas data as base64
        const imageData = this.canvas.toDataURL('image/png');
        this.characterImage = imageData;
        
        // Show confirmation
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
        notification.textContent = 'Character sketch saved!';
        document.body.appendChild(notification);
        
        // Remove notification after 2 seconds
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }
    
    async generateCharacter() {
        if (!this.apiKey) {
            alert('Please enter your Gemini API key first!');
            return;
        }
        
        if (!this.characterDescription) {
            alert('Please describe your character first!');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Initialize the Gemini API client
            const genai = new GoogleGenAI({ apiKey: this.apiKey });
            
            // Create prompt for character generation
            const prompt = `Create a professional comic book character based on this sketch and description. 
            Description: ${this.characterDescription}
            Style: Comic book character design, clean lines, professional coloring, superhero style
            Requirements:
            1. Maintain the same character design style and facial features consistent
            2. Create a full-body view of the character
            3. Include detailed costume and accessories as described
            4. Professional comic book art quality
            5. White background for clarity`;
            
            // Get canvas data as base64 (without data URL prefix)
            const base64Data = this.canvas.toDataURL('image/png').split(',')[1];
            
            // Generate content using Gemini
            const response = await genai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: 'image/png'
                                }
                            }
                        ]
                    }
                ]
            });
            
            // Extract the generated image
            const imageData = this.extractImageData(response);
            if (imageData) {
                this.characterImage = `data:image/png;base64,${imageData}`;
                
                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg';
                notification.textContent = 'Character generated successfully!';
                document.body.appendChild(notification);
                
                // Remove notification after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 2000);
            } else {
                throw new Error('Failed to generate character image');
            }
        } catch (error) {
            console.error('Error generating character:', error);
            alert(`Error: ${error.message || 'Failed to generate character'}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    async generateComic() {
        if (!this.apiKey) {
            alert('Please enter your Gemini API key first!');
            return;
        }
        
        if (!this.characterImage) {
            alert('Please create or generate a character first!');
            return;
        }
        
        const sceneDescription = document.getElementById('sceneDescription').value;
        if (!sceneDescription) {
            alert('Please describe the scene for your comic!');
            return;
        }
        
        const panelCount = parseInt(document.getElementById('panelCount').value);
        this.showLoading(true);
        
        try {
            // Initialize the Gemini API client
            const genai = new GoogleGenAI({ apiKey: this.apiKey });
            
            // Clear previous panels
            this.panels = [];
            
            // Store the character reference for consistency
            let characterReference = this.characterImage;
            
            // Generate panels one by one to maintain character consistency
            for (let i = 0; i < panelCount; i++) {
                const panelPrompt = `Create comic panel ${i+1} of ${panelCount} for this scene: ${sceneDescription}
                CRITICAL: Maintain EXACT character consistency with the provided reference image.
                Style: Comic book panel, professional illustration, clear storytelling, vibrant colors
                Requirements:
                1. Keep the character's facial features, costume, and appearance IDENTICAL to the reference
                2. Create appropriate panel composition for storytelling
                3. Add 1-2 speech bubbles with relevant dialogue
                4. Include detailed background elements that match the scene description
                5. Professional comic book art quality with dynamic poses and expressions
                
                Panel ${i+1} narrative focus: ${this.getPanelDescription(i, panelCount, sceneDescription)}
                
                Scene context: ${sceneDescription}`;
                
                // Get character image as base64 (without data URL prefix)
                const base64Data = characterReference.split(',')[1];
                
                // Generate content using Gemini
                const response = await genai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: panelPrompt },
                                {
                                    inlineData: {
                                        data: base64Data,
                                        mimeType: 'image/png'
                                    }
                                }
                            ]
                        }
                    ]
                });
                
                // Extract the generated image
                const imageData = this.extractImageData(response);
                if (imageData) {
                    const panelImage = `data:image/png;base64,${imageData}`;
                    this.panels.push(panelImage);
                    
                    // Use this panel as the new character reference for better consistency
                    characterReference = panelImage;
                } else {
                    throw new Error(`Failed to generate panel ${i+1}`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Display the comic panels
            this.displayComic();
        } catch (error) {
            console.error('Error generating comic:', error);
            alert(`Error: ${error.message || 'Failed to generate comic'}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    getPanelDescription(panelIndex, panelCount, sceneDescription) {
        // Provide specific descriptions for each panel to create a narrative flow
        const descriptions = [
            "Establishing shot of the scene with the main character, wide angle view",
            "Close-up of the character's expression or important action detail",
            "Dynamic action shot showing the key moment or conflict",
            "Resolution or aftermath of the scene, showing consequences or next steps"
        ];
        
        if (panelIndex < descriptions.length) {
            return descriptions[panelIndex];
        }
        
        return "Continue the story with appropriate panel composition";
    }
    
    extractImageData(response) {
        try {
            if (response.candidates && response.candidates[0] && 
                response.candidates[0].content && response.candidates[0].content.parts) {
                
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return part.inlineData.data;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error extracting image data:', error);
            return null;
        }
    }
    
    displayComic() {
        const comicDisplay = document.getElementById('comicDisplay');
        const comicPanels = document.getElementById('comicPanels');
        
        // Clear previous panels
        comicPanels.innerHTML = '';
        
        // Add each panel to the display
        this.panels.forEach((panel, index) => {
            const panelElement = document.createElement('div');
            panelElement.className = 'bg-white rounded-lg shadow-md overflow-hidden';
            panelElement.innerHTML = `
                <img src="${panel}" alt="Comic Panel ${index + 1}" class="w-full h-auto">
                <div class="p-2 text-center font-bold text-gray-700">Panel ${index + 1}</div>
            `;
            comicPanels.appendChild(panelElement);
        });
        
        // Show the comic display
        comicDisplay.classList.remove('hidden');
        
        // Scroll to the comic display
        comicDisplay.scrollIntoView({ behavior: 'smooth' });
    }
    
    downloadComic() {
        if (this.panels.length === 0) {
            alert('No comic to download!');
            return;
        }
        
        // Create a zip file with all panels
        const zip = new JSZip();
        
        // Add each panel to the zip
        this.panels.forEach((panel, index) => {
            // Convert data URL to blob
            const byteString = atob(panel.split(',')[1]);
            const mimeString = panel.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], {type: mimeString});
            
            // Add to zip
            zip.file(`panel-${index + 1}.png`, blob);
        });
        
        // Generate and download zip
        zip.generateAsync({type:"blob"}).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'comic-strip.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
    
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ComicGeniusPro();
});