// Enhanced UI interactions for ComicGenius Pro
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button');
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
                counter.className = 'char-counter text-xs text-gray-500 mt-1 text-right';
                textarea.parentNode.insertBefore(counter, textarea.nextSibling);
            }
            
            // Update character count
            const maxLength = textarea.getAttribute('maxlength') || 500;
            counter.textContent = `${textarea.value.length}/${maxLength}`;
        });
    });
    
    // Add tooltip functionality
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.getAttribute('data-tooltip');
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'absolute bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1 z-10';
            tooltipElement.textContent = tooltipText;
            tooltipElement.id = 'dynamic-tooltip';
            document.body.appendChild(tooltipElement);
            
            const rect = e.target.getBoundingClientRect();
            tooltipElement.style.left = rect.left + 'px';
            tooltipElement.style.top = (rect.top - 30) + 'px';
        });
        
        tooltip.addEventListener('mouseleave', () => {
            const tooltipElement = document.getElementById('dynamic-tooltip');
            if (tooltipElement) {
                tooltipElement.remove();
            }
        });
    });
});