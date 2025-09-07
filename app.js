// Import the Google GenAI library
import { GoogleGenAI } from '@google/genai';

// Prompt Engine to create optimized prompts for Gemini
class PromptEngine {
    constructor() {
        this.globalConstraints = `HARD CONSTRAINTS:
1. EXACT character consistency (face, costume, proportions)
2. Professional comic illustration quality
3. Speech bubbles with clear, readable text (no artifacts)
4. Dynamic composition with proper comic framing
5. Maintain visual continuity across panels
6. No watermarks, logos or UI elements`;
    }

    buildCharacterPrompt({ description, stylePreset }) {
        return `SYSTEM ROLE:
You are an expert comic character artist with perfect understanding of character design.

USER CHARACTER DESCRIPTION:
${description}

STYLE PRESET:
${stylePreset || 'Modern Comic'}

TASK:
Transform sketch into a polished full-body character reference.

${this.globalConstraints}

OUTPUT FOCUS:
Character on clean background, full body view, detailed costume elements.`;
    }

    buildPanelPrompt({ panelIndex, panelCount, sceneDescription, storyBeat, stylePreset }) {
        return `SYSTEM ROLE:
You are a professional comic sequential artist with expertise in storytelling.

STORY CONTEXT:
${sceneDescription}

PANEL PROGRESSION:
Panel ${panelIndex+1} of ${panelCount}

CURRENT STORY BEAT:
${storyBeat}

STYLE PRESET:
${stylePreset || 'Modern Comic'}

TASK:
Create this specific panel with perfect character consistency.

${this.globalConstraints}

OUTPUT FOCUS:
Clear storytelling, expressive characters, readable dialogue, dynamic composition.`;
    }
}

class ComicGeniusPro {
    constructor() {
        this.apiKey = localStorage.getItem('apiKey') || '';
        this.characterImage = localStorage.getItem('characterImage') || null;
        this.characterDescription = localStorage.getItem('characterDescription') || '';
        this.stylePreset = localStorage.getItem('stylePreset') || 'Modern Comic';
        this.panels = [];
        this.panelsMetadata = [];
        this.promptEngine = new PromptEngine();
        this.stylePresets = [
            'Modern Comic',
            'Noir',
            'Manga',
            'Golden Age',
            'Digital Art',
            'Cartoon'
        ];
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Restore saved API key to input field
        if (this.apiKey) {
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput) apiKeyInput.value = this.apiKey;
        }
        
        // Restore saved character description
        if (this.characterDescription) {
            const descInput = document.getElementById('characterDescription');
            if (descInput) descInput.value = this.characterDescription;
        }
        
        // Populate style preset dropdown
        this.populateStylePresets();
        
        // Initialize sidebar toggle
        this.initializeSidebar();
    }
    
    initializeSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('sidebar-collapsed');
                document.getElementById('mainContent').classList.toggle('main-expanded');
            });
        }
    }
    
    // Show unified toast notification
    showToast(type, message, duration = 3000) {
        // Remove any existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-4 py-3 rounded-md border shadow-lg z-50 toast-notification opacity-0 transition-opacity duration-300 ${
            type === 'success' ? 'bg-background border-green-500' : 
            type === 'error' ? 'bg-background border-destructive' : 
            type === 'info' ? 'bg-background border-primary' : 
            'bg-background border-muted'
        }`;
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle text-green-500' : 
                    type === 'error' ? 'exclamation-circle text-destructive' : 
                    type === 'info' ? 'info-circle text-primary' : 
                    'bell text-muted-foreground'
                } mr-2"></i>
                <span class="text-foreground">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    }
    
    populateStylePresets() {
        const styleSelect = document.getElementById('stylePreset');
        if (styleSelect) {
            this.stylePresets.forEach(style => {
                const option = document.createElement('option');
                option.value = style;
                option.textContent = style;
                styleSelect.appendChild(option);
            });
            
            // Set the saved style
            styleSelect.value = this.stylePreset;
        }
    }
    
    setupEventListeners() {
        // Button events
        document.getElementById('generateCharacterBtn').addEventListener('click', () => this.generateCharacter());
        document.getElementById('generateComicBtn').addEventListener('click', () => this.generateComic());
        document.getElementById('downloadComicBtn').addEventListener('click', () => this.downloadComic());
        
        // API key input
        document.getElementById('apiKey').addEventListener('change', (e) => {
            this.apiKey = e.target.value;
            localStorage.setItem('apiKey', e.target.value);
        });
        
        // Character description
        document.getElementById('characterDescription').addEventListener('input', (e) => {
            this.characterDescription = e.target.value;
            localStorage.setItem('characterDescription', e.target.value);
        });
        
        // Style preset selector
        const stylePreset = document.getElementById('stylePreset');
        if (stylePreset) {
            stylePreset.addEventListener('change', (e) => {
                this.stylePreset = e.target.value;
                localStorage.setItem('stylePreset', e.target.value);
            });
        }
        
        // Panel count selector
        const panelCount = document.querySelectorAll('.panel-count-btn');
        if (panelCount.length) {
            panelCount.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Remove active class from all buttons
                    panelCount.forEach(b => b.classList.remove('bg-primary', 'text-primary-foreground'));
                    b.classList.add('bg-muted', 'text-muted-foreground');
                    
                    // Add active class to clicked button
                    e.currentTarget.classList.add('bg-primary', 'text-primary-foreground');
                    e.currentTarget.classList.remove('bg-muted', 'text-muted-foreground');
                    
                    // Set panel count in hidden input
                    const count = e.currentTarget.getAttribute('data-count');
                    document.getElementById('panelCount').value = count;
                });
            });
        }
        
        // Add carousel navigation
        const carouselNavLeft = document.querySelector('.carousel-nav-left button');
        const carouselNavRight = document.querySelector('.carousel-nav-right button');
        
        if (carouselNavLeft) {
            carouselNavLeft.addEventListener('click', () => this.navigateCarousel('prev'));
        }
        
        if (carouselNavRight) {
            carouselNavRight.addEventListener('click', () => this.navigateCarousel('next'));
        }
        
        // Add keyboard shortcuts for carousel navigation
        document.addEventListener('keydown', (e) => {
            // Only respond if comic display is visible
            const comicDisplay = document.getElementById('comicDisplay');
            if (comicDisplay && !comicDisplay.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') this.navigateCarousel('prev');
                if (e.key === 'ArrowRight') this.navigateCarousel('next');
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only respond if not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'g' || e.key === 'G') this.generateCharacter();
            if (e.key === 'c' || e.key === 'C') this.generateComic();
        });
    }
    
    navigateCarousel(direction) {
        const comicPanels = document.getElementById('comicPanels');
        if (!comicPanels) return;
        
        const scrollAmount = comicPanels.clientWidth * 0.8;
        const scrollPosition = direction === 'prev' ? 
            comicPanels.scrollLeft - scrollAmount : 
            comicPanels.scrollLeft + scrollAmount;
        
        comicPanels.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        
        // Update carousel indicators
        this.updateCarouselIndicators();
    }
    
    updateCarouselIndicators() {
        const indicators = document.querySelector('.carousel-indicators');
        const comicPanels = document.getElementById('comicPanels');
        
        if (!indicators || !comicPanels || this.panels.length === 0) return;
        
        // Calculate which panel is most visible
        const scrollPosition = comicPanels.scrollLeft;
        const panelWidth = comicPanels.scrollWidth / this.panels.length;
        const currentPanelIndex = Math.round(scrollPosition / panelWidth);
        
        // Update indicators
        indicators.innerHTML = '';
        this.panels.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `w-2 h-2 rounded-full mx-1 ${
                index === currentPanelIndex ? 'bg-primary' : 'bg-muted'
            }`;
            indicators.appendChild(indicator);
        });
    }
    
    async generateCharacter() {
        if (!this.apiKey) {
            this.showToast('error', 'Please enter your Gemini API key first!');
            return;
        }
        
        if (!this.characterDescription) {
            this.showToast('error', 'Please describe your character first!');
            return;
        }
        
        // Disable the generate button
        const generateBtn = document.getElementById('generateCharacterBtn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i>Generating...';
        }
        
        this.showLoading(true);
        
        try {
            // Initialize the Gemini API client
            const genai = new GoogleGenAI({ apiKey: this.apiKey });
            
            // Use the prompt engine to build an optimized prompt
            const prompt = this.promptEngine.buildCharacterPrompt({
                description: this.characterDescription,
                stylePreset: this.stylePreset
            });
            
            // Generate content using Gemini (text-to-image mode)
            const response = await genai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            });
            
            // Extract the generated image
            const imageData = this.extractImageData(response);
            if (imageData) {
                this.characterImage = `data:image/png;base64,${imageData}`;
                
                // Save to localStorage for persistence
                localStorage.setItem('characterImage', this.characterImage);
                
                // Display the character image in the character display area
                const characterDisplay = document.getElementById('characterDisplay');
                if (characterDisplay) {
                    characterDisplay.classList.remove('hidden');
                    characterDisplay.innerHTML = `
                        <div class="bg-card rounded-lg border shadow-sm p-6">
                            <h3 class="text-xl font-semibold mb-3">Generated Character</h3>
                            <div class="bg-background p-2 rounded-md">
                                <img src="${this.characterImage}" alt="Generated Character" class="w-full h-auto rounded-md shadow">
                            </div>
                            <div class="mt-4 flex justify-between">
                                <button id="regenerateBtn" class="bg-primary/90 hover:bg-primary text-primary-foreground text-sm py-2 px-4 rounded flex items-center">
                                    <i class="fas fa-sync-alt mr-2"></i>Regenerate
                                </button>
                                <button id="useCharacterBtn" class="bg-accent hover:bg-accent/90 text-accent-foreground text-sm py-2 px-4 rounded flex items-center">
                                    <i class="fas fa-arrow-right mr-2"></i>Use for Comic
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // Add regenerate button listener
                    document.getElementById('regenerateBtn')?.addEventListener('click', () => this.generateCharacter());
                    
                    // Add use character for comic button listener
                    document.getElementById('useCharacterBtn')?.addEventListener('click', () => {
                        document.getElementById('comicCreationSection').scrollIntoView({ behavior: 'smooth' });
                        // Focus on the scene description textarea
                        document.getElementById('sceneDescription')?.focus();
                    });
                }
                
                // Show success notification
                this.showToast('success', 'Character generated successfully!');
                
                // Scroll to character display
                characterDisplay.scrollIntoView({ behavior: 'smooth' });
            } else {
                throw new Error('Failed to generate character image');
            }
        } catch (error) {
            console.error('Error generating character:', error);
            this.showToast('error', `Error: ${error.message || 'Failed to generate character'}`);
        } finally {
            this.showLoading(false);
            
            // Re-enable the generate button
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Character';
            }
        }
    }
    
    async generateComic() {
        if (!this.apiKey) {
            this.showToast('error', 'Please enter your Gemini API key first!');
            return;
        }
        
        if (!this.characterImage) {
            this.showToast('error', 'Please generate a character first!');
            return;
        }
        
        const sceneDescription = document.getElementById('sceneDescription').value;
        if (!sceneDescription) {
            this.showToast('error', 'Please describe the scene for your comic!');
            return;
        }
        
        // Save scene description to localStorage
        localStorage.setItem('sceneDescription', sceneDescription);
        
        // Get panel count from the currently selected button or input
        let panelCount = 4; // Default
        
        // Check if we have a hidden input with the panel count
        const panelCountInput = document.getElementById('panelCount');
        if (panelCountInput && panelCountInput.value) {
            panelCount = parseInt(panelCountInput.value);
        } else {
            // Try to get from active button
            const activeButton = document.querySelector('.panel-count-btn.bg-primary');
            if (activeButton) {
                panelCount = parseInt(activeButton.getAttribute('data-count') || '4');
            }
        }
        
        // Save panel count to localStorage
        localStorage.setItem('panelCount', panelCount.toString());
        
        // Disable the generate button
        const generateBtn = document.getElementById('generateComicBtn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i>Generating...';
        }
        
        this.showLoading(true);
        
        try {
            // Initialize the Gemini API client
            const genai = new GoogleGenAI({ apiKey: this.apiKey });
            
            // Clear previous panels
            this.panels = [];
            this.panelsMetadata = [];
            
            // Use the original character reference for all panels to maintain consistency
            const characterReference = this.characterImage;
            
            // Show progress in the loading indicator
            const progressBar = document.getElementById('generationProgress');
            if (progressBar) progressBar.style.width = '0%';
            
            // Generate panels one by one to maintain character consistency
            for (let i = 0; i < panelCount; i++) {
                // Update progress indicator
                if (progressBar) {
                    const progress = Math.round((i / panelCount) * 100);
                    progressBar.style.width = `${progress}%`;
                }
                
                // Update loading text
                const loadingText = document.getElementById('loadingText');
                if (loadingText) {
                    loadingText.textContent = `Generating panel ${i+1} of ${panelCount}...`;
                }
                
                // Create a more detailed sequential narrative
                const storyBeat = this.getSequentialStoryBeat(i, panelCount);
                
                // Use the prompt engine to build an optimized prompt
                const panelPrompt = this.promptEngine.buildPanelPrompt({
                    panelIndex: i,
                    panelCount,
                    sceneDescription,
                    storyBeat,
                    stylePreset: this.stylePreset
                });
                
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
                    
                    // Store metadata for this panel
                    this.panelsMetadata.push({
                        storyBeat,
                        index: i,
                        altText: `Comic panel ${i+1}: ${storyBeat.split(':')[0]}`
                    });
                } else {
                    throw new Error(`Failed to generate panel ${i+1}`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Complete the progress bar
            if (progressBar) progressBar.style.width = '100%';
            
            // Display the comic panels
            this.displayComic();
            this.showToast('success', 'Comic strip generated successfully!');
        } catch (error) {
            console.error('Error generating comic:', error);
            this.showToast('error', `Error: ${error.message || 'Failed to generate comic'}`);
        } finally {
            this.showLoading(false);
            
            // Re-enable the generate button
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-book-open mr-2"></i>Generate Comic';
            }
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
        const carouselIndicators = document.querySelector('.carousel-indicators');
        
        // Clear previous panels
        comicPanels.innerHTML = '';
        
        // Add each panel to the display with better styling and click functionality
        this.panels.forEach((panel, index) => {
            const metadata = this.panelsMetadata[index] || {};
            const storyBeat = metadata.storyBeat || this.getSequentialStoryBeat(index, this.panels.length);
            const altText = metadata.altText || `Comic Panel ${index + 1}`;
            
            const panelElement = document.createElement('div');
            panelElement.className = 'min-w-[280px] bg-card rounded-lg border shadow-sm overflow-hidden transition duration-300 hover:shadow-md relative group';
            panelElement.innerHTML = `
                <div class="p-3 bg-muted/30 border-b flex items-center justify-between">
                    <h3 class="text-lg font-medium">Panel ${index + 1}</h3>
                    <div class="opacity-0 group-hover:opacity-100 transition duration-300">
                        <button class="regenerate-panel-btn bg-primary/80 hover:bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center" 
                                data-index="${index}" 
                                title="Regenerate this panel">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="p-3 cursor-pointer panel-image-container">
                    <div class="bg-background p-1 rounded-md">
                        <img src="${panel}" alt="${altText}" class="w-full h-auto comic-panel-image rounded">
                    </div>
                    <div class="mt-2 text-xs text-muted-foreground">
                        ${storyBeat.split(':')[0]}
                    </div>
                </div>
            `;
            
            comicPanels.appendChild(panelElement);
            
            // Add click event to open popup (only to the image container)
            const imageContainer = panelElement.querySelector('.panel-image-container');
            imageContainer.addEventListener('click', () => {
                this.openImagePopup(panel, `Comic Panel ${index + 1} - ${storyBeat.split(':')[0]}`);
            });
            
            // Add regenerate button event
            const regenerateBtn = panelElement.querySelector('.regenerate-panel-btn');
            regenerateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.regeneratePanel(index);
            });
        });
        
        // Create carousel indicators
        if (carouselIndicators) {
            carouselIndicators.innerHTML = '';
            this.panels.forEach((_, index) => {
                const indicator = document.createElement('div');
                indicator.className = `w-2 h-2 rounded-full mx-1 ${
                    index === 0 ? 'bg-primary' : 'bg-muted'
                }`;
                carouselIndicators.appendChild(indicator);
            });
        }
        
        // Show the comic display
        comicDisplay.classList.remove('hidden');
        
        // Scroll to the comic display
        comicDisplay.scrollIntoView({ behavior: 'smooth' });
    }
    
    async regeneratePanel(index) {
        if (!this.apiKey || !this.characterImage) {
            this.showToast('error', 'Missing API key or character reference');
            return;
        }
        
        // Get the panel element to show loading state
        const panelsContainer = document.getElementById('comicPanels');
        const panelElements = panelsContainer.querySelectorAll('.min-w-\\[280px\\]');
        
        if (index >= panelElements.length) return;
        
        const panelElement = panelElements[index];
        const imageContainer = panelElement.querySelector('.panel-image-container');
        
        // Show loading state
        imageContainer.innerHTML = `
            <div class="flex items-center justify-center p-10 bg-background rounded-md">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
        `;
        
        try {
            // Initialize the Gemini API client
            const genai = new GoogleGenAI({ apiKey: this.apiKey });
            
            const sceneDescription = document.getElementById('sceneDescription').value;
            const panelCount = this.panels.length;
            
            // Create a more detailed sequential narrative
            const storyBeat = this.getSequentialStoryBeat(index, panelCount);
            
            // Use the prompt engine to build an optimized prompt
            const panelPrompt = this.promptEngine.buildPanelPrompt({
                panelIndex: index,
                panelCount,
                sceneDescription,
                storyBeat,
                stylePreset: this.stylePreset
            });
            
            // Get character image as base64 (without data URL prefix)
            const base64Data = this.characterImage.split(',')[1];
            
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
                
                // Update the panel in our array
                this.panels[index] = panelImage;
                
                // Update metadata
                this.panelsMetadata[index] = {
                    storyBeat,
                    index,
                    altText: `Comic panel ${index+1}: ${storyBeat.split(':')[0]}`
                };
                
                // Update the display
                imageContainer.innerHTML = `
                    <div class="bg-background p-1 rounded-md">
                        <img src="${panelImage}" alt="${this.panelsMetadata[index].altText}" class="w-full h-auto comic-panel-image rounded">
                    </div>
                    <div class="mt-2 text-xs text-muted-foreground">
                        ${storyBeat.split(':')[0]}
                    </div>
                `;
                
                this.showToast('success', `Panel ${index + 1} regenerated!`);
            } else {
                throw new Error(`Failed to regenerate panel ${index+1}`);
            }
        } catch (error) {
            console.error(`Error regenerating panel ${index+1}:`, error);
            this.showToast('error', `Failed to regenerate panel ${index+1}`);
            
            // Restore the previous panel
            if (this.panels[index]) {
                const metadata = this.panelsMetadata[index] || {};
                const storyBeat = metadata.storyBeat || this.getSequentialStoryBeat(index, this.panels.length);
                
                imageContainer.innerHTML = `
                    <div class="bg-background p-1 rounded-md">
                        <img src="${this.panels[index]}" alt="Comic Panel ${index + 1}" class="w-full h-auto comic-panel-image rounded">
                    </div>
                    <div class="mt-2 text-xs text-muted-foreground">
                        ${storyBeat.split(':')[0]}
                    </div>
                `;
            }
        }
    }
    
    openImagePopup(imageSrc, title) {
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm';
        overlay.id = 'image-popup-overlay';
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'relative max-w-4xl max-h-full bg-card border rounded-lg overflow-hidden shadow-lg';
        
        // Add title
        const titleElement = document.createElement('div');
        titleElement.className = 'p-4 bg-muted/50 border-b text-xl font-medium';
        titleElement.textContent = title;
        
        // Add image
        const imgElement = document.createElement('img');
        imgElement.src = imageSrc;
        imgElement.className = 'max-w-full max-h-[80vh] object-contain p-4 bg-background';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'absolute top-3 right-3 bg-background/80 border text-foreground rounded-full p-2 hover:bg-background';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // Add download button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'absolute top-3 right-12 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90';
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
        
        // Add keyboard navigation
        const panelIndex = parseInt(title.match(/Panel (\d+)/)?.[1] || '0') - 1;
        
        // Add navigation buttons if we have more than one panel
        if (this.panels.length > 1) {
            // Previous button
            if (panelIndex > 0) {
                const prevButton = document.createElement('button');
                prevButton.className = 'absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 border text-foreground rounded-full p-3 hover:bg-background';
                prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.body.removeChild(overlay);
                    
                    // Get previous panel
                    const prevIndex = panelIndex - 1;
                    const prevPanel = this.panels[prevIndex];
                    const prevMetadata = this.panelsMetadata[prevIndex];
                    const prevTitle = `Comic Panel ${prevIndex + 1} - ${prevMetadata.storyBeat.split(':')[0]}`;
                    
                    // Open previous panel
                    this.openImagePopup(prevPanel, prevTitle);
                });
                popupContent.appendChild(prevButton);
            }
            
            // Next button
            if (panelIndex < this.panels.length - 1) {
                const nextButton = document.createElement('button');
                nextButton.className = 'absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 border text-foreground rounded-full p-3 hover:bg-background';
                nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.body.removeChild(overlay);
                    
                    // Get next panel
                    const nextIndex = panelIndex + 1;
                    const nextPanel = this.panels[nextIndex];
                    const nextMetadata = this.panelsMetadata[nextIndex];
                    const nextTitle = `Comic Panel ${nextIndex + 1} - ${nextMetadata.storyBeat.split(':')[0]}`;
                    
                    // Open next panel
                    this.openImagePopup(nextPanel, nextTitle);
                });
                popupContent.appendChild(nextButton);
            }
        }
        
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
        
        // Add keyboard navigation
        overlay.tabIndex = 0;
        overlay.focus();
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
            } else if (e.key === 'ArrowLeft' && panelIndex > 0) {
                document.body.removeChild(overlay);
                
                // Get previous panel
                const prevIndex = panelIndex - 1;
                const prevPanel = this.panels[prevIndex];
                const prevMetadata = this.panelsMetadata[prevIndex];
                const prevTitle = `Comic Panel ${prevIndex + 1} - ${prevMetadata.storyBeat.split(':')[0]}`;
                
                // Open previous panel
                this.openImagePopup(prevPanel, prevTitle);
            } else if (e.key === 'ArrowRight' && panelIndex < this.panels.length - 1) {
                document.body.removeChild(overlay);
                
                // Get next panel
                const nextIndex = panelIndex + 1;
                const nextPanel = this.panels[nextIndex];
                const nextMetadata = this.panelsMetadata[nextIndex];
                const nextTitle = `Comic Panel ${nextIndex + 1} - ${nextMetadata.storyBeat.split(':')[0]}`;
                
                // Open next panel
                this.openImagePopup(nextPanel, nextTitle);
            }
        });
        
        // Add to document
        document.body.appendChild(overlay);
    }
    
    downloadComic() {
        if (this.panels.length === 0) {
            this.showToast('error', 'No comic to download!');
            return;
        }
        
        // Show download starting toast
        this.showToast('info', 'Preparing download...');
        
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
        
        // Add metadata file with character description and style
        const metadata = {
            characterDescription: this.characterDescription,
            stylePreset: this.stylePreset,
            panelCount: this.panels.length,
            generatedDate: new Date().toISOString(),
            storyBeats: this.panelsMetadata.map(m => m.storyBeat)
        };
        
        zip.file('comic-metadata.json', JSON.stringify(metadata, null, 2));
        
        // Generate and download zip
        zip.generateAsync({type:"blob"}).then((content) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'comic-strip.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('success', 'Comic downloaded successfully!');
        }).catch(error => {
            console.error('Error creating zip:', error);
            this.showToast('error', 'Failed to download comic');
        });
    }
    
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (!loadingIndicator) return;
        
        if (show) {
            loadingIndicator.classList.remove('hidden');
            
            // Reset progress bar
            const progressBar = document.getElementById('generationProgress');
            if (progressBar) {
                progressBar.style.width = '0%';
                progressBar.style.transition = 'width 0.5s ease';
            }
            
            // Reset loading text
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = 'Preparing your creation...';
            }
            
            // Disable interactive elements
            document.querySelectorAll('button:not(.close-button)').forEach(button => {
                button.disabled = true;
                if (!button.classList.contains('carousel-nav-btn')) {
                    button.classList.add('opacity-50', 'cursor-not-allowed');
                }
            });
            
            // Disable inputs
            document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
                input.disabled = true;
                input.classList.add('opacity-50', 'cursor-not-allowed');
            });
        } else {
            loadingIndicator.classList.add('hidden');
            
            // Re-enable interactive elements
            document.querySelectorAll('button').forEach(button => {
                button.disabled = false;
                button.classList.remove('opacity-50', 'cursor-not-allowed');
            });
            
            // Re-enable inputs
            document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
                input.disabled = false;
                input.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ComicGeniusPro();
});