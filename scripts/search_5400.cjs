const fs = require('fs');
const lines = fs.readFileSync('C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
for (const l of lines) {
  if (l.includes('5400') && !l.includes('"step_index":5400')) {
    console.log(l.substring(0, 200));
  }
}

