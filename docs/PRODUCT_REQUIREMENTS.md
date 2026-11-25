# Product Requirements Document — BPMN Decision Lab

## 1. Product vision

Create a browser-only learning lab where graduate students learn to interpret BPMN process models, diagnose operational problems, design interventions, test assumptions, and justify process-improvement decisions with evidence.

The product is deliberately narrower than a full BPMN authoring suite. It prioritizes process reasoning and evidence-based decision-making over exposing every modelling control.

## 2. Target users

- **Student:** explores a case, runs experiments, completes assessments, and reviews decision consequences.
- **Teaching assistant / instructor:** explains the case, reviews student outputs, and later authors or assigns cases.
- **Maintainer:** updates process assumptions, interventions, question banks, and software behavior.

## 3. Learning outcomes

A learner should be able to:

1. Read a simplified BPMN process and identify the semantics of tasks, events, exclusive and parallel gateways, sequence flow, and rework paths.
2. Distinguish processing time, waiting time, cycle time, throughput, resource utilisation, and quality measures.
3. Form a testable hypothesis using case evidence.
4. Select a process intervention that respects resource, cost, and quality constraints.
5. Compare baseline and intervention scenarios and identify trade-offs.
6. Explain uncertainty and model limitations before making a managerial recommendation.

## 4. Product principles

- Keep every learner activity inside the website.
- No external API, login service, hosted simulator, or third-party runtime dependency.
- Separate canonical case data from rendering and simulation logic.
- Show assumptions beside results; never present simulated values as observed business facts.
- Reward defensible reasoning, not only selecting the nominally best option.
- Do not equate a shorter cycle time with overall process improvement.
- Make the assessment diagnostic and formative; instructor judgement remains necessary for free-text reasoning.

## 5. Functional scope — pilot

### FR-01: Case overview
The learner can review case context, mission, boundaries, roles, and learning objectives.

### FR-02: Process explorer
The learner can inspect a simplified process diagram. Selecting a node reveals the task type, description, time, role/resource count, input, and output where available.

### FR-03: Scenario controls
The learner can change demand, packer count, packing duration, rework rate, and the defined interventions.

### FR-04: Process simulation
The browser runs a deterministic-seed, single-shift discrete-event teaching model and returns throughput, completed-within-shift count, cycle-time measures, queue waiting, rework, first-pass yield, cost, and station workload.

### FR-05: Baseline comparison
The learner can compare the current scenario with the canonical baseline, including favourable and unfavourable changes.

### FR-06: To-Be preview
The interface highlights elements affected by the chosen interventions and explains the assumptions represented.

### FR-07: Assessment
The learner completes ten staged questions. Each question has four choices, a defined learning target, a difficulty level, evidence, feedback, consequence text, and a weighted score. Answers are not revealed during the assessment.

### FR-08: Diagnostic report
After completion, the system displays weighted overall score, competency-level scores, evidence counts, recommendations, and item-level decision replay.

### FR-09: Local persistence
Scenario history and answers can be retained in the current browser's Local Storage. The learner can export a report as JSON.

### FR-10: Offline operation
The website loads all assets and content locally and does not require network requests for core use.

## 6. Non-functional requirements

- Responsive layout for desktop, tablet, and mobile.
- Right-to-left Persian interface with accessible labels and keyboard focus for key controls.
- No external JavaScript libraries or CSS frameworks in the pilot.
- Avoid injecting learner-entered text as HTML; encode it before rendering.
- Deterministic random seed for reproducible baseline/intervention comparisons.
- Document all model assumptions and limitations.
- Keep question content and case data editable as JSON.

## 7. Explicit exclusions from pilot

- Full BPMN 2.0 graphical editor or formal conformance validator.
- Direct embedding of Visual Paradigm Desktop or use of its internal simulation engine.
- Multi-user collaboration or server-side accounts.
- AI grading of free-text reasoning.
- Empirical prediction or calibration against a real company.
- Full workforce calendar, shift scheduling, stochastic service distributions, and complex event subprocess behavior.

## 8. Success indicators for a classroom pilot

- At least 80% of test learners can complete the case without procedural help.
- Learners can explain why the highest-utilisation station is only a bottleneck candidate, not automatic proof of root cause.
- Learners correctly distinguish a capacity intervention from a quality intervention.
- Learners mention at least one trade-off in their final recommendation.
- Instructors can review answers and experiment settings without reconstructing the learner's steps.

These are proposed evaluation targets, not measured outcomes.

## 9. Future product questions

- How should the learner design a novel BPMN structure if the pilot only exposes intervention controls?
- What data format is needed for portable BPMN 2.0 interchange?
- Which validation rules should be checked automatically versus explained by an instructor?
- How should stochastic arrivals and task-time distributions be represented transparently?
- What is the right balance between adaptive assessment and fair, comparable summative assessment?
