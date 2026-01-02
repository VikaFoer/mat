// Configure PDF.js worker with CSP compatibility
// Check if we're on a production server (Railway, etc.) where CSP might block workers
const isProduction = window.location.hostname.includes('railway') || 
                     window.location.hostname.includes('vercel') ||
                     window.location.hostname.includes('netlify') ||
                     (window.location.protocol === 'https:' && !window.location.hostname.includes('localhost'));

const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

// Configure PDF.js worker - don't set worker on production to force main thread usage
// This avoids CSP issues with blob: URLs
if (typeof pdfjsLib !== 'undefined' && !isProduction) {
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } catch (e) {
        console.warn('Could not set worker source:', e);
    }
}

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

// Track loaded PDFs to prevent recursion
const loadedPDFs = new Set();

// Function to render PDF pages as images with progressive loading
async function renderPDFAsImages(pdfPath, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    // Prevent loading the same PDF multiple times
    const pdfKey = `${pdfPath}-${containerId}`;
    if (loadedPDFs.has(pdfKey)) {
        console.log(`PDF ${pdfPath} already loaded, skipping`);
        return;
    }
    loadedPDFs.add(pdfKey);

    // Always try to use PDF.js first to render as images (no navigation possible)
    // Only fallback to iframe if PDF.js fails
    if (typeof pdfjsLib === 'undefined') {
        // PDF.js not available, use iframe as fallback
        container.innerHTML = '';
        
        const iframe = document.createElement('iframe');
        iframe.className = 'pdf-viewer';
        // Completely disable all navigation
        iframe.src = pdfPath + '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
        iframe.type = 'application/pdf';
        iframe.style.width = '100%';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.minHeight = '600px';
        iframe.setAttribute('loading', 'lazy');
        
        const fallbackLink = document.createElement('p');
        fallbackLink.className = 'pdf-fallback';
        fallbackLink.style.marginTop = '20px';
        fallbackLink.style.textAlign = 'center';
        const link = document.createElement('a');
        link.href = pdfPath;
        link.target = '_blank';
        link.className = 'pdf-download-link';
        link.textContent = '📄 Відкрити PDF у новому вікні';
        fallbackLink.appendChild(link);
        
        container.appendChild(iframe);
        container.appendChild(fallbackLink);
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
        // First, check if file exists by trying to fetch it
        let fileExists = true;
        try {
            const response = await fetch(pdfPath, { method: 'HEAD' });
            if (!response.ok) {
                if (response.status === 404) {
                    fileExists = false;
                    throw new Error(`PDF файл "${pdfPath}" не знайдено (404). Перевірте, чи файл існує та чи правильна назва файлу.`);
                } else if (!response.ok) {
                    console.warn(`File exists but returned status ${response.status}`);
                }
            }
        } catch (fetchError) {
            // If fetch fails, try to load PDF anyway (might be CORS issue or local file)
            if (fetchError.message.includes('404')) {
                fileExists = false;
                throw fetchError;
            }
            console.warn('Could not verify file existence (might be CORS or local file):', fetchError);
        }

        // Load PDF with better error handling and CSP compatibility
        // PDF.js should be loaded now (we load it in HTML)
        if (typeof pdfjsLib === 'undefined') {
            // If still not available, wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 500));
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js не завантажено. Використовується iframe fallback.');
            }
        }

        // Use main thread on production to avoid CSP issues with workers
        const loadingTask = pdfjsLib.getDocument({
            url: pdfPath,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            verbosity: 0, // Reduce console warnings
            stopAtErrors: false, // Continue even with errors
            useSystemFonts: false, // Better compatibility
            disableAutoFetch: false,
            disableStream: false,
            disableWorker: isProduction, // Disable worker on production to avoid CSP issues
        });
        
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        
        // If we got here but numPages is 0 or invalid, there might be an issue
        if (!numPages || numPages <= 0) {
            throw new Error('PDF файл порожній або пошкоджений');
        }

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
        console.error('Error loading PDF with PDF.js:', error);
        
        // Immediately try fallback to iframe/object viewer
        const errorMessage = error.message || 'Невідома помилка';
        
        // Clear container and try iframe/object fallback
        container.innerHTML = '';
        
        // Create iframe as primary fallback to avoid navigation recursion
        const iframe = document.createElement('iframe');
        iframe.className = 'pdf-viewer';
        // Disable navpanes to prevent recursion/navigation issues
        iframe.src = pdfPath + '#toolbar=1&navpanes=0&scrollbar=1&view=FitH';
        iframe.type = 'application/pdf';
        iframe.style.width = '100%';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.minHeight = '600px';
        iframe.setAttribute('loading', 'lazy');
        
        // Add error handler for iframe
        iframe.onerror = () => {
            container.innerHTML = `
                <div class="pdf-error">
                    <p>Помилка завантаження PDF: ${errorMessage}</p>
                    <p style="margin-top: 15px; color: #666; font-size: 0.9em;">
                        Можливі причини:<br>
                        • Файл не існує або має неправильну назву<br>
                        • PDF файл пошкоджений<br>
                        • Проблеми з доступом до файлу<br>
                        • Браузер не підтримує вбудований перегляд PDF
                    </p>
                    <a href="${pdfPath}" target="_blank" class="pdf-download-link" style="margin-top: 20px; display: inline-block;">
                        📄 Відкрити PDF у новому вікні
                    </a>
                </div>
            `;
        };
        
        // Add fallback link
        const fallbackLink = document.createElement('p');
        fallbackLink.className = 'pdf-fallback';
        fallbackLink.style.marginTop = '20px';
        fallbackLink.style.textAlign = 'center';
        const link = document.createElement('a');
        link.href = pdfPath;
        link.target = '_blank';
        link.className = 'pdf-download-link';
        link.textContent = '📄 Відкрити PDF у новому вікні';
        fallbackLink.appendChild(link);
        
        container.appendChild(iframe);
        container.appendChild(fallbackLink);
        
        // Also try to detect if iframe loaded successfully
        iframe.onload = () => {
            console.log('PDF loaded successfully in iframe');
        };
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
    
    // Load PDF for lecture 3 when tab is activated
    const lecture3Button = document.querySelector('[data-tab="lecture3"]');
    let lecture3Loaded = false;
    
    lecture3Button.addEventListener('click', () => {
        if (!lecture3Loaded) {
            lecture3Loaded = true;
            renderPDFAsImages('Diskretna-matematika (2).pdf', 'lecture3-pages');
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

