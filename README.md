# app-insights-kit

One private page with downloads, rating and newest reviews for all your apps. **No dependencies**: plain Node 20+ and one HTML file.

## Add an app
Copy `apps/hringnring.json` to `apps/<name>.json` and fill in:
- `name`: shown on the tab
- `appId`: the app's Apple ID (App Store Connect → App Information → General → Apple ID)
- `vendorNumber`: App Store Connect → Payments and Financial Reports (top left)

## See it with sample data
```
npm run sample      # writes dist/index.html with made-up numbers
```

## Real numbers
Create an App Store Connect API key (Users and Access → Integrations → App Store Connect API; role Admin or Finance). Then:
```
ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_PRIVATE_KEY="$(cat AuthKey_XXXX.p8)" npm run pull
npm run build       # writes dist/index.html
```
Or let GitHub do it daily: add the three values as repository secrets (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`) and keep the repo **private**. The workflow commits `data/` and attaches `dist/index.html` to each run.

## Not included yet
- Deletions (uninstalls): they come from Apple's Analytics Reports API, a separate multi-step request. Next version.
- Sign-ups: they live in Firebase, which this kit deliberately does not use.
- Review emails.
- Star-only ratings: the API gives written reviews only, so the rating is the average of the newest written reviews.

Not yet tested against Apple's live API (no live app). Run `npm test` for the offline tests.
