# SPQnC Consultant website (static)

## Run locally
1. Open this folder in VS Code (File > Open Folder).
2. Install the "Live Server" extension, right-click index.html > Open with Live Server.

## Put it on GitHub
    git init
    git add .
    git commit -m "Initial site"
    git branch -M main
    git remote add origin https://github.com/<account>/spqnc-website.git
    git push -u origin main

## Deploy on Cloudflare Pages (free)
Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git >
pick the repo. Framework preset: None. Build command: (leave empty).
Output directory: /  (root). Every push to main redeploys.

## Before launch (placeholders to replace)
- Brand name: find-and-replace "SPQnC Consultant" once confirmed.
- Phone, WhatsApp and email in the Contact section.
- Form: replace YOUR_FORM_ID in index.html with the id from the form service.
- Logo: swap assets/emblem.png, favicon.png, logo-full.png for clean files.
- Services and process wording: client to confirm.
- Add a privacy note page and a real domain, then update <title> and meta tags.
