const firebaseConfig = {
    apiKey: "AIzaSyD9n7tntYINGMt6MzzIiGDsKOGwPxXFolE",
    authDomain: "happy-garden-13531.firebaseapp.com",
    projectId: "happy-garden-13531",
    storageBucket: "happy-garden-13531.firebasestorage.app",
    messagingSenderId: "1085122729486",
    appId: "1:1085122729486:web:9a5bcc00e31be432e30e5f"
};

const WALL_COLLECTION = 'drawings';
const ADMIN_PASSWORD = '7Maruthi';
const FIREBASE_TIMEOUT_MS = 7000;
const FIREBASE_MODULES = {
    app: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    firestore: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    auth: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
};
const DEFAULT_CATEGORY_EMOJIS = {
    cat: '🐱',
    dog: '🐶',
    flower: '🌸',
    fish: '🐟',
    duck: '🦆'
};

let initializeApp;
let getFirestore;
let collection;
let addDoc;
let getDocs;
let deleteDoc;
let doc;
let updateDoc;
let onSnapshot;
let increment;
let serverTimestamp;
let getAuth;
let signInAnonymously;
let app;
let db;
let auth;
let firebaseReadyPromise;

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentColor = '';
let currentCategory = '';
let unsubscribeDrawings = null;
let allDrawings = [];
let activeFilter = 'all';
let wallSource = 'local';
let brushSize = 3;
let rainbowMode = false;
let sparkleMode = false;
let rainbowHue = 0;
let canvasHistory = [];
let currentPreviewDrawing = null;

const categoryEmojis = { ...DEFAULT_CATEGORY_EMOJIS };

let soundEnabled = true;
const popSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC'); // Pop sound
const ambientSound = new Audio('058216_quotcool-breezequot-sample-2wav-39360.mp3');
ambientSound.loop = true;
ambientSound.volume = 0.3;

document.getElementById('soundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');

    if (soundEnabled) {
        btn.textContent = '🔊';
        btn.classList.remove('muted');
        ambientSound.play().catch(() => {});
    } else {
        btn.textContent = '🔇';
        btn.classList.add('muted');
        ambientSound.pause();
    }
});

let ambientStarted = false;
document.body.addEventListener('click', () => {
    if (!ambientStarted && soundEnabled) {
        ambientSound.play().catch(() => {});
        ambientStarted = true;
    }
}, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    loadSavedEmojis();
    loadTheme();
    currentColor = getDrawColor('ink');
    syncCategoryButtons();
    setupEventListeners();
    loadDrawings();
});

function setupEventListeners() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openDrawingModal(btn.dataset.category);
        });
    });

    document.querySelectorAll('.color-btn, .eraser-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn, .eraser-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = getDrawColor(btn.dataset.color);
            updateToolHint(btn.classList.contains('eraser-btn') ? 'Eraser selected' : `${btn.title} ink selected`);
        });
    });

    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
    document.getElementById('submitDrawing').addEventListener('click', submitDrawing);
    document.getElementById('refreshWall').addEventListener('click', refreshWall);
    document.getElementById('undoCanvas').addEventListener('click', undoCanvas);
    document.getElementById('rainbowMode').addEventListener('click', toggleRainbowMode);
    document.getElementById('sparkleMode').addEventListener('click', toggleSparkleMode);
    document.getElementById('closePreview').addEventListener('click', closePreview);
    document.getElementById('downloadSticker').addEventListener('click', downloadPreviewSticker);
    document.getElementById('exportGardenBtn').addEventListener('click', exportGardenBackup);

    document.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            brushSize = Number(btn.dataset.size);
            updateToolHint(`${btn.title} selected`);
        });
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    document.getElementById('drawingModal').addEventListener('click', (e) => {
        if (e.target.id === 'drawingModal') {
            closeModal();
        }
    });

    document.getElementById('previewModal').addEventListener('click', (e) => {
        if (e.target.id === 'previewModal') {
            closePreview();
        }
    });
}

function syncCategoryButtons() {
    const categoryButtons = document.getElementById('categoryButtons');

    Object.entries(categoryEmojis).forEach(([category, emoji]) => {
        let btn = categoryButtons.querySelector(`[data-category="${category}"]`);
        if (btn) {
            btn.title = `Draw ${category}`;
            btn.setAttribute('aria-label', `Draw ${category}`);
            const emojiSpan = btn.querySelector('.emoji');
            if (emojiSpan) emojiSpan.textContent = emoji;
            return;
        }

        const newBtn = document.createElement('button');
        newBtn.className = 'category-btn';
        newBtn.dataset.category = category;
        newBtn.type = 'button';
        newBtn.title = `Draw ${category}`;
        newBtn.setAttribute('aria-label', `Draw ${category}`);

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.textContent = emoji;

        newBtn.appendChild(emojiSpan);
        categoryButtons.appendChild(newBtn);
    });
}

function openDrawingModal(category) {
    currentCategory = category;
    document.getElementById('currentCategory').textContent = category;
    document.getElementById('categoryEmoji').textContent = categoryEmojis[category] || '✦';
    document.getElementById('drawingModal').classList.add('active');
    canvasHistory = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function closeModal() {
    document.getElementById('drawingModal').classList.remove('active');
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    saveCanvasState();
    canvas.setPointerCapture?.(e.pointerId);
    const point = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
}

function draw(e) {
    if (!isDrawing) return;

    e.preventDefault();
    const point = getCanvasPoint(e);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = getStrokeColor();
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    if (sparkleMode && Math.random() > 0.72) {
        drawSparkle(point);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    }
}

function stopDrawing() {
    isDrawing = false;
}

function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function clearCanvas() {
    saveCanvasState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getDrawColor(name) {
    const token = getComputedStyle(document.documentElement).getPropertyValue(`--draw-${name}`).trim();
    return token || getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim();
}

function getStrokeColor() {
    if (!rainbowMode) return currentColor;
    rainbowHue = (rainbowHue + 8) % 360;
    return `hsl(${rainbowHue}, 85%, 56%)`;
}

function drawSparkle(point) {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
    const x = point.x + (Math.random() - 0.5) * 14;
    const y = point.y + (Math.random() - 0.5) * 14;
    const size = 3 + Math.random() * 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.moveTo(x - size * 0.65, y - size * 0.65);
    ctx.lineTo(x + size * 0.65, y + size * 0.65);
    ctx.moveTo(x + size * 0.65, y - size * 0.65);
    ctx.lineTo(x - size * 0.65, y + size * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function saveCanvasState() {
    canvasHistory.push(canvas.toDataURL('image/png'));
    if (canvasHistory.length > 18) canvasHistory.shift();
}

function undoCanvas() {
    const lastState = canvasHistory.pop();
    if (!lastState) return;

    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = lastState;
}

function toggleRainbowMode() {
    rainbowMode = !rainbowMode;
    const btn = document.getElementById('rainbowMode');
    btn.classList.toggle('active', rainbowMode);
    btn.setAttribute('aria-pressed', String(rainbowMode));
    updateToolHint(rainbowMode ? 'Rainbow is on: your stroke changes color as you draw' : 'Rainbow is off: using the selected color');
}

function toggleSparkleMode() {
    sparkleMode = !sparkleMode;
    const btn = document.getElementById('sparkleMode');
    btn.classList.toggle('active', sparkleMode);
    btn.setAttribute('aria-pressed', String(sparkleMode));
    updateToolHint(sparkleMode ? 'Sparkle is on: tiny star stamps appear while you draw' : 'Sparkle is off: clean brush strokes');
}

function updateToolHint(text) {
    const hint = document.getElementById('toolHint');
    hint.textContent = text;
    hint.classList.add('is-changing');
    setTimeout(() => hint.classList.remove('is-changing'), 240);
}

async function submitDrawing() {
    const imageData = canvas.toDataURL('image/png');

    const isCanvasEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0);
    if (isCanvasEmpty) {
        alert('Please draw something first! 🎨');
        return;
    }

    try {
        const drawing = {
            category: currentCategory,
            categoryEmoji: categoryEmojis[currentCategory] || '✦',
            imageData: imageData,
            reactions: 0,
            timestamp: new Date().toISOString()
        };

        if (db) {
            await addDoc(collection(db, WALL_COLLECTION), {
                ...drawing,
                createdAt: serverTimestamp()
            });
            console.log('Drawing saved to Firebase!');
        } else {
            const drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
            drawings.push({
                ...drawing,
                id: crypto.randomUUID()
            });
            localStorage.setItem('drawings', JSON.stringify(drawings));
            loadLocalDrawings();
            console.log('Drawing saved to localStorage (Firebase not configured)');
        }

        if (soundEnabled) {
            popSound.currentTime = 0;
            popSound.play().catch(() => {});
        }

        fireConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        closeModal();
        showSuccessMessage();
    } catch (error) {
        console.error('Error saving drawing:', error);
        alert('Oops! Something went wrong. Please try again.');
    }
}

async function loadDrawings() {
    if (!db) {
        await loadLocalDrawings();
    }

    await connectFirebase();

    if (db) {
        wallSource = 'cloud';
        updateGardenStatus('Connecting to live cloud wall...');
        await signInForFirestore();

        if (unsubscribeDrawings) return;

        let snapshotResolved = false;
        const snapshotTimeout = setTimeout(async () => {
            if (snapshotResolved) return;
            await loadLocalDrawings();
            updateGardenStatus('Shared wall is taking too long. Drawing still works on this device.');
        }, FIREBASE_TIMEOUT_MS);

        unsubscribeDrawings = onSnapshot(
            collection(db, WALL_COLLECTION),
            (snapshot) => {
                snapshotResolved = true;
                clearTimeout(snapshotTimeout);
                const drawings = [];
                snapshot.forEach((docSnapshot) => {
                    drawings.push(normalizeDrawing(docSnapshot.data(), docSnapshot.id));
                });
                renderDrawings(drawings, 'cloud');
            },
            async (error) => {
                snapshotResolved = true;
                clearTimeout(snapshotTimeout);
                console.error('Error listening to drawings:', error);
                const fallbackMessage = error.code === 'permission-denied'
                    ? 'Cloud wall is locked by Firebase rules. The saved drawings may still be there.'
                    : 'Cloud wall is unavailable. Showing this device only.';
                updateGardenStatus(fallbackMessage);
                await loadLocalDrawings();
                updateGardenStatus(fallbackMessage);
            }
        );
        return;
    }

    await loadLocalDrawings();
}

async function connectFirebase() {
    if (db || firebaseReadyPromise) {
        return firebaseReadyPromise;
    }

    updateGardenStatus('Connecting to the shared wall...');
    firebaseReadyPromise = withTimeout(loadFirebase(), FIREBASE_TIMEOUT_MS)
        .catch((error) => {
            console.warn('Firebase did not start. Local drawing still works.', error);
            db = null;
            auth = null;
            firebaseReadyPromise = null;
            updateGardenStatus('Shared wall is offline right now. Drawing still works on this device.');
        });

    return firebaseReadyPromise;
}

async function loadFirebase() {
    const [appModule, firestoreModule, authModule] = await Promise.all([
        import(FIREBASE_MODULES.app),
        import(FIREBASE_MODULES.firestore),
        import(FIREBASE_MODULES.auth)
    ]);

    initializeApp = appModule.initializeApp;
    getFirestore = firestoreModule.getFirestore;
    collection = firestoreModule.collection;
    addDoc = firestoreModule.addDoc;
    getDocs = firestoreModule.getDocs;
    deleteDoc = firestoreModule.deleteDoc;
    doc = firestoreModule.doc;
    updateDoc = firestoreModule.updateDoc;
    onSnapshot = firestoreModule.onSnapshot;
    increment = firestoreModule.increment;
    serverTimestamp = firestoreModule.serverTimestamp;
    getAuth = authModule.getAuth;
    signInAnonymously = authModule.signInAnonymously;

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase initialized successfully!');
}

function withTimeout(promise, ms) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Firebase connection timed out')), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function signInForFirestore() {
    if (!auth || auth.currentUser) return;

    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.warn('Anonymous Firebase auth is not available. Trying Firestore without auth.', error);
    }
}

async function loadLocalDrawings() {
    wallSource = 'local';
    const drawings = JSON.parse(localStorage.getItem('drawings') || '[]').map((drawing, index) => {
        return normalizeDrawing(drawing, drawing.id || `local-${index}`);
    });
    renderDrawings(drawings, 'local');
}

async function refreshWall() {
    if (db && unsubscribeDrawings) {
        unsubscribeDrawings();
        unsubscribeDrawings = null;
    }
    await loadDrawings();
}

function normalizeDrawing(drawing, id) {
    return {
        ...drawing,
        id,
        category: drawing.category || 'mystery',
        categoryEmoji: drawing.categoryEmoji || categoryEmojis[drawing.category] || '✦',
        reactions: Number(drawing.reactions || 0),
        sortTime: getDrawingTime(drawing)
    };
}

function getDrawingTime(drawing) {
    const value = drawing.createdAt || drawing.timestamp || drawing.clientCreatedAt || drawing.date;
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function renderDrawings(drawings, source) {
    allDrawings = drawings.sort((a, b) => b.sortTime - a.sortTime);
    wallSource = source;
    updateFilterChips();
    renderGarden();
}

function renderGarden() {
    const gardenGrid = document.getElementById('gardenGrid');
    const visibleDrawings = activeFilter === 'all'
        ? allDrawings
        : allDrawings.filter((drawing) => drawing.category === activeFilter);

    gardenGrid.innerHTML = '';
    updateGardenStatus();

    if (visibleDrawings.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-patch">
                <span class="empty-sprout">🌱</span>
                <strong>${activeFilter === 'all' ? 'Plant the first doodle' : 'Nothing in this corner yet'}</strong>
                <span>${activeFilter === 'all' ? 'Pick a tiny friend above and make the wall wake up.' : 'Try another sticker pile.'}</span>
            </div>
        `;
        gardenGrid.appendChild(emptyState);
        return;
    }

    visibleDrawings.forEach((drawing) => {
        gardenGrid.appendChild(createDrawingCard(drawing));
    });
}

function createDrawingCard(drawing) {
    const card = document.createElement('article');
    card.className = 'drawing-card';
    card.dataset.drawingId = drawing.id;
    card.style.setProperty('--tilt', `${getStickerTilt(drawing.id)}deg`);

    const categoryTag = document.createElement('div');
    categoryTag.className = 'category-tag';
    categoryTag.textContent = getCategoryEmoji(drawing);

    const tape = document.createElement('span');
    tape.className = 'sticker-tape';

    const img = document.createElement('img');
    img.src = drawing.imageData;
    img.alt = `${drawing.category} drawing`;
    img.loading = 'lazy';
    img.width = 112;
    img.height = 112;

    const reactBtn = document.createElement('button');
    reactBtn.className = 'react-btn';
    reactBtn.type = 'button';
    reactBtn.textContent = '♥';
    reactBtn.title = 'React with love';
    reactBtn.setAttribute('aria-label', 'React with love');

    const drawingKey = drawing.id;
    const hasReacted = localStorage.getItem(`reacted_${drawingKey}`) === 'true';
    if (hasReacted) reactBtn.classList.add('reacted');

    const reactCount = document.createElement('div');
    reactCount.className = 'react-count';
    if (drawing.reactions > 0) {
        reactCount.textContent = drawing.reactions;
        reactCount.classList.add('visible');
    }

    reactBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleReaction(drawing, drawingKey, reactBtn, reactCount, e);
    });

    card.addEventListener('click', () => openPreview(drawing));

    card.appendChild(tape);
    card.appendChild(categoryTag);
    card.appendChild(img);
    card.appendChild(reactBtn);
    card.appendChild(reactCount);
    return card;
}

function getStickerTilt(id = '') {
    const text = String(id);
    const seed = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return (seed % 9) - 4;
}

function openPreview(drawing) {
    currentPreviewDrawing = drawing;
    document.getElementById('previewEmoji').textContent = getCategoryEmoji(drawing);
    document.getElementById('previewImage').src = drawing.imageData;
    document.getElementById('previewCaption').textContent = `${drawing.category} sticker from the garden`;
    document.getElementById('previewModal').classList.add('active');
}

function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
    currentPreviewDrawing = null;
}

async function downloadPreviewSticker() {
    if (!currentPreviewDrawing?.imageData) return;

    const blob = await (await fetch(currentPreviewDrawing.imageData)).blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const category = currentPreviewDrawing.category || 'garden';
    link.href = url;
    link.download = `fun-garden-${category}-sticker.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getCategoryEmoji(drawing) {
    return drawing.categoryEmoji || categoryEmojis[drawing.category] || '✦';
}

function updateFilterChips() {
    const filterBar = document.getElementById('filterBar');
    const categories = new Map();

    allDrawings.forEach((drawing) => {
        categories.set(drawing.category, getCategoryEmoji(drawing));
    });

    Object.entries(categoryEmojis).forEach(([category, emoji]) => {
        categories.set(category, emoji);
    });

    filterBar.innerHTML = '';
    filterBar.appendChild(createFilterChip('all', 'All', allDrawings.length));

    Array.from(categories.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, emoji]) => {
            const count = allDrawings.filter((drawing) => drawing.category === category).length;
            if (count > 0) {
                filterBar.appendChild(createFilterChip(category, emoji, count));
            }
        });
}

function createFilterChip(filter, label, count) {
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.type = 'button';
    chip.dataset.filter = filter;
    chip.textContent = `${label} ${count}`;
    chip.setAttribute('aria-pressed', String(activeFilter === filter));

    if (activeFilter === filter) chip.classList.add('active');

    chip.addEventListener('click', () => {
        activeFilter = filter;
        updateFilterChips();
        renderGarden();
    });

    return chip;
}

function updateGardenStatus(message) {
    const status = document.getElementById('gardenStatus');
    if (message) {
        status.textContent = message;
        return;
    }

    const hiddenOlder = allDrawings.filter((drawing) => drawing.sortTime === 0).length;
    const sourceText = wallSource === 'cloud' ? 'Live cloud wall' : 'This device only';
    const countText = `${allDrawings.length} drawing${allDrawings.length === 1 ? '' : 's'}`;
    const recoveredText = hiddenOlder > 0 ? `, including ${hiddenOlder} restored older post${hiddenOlder === 1 ? '' : 's'}` : '';
    status.textContent = `${sourceText} · ${countText}${recoveredText}`;
}

function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('gardenTheme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function loadTheme() {
    setTheme(localStorage.getItem('gardenTheme') || 'morning');
}

function exportGardenBackup() {
    const backup = {
        exportedAt: new Date().toISOString(),
        count: allDrawings.length,
        drawings: allDrawings.map(({ sortTime, ...drawing }) => drawing)
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fun-garden-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

async function handleReaction(drawing, drawingKey, reactBtn, reactCount, clickEvent) {
    const hasReacted = localStorage.getItem(`reacted_${drawingKey}`) === 'true';
    const delta = hasReacted ? -1 : 1;
    const nextCount = Math.max(0, (Number(drawing.reactions) || 0) + delta);

    if (hasReacted) {
        localStorage.removeItem(`reacted_${drawingKey}`);
        reactBtn.classList.remove('reacted');
    } else {
        localStorage.setItem(`reacted_${drawingKey}`, 'true');
        reactBtn.classList.add('reacted');
    }

    drawing.reactions = nextCount;
    reactCount.textContent = nextCount;
    reactCount.classList.toggle('visible', nextCount > 0);

    if (db && drawing.id && !drawing.id.startsWith('local-')) {
        await updateDoc(doc(db, WALL_COLLECTION, drawing.id), {
            reactions: increment(delta)
        });
    } else {
        const drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
        const nextDrawings = drawings.map((item) => {
            if ((item.id || item.timestamp) === drawingKey) {
                return { ...item, reactions: nextCount };
            }
            return item;
        });
        localStorage.setItem('drawings', JSON.stringify(nextDrawings));
    }

    if (!hasReacted) {
        fireConfetti({
            particleCount: 20,
            spread: 40,
            origin: {
                x: clickEvent.clientX / window.innerWidth,
                y: clickEvent.clientY / window.innerHeight
            }
        });
    }
}

function fireConfetti(options = {}) {
    const count = Math.min(options.particleCount || 30, 80);
    const origin = options.origin || { x: 0.5, y: 0.5 };
    const colors = ['#ff6f91', '#72d6c9', '#92b8ef', '#ffa69e', '#25283d'];

    for (let i = 0; i < count; i += 1) {
        const bit = document.createElement('span');
        bit.className = 'confetti-bit';
        bit.style.left = `${origin.x * 100}%`;
        bit.style.top = `${origin.y * 100}%`;
        bit.style.background = colors[i % colors.length];
        bit.style.setProperty('--dx', `${(Math.random() - 0.5) * 220}px`);
        bit.style.setProperty('--dy', `${-40 - Math.random() * 170}px`);
        bit.style.setProperty('--spin', `${Math.random() * 520 - 260}deg`);
        document.body.appendChild(bit);
        setTimeout(() => bit.remove(), 900);
    }
}

function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'toast-message';
    message.textContent = '✨ Added to the garden!';
    document.body.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 2000);
}

document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);

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

function loadEmojiList() {
    const emojiList = document.getElementById('emojiList');
    emojiList.innerHTML = '';

    Object.entries(categoryEmojis).forEach(([key, emoji]) => {
        const item = document.createElement('div');
        item.className = 'emoji-item';

        const emojiText = document.createElement('span');
        emojiText.textContent = emoji;

        const keyText = document.createElement('span');
        keyText.textContent = key;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeEmoji(key));

        item.appendChild(emojiText);
        item.appendChild(keyText);
        item.appendChild(removeBtn);
        emojiList.appendChild(item);
    });
}

document.getElementById('addEmojiBtn').addEventListener('click', () => {
    const selectedEmoji = prompt('Paste one emoji for the new category:');
    if (!selectedEmoji) {
        return;
    }

    const exists = Object.values(categoryEmojis).includes(selectedEmoji);
    if (exists) {
        alert('This emoji is already added!');
        return;
    }

    const keyName = prompt('Enter a name for this category:');
    if (!keyName) return;
    const normalizedKey = keyName.trim().toLowerCase().replace(/\s+/g, '-');

    if (categoryEmojis[normalizedKey]) {
        alert('This category name already exists!');
        return;
    }

    categoryEmojis[normalizedKey] = selectedEmoji;
    syncCategoryButtons();
    setupCategoryButton(normalizedKey);
    updateFilterChips();
    loadEmojiList();
    localStorage.setItem('categoryEmojis', JSON.stringify(categoryEmojis));

    alert(`Added ${selectedEmoji} as "${normalizedKey}"!`);
});

function removeEmoji(key) {
    if (confirm(`Remove ${categoryEmojis[key]} (${key})?`)) {
        delete categoryEmojis[key];
        const btn = document.querySelector(`[data-category="${key}"]`);
        if (btn) btn.remove();
        updateFilterChips();
        loadEmojiList();
        localStorage.setItem('categoryEmojis', JSON.stringify(categoryEmojis));

        alert('Emoji removed!');
    }
}

function setupCategoryButton(category) {
    const btn = document.querySelector(`[data-category="${category}"]`);
    if (!btn || btn.dataset.bound === 'true') return;

    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => openDrawingModal(category));
}

document.getElementById('clearGardenBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to DELETE ALL DRAWINGS? This cannot be undone!')) {
        return;
    }

    if (!confirm('FINAL WARNING: This will permanently delete everything. Continue?')) {
        return;
    }

    try {
        await connectFirebase();

        if (db) {
            const querySnapshot = await getDocs(collection(db, WALL_COLLECTION));

            const deletePromises = [];
            querySnapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(doc(db, WALL_COLLECTION, docSnapshot.id)));
            });

            await Promise.all(deletePromises);
            console.log('All drawings deleted from Firebase');
        } else {
            localStorage.removeItem('drawings');
        }

        await loadDrawings();
        alert('Garden cleared successfully!');
    } catch (error) {
        console.error('Error clearing garden:', error);
        alert('Error clearing garden. Check console.');
    }
});

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
        const drawingsToRemove = allDrawings.slice(0, n);

        if (db) {
            const deletePromises = drawingsToRemove
                .filter((drawing) => drawing.id && !drawing.id.startsWith('local-'))
                .map((drawing) => deleteDoc(doc(db, WALL_COLLECTION, drawing.id)));
            await Promise.all(deletePromises);
            console.log(`Last ${n} drawings deleted`);
        } else {
            let drawings = JSON.parse(localStorage.getItem('drawings') || '[]');
            const removeIds = new Set(drawingsToRemove.map((drawing) => drawing.id));
            drawings = drawings.filter((drawing, index) => !removeIds.has(drawing.id || `local-${index}`));
            localStorage.setItem('drawings', JSON.stringify(drawings));
            loadLocalDrawings();
        }

        document.getElementById('removeLastN').value = '';
        alert(`Removed last ${n} drawing(s)!`);
    } catch (error) {
        console.error('Error removing drawings:', error);
        alert('Error removing drawings. Check console.');
    }
});

function loadSavedEmojis() {
    const savedEmojis = localStorage.getItem('categoryEmojis');
    if (!savedEmojis) return;

    try {
        const loadedEmojis = JSON.parse(savedEmojis);
        Object.assign(categoryEmojis, loadedEmojis);
    } catch (error) {
        console.warn('Saved emoji categories could not be loaded:', error);
    }
}
