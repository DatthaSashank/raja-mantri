# Git & Vercel Continuous Deployment Guide

Follow these steps to link your local project to GitHub and set up automatic deployments with Vercel.

## 1. Create a GitHub Repository
1.  Go to [github.com/new](https://github.com/new).
2.  Repository name: `raja-mantri` (or any name you like).
3.  **Public/Private**: Choose whichever you prefer.
4.  **Do NOT** initialize with README, .gitignore, or License (we already have them).
5.  Click **Create repository**.
6.  Copy the URL (e.g., `https://github.com/YOUR_USERNAME/raja-mantri.git`).

## 2. Push Local Code to GitHub
Open your terminal in the project folder and run:

```powershell
# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Raja Mantri Game"

# Link to your new GitHub repo (Replace URL with yours)
git remote add origin https://github.com/YOUR_USERNAME/raja-mantri.git

# Push code
git branch -M main
git push -u origin main
```

## 3. Connect Vercel to GitHub
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Under **"Import Git Repository"**, you should see your new `raja-mantri` repo.
    - If not, click **"Adjust GitHub App Permissions"** to grant access.
4.  Click **Import** next to your repo.
5.  **Framework Preset**: It should auto-detect `Vite`.
6.  Click **Deploy**.

## 4. Continuous Deployment (Magic!)
Now, whenever you make changes:
1.  Edit code.
2.  Run:
    ```powershell
    git add .
    git commit -m "Fixed a bug"
    git push
    ```
3.  Vercel will **automatically detect the push**, build your app, and update the live site within seconds!
