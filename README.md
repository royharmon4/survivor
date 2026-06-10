# Survivor 51 Rankings

A small private ranking app for Survivor 51 fans.

## What it does

- Shows the rumored Survivor 51 cast.
- Lets signed-in users rank the cast from most likely to win to least likely.
- Saves each user's ranking privately.
- Uses Netlify Identity for login and Netlify Blobs for storage.

## Netlify setup

Use these build settings:

```txt
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Then enable Identity in Netlify and turn on Google as an external provider. For a small private group, set registration to invite only.

## Local development

```bash
npm install
npm run dev
```

Function-backed saving works when running through Netlify Dev or after deploying to Netlify.
