# Architecture

## Runtime model

The pilot is a static browser application. `index.html` loads local CSS and JavaScript. There is no application server, remote API, database, authentication provider, analytics tracker, or third-party script dependency.

```text
index.html
   ├── assets/styles.css
   ├── assets/data.js          ← generated browser bundle
   ├── assets/simulator.js     ← ProcessSim.run(config)
   └── assets/app.js           ← UI, assessment, reporting, storage

Canonical content:
   data/process-case.json
   data/improvement-actions.json
   data/assessment.json
        │
        └── scripts/build-data.py ──> assets/data.js
```

## Data ownership

- `data/*.json` is the canonical, editable source.
- `assets/data.js` is generated to let the application open directly from `file://` without relying on `fetch()` (which is restricted for local files in many browsers).
- `scripts/build-data.py` regenerates that bundle.
- `app.js` consumes `window.BPMN_LAB_DATA` and `window.ProcessSim`.

## Simulation boundary

`simulator.js` is a pure in-browser simulation module exposed as `window.ProcessSim.run(config)`. It has no DOM access and can be tested independently. It returns aggregate measures and station-level workload information.

## Persistence boundary

Local Storage is used only for a small scenario history and assessment answers. These records stay in the user's browser profile. They are not synchronized or transmitted. Clearing browser storage removes them. The report JSON export is generated client-side.

## Security and privacy

- No credentials or secrets are required.
- No telemetry or analytics are loaded.
- User-entered reasoning is HTML-escaped before being re-rendered in the report.
- The case and assessment files contain fictional teaching content.
- If accounts, cloud saves, analytics, or real student records are added in a future version, privacy notices, authentication, access controls, retention rules, and a server security review will be required.

## BPMN representation

The current SVG is a simplified view of a single case. It is not a generic BPMN renderer, import/export engine, or standards validator. Its purpose is to teach the case flow and make nodes explorable.
