# Free Deployment & Hosting Guide

Great news! Your **Raja Mantri** app is built as a static web application, which means it can be hosted completely for **FREE**. It does not require a database server, as all game state is handled locally on the device during the game.

## 1. Free Web Hosting
You can host the web version of your game for free on these platforms:

### **Vercel** (Recommended)
1.  Create a free account at [vercel.com](https://vercel.com).
2.  Install Vercel CLI: `npm i -g vercel`
3.  Run `vercel` in your project folder.
4.  Follow the prompts (keep defaults).
5.  **Cost**: $0/month.

### **Netlify**
1.  Create a free account at [netlify.com](https://netlify.com).
2.  Drag and drop your `dist` folder (created after `npm run build`) into their dashboard.
3.  **Cost**: $0/month.

### **GitHub Pages**
1.  Push your code to a GitHub repository.
2.  Enable GitHub Pages in Settings.
3.  **Cost**: $0/month.

## 2. Database Costs
**None.** This app uses "Local State" (React Context) to manage the game. Data is lost when the app is closed, which is perfect for a pass-and-play game. No external database (like Firebase or MongoDB) is needed, so there are **zero database costs**.

## 3. Mobile App Costs
- **Android**: Building the APK is free. Publishing to the Google Play Store requires a one-time $25 fee (Google's rule, not the app's). You can share the APK file with friends for free without the store.
- **iOS**: Building the app requires a Mac. Publishing to the Apple App Store requires a $99/year developer account.
