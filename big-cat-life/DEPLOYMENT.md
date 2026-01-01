# How to Host Your Game on the Web (Free)

The easiest way to share your game with a friend for free is using **GitHub Pages**. Since your game runs entirely in the browser (HTML/CSS/JS), this is a perfect solution.

## Prerequisites
1.  **GitHub Account**: If you don't have one, sign up at [github.com](https://github.com).
2.  **Git Installed**: You likely have this, but if not, download it from [git-scm.com](https://git-scm.com).

## Step 1: Prepare your Project
1.  Open your command prompt / terminal in this project folder (`big-cat-life`).
2.  Initialize a git repository:
    ```bash
    git init
    ```
3.  Add your files:
    ```bash
    git add .
    ```
4.  Commit them:
    ```bash
    git commit -m "Initial game release"
    ```

## Step 2: Create a Repository on GitHub
1.  Go to GitHub and click the **+** icon (top right) -> **New repository**.
2.  Name it (e.g., `big-cat-race`).
3.  Make it **Public** (required for free GitHub Pages).
4.  Do **NOT** check "Initialize with README" (you already have code).
5.  Click **Create repository**.

## Step 3: Upload Code
GitHub will show you commands to "push an existing repository". Run these in your terminal:

```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M main
git push -u origin main
```

*(Replace `<YOUR-USERNAME>` and `<YOUR-REPO-NAME>` with your actual details)*

## Step 4: Turn on the Website
1.  On your GitHub repository page, go to **Settings** (top tab).
2.  In the left sidebar, click **Pages**.
3.  Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4.  Under **Branch**, select `main` and `/ (root)`.
5.  Click **Save**.

## Step 5: Play!
Wait about 1-2 minutes. GitHub will generate a link for you, usually looking like:
`https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

Send this link to your friend! They can play on any computer or mobile phone.
