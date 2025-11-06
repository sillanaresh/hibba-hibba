# 😝 Fun Garden

A collaborative drawing game where anyone can doodle and share their creations in a shared garden!

## What is Fun Garden?

Fun Garden is a simple, playful web app where you can:
1. **Pick a category** - Choose from cat 🐱, dog 🐶, flower 🌸, fish 🐟, or duck 🦆
2. **Draw something cute** - Use the simple drawing canvas with colors
3. **Share instantly** - Your drawing appears in the garden for everyone to see
4. **Enjoy the chaos** - Watch as the garden fills up with everyone's silly doodles!

No login required. No rules. Just pure creative fun. Share the link with friends and see what weird and wonderful art fills up the garden!

## Features

- 🐱 🐶 🌸 🐟 🦆 Five drawing categories
- 🎨 Simple drawing canvas with 5 colors + eraser
- 🌱 Shared garden where all drawings appear in real-time
- 📱 Mobile-friendly touch drawing
- 🔥 Firebase backend for instant sharing
- ✨ Pleasant, calm, happy UI vibes

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `happy-garden` (or whatever you like)
4. Disable Google Analytics (not needed for this)
5. Click "Create Project"

### Step 2: Set Up Firestore Database

1. In your Firebase project, click "Firestore Database" in the left menu
2. Click "Create Database"
3. Choose "Start in **test mode**" (for now - you can secure it later)
4. Select a location (closest to you)
5. Click "Enable"

### Step 3: Get Firebase Config

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project Settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. Register app with nickname: `happy-garden-web`
6. Copy the `firebaseConfig` object

### Step 4: Add Config to Your App

1. Open `app.js` in your code editor
2. Find this section:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```
3. Replace it with YOUR actual Firebase config from Step 3

### Step 5: Test Locally

1. You need a local web server (can't just open HTML file due to Firebase)
2. Options:
   - **Python**: `python3 -m http.server 8000`
   - **Node.js**: `npx http-server`
   - **VS Code**: Install "Live Server" extension
3. Open `http://localhost:8000` in your browser
4. Try drawing something and submitting it!

### Step 6: Deploy to Vercel (Make it shareable!)

1. Install Vercel CLI: `npm i -g vercel`
2. In your project folder, run: `vercel`
3. Follow the prompts (just press Enter for defaults)
4. Get your live URL! Share it with anyone 🎉

## How It Works

### For Users:
1. Click a category button (Cat/Dog/Flower)
2. Draw in the canvas with your mouse or finger
3. Click "Add to Garden"
4. See your drawing appear in the shared garden!

### Technical Stack:
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Firebase Firestore
- **Hosting**: Vercel (or any static host)
- **Drawing**: HTML Canvas API

## Fallback Mode

If Firebase isn't configured, the app uses localStorage to save drawings. This means:
- ✅ You can test locally
- ❌ Drawings only visible on YOUR device
- ❌ Can't share with others

Once you add Firebase config, it automatically switches to cloud mode!

## File Structure

```
happy-garden/
├── index.html      # Main page structure
├── styles.css      # Pleasant, calm styling
├── app.js          # Drawing logic + Firebase
└── README.md       # This file
```

## Customization Ideas

- Add more categories (birds, trees, bugs!)
- Add more colors
- Bigger/smaller canvas
- Add usernames (optional)
- Add "like" buttons
- Add search/filter by category
- Add drawing animations

## Troubleshooting

**Drawings not appearing for others?**
- Make sure Firebase config is correct
- Check browser console for errors
- Verify Firestore is in test mode

**Can't draw on mobile?**
- Touch events are supported!
- Make sure you're not scrolling while drawing

**Deployment not working?**
- Make sure all files are uploaded
- Check that Firebase config is added
- Try clearing cache

## Support

Questions? Issues? Just ask! 🌸

---

Made with ❤️ for spreading joy through doodles!