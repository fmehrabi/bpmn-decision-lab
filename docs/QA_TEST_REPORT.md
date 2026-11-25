# Quality Assurance Summary — Pilot 0.4.1

## Automated checks

The repository includes repeatable checks that can be run locally or by GitHub Actions:

```bash
python scripts/build-data.py
python scripts/validate-project.py
node tests/smoke-test.js
node --check assets/app.js
node --check assets/simulator.js
node --check assets/data.js
```

The smoke test verifies question-bank structure, scoring ranges, feedback and consequence coverage, reproducibility of the baseline run, capacity overload under demand shock, staffing effects, and the checklist intervention.

## Browser interaction checks performed for this build

The application was loaded in Chromium with local assets embedded in the test document (no network requests). The following paths passed:

- Dashboard initialisation and navigation;
- Running the baseline simulation and rendering eight KPI cards;
- Selecting a process node and showing its activity details;
- Completing all ten assessment items using the highest-scored options;
- Enforcing required written-rationale length on analytical items;
- Showing the correct empty-report state before assessment completion;
- Rendering the completed report, competency profile, and ten Decision Replay items;
- Completing the assessment with weak answers and rendering diagnostic signals;
- Checking that the empty-report prompt is hidden when a completed report is available;
- Checking 375-, 390-, 414-, 768-, 900-, 1024-, 1440-, and 1600-pixel viewports for horizontal overflow.

These checks cover the current pilot's interaction paths, not a full cross-browser compatibility or accessibility certification. Recheck in current Chrome, Edge, and Firefox before classroom deployment.

## Known limits

- No empirical validation against a real organisation's event log.
- No full BPMN 2.0 editing or conformance engine.
- No server-side user accounts, cross-device sync, or instructor cohort dashboard.
- No automatic semantic grading of free-text rationales.
- Browser Local Storage can be cleared by the user or browser settings.
