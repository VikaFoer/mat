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

// Function to add PDF file viewer to a specific lecture tab
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

    // Remove placeholder if exists
    const placeholder = materialsContainer.querySelector('.pdf-viewer-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Create object element for PDF viewer with fallback
    const object = document.createElement('object');
    object.className = 'pdf-viewer';
    object.data = pdfPath + '#toolbar=1&navpanes=1&scrollbar=1';
    object.type = 'application/pdf';

    // Create iframe fallback
    const iframe = document.createElement('iframe');
    iframe.className = 'pdf-viewer';
    iframe.src = pdfPath + '#toolbar=1&navpanes=1&scrollbar=1';
    iframe.type = 'application/pdf';

    // Create link fallback
    const fallback = document.createElement('p');
    fallback.className = 'pdf-fallback';
    const link = document.createElement('a');
    link.href = pdfPath;
    link.target = '_blank';
    link.className = 'pdf-download-link';
    link.textContent = '📄 Відкрити PDF у новому вікні';
    fallback.appendChild(document.createTextNode('Ваш браузер не підтримує відображення PDF. '));
    fallback.appendChild(link);

    object.appendChild(iframe);
    object.appendChild(fallback);

    // Clear and add new content
    materialsContainer.innerHTML = '';
    materialsContainer.appendChild(object);
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addPDFContent, addPDFViewer };
}

