# DM Aluminium & Glass

This project is set up for a private admin dashboard and customer contact workflow.

## Storage and authentication

- Firebase Authentication is used for admin sign-in.
- Customer records are stored in Cloud Firestore.
- Firebase configuration is provided through local environment variables.
- The `.env` file must never be committed to the repository.
- Use `.env.example` as the configuration template.

## Backup/export
Use the dashboard export button to download customer records as CSV files.

## Recycle bin cleanup
The dashboard includes recycle bin cleanup options for old deleted records:
- clear 7-day old records
- clear 15-day old records

## Development
```bash
npm install
npm run dev