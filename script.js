// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Cache for rendered pages
const renderedPagesCache = new Map();

// Calculate optimal scale based on container width
function calculateOptimalScale(containerWidth) {
    // Target width for PDF pages (with some padding)
    const targetWidth = Math.min(containerWidth - 40, 1200);
    // Base scale calculation (assuming A4 width ~595px at 72 DPI)
    const baseScale = targetWidth / 595;
    // Limit scale between 1.0 and 1.8 for performance
    return Math.max(1.0, Math.min(1.8, baseScale));
}

// Function to render a single page
async function renderPage(pdf, pageNum, numPages, container, scale) {
    try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Optimize canvas rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Render page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Convert canvas to image with optimized quality (JPEG for smaller size)
        const img = document.createElement('img');
        // Use JPEG with 0.92 quality for better compression while maintaining quality
        img.src = canvas.toDataURL('image/jpeg', 0.92);
        img.className = 'pdf-page-image';
        img.alt = `Сторінка ${pageNum} з ${numPages}`;
        img.loading = 'lazy'; // Lazy loading for better performance

        // Add page number
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-page-wrapper';
        const pageNumber = document.createElement('div');
        pageNumber.className = 'pdf-page-number';
        pageNumber.textContent = `Сторінка ${pageNum} з ${numPages}`;
        
        pageWrapper.appendChild(pageNumber);
        pageWrapper.appendChild(img);
        container.appendChild(pageWrapper);

        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;
    } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
    }
}

// Function to render PDF pages as images with progressive loading
async function renderPDFAsImages(pdfPath, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    // Check cache
    const cacheKey = `${pdfPath}-${containerId}`;
    if (renderedPagesCache.has(cacheKey)) {
        container.innerHTML = renderedPagesCache.get(cacheKey);
        return;
    }

    // Show loading message
    container.innerHTML = '<div class="pdf-loading">Завантаження PDF...</div>';

    try {
        // Load PDF
        const loadingTask = pdfjsLib.getDocument({
            url: pdfPath,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Calculate optimal scale
        const containerWidth = container.offsetWidth || 1200;
        const scale = calculateOptimalScale(containerWidth);

        // Clear loading message and show progress
        container.innerHTML = `<div class="pdf-loading">Завантаження PDF... (0/${numPages} сторінок)</div>`;

        // Render pages progressively with small delays for smoothness
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            // Update progress
            const loadingDiv = container.querySelector('.pdf-loading');
            if (loadingDiv) {
                loadingDiv.textContent = `Завантаження PDF... (${pageNum}/${numPages} сторінок)`;
            }

            // Render page
            await renderPage(pdf, pageNum, numPages, container, scale);

            // Small delay between pages to prevent blocking (only for first few pages)
            if (pageNum < 3) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // Remove loading message if still present
        const loadingDiv = container.querySelector('.pdf-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }

        // Cache the rendered content
        renderedPagesCache.set(cacheKey, container.innerHTML);
    } catch (error) {
        console.error('Error loading PDF:', error);
        container.innerHTML = `
            <div class="pdf-error">
                <p>Помилка завантаження PDF: ${error.message}</p>
                <a href="${pdfPath}" target="_blank" class="pdf-download-link">
                    📄 Відкрити PDF у новому вікні
                </a>
            </div>
        `;
    }
}

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Smooth scroll to top when switching tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // Load PDF for lecture 1
    renderPDFAsImages('Лекція1(Основи теорії множин).pdf', 'lecture1-pages');
    
    // Load PDF for lecture 2 when tab is activated
    const lecture2Tab = document.getElementById('lecture2');
    const lecture2Button = document.querySelector('[data-tab="lecture2"]');
    let lecture2Loaded = false;
    
    lecture2Button.addEventListener('click', () => {
        if (!lecture2Loaded) {
            lecture2Loaded = true;
            renderPDFAsImages('Diskretna-matematika (1).pdf', 'lecture2-pages');
        }
    });
});

// Function to add PDF content to a specific lecture tab
function addPDFContent(lectureId, content) {
    const lectureTab = document.getElementById(lectureId);
    if (!lectureTab) {
        console.error(`Lecture tab ${lectureId} not found`);
        return;
    }

    const materialsContainer = lectureTab.querySelector('.materials-container');
    if (!materialsContainer) {
        console.error(`Materials container not found for ${lectureId}`);
        return;
    }

    // Remove placeholder if exists
    const placeholder = materialsContainer.querySelector('.pdf-viewer-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Create content div
    const contentDiv = document.createElement('div');
    contentDiv.className = 'pdf-content';
    contentDiv.innerHTML = content;

    // Clear and add new content
    materialsContainer.innerHTML = '';
    materialsContainer.appendChild(contentDiv);
}

// Function to add PDF file viewer to a specific lecture tab (renders as images)
function addPDFViewer(lectureId, pdfPath) {
    const lectureTab = document.getElementById(lectureId);
    if (!lectureTab) {
        console.error(`Lecture tab ${lectureId} not found`);
        return;
    }

    const materialsContainer = lectureTab.querySelector('.materials-container');
    if (!materialsContainer) {
        console.error(`Materials container not found for ${lectureId}`);
        return;
    }

    // Create container ID for this PDF
    const containerId = `${lectureId}-pages`;
    materialsContainer.id = containerId;

    // Remove placeholder if exists
    const placeholder = materialsContainer.querySelector('.pdf-viewer-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Render PDF as images
    renderPDFAsImages(pdfPath, containerId);
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addPDFContent, addPDFViewer };
}

