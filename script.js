// Images for each lecture
const lectureImages = {
    1: [
        '1 лекція/1_Diskretna-matematika.png',
        '1 лекція/2_Sposobi-zadannya-vidnoshen.png',
        '1 лекція/3_Priklad-matrichnogo-sposobu.png',
        '1 лекція/4_Grafichnij-sposib-zadannya-vidnoshen.png',
        '1 лекція/5_Vlastivosti-odnoridnih-binarnih-vidnoshen.png',
        '1 лекція/6_Vlastivosti-vidnoshen-simetriya.png',
        '1 лекція/7_Specialni-binarni-vidnoshennya-ekvivalentnist.png',
        '1 лекція/8_Vidnoshennya-poryadku.png',
        '1 лекція/9_Diagrami-Gasse-ta-vidnoshennya-tolerantnosti.png'
    ]
    // Add more lectures as needed
};

// Function to load images for a lecture
function loadLectureImages(lectureNumber) {
    const container = document.getElementById(`lecture${lectureNumber}-images`);
    if (!container) {
        console.error(`Container for lecture ${lectureNumber} not found`);
        return;
    }

    const images = lectureImages[lectureNumber];
    if (!images || images.length === 0) {
        return;
    }

    // Clear container
    container.innerHTML = '';

    // Load each image
    images.forEach((imagePath, index) => {
        const img = document.createElement('img');
        img.src = imagePath;
        img.className = 'lecture-image';
        img.alt = `Лекція ${lectureNumber}, зображення ${index + 1}`;
        img.loading = 'lazy';
        
        // Add error handling
        img.onerror = function() {
            console.error(`Failed to load image: ${imagePath}`);
            this.style.display = 'none';
        };

        container.appendChild(img);
    });
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const lectureLinks = document.querySelectorAll('.lecture-link');
    const lectureContents = document.querySelectorAll('.lecture-content');

    lectureLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const lectureNumber = this.getAttribute('data-lecture');
            const targetLecture = document.getElementById(`lecture${lectureNumber}`);

            // Remove active class from all links and contents
            lectureLinks.forEach(l => l.classList.remove('active'));
            lectureContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked link and corresponding content
            this.classList.add('active');
            if (targetLecture) {
                targetLecture.classList.add('active');
                
                // Load images if this is the first time viewing
                if (targetLecture.querySelector('.lecture-image') === null) {
                    loadLectureImages(lectureNumber);
                }
            }

            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // Load images for lecture 1 on page load
    loadLectureImages(1);
});
