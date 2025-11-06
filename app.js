// Firebase configuration will go here
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, limit, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Load confetti library
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

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
    flower: '🌸',
    fish: '🐟',
    duck: '🦆'
};

// Sound effects
let soundEnabled = true;
const popSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC'); // Pop sound
const ambientSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Garden ambient (birds chirping)
ambientSound.loop = true;
ambientSound.volume = 0.3;

// Sound toggle
document.getElementById('soundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');

    if (soundEnabled) {
        btn.textContent = '🔊';
        btn.classList.remove('muted');
        ambientSound.play().catch(() => {}); // Start ambient if enabled
    } else {
        btn.textContent = '🔇';
        btn.classList.add('muted');
        ambientSound.pause();
    }
});

// Auto-play ambient sound on first interaction
let ambientStarted = false;
document.body.addEventListener('click', () => {
    if (!ambientStarted && soundEnabled) {
        ambientSound.play().catch(() => {});
        ambientStarted = true;
    }
}, { once: true });

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

        // Play pop sound
        if (soundEnabled) {
            popSound.currentTime = 0;
            popSound.play().catch(() => {});
        }

        // Confetti explosion!
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

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

        // Display drawings in grid
        drawings.forEach((drawing, index) => {
            const card = document.createElement('div');
            card.className = 'drawing-card';
            card.dataset.drawingId = drawing.id || index;

            const categoryTag = document.createElement('div');
            categoryTag.className = 'category-tag';
            categoryTag.textContent = categoryEmojis[drawing.category];

            const img = document.createElement('img');
            img.src = drawing.imageData;
            img.width = 80;
            img.height = 80;
            img.style.borderRadius = '8px';

            // React button
            const reactBtn = document.createElement('button');
            reactBtn.className = 'react-btn';
            reactBtn.innerHTML = '❤️';
            reactBtn.title = 'React with love';

            // Check if already reacted (from localStorage)
            const reactions = JSON.parse(localStorage.getItem('reactions') || '{}');
            const drawingKey = drawing.id || index;
            const reactionCount = drawing.reactions || reactions[drawingKey] || 0;
            const hasReacted = localStorage.getItem(`reacted_${drawingKey}`) === 'true';

            if (hasReacted) {
                reactBtn.classList.add('reacted');
            }

            reactBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await handleReaction(drawing, drawingKey, reactBtn, reactCount);
            });

            // React count
            const reactCount = document.createElement('div');
            reactCount.className = 'react-count';
            if (reactionCount > 0) {
                reactCount.textContent = reactionCount;
                reactCount.classList.add('visible');
            }

            card.appendChild(categoryTag);
            card.appendChild(img);
            card.appendChild(reactBtn);
            card.appendChild(reactCount);
            gardenGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading drawings:', error);
        gardenGrid.innerHTML = '<div class="empty-state"><p>Unable to load drawings. Please refresh the page.</p></div>';
    }
}

// Handle reaction (heart button)
async function handleReaction(drawing, drawingKey, reactBtn, reactCount) {
    const hasReacted = localStorage.getItem(`reacted_${drawingKey}`) === 'true';

    if (hasReacted) {
        // Un-react
        localStorage.removeItem(`reacted_${drawingKey}`);
        reactBtn.classList.remove('reacted');

        // Update count
        const reactions = JSON.parse(localStorage.getItem('reactions') || '{}');
        reactions[drawingKey] = Math.max(0, (reactions[drawingKey] || 1) - 1);
        localStorage.setItem('reactions', JSON.stringify(reactions));

        if (reactions[drawingKey] === 0) {
            reactCount.classList.remove('visible');
        } else {
            reactCount.textContent = reactions[drawingKey];
        }
    } else {
        // React
        localStorage.setItem(`reacted_${drawingKey}`, 'true');
        reactBtn.classList.add('reacted');

        // Update count
        const reactions = JSON.parse(localStorage.getItem('reactions') || '{}');
        reactions[drawingKey] = (reactions[drawingKey] || 0) + 1;
        localStorage.setItem('reactions', JSON.stringify(reactions));

        reactCount.textContent = reactions[drawingKey];
        reactCount.classList.add('visible');

        // Mini confetti
        confetti({
            particleCount: 20,
            spread: 40,
            origin: {
                x: event.clientX / window.innerWidth,
                y: event.clientY / window.innerHeight
            }
        });
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

// ===== ADMIN SETTINGS PANEL =====

const ADMIN_PASSWORD = '7Maruthi';

// Settings Modal Controls
document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);

// Click outside modal to close
document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') {
        closeSettingsModal();
    }
});

function openSettings() {
    const password = prompt('Enter admin password:');
    if (password === ADMIN_PASSWORD) {
        document.getElementById('settingsModal').classList.add('active');
        loadEmojiList();
    } else if (password !== null) {
        alert('Incorrect password!');
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

// Load current emoji list for removal
function loadEmojiList() {
    const emojiList = document.getElementById('emojiList');
    emojiList.innerHTML = '';

    Object.entries(categoryEmojis).forEach(([key, emoji]) => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.innerHTML = `
            <span>${emoji}</span>
            <span>${key}</span>
            <button onclick="removeEmoji('${key}')">Remove</button>
        `;
        emojiList.appendChild(item);
    });
}

// Add new emoji
let emojiPicker = null;
document.getElementById('addEmojiBtn').addEventListener('click', () => {
    const container = document.getElementById('emojiPickerContainer');

    if (emojiPicker) {
        container.innerHTML = '';
        emojiPicker = null;
        return;
    }

    emojiPicker = document.createElement('emoji-picker');
    container.appendChild(emojiPicker);

    emojiPicker.addEventListener('emoji-click', (event) => {
        const selectedEmoji = event.detail.unicode;

        // Check if emoji already exists
        const exists = Object.values(categoryEmojis).includes(selectedEmoji);
        if (exists) {
            alert('This emoji is already added!');
            return;
        }

        // Generate a key name (use emoji as key or ask user)
        const keyName = prompt('Enter a name for this category:');
        if (!keyName) return;

        // Check if key already exists
        if (categoryEmojis[keyName.toLowerCase()]) {
            alert('This category name already exists!');
            return;
        }

        // Add to categoryEmojis
        categoryEmojis[keyName.toLowerCase()] = selectedEmoji;

        // Add button to UI
        addCategoryButton(keyName.toLowerCase(), selectedEmoji);

        // Refresh emoji list
        loadEmojiList();

        // Save to localStorage
        localStorage.setItem('categoryEmojis', JSON.stringify(categoryEmojis));

        alert(`Added ${selectedEmoji} as "${keyName}"!`);
        container.innerHTML = '';
        emojiPicker = null;
    });
});

// Add category button dynamically
function addCategoryButton(category, emoji) {
    const categoryButtons = document.querySelector('.category-buttons');
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.dataset.category = category;
    btn.innerHTML = `<span class="emoji">${emoji}</span>`;
    btn.addEventListener('click', () => {
        openDrawingModal(category);
    });
    categoryButtons.appendChild(btn);
}

// Remove emoji
window.removeEmoji = function(key) {
    if (confirm(`Remove ${categoryEmojis[key]} (${key})?`)) {
        delete categoryEmojis[key];

        // Remove button from UI
        const btn = document.querySelector(`[data-category="${key}"]`);
        if (btn) btn.remove();

        // Refresh emoji list
        loadEmojiList();

        // Save to localStorage
        localStorage.setItem('categoryEmojis', JSON.stringify(categoryEmojis));

        alert('Emoji removed!');
    }
};

// Clear entire garden
document.getElementById('clearGardenBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to DELETE ALL DRAWINGS? This cannot be undone!')) {
        return;
    }

    if (!confirm('FINAL WARNING: This will permanently delete everything. Continue?')) {
        return;
    }

    try {
        if (db) {
            // Delete from Firebase
            const q = query(collection(db, 'drawings'));
            const querySnapshot = await getDocs(q);

            const deletePromises = [];
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, 'drawings', docSnapshot.id)));
            });

            await Promise.all(deletePromises);
            console.log('All drawings deleted from Firebase');
        } else {
            // Clear localStorage
            localStorage.removeItem('drawings');
        }

        // Reload garden
        await loadDrawings();
        alert('Garden cleared successfully!');
    } catch (error) {
        console.error('Error clearing garden:', error);
        alert('Error clearing garden. Check console.');
    }
});

// Remove last N drawings
document.getElementById('removeLastNBtn').addEventListener('click', async () => {
    const n = parseInt(document.getElementById('removeLastN').value);

    if (!n || n < 1) {
        alert('Please enter a valid number!');
        return;
    }

    if (!confirm(`Remove the last ${n} drawing(s)?`)) {
        return;
    }

    try {
        if (db) {
            // Get last N drawings from Firebase
            const q = query(collection(db, 'drawings'), orderBy('timestamp', 'desc'), limit(n));
            const querySnapshot = await getDocs(q);

            const deletePromises = [];
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, 'drawings', docSnapshot.id)));
            });

            await Promise.all(deletePromises);
            console.log(`Last ${n} drawings deleted`);
        } else {
            // Remove from localStorage
            let drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
            drawings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            drawings = drawings.slice(n);
            localStorage.setItem('drawings', JSON.stringify(drawings));
        }

        // Reload garden
        await loadDrawings();
        document.getElementById('removeLastN').value = '';
        alert(`Removed last ${n} drawing(s)!`);
    } catch (error) {
        console.error('Error removing drawings:', error);
        alert('Error removing drawings. Check console.');
    }
});

// Load saved emojis from localStorage on startup
const savedEmojis = localStorage.getItem('categoryEmojis');
if (savedEmojis) {
    const loadedEmojis = JSON.parse(savedEmojis);
    Object.assign(categoryEmojis, loadedEmojis);

    // Add any new buttons that aren't already in HTML
    Object.entries(loadedEmojis).forEach(([key, emoji]) => {
        if (!document.querySelector(`[data-category="${key}"]`)) {
            addCategoryButton(key, emoji);
        }
    });
}
