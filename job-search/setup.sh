#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js 18+ required"; exit 1; }
npm install -g pinloop
mkdir -p .claude/skills/pinloop
{
  printf -- '---\nname: pinloop\ndescription: Search, count, pull and judge job postings with the Pinloop CLI against the user'"'"'s stored resume and preferences. Use for any job-search request.\n---\n\n'
  pinloop skill
} > .claude/skills/pinloop/SKILL.md
echo "Installed pinloop $(pinloop --version) and wrote .claude/skills/pinloop/SKILL.md"
echo "Next: run 'claude' here and say: Run pinloop welcome and follow the instructions."
