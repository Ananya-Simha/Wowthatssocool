# Thirty Days of Facts

One number a day, one fun fact each.

## Option A: one device only (any static host)
Upload just `index.html` to Render (Static Site), Vercel, Netlify, or GitHub Pages.
Progress saves in that browser. Each device keeps its own progress.

## Option B: synced across devices (Vercel)
1. Put this whole folder in a GitHub repo and import it into Vercel.
2. In the Vercel project, open Storage, add an Upstash Redis database (free tier is plenty), and connect it to the project. This sets the `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables for you.
3. Redeploy. The footer of the page will say "Synced across your devices".

Anyone who opens the link shares the same progress, so share it only with the one person it's for.

## Editing the facts
Open `index.html` and change the `FACTS` list near the top of the script.
