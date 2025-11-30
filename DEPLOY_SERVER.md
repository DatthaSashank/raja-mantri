# Deployment Guide: Zero-G Heist

This guide will help you deploy your Multiplayer Game so friends can play over the internet.

## Part 1: Deploy the Server (Backend) to Render.com

Render is a cloud provider that offers a free tier for Node.js services.

1.  **Push to GitHub**: Ensure your latest code (including the `server` folder) is pushed to your GitHub repository.
2.  **Sign Up/Login**: Go to [dashboard.render.com](https://dashboard.render.com/) and log in with GitHub.
3.  **New Web Service**:
    - Click **New +** and select **Web Service**.
    - Connect your GitHub repository (`raja-mantri`).
4.  **Configure Service**:
    - **Name**: `raja-mantri-server` (or similar)
    - **Root Directory**: `server` (Important! This tells Render the app is in the subfolder)
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node index.js`
    - **Instance Type**: Free
5.  **Deploy**: Click **Create Web Service**.
6.  **Wait**: Render will build and start your server. Once done, copy the **Service URL** (e.g., `https://raja-mantri-server.onrender.com`).

## Part 2: Configure Frontend for Production

Now that you have a live server URL, you need to tell your frontend to connect to it.

1.  **Go to Vercel**: Log in to your Vercel dashboard where the frontend is deployed.
2.  **Settings**: Go to your project -> **Settings** -> **Environment Variables**.
3.  **Add Variable**:
    - **Key**: `VITE_SERVER_URL`
    - **Value**: Paste your Render Service URL (e.g., `https://raja-mantri-server.onrender.com`)
    - Click **Save**.
4.  **Redeploy**:
    - Go to **Deployments**.
    - Click the three dots on the latest deployment -> **Redeploy**.
    - This will rebuild your frontend with the new Server URL.

## Part 3: Play!

Once Vercel finishes redeploying, open your Vercel App URL. It should now connect to your Render server, allowing you to play with friends anywhere!

## Troubleshooting

### "Vercel asks for Login in Incognito/Other Devices"
If your friends see a Vercel login screen, it means **Deployment Protection** is on. To fix this:
1.  Go to your Vercel Project Dashboard.
2.  Click **Settings** -> **Deployment Protection**.
3.  Disable **Vercel Authentication** (Standard Protection).
4.  Click **Save**.
5.  Now your link should be public for everyone!
