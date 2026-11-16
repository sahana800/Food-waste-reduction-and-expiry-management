# FreshTrack website

A mobile-friendly food inventory and expiry-management web app.

## Run on a phone
1. Extract `freshtrack-website.zip`.
2. Upload the folder to a static hosting service such as GitHub Pages, Netlify, or Vercel (no build command is needed).
3. Open the published HTTPS link in Chrome on your phone.
4. In Chrome, tap the three-dot menu and choose **Add to Home screen** or **Install app**.

For a quick local preview, open `index.html` on a computer. PWA offline installation/service-worker support requires HTTPS or localhost.

## Features
- Responsive dashboard and food inventory
- Add, search, edit, mark-used, restore, and delete food items
- Expiry status and alerts (expired / expiring in 3 days / fresh)
- Food category suggestions and editable shelf-life estimates by storage type
- Package date support and opened/unopened status
- Use-first list and simple pantry-based meal ideas
- Household profile details, an interactive shopping list, and food-waste log
- Donation pickup status tracking (available / reserved / collected)
- Optional browser expiry notifications while the website is open
- CSV inventory export
- Full JSON backup and restore including profile, shopping list, donations, and waste log
- Local browser storage and basic offline caching

## Important limitations
This is a client-side website, not a multi-user cloud service. Profile, household, inventory, shopping, and impact data stay in the current browser/device. The profile is not a login, and household details do not sync or share with other people. Browser reminders work only while the site is open and the browser grants notification permission. Secure accounts, cloud sync, household invites, real NGO matching, and reliable background push notifications require a backend and deployment configuration. Do not enter sensitive personal information.

## Expiry estimates
- The Add Food form suggests a category from the food name and estimates a date using typical shelf-life guidance for room temperature, refrigerator, or freezer storage and opened/unopened status.
- Dates are editable and saved with purchase date, storage, and package status. Inventory and dashboard alerts show days remaining.
- Estimates are general guidance only and are not guaranteed food-safety dates. Follow package instructions and local food-safety guidance.


## Deploy to Vercel
This project is a static website and does not need an API key, package install, or build command.
1. Create a new project in Vercel and import the project folder or upload the files from this package.
2. Keep the framework preset as Other.
3. Set the root directory to the folder containing index.html (the project root).
4. Leave Build Command and Output Directory empty, then deploy. Vercel will serve index.html from the project root.

The browser-stored inventory belongs to each visitor's device and is not synchronized between devices.


## Latest improvements
- Use package best-before/use-by dates before predictions; change dates manually anytime.
- Edit saved food, mark food used and restore it, sort by expiry, and undo a recent deletion.
- Export CSV or download/import a JSON backup. Imports merge and skip duplicates.
- Navigation uses a 2-column grid on phones and 4 columns on desktop; cards and forms resize for narrow widths.
- Added household profile fields (stored locally), expiry notification preferences, shopping list, waste log, impact counts, meal ideas, and donation pickup statuses.
- Estimates are general household guidance only. They do not indicate that food is safe to eat.

