'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

const caseData = readJson('data/process-case.json');
const actions = readJson('data/improvement-actions.json');
const assessment = readJson('data/assessment.json');

assert.equal(assessment.questionCount, assessment.questions.length, 'questionCount must match item count');
assert.equal(assessment.questions.length, 10, 'pilot should contain ten questions');
assert.equal(new Set(assessment.questions.map((q) => q.id)).size, assessment.questions.length, 'question IDs must be unique');
for (const question of assessment.questions) {
  assert.equal(question.options.length, 4, `${question.id} must have four options`);
  assert.ok(question.options.some((option) => option.score === 100), `${question.id} must have a top-scored option`);
  assert.ok(question.options.every((option) => typeof option.feedback === 'string' && option.feedback.length > 10), `${question.id} needs option feedback`);
  assert.ok(question.options.every((option) => typeof option.impact === 'string' && option.impact.length > 10), `${question.id} needs option impact analysis`);
  assert.ok(question.options.every((option) => typeof option.diagnosticTag === 'string' && option.diagnosticTag.length > 0), `${question.id} needs diagnostic tags`);
  assert.ok(question.options.every((option) => Number.isFinite(option.score) && option.score >= 0 && option.score <= 100), `${question.id} has an invalid score`);
  assert.ok(typeof question.bestExplanation === 'string' && question.bestExplanation.length > 20, `${question.id} needs a best-answer explanation`);
  assert.ok(typeof question.learningTip === 'string' && question.learningTip.length > 10, `${question.id} needs a learning tip`);
  assert.ok(typeof question.competency === 'string' && question.competency.length > 0, `${question.id} needs a competency mapping`);
  assert.ok(Number.isFinite(question.weight) && question.weight > 0, `${question.id} needs a positive scoring weight`);
}
assert.ok(assessment.questions.filter((q) => q.requiresReason).length >= 6, 'analytical items should require written reasoning');
assert.equal(caseData.baseline.demandPerShift, 80);
assert.equal(actions.length, 3);

// Load the browser module in a minimal Node global.
global.window = {};
require(path.join(root, 'assets/simulator.js'));
const simulate = global.window.ProcessSim.run;
assert.equal(typeof simulate, 'function');

const baseline = simulate({});
const baselineAgain = simulate({});
assert.deepEqual(baseline, baselineAgain, 'fixed-seed baseline must be reproducible');
assert.equal(baseline.demand, 80);
assert.equal(baseline.completed, 75);
assert.equal(baseline.bottleneck, 'packing');
assert.ok(baseline.stages.packing.workloadPercent > 90 && baseline.stages.packing.workloadPercent < 100);

const demandShock = simulate({ demand: 112 });
assert.ok(demandShock.stages.packing.workloadPercent > 100, 'demand shock should overload baseline packing capacity');

const extraPacker = simulate({ extraPacker: true });
assert.ok(extraPacker.stages.packing.workloadPercent < baseline.stages.packing.workloadPercent, 'extra packer should reduce packing workload');
assert.ok(extraPacker.totalCost > baseline.totalCost, 'extra packer should increase modeled shift cost');

const checklist = simulate({ checklist: true });
assert.ok(checklist.reworkRateObserved <= baseline.reworkRateObserved, 'checklist scenario should not increase modeled rework probability');

console.log('BPMN Decision Lab smoke tests passed.');
console.log(`Baseline: ${baseline.completed}/${baseline.demand} completed; packing workload ${baseline.stages.packing.workloadPercent.toFixed(1)}%; cycle ${baseline.averageCycle.toFixed(2)} min.`);
console.log(`Demand shock: packing workload ${demandShock.stages.packing.workloadPercent.toFixed(1)}%.`);
