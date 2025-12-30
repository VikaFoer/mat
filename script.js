// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Function to render PDF pages as images
async function renderPDFAsImages(pdfPath, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    // Show loading message
    container.innerHTML = '<div class="pdf-loading">Завантаження PDF...</div>';

    try {
        // Load PDF
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Clear loading message
        container.innerHTML = '';

        // Render each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render page to canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Convert canvas to image
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.className = 'pdf-page-image';
            img.alt = `Сторінка ${pageNum} з ${numPages}`;

            // Add page number
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'pdf-page-wrapper';
            const pageNumber = document.createElement('div');
            pageNumber.className = 'pdf-page-number';
            pageNumber.textContent = `Сторінка ${pageNum} з ${numPages}`;
            
            pageWrapper.appendChild(pageNumber);
            pageWrapper.appendChild(img);
            container.appendChild(pageWrapper);
        }
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

