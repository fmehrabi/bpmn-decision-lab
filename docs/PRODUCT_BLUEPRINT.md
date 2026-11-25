# Product Blueprint — Full Learning Lab Concept

This document records the broader product direction beyond the current single-case pilot.

## Product positioning

BPMN Decision Lab is intended to be a browser-only process-learning environment. It should help learners move through a cycle of:

**Understand → Diagnose → Hypothesise → Experiment → Analyse → Redesign → Defend**

The core differentiator is not the number of BPMN editing tools. It is the instructional design that makes students use evidence, acknowledge constraints, compare options, and explain consequences.

## Proposed product modules

| Module | Student experience | Instructor value | Pilot status |
|---|---|---|---|
| Process Library | Browse industry-based process cases | Assign a case by learning objective | One fictional case |
| Process Explorer | Read a clickable As-Is model and inspect activities | Explain the process without distributing complex files | Implemented as simplified SVG |
| Improvement Toolkit | Apply constrained interventions instead of using a full modelling suite | Control the available decision space | Three interventions |
| Parameter Lab | Change demand, time, resources, and rework assumptions | Demonstrate sensitivity to assumptions | Implemented |
| Simulation Engine | Run a local process model and observe consequences | Create repeatable experiments | Simplified discrete-event engine |
| Analytics Center | Compare cycle time, queue wait, throughput, cost, quality, and utilisation | Discuss multi-objective performance | Core metrics implemented |
| To-Be Preview | See which elements are affected by selected interventions | Explain the relationship between action and model | Highlight-based conceptual preview |
| Decision Arena | Complete fixed-form, evidence-based scenario questions | Diagnose learning needs | Ten questions |
| Adaptive Practice | Receive targeted follow-up questions based on performance | Assign remedial practice | Future scope |
| Scenario Disruption | Respond to staff absence, demand surges, or equipment failure | Teach resilience and capacity planning | Future scope |
| Decision Replay | Review chosen and alternative decisions, feedback, and impacts | Support debrief and formative assessment | Implemented |
| Instructor Studio | Author cases, questions, constraints, and rubrics | Reuse content across cohorts | Future scope |
| Cohort Dashboard | Track learner progress and submissions | Review class-level learning patterns | Future scope; requires a privacy-reviewed backend |
| Collaboration | Work in groups with version history and comments | Facilitate team-based process improvement | Future scope; requires identity and synchronization design |
| AI Socratic Tutor | Receive question-led hints and simulated management challenges | Extend guided practice | Future scope; no AI service is connected in the pilot |

## Why constrained intervention tools can be better than a full BPMN editor

A complete modelling canvas introduces a large interaction burden. For an early process-analysis exercise, the learning objective may be to diagnose a bottleneck, not to learn every editor control. A constrained toolset can isolate the decision task:

- Students start from a common reference model.
- The instructor controls the set of permitted interventions.
- Every action maps to explicit model parameters or a defined structural change.
- The result is repeatable and comparable across students.
- The student must explain why an action is appropriate before or after testing it.

A later redesign level can introduce editable blocks or a full browser-based BPMN editor for selected BPMN elements.

## Suggested challenge formats

1. **Cost challenge:** reduce delay without exceeding a cost ceiling.
2. **Quality challenge:** reduce rework without removing necessary control.
3. **Capacity challenge:** absorb a demand increase with existing staff.
4. **Resource challenge:** move or add resources while observing bottleneck migration.
5. **Redesign challenge:** create two alternative To-Be models and compare them.
6. **Crisis challenge:** respond to an unplanned absence, equipment downtime, or demand spike.
7. **Open challenge:** propose an unlisted intervention and document assumptions and risks.

## Decision Arena modes

- **Diagnostic assessment:** fixed items to identify current learning needs.
- **Formative checkpoints:** short questions after a lab activity.
- **Summative assessment:** fixed and comparable forms, reviewed by the instructor.
- **Scenario simulation mode:** learner choices can change later scenario conditions and consequences. This should be separated from formal assessment to preserve comparability.
- **Decision Replay:** the learner explores what could have happened after alternative choices.

## Browser-only implementation boundary

The target experience remains inside the website and should not depend on a separate desktop tool, external API, or hosted simulator. That means the team owns the browser-based diagram renderer, supported BPMN behaviour, simulation model, assessment system, and analytics. It does not mean the pilot already implements all features of Visual Paradigm or full BPMN conformance.

## Long-term learning value

The lab should assess not only whether a student selected the highest-scored choice, but also whether they:

- noticed missing evidence;
- formulated a testable hypothesis;
- considered capacity, cost, quality, and risk together;
- interpreted results in light of model assumptions;
- distinguished local optimisation from system-level improvement;
- communicated the limits of the analysis.
