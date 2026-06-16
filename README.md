# ◉ DotCom Events — QR Ticket Scanner

A professional Android app for scanning and validating event tickets linked to Google Sheets.

---

## Features

- **QR Code Scanner** — Real-time camera scanning with auto-detection
- **Google Sheets Integration** — Reads your ticket list and updates status live
- **Duplicate Prevention** — Detects already-checked-in tickets instantly
- **Scan History** — Local log with stats (checked in / duplicates / not found)
- **Flash Control** — Toggle torch for low-light venues
- **Offline Detection** — Clear error messages when network is unavailable

---

## Colour Scheme

| Token | Colour |
|-------|--------|
| Primary | Turquoise `#0ABFBC` |
| Background | White `#FFFFFF` |
| Text / UI | Dark Grey `#2D3142` |

---

## Building the APK via GitHub Actions (Free)

### Step 1 — Push this code to GitHub

```bash
# Create a new GitHub repository at github.com, then:
cd dotcom-events
git init
git add .
git commit -m "Initial DotCom Events build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dotcom-events.git
git push -u origin main
```

### Step 2 — Wait for the build (~15–25 minutes)

GitHub Actions will automatically start building when you push to `main`.

1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. Click the latest workflow run
4. Watch the build progress

### Step 3 — Download the APK

When the build completes (green checkmark):
1. Scroll to the bottom of the workflow run
2. Under **"Artifacts"**, click **DotComEvents-APK**
3. Extract the `.zip` — inside is `DotComEvents.apk`

### Step 4 — Install on Android

1. Transfer the APK to your Android device (email, USB, Google Drive)
2. On the device, go to **Settings → Security → Unknown Sources** (or "Install unknown apps")
3. Enable it for your browser or file manager
4. Tap the APK file to install

---

## Google Sheets Setup

### 1. Set up your spreadsheet

Create a Google Sheet with these columns (or map your own in Settings):

| A: Ticket ID | B: Attendee Name | C: Ticket Type | D: Status | E: Check-in Time |
|---|---|---|---|---|
| TKT-001 | Jane Smith | VIP | | |
| TKT-002 | John Doe | General | | |

The **Ticket ID** column should match the value encoded in your QR codes.

### 2. Create a Google Sheets API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Click **"Enable APIs and Services"** → search for **"Google Sheets API"** → Enable
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API Key
6. Recommended: Click **"Restrict Key"** → restrict to Google Sheets API

### 3. Make your sheet accessible

- **Option A (Easiest):** Click **Share** → **Anyone with the link** → **Editor**
- **Option B (More secure):** Use a Service Account (advanced)

### 4. Get your Spreadsheet ID

From your sheet URL:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

### 5. Configure the app

Open the app → **Settings tab** → enter:
- API Key
- Spreadsheet ID
- Sheet tab name (default: "Sheet1")
- Column mapping if different from default

Tap **TEST CONNECTION** to verify, then **SAVE CONFIGURATION**.

---

## How Scanning Works

1. Open the **Scan tab** and point camera at a QR code
2. The app looks up the QR value in your Google Sheet
3. **If valid:** Marks the ticket as `USED` and records the timestamp
4. **If already used:** Shows warning with original check-in time
5. **If not found:** Shows error — the code isn't in your sheet
6. Tap **"SCAN NEXT TICKET"** to continue

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Access denied" | Check API Key, make sure sheet is shared |
| "Spreadsheet not found" | Verify the Spreadsheet ID is correct |
| "Sheet not found" | Check the Sheet tab name matches exactly |
| Camera not working | Grant camera permission in device settings |
| Build fails | Check GitHub Actions logs for specific error |

---

## Tech Stack

- **React Native** (Expo 51)
- **expo-camera** — QR scanning
- **Google Sheets API v4** — ticket data
- **React Navigation** — tab navigation
- **AsyncStorage** — local config persistence
- **GitHub Actions** — free CI/CD APK builds

---

*DotCom Events — Professional event check-in, simplified.*
