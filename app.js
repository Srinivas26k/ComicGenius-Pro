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
                
                // Display the character image next to the canvas
                const characterDisplay = document.getElementById('characterDisplay');
                if (characterDisplay) {
                    characterDisplay.innerHTML = `
                        <div class="mt-4">
                            <h3 class="text-lg font-semibold mb-2">Generated Character</h3>
                            <img src="${this.characterImage}" alt="Generated Character" class="max-w-full h-auto border rounded-lg shadow">
                        </div>
                    `;
                }
                
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
            
            // Use the original character reference for all panels to maintain consistency
            const characterReference = this.characterImage;
            
            // Generate panels one by one to maintain character consistency
            for (let i = 0; i < panelCount; i++) {
                // Create a more detailed sequential narrative
                const storyBeat = this.getSequentialStoryBeat(i, panelCount);
                
                const panelPrompt = `Create comic panel ${i+1} of ${panelCount} for this sequential story.
                Story context: ${sceneDescription}
                Current story beat: ${storyBeat}
                
                CRITICAL REQUIREMENTS:
                1. Maintain EXACT character consistency with the provided reference image
                2. Create a clear narrative progression from previous panels
                3. Match the visual style to previous panels for continuity
                4. Include 1-2 speech bubbles with relevant dialogue that advances the story
                5. Focus on the specific story beat for this panel
                
                Visual Style: Comic book panel, professional illustration, clear storytelling, vibrant colors
                Character Requirements:
                - Keep facial features, costume, and appearance IDENTICAL to the reference
                - Show appropriate emotions and actions for this story beat
                Background Requirements:
                - Create detailed background elements that match the story context
                - Ensure backgrounds are consistent with previous panels where appropriate`;
                
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
    
    getSequentialStoryBeat(panelIndex, panelCount) {
        // Provide specific story beats for each panel to create a narrative flow
        const storyBeats = [
            "INTRODUCTION: Establish the setting and introduce the main character in their normal environment",
            "INCITING INCIDENT: Something disrupts the character's normal world - a discovery, threat, or opportunity",
            "RISING ACTION: Character reacts to the incident and begins to take action",
            "CLIMAX: The key confrontation or moment of highest tension in the story",
            "FALLING ACTION: The immediate aftermath of the climax",
            "RESOLUTION: How the story concludes and what it means for the character"
        ];
        
        // For 3-4 panels, we'll focus on the key beats
        if (panelCount <= 4) {
            const keyBeats = [
                storyBeats[0], // Introduction
                storyBeats[1], // Inciting incident
                storyBeats[3], // Climax
                storyBeats[5]  // Resolution
            ];
            
            if (panelIndex < keyBeats.length) {
                return keyBeats[panelIndex];
            }
        }
        
        // For more panels, use the full sequence
        if (panelIndex < storyBeats.length) {
            return storyBeats[panelIndex];
        }
        
        return "Continue the story with appropriate narrative progression";
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
        
        // Add each panel to the display with better styling and click functionality
        this.panels.forEach((panel, index) => {
            const panelElement = document.createElement('div');
            panelElement.className = 'bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105';
            panelElement.innerHTML = `
                <div class="p-4 bg-gray-50 border-b">
                    <h3 class="text-lg font-semibold text-gray-800">Panel ${index + 1}</h3>
                </div>
                <div class="p-2">
                    <img src="${panel}" alt="Comic Panel ${index + 1}" class="w-full h-auto comic-panel-image">
                </div>
            `;
            
            // Add click event to open popup
            panelElement.addEventListener('click', () => {
                this.openImagePopup(panel, `Comic Panel ${index + 1}`);
            });
            
            comicPanels.appendChild(panelElement);
        });
        
        // Show the comic display
        comicDisplay.classList.remove('hidden');
        
        // Scroll to the comic display
        comicDisplay.scrollIntoView({ behavior: 'smooth' });
    }
    
    openImagePopup(imageSrc, title) {
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
        overlay.id = 'image-popup-overlay';
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden shadow-2xl';
        
        // Add title
        const titleElement = document.createElement('div');
        titleElement.className = 'p-4 bg-gray-800 text-white text-xl font-bold';
        titleElement.textContent = title;
        
        // Add image
        const imgElement = document.createElement('img');
        imgElement.src = imageSrc;
        imgElement.className = 'max-w-full max-h-[80vh] object-contain';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // Add download button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'absolute top-2 right-12 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700';
        downloadButton.innerHTML = '<i class="fas fa-download"></i>';
        downloadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const link = document.createElement('a');
            link.href = imageSrc;
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        
        // Assemble popup
        popupContent.appendChild(titleElement);
        popupContent.appendChild(imgElement);
        popupContent.appendChild(closeButton);
        popupContent.appendChild(downloadButton);
        overlay.appendChild(popupContent);
        
        // Add click to close functionality
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
        
        // Add to document
        document.body.appendChild(overlay);
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