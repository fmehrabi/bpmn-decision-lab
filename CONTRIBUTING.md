# Contributing

Thank you for helping improve BPMN Decision Lab.

## Before proposing a change

- Read `docs/PRODUCT_REQUIREMENTS.md` and `docs/SIMULATION_MODEL.md`.
- Keep the pilot browser-only unless a proposal explicitly changes the product boundary.
- Do not add external dependencies or network calls without documenting why they are required.
- Keep the fictional-data notice visible.

## Content changes

1. Edit canonical JSON under `data/`.
2. Run `python scripts/build-data.py`.
3. Run `node tests/smoke-test.js`.
4. Review the question wording, answer keys, partial-credit rationale, and consequence text.
5. Update the relevant documentation.

## Code changes

- Keep simulation logic separate from DOM code.
- Do not silently change metric definitions; update `docs/SIMULATION_MODEL.md`.
- Use escaped text when displaying learner-entered content.
- Check desktop and mobile layouts.
- Avoid claims of BPMN conformance unless a validator has actually been implemented and tested.

## Issues and pull requests

Please include the scenario, expected behavior, actual behavior, and a reproducible test case. For assessment changes, explain the learning objective and why each distractor is plausible but not preferred under the stated conditions.
