// Images for each lecture
const lectureImages = {
    1: [
        '1 лекція/1_Diskretna-matematika.png',
        '1 лекція/2_Diskretna-matematika-diskretnij-analiz-skinchenna-matematika-ce-rozdil-suchasnoyi-matematiki-v-yakom.png',
        '1 лекція/3_Rozdili-diskretnoyi-matematiki.png',
        '1 лекція/4_Zastosuvannya-diskretnoyi-matematiki.png',
        '1 лекція/5_Literatura-za-kursom.png',
        '1 лекція/6_Mnozhina-Elementi-mnozhin.png',
        '1 лекція/7_Prikladi-mnozhin.png',
        '1 лекція/8_Poznachennya-i-tipi-mnozhin.png',
        '1 лекція/9_Rivnist-ta-vklyuchennya-mnozhin.png',
        '1 лекція/10_Chislovi-mnozhini.png',
        '1 лекція/11_Skinchenni-ta-neskinchenni-mnozhini.png',
        '1 лекція/12_Potuzhnist-mnozhini-ta-bulean.png',
        '1 лекція/13_Uporyadkovani-ta-specialni-mnozhini.png',
        '1 лекція/14_Sposobi-zadannya-mnozhin.png',
        '1 лекція/15_Procedura-porodzhennya-elementiv.png',
        '1 лекція/16_Geometrichna-interpretaciya-mnozhin.png',
        '1 лекція/17_Diagrami-Ejlera-prikladi.png',
        '1 лекція/18_Diagrami-Venna.png',
        '1 лекція/19_Algebra-mnozhin-osnovni-operaciyi.png'
    ],
    2: [
        '2 лекція/1_Diskretna-matematika.png',
        '2 лекція/2_Prioritet-operacij-v-algebri-mnozhin.png',
        '2 лекція/3_Zakoni-algebri-mnozhin.png',
        '2 лекція/4_Vlastivosti-riznici-ta-priklad-dovedennya.png',
        '2 лекція/5_Potuzhnist-mnozhin-vzayemno-odnoznachna-vidpovidnist.png',
        '2 лекція/6_Zlichenni-ta-kontinualni-mnozhini.png',
        '2 лекція/7_Zadacha-pro-meteosposterezhennya.png',
        '2 лекція/8_Dekartovij-dobutok-mnozhin.png'
    ],
    3: [
        '3 лекція/1_Diskretna-matematika.png',
        '3 лекція/2_Sposobi-zadannya-vidnoshen.png',
        '3 лекція/3_Priklad-matrichnogo-sposobu.png',
        '3 лекція/4_Grafichnij-sposib-zadannya-vidnoshen.png',
        '3 лекція/5_Vlastivosti-odnoridnih-binarnih-vidnoshen.png',
        '3 лекція/6_Vlastivosti-vidnoshen-simetriya.png',
        '3 лекція/7_Specialni-binarni-vidnoshennya-ekvivalentnist.png',
        '3 лекція/8_Vidnoshennya-poryadku.png',
        '3 лекція/9_Diagrami-Gasse-ta-vidnoshennya-tolerantnosti.png'
    ],
    4: [
        '4 лекція/1_Buleva-algebra.png',
        '4 лекція/2_Dzhordzh-Bul-zasnovnik-bulevoyi-algebri.png',
        '4 лекція/3_Bulevi-zminni-ta-funkciyi-osnovni-ponyattya.png',
        '4 лекція/4_Sposobi-zadannya-bulevih-funkcij.png',
        '4 лекція/5_Bulevi-funkciyi-odniyeyi-ta-dvoh-zminnih.png',
        '4 лекція/6_Zakoni-bulevoyi-algebri.png',
        '4 лекція/7_Vlastivosti-osnovnih-logichnih-operacij.png',
        '4 лекція/8_Bulevi-funkciyi-bagatoh-zminnih.png',
        '4 лекція/9_Prioritet-operacij-ta-zvyazok-z-teoriyeyu-mnozhin.png',
        '4 лекція/10_Praktichnij-priklad-analiz-mnozhin.png'
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

    // Set lecture 1 as active by default
    const firstLink = document.querySelector('.lecture-link[data-lecture="1"]');
    const firstContent = document.getElementById('lecture1');
    if (firstLink && firstContent) {
        firstLink.classList.add('active');
        firstContent.classList.add('active');
    }
});
