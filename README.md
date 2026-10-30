# Team Daily Update Tracker

A simple single-page HTML app for tracking daily team updates, with Excel import/export so the team can share data using a common spreadsheet workflow.

## Features
- Add daily updates for team members
- Track project, status, blockers, next steps, and hours
- Filter by member/project/status
- Edit and delete records
- Export data to Excel (.xlsx)
- Import data from an existing Excel file
- Data is saved in browser local storage for quick usage

## How to run
1. Open `index.html` directly in a browser, or
2. Run a local static server:

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Team-shared workflow
This app is designed for team collaboration using Excel files:
- One team member can export the latest data as `team_daily_updates.xlsx`
- The file can be shared via OneDrive, Google Drive, or a shared folder
- Team members can import the same Excel file back into the app when needed

## Files
- `index.html` - app layout
- `styles.css` - styling
- `script.js` - application logic and Excel import/export

## Notes
This is a front-end-only application and does not include a database or login system. It works well for lightweight team reporting and can be upgraded later to a backend-based shared app.
