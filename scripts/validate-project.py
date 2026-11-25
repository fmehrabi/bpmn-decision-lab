#!/usr/bin/env python3
"""Validate the static project structure and local HTML asset references."""
from __future__ import annotations
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "index.html", "README.md", "README.fa.md", "LICENSE", "CONTRIBUTING.md",
    "assets/app.js", "assets/styles.css", "assets/simulator.js", "assets/data.js", "assets/favicon.svg",
    "data/process-case.json", "data/improvement-actions.json", "data/assessment.json",
    "docs/PRODUCT_REQUIREMENTS.md", "docs/ARCHITECTURE.md", "docs/CASE_STUDY.md",
    "docs/SIMULATION_MODEL.md", "docs/ASSESSMENT_DESIGN.md", "docs/INSTRUCTOR_GUIDE.md",
    "docs/ROADMAP.md", "docs/PRODUCT_BLUEPRINT.md", "docs/DATA_DICTIONARY.md", "docs/QUESTION_AUTHORING_GUIDE.md", "docs/GITHUB_PUBLISHING_FA.md", "docs/PILOT_WALKTHROUGH_FA.md", "docs/QA_TEST_REPORT.md", "tests/smoke-test.js", "scripts/publish-to-github.ps1",
    ".github/workflows/quality-check.yml", ".github/PULL_REQUEST_TEMPLATE.md"
]
for item in REQUIRED:
    if not (ROOT / item).is_file():
        raise SystemExit(f"Missing required project file: {item}")

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []
        self.external_refs = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        for key in ("src", "href"):
            val = values.get(key)
            if val and val.startswith(("https://", "http://")):
                self.external_refs.append(val)
            elif val and not val.startswith(("#", "mailto:", "data:")):
                self.refs.append(val)

html = (ROOT / "index.html").read_text(encoding="utf-8")
parser = Parser(); parser.feed(html)
for ref in parser.refs:
    target = (ROOT / ref).resolve()
    if not target.exists():
        raise SystemExit(f"Broken local asset reference in index.html: {ref}")

app = (ROOT / "assets/app.js").read_text(encoding="utf-8")
missing = sorted(set(re.findall(r"\$\('([^']+)'\)", app)) - parser.ids - {"restartAssessment"})
if missing:
    raise SystemExit("Missing app.js element IDs: " + ", ".join(missing))

for name in ("process-case.json", "improvement-actions.json", "assessment.json"):
    json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))

assessment = json.loads((ROOT / "data/assessment.json").read_text(encoding="utf-8"))
if assessment.get("questionCount") != len(assessment.get("questions", [])):
    raise SystemExit("Assessment questionCount does not match its question bank")
for question in assessment.get("questions", []):
    if len(question.get("options", [])) != 4:
        raise SystemExit(f"{question.get('id')}: expected four options")
    if not any(option.get("score") == 100 for option in question["options"]):
        raise SystemExit(f"{question.get('id')}: missing highest-scored option")
    if any(not option.get("diagnosticTag") for option in question["options"]):
        raise SystemExit(f"{question.get('id')}: missing diagnostic tag")

if "window.BPMN_LAB_DATA =" not in (ROOT / "assets/data.js").read_text(encoding="utf-8"):
    raise SystemExit("assets/data.js does not look like a generated data bundle")
if ".hidden{display:none!important}" not in (ROOT / "assets/styles.css").read_text(encoding="utf-8"):
    raise SystemExit("The hidden utility class is missing from styles.css")

if parser.external_refs:
    raise SystemExit("The app shell should not load remote scripts, stylesheets, or assets: " + ", ".join(parser.external_refs))

runtime = "\n".join((ROOT / "assets" / name).read_text(encoding="utf-8") for name in ("app.js", "simulator.js", "data.js"))
for network_api in ("fetch(", "XMLHttpRequest", "WebSocket(", "EventSource("):
    if network_api in runtime:
        raise SystemExit(f"External network API found in browser runtime: {network_api}")

print("Project structure validation passed.")
print(f"Checked {len(REQUIRED)} required files, {len(parser.ids)} HTML IDs, and {len(parser.refs)} local asset references.")
