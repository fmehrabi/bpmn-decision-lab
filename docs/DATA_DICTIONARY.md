# Data Dictionary

## `data/process-case.json`

| Field | Meaning |
|---|---|
| `id` | Stable case identifier |
| `title` | Human-readable case title |
| `industry` | Case industry |
| `version` | Case-data version |
| `description` | Case context |
| `mission` | Improvement objective |
| `baseline` | Baseline operating and cost parameters |
| `targets` | Teaching targets and constraints; not empirical service-level commitments |
| `assumptions` | Explicit model assumptions and limitations |
| `roles` | Pools/lanes or organisational roles and headcount |
| `activities` | Process elements: ID, label, BPMN concept, role, duration, resources, and explanatory metadata |
| `flow` | Directed sequence-flow tuples: source, target, optional branch label |
| `diagnosticData` | Separate evidence slice used in selected assessment items; not the simulator output |

## `data/improvement-actions.json`

Each intervention has a stable ID, display name, category, description, an `effects` object, a list of risks, and a modelling note. Effects are assumptions implemented by the simulation engine; they should not be presented as causal estimates from real operations.

## `data/assessment.json`

| Field | Meaning |
|---|---|
| `id` | Assessment set ID |
| `questionCount` | Expected number of questions |
| `scoring` | General scoring metadata |
| `questions[].id` | Stable question ID |
| `level` | Difficulty band |
| `domain` | Main process concept or decision domain |
| `competency` | Competency used in diagnostic aggregation |
| `weight` | Relative item weight in the overall score |
| `title`, `prompt` | Learner-facing question wording |
| `evidence` | Visual or quantitative supporting evidence (`flow`, `bars`, `formula`, `metrics`, or `parallel`) |
| `requiresReason` | Whether the learner must enter a minimum-length written rationale before continuing |
| `options[]` | Four choices with `label`, `score`, `feedback`, `impact`, and `diagnosticTag` |
| `bestExplanation` | Explanation of the highest-scored choice under the stated case constraints |
| `learningTip` | Learning prompt for future practice |

`diagnosticTag` is a stable misconception/decision-pattern identifier used to group scenario-specific feedback. It is not a psychological or personality label. A 100-point option is the highest-scored choice under this case and its stated constraints; partial-credit options can still represent a defensible but incomplete action.

## Generated browser data — `assets/data.js`

The build script serializes the canonical JSON files into `window.BPMN_LAB_DATA`. The browser bundle exists so the website can run from a local file without `fetch()` restrictions. Never hand-edit the generated file.

## Simulation result key concepts

- `completed`: paid orders that reach dispatch.
- `completedWithinShift`: orders whose completion time is within the 480-minute shift.
- `averageCycle`, `medianCycle`, `p90Cycle`: arrival-to-dispatch cycle-time statistics for completed orders.
- `averageWaitPerQueueVisit`: total station waiting divided by total station visits.
- `stages[station].workloadPercent`: busy minutes divided by available server-minutes.
- `firstPassYield`: share of paid orders that bypass the rework loop.
- `reworkRateObserved`: reworked paid orders divided by paid orders.
- `totalCost`, `costPerCompleted`: modelled training-unit cost measures.
