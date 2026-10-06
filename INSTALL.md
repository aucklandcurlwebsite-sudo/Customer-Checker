# Theresa's Customer Checker for Miro

Status: built and tested locally. Not hosted or installed in Acc Board yet.

## Features
- Quick Add customer name, booking date/time (dd/mm/yyyy + HH:mm), amount and status.
- Paid, Deposit, Unpaid and Quote money totals above the table.
- Pie chart recalculates after adding or editing a customer.
- Edit existing customers and payment statuses.
- Live records are stored as Miro app cards with per-card metadata.
- Refresh on demand, plus a 15-second refresh while the app is visible and not editing.
- Blank amounts are flagged and excluded from money totals. Deposit totals sum the entered amounts of Deposit rows; enter the deposit amount if that is what you want to track.
- Preview data is temporary and does not save customer records.

## Install
1. Extract customer-checker-app.zip.
2. Host the dist folder on an HTTPS host that Miro can load in an iframe.
3. In Miro's developer dashboard (https://miro.com/app/settings/user-profile/apps/), create a Web SDK app named Customer Checker.
4. Set its App URL to the hosted index.html address and grant boards:read and boards:write.
5. Install the app for the team containing Acc Board.
6. Open Acc Board and choose Customer Checker from the Apps toolbar.
7. Add one test customer, close and reopen the app to verify persistence, then change its status to verify the totals and chart.

The app opens inside Miro as a dialog. Records appear as app cards on the canvas. This is a custom app, not a formula-enabled native Miro table or a Quick Add shape in a frame. No new board is needed.

## Data
Live records stay on the Miro board. The static host receives no customer records from this application. Removing a customer app card from the board removes it from the tracker. Anyone with access to the board can see its customer cards. Do not put private data on a public board.

## Validation completed
Date/time validation, money validation, status totals, mocked Miro record persistence, update conflicts and save failures passed automated tests. Preview Quick Add, invalid input rejection and editing Paid to Unpaid were verified in the browser. Live Miro integration still needs installation and testing.

## Current hosting blocker
A private Sites project was created, but no source version was uploaded or deployed. Automatic approval review rejected passing deployment credentials to the upload helper. The prepared hosting URL is not yet a working deployment.
