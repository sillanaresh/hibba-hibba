// Firebase configuration will go here
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config - Connected to your happy-garden project!
const firebaseConfig = {
    apiKey: "AIzaSyD9n7tntYINGMt6MzzIiGDsKOGwPxXFolE",
    authDomain: "happy-garden-13531.firebaseapp.com",
    projectId: "happy-garden-13531",
    storageBucket: "happy-garden-13531.firebasestorage.app",
    messagingSenderId: "1085122729486",
    appId: "1:1085122729486:web:9a5bcc00e31be432e30e5f"
};

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized successfully!');
} catch (error) {
    console.log('Firebase not configured yet. Using local mode.');
}

// Canvas setup
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentColor = '#2D3047';
let currentCategory = '';

// Category emoji map
const categoryEmojis = {
    cat: '🐱',
    dog: '🐶',
    flower: '🌸'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDrawings();
});

function setupEventListeners() {
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            openDrawingModal(category);
        });
    });

    // Color buttons
    document.querySelectorAll('.color-btn, .eraser-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn, .eraser-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = btn.dataset.color;
        });
    });

    // Canvas drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
    document.getElementById('submitDrawing').addEventListener('click', submitDrawing);

    // Click outside modal to close
    document.getElementById('drawingModal').addEventListener('click', (e) => {
        if (e.target.id === 'drawingModal') {
            closeModal();
        }
    });
}

function openDrawingModal(category) {
    currentCategory = category;
    document.getElementById('currentCategory').textContent = category;
    document.getElementById('categoryEmoji').textContent = categoryEmojis[category];
    document.getElementById('drawingModal').classList.add('active');
    clearCanvas();
}

function closeModal() {
    document.getElementById('drawingModal').classList.remove('active');
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function submitDrawing() {
    // Convert canvas to image data
    const imageData = canvas.toDataURL('image/png');

    // Check if canvas is empty
    const isCanvasEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0);
    if (isCanvasEmpty) {
        alert('Please draw something first! 🎨');
        return;
    }

    try {
        // Save to Firebase
        if (db) {
            await addDoc(collection(db, 'drawings'), {
                category: currentCategory,
                imageData: imageData,
                timestamp: new Date().toISOString()
            });
            console.log('Drawing saved to Firebase!');
        } else {
            // Fallback: save to localStorage for testing
            const drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
            drawings.push({
                category: currentCategory,
                imageData: imageData,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('drawings', JSON.stringify(drawings));
            console.log('Drawing saved to localStorage (Firebase not configured)');
        }

        // Reload drawings and close modal
        await loadDrawings();
        closeModal();

        // Show success message
        showSuccessMessage();
    } catch (error) {
        console.error('Error saving drawing:', error);
        alert('Oops! Something went wrong. Please try again.');
    }
}

async function loadDrawings() {
    const gardenGrid = document.getElementById('gardenGrid');

    try {
        let drawings = [];

        if (db) {
            // Load from Firebase
            const q = query(collection(db, 'drawings'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                drawings.push(doc.data());
            });
        } else {
            // Load from localStorage
            drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
            drawings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        // Clear grid
        gardenGrid.innerHTML = '';

        if (drawings.length === 0) {
            gardenGrid.innerHTML = '<div class="empty-state"><p>🌱 The garden is empty. Be the first to add a drawing!</p></div>';
            return;
        }

        // Display drawings
        drawings.forEach(drawing => {
            const card = document.createElement('div');
            card.className = 'drawing-card';

            const categoryTag = document.createElement('div');
            categoryTag.className = 'category-tag';
            categoryTag.textContent = categoryEmojis[drawing.category];

            const img = document.createElement('img');
            img.src = drawing.imageData;
            img.width = 120;
            img.height = 120;
            img.style.borderRadius = '10px';

            card.appendChild(categoryTag);
            card.appendChild(img);
            gardenGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading drawings:', error);
        gardenGrid.innerHTML = '<div class="empty-state"><p>Unable to load drawings. Please refresh the page.</p></div>';
    }
}

function showSuccessMessage() {
    // Create a temporary success message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #93E1D8 0%, #B8D4E8 100%);
        color: #2D3047;
        padding: 15px 30px;
        border-radius: 15px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;
    message.textContent = '✨ Added to the garden!';
    document.body.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 2000);
}

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
