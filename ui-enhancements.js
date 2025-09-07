// Enhanced UI interactions for ComicGenius Pro
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button:not(.carousel-nav-btn)');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.classList.add('transform', 'scale-105', 'transition', 'duration-200');
        });
        button.addEventListener('mouseleave', () => {
            button.classList.remove('transform', 'scale-105');
        });
    });
    
    // Add character counter to textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', () => {
            // Create character counter if it doesn't exist
            let counter = textarea.nextElementSibling;
            if (!counter || !counter.classList.contains('char-counter')) {
                counter = document.createElement('div');
                counter.className = 'char-counter text-xs text-muted-foreground mt-1 text-right';
                textarea.parentNode.insertBefore(counter, textarea.nextSibling);
            }
            
            // Update character count
            const maxLength = textarea.getAttribute('maxlength') || 500;
            counter.textContent = `${textarea.value.length}/${maxLength}`;
            
            // Add warning color when approaching limit
            if (textarea.value.length > maxLength * 0.9) {
                counter.classList.add('text-amber-500');
                counter.classList.remove('text-muted-foreground');
            } else {
                counter.classList.remove('text-amber-500');
                counter.classList.add('text-muted-foreground');
            }
        });
        
        // Trigger input event to initialize counters
        textarea.dispatchEvent(new Event('input'));
    });
    
    // Add tooltip functionality to all elements with data-tooltip
    document.querySelectorAll('[data-tooltip]').forEach(addTooltipToElement);
    
    // Add tooltip to all buttons that don't have one yet
    document.querySelectorAll('button:not([data-tooltip])').forEach(button => {
        // Skip buttons that already have tooltips or don't need them
        if (button.classList.contains('close-button') || button.classList.contains('carousel-nav-btn')) return;
        
        // Add tooltips based on button ID
        if (button.id === 'generateCharacterBtn') {
            button.setAttribute('data-tooltip', 'Generate a professional character from your description (G)');
        } else if (button.id === 'generateComicBtn') {
            button.setAttribute('data-tooltip', 'Generate a comic strip with your character (C)');
        } else if (button.id === 'downloadComicBtn') {
            button.setAttribute('data-tooltip', 'Download all panels as a ZIP file');
        } else if (button.id === 'sidebarToggle') {
            button.setAttribute('data-tooltip', 'Toggle sidebar');
        } else if (button.id === 'regenerateBtn') {
            button.setAttribute('data-tooltip', 'Regenerate character');
        } else if (button.id === 'useCharacterBtn') {
            button.setAttribute('data-tooltip', 'Proceed to comic creation');
        }
        
        addTooltipToElement(button);
    });
    
    // Setup panel count buttons
    setupPanelCountButtons();
    
    // Setup carousel functionality
    setupCarouselNavigation();
    
    // Toggle API key visibility
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyToggle = document.querySelector('.eye-icon');
    
    if (apiKeyInput && apiKeyToggle) {
        apiKeyToggle.addEventListener('click', () => {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                apiKeyToggle.classList.remove('fa-eye-slash');
                apiKeyToggle.classList.add('fa-eye');
            } else {
                apiKeyInput.type = 'password';
                apiKeyToggle.classList.remove('fa-eye');
                apiKeyToggle.classList.add('fa-eye-slash');
            }
        });
    }
    
    // Add keypress interactions
    document.addEventListener('keydown', handleKeypress);
    
    // Initialize theme 
    function initializeTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        
        // Setup theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Update icon based on current theme
            updateThemeIcon(savedTheme);
            
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.contains('dark');
                document.documentElement.classList.toggle('dark', !isDark);
                localStorage.setItem('theme', isDark ? 'light' : 'dark');
                updateThemeIcon(isDark ? 'light' : 'dark');
            });
        }
    }
    
    // Update theme toggle icon
    function updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            if (theme === 'dark') {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                themeToggle.setAttribute('data-tooltip', 'Switch to light mode');
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                themeToggle.setAttribute('data-tooltip', 'Switch to dark mode');
            }
        }
    }
    
    // Setup panel count buttons
    function setupPanelCountButtons() {
        const panelCountButtons = document.querySelectorAll('.panel-count-btn');
        
        if (panelCountButtons.length) {
            // Set the saved panel count if available
            const savedCount = localStorage.getItem('panelCount');
            if (savedCount) {
                document.getElementById('panelCount').value = savedCount;
                
                // Activate the correct button
                panelCountButtons.forEach(btn => {
                    if (btn.getAttribute('data-count') === savedCount) {
                        btn.classList.remove('bg-muted', 'text-muted-foreground');
                        btn.classList.add('bg-primary', 'text-primary-foreground');
                    } else {
                        btn.classList.add('bg-muted', 'text-muted-foreground');
                        btn.classList.remove('bg-primary', 'text-primary-foreground');
                    }
                });
            } else {
                // Default to first button if no saved count
                panelCountButtons[0].classList.remove('bg-muted', 'text-muted-foreground');
                panelCountButtons[0].classList.add('bg-primary', 'text-primary-foreground');
                document.getElementById('panelCount').value = panelCountButtons[0].getAttribute('data-count');
            }
        }
    }
    
    // Setup carousel navigation
    function setupCarouselNavigation() {
        const carouselContent = document.querySelector('.carousel-content');
        
        if (carouselContent) {
            // Add mouse wheel horizontal scroll
            carouselContent.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    carouselContent.scrollLeft += e.deltaY;
                    updateCarouselIndicators();
                }
            });
            
            // Add scroll event to update indicators
            carouselContent.addEventListener('scroll', () => {
                updateCarouselIndicators();
            });
        }
    }
    
    // Update carousel indicators
    function updateCarouselIndicators() {
        const indicators = document.querySelector('.carousel-indicators');
        const content = document.querySelector('.carousel-content');
        
        if (!indicators || !content) return;
        
        // Get total panels
        const totalPanels = content.children.length;
        if (totalPanels === 0) return;
        
        // Calculate which panel is most visible
        const scrollPosition = content.scrollLeft;
        const panelWidth = content.scrollWidth / totalPanels;
        const currentPanelIndex = Math.round(scrollPosition / panelWidth);
        
        // Update indicators
        const indicatorElements = indicators.querySelectorAll('div');
        indicatorElements.forEach((indicator, index) => {
            if (index === currentPanelIndex) {
                indicator.classList.add('bg-primary');
                indicator.classList.remove('bg-muted');
            } else {
                indicator.classList.remove('bg-primary');
                indicator.classList.add('bg-muted');
            }
        });
    }
    
    // Function to add tooltip to an element
    function addTooltipToElement(element) {
        element.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.getAttribute('data-tooltip');
            if (!tooltipText) return;
            
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'absolute bg-popover text-popover-foreground text-xs rounded py-1 px-2 border shadow-sm z-50';
            tooltipElement.textContent = tooltipText;
            tooltipElement.id = 'dynamic-tooltip';
            document.body.appendChild(tooltipElement);
            
            const rect = e.target.getBoundingClientRect();
            tooltipElement.style.left = rect.left + 'px';
            tooltipElement.style.top = (rect.top - 30) + 'px';
        });
        
        element.addEventListener('mouseleave', () => {
            const tooltipElement = document.getElementById('dynamic-tooltip');
            if (tooltipElement) {
                tooltipElement.remove();
            }
        });
    }
    
    // Function to handle keypresses for shortcuts
    function handleKeypress(e) {
        // Only respond if not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Keyboard shortcuts
        if (e.key === 'g' || e.key === 'G') document.getElementById('generateCharacterBtn')?.click();
        if (e.key === 'c' || e.key === 'C') document.getElementById('generateComicBtn')?.click();
        
        // Theme toggle shortcut
        if (e.key === 't' || e.key === 'T') document.getElementById('themeToggle')?.click();
        
        // Sidebar toggle shortcut
        if (e.key === 'b' || e.key === 'B') document.getElementById('sidebarToggle')?.click();
    }
});