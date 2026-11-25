# Assessment Design — Decision Arena

## Purpose

Decision Arena measures scenario-specific process reasoning, not personality and not general professional competence. It uses objective multiple-choice decisions with partial-credit scoring and optional written rationales. Free-text reasoning is retained for instructor review and is not automatically graded.

## Blueprint

| Item | Level | Domain | Competency | Main learning target |
|---|---|---|---|---|
| Q01 | Introductory | BPMN semantics | Model reading | Select an Exclusive Gateway for mutually exclusive payment outcomes |
| Q02 | Introductory | Diagnosis | Evidence analysis | Use queue and workload evidence to prioritize investigation |
| Q03 | Intermediate | Capacity | Quantitative reasoning | Compute 2 × 480 ÷ 12 = 80 orders per shift |
| Q04 | Intermediate | Rework | Root-cause thinking | Investigate causes before removing the return path |
| Q05 | Intermediate | Improvement | Intervention selection | Select a low-cost preventive intervention under a cost constraint |
| Q06 | Advanced | Redesign | Structural change | Convert payment activity to Service Task while retaining failure handling |
| Q07 | Advanced | Redesign | Parallelization | Use parallel split and join for independent mandatory checks |
| Q08 | Advanced | Capacity | Operational resilience | Compare 112-order demand with 80-order nominal packing capacity |
| Q09 | Advanced | Performance | Trade-off management | Reject an unbalanced time gain that harms first-pass yield |
| Q10 | Advanced | Managerial judgement | Model validation | Validate assumptions and sensitivity before operational recommendations |

## Scoring

Each option receives a score between 0 and 100. The overall score is weighted by the question's `weight` field:

`Overall = round( Σ(option score × question weight) / Σ(100 × question weight) × 100 )`

The current item bank uses partial credit (for example 20 or 55) where an option contains a partially defensible idea but is incomplete, poorly prioritized, or insufficiently evidence-based. Scores are instructional design choices and should be reviewed by the course instructor before formal grading.

Competency scores are weighted means of the answered items mapped to each competency. The report also shows the number of items supporting each score. It flags lower-scored choices as case-specific decision-risk or misconception signals and shows their stated impacts. A rationale-coverage indicator counts whether a rationale was entered; it does not assess rationale quality. A competency represented by one item provides limited evidence and must not be overinterpreted.

## Item feedback and consequence review

Every option has:
- **Feedback:** why the choice fits or conflicts with the stated conditions.
- **Impact:** a plausible process consequence if the organization followed it.

After submission, Decision Replay shows the learner's selection, the highest-scored option in the authored case, feedback, impacts, the best-option rationale, the learning tip, and the student's written rationale.

The highest-scored option is the preferred answer **for the stated case and constraints**. It is not a universal rule for every organization. Some alternatives may become reasonable under different evidence, risk tolerance, or policy constraints.

## Fairness and validity considerations

- The assessment is fixed-form in the pilot; all learners receive the same ten items in the same order.
- Assessment mode does not branch based on a student's previous answer, which helps preserve comparability.
- Visual evidence is rendered from the same case model, and the essential premises are repeated in the prompt.
- Some questions have a single best answer; partial credit recognizes defensible but incomplete reasoning.
- A score is not a validated psychometric measure. Do not use it for high-stakes decisions.
- Instructor review is required for the written rationales and for any summative use.

## Future improvements

- Add randomized parallel forms with equivalent learning targets.
- Pilot item difficulty and discrimination with a real student cohort.
- Improve distractor analysis using response patterns.
- Add multi-select, ranking, and short constructed-response tasks.
- Add scenario simulation mode where choices alter subsequent operating conditions, while keeping formal assessment mode fixed and comparable.
- Separate knowledge score, evidence-use score, and rationale rubric rather than merging all constructs into one number.
