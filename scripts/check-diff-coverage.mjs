import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG = {
  threshold: 90,
  lcovPath: path.resolve(process.cwd(), 'frontend/coverage/lcov.info'),
  baseBranch: process.env.BASE_BRANCH || 'origin/main',
  srcDir: 'frontend/src'
};

const IGNORE_PATTERNS = [
  /\.(spec|test)\./,
  /\bspecs\b/,
  /\btests\b/,
  /\b__tests__\b/,
  /\bfixtures\b/,
  /\bmocks\b/,
  /\bstubs\b/,
  /\bfakes\b/,
  /\b__mocks__\b/,
  /\bconstants\b/,
  /\bstatic\b/,
  /\blocales\b/,
  /\bi18n\b/,
  /\bstories\b/,
  /\bindex\.(ts|tsx|js|jsx)$/,
  /\btypes\.(ts|tsx)$/,
  /\.d\.ts$/,
  /\.config\./,
  /rc\.(js|ts|json)$/
];

function run() {
	try {
    console.log(`Starting diff coverage check against: ${CONFIG.baseBranch}`);

    const diffFiles = getChangedFiles(CONFIG.baseBranch, CONFIG.srcDir);
    
    if (diffFiles.length === 0) {
      console.log('No logic files changed in diff. Skipping.');
      process.exit(0);
    }

    validateLcovFile(CONFIG.lcovPath);

    const lcovContent = fs.readFileSync(CONFIG.lcovPath, 'utf-8');

    const failures = analyzeCoverage(diffFiles, lcovContent);

    handleResults(failures);

  } catch (error) {
    console.error('Critical Failure during coverage check:');
    console.error(error.message);
    process.exit(1);
  }
}

function getChangedFiles(base, dir) {
  try {
    const command = `git diff --name-only --diff-filter=d ${base}...HEAD -- ${dir}`;
    
    return execSync(command)
      .toString()
      .trim()
      .split('\n')
      .filter(file => {
        if (!file) return false;
        const isSource = /\.(?:ts|tsx|js|jsx)$/.test(file);
        const isIgnored = IGNORE_PATTERNS.some(pattern => pattern.test(file));
        return isSource && !isIgnored;
      });
  } catch (e) {
    console.error(`Error fetching diff: ${e.message}`);
    return [];
  }
}

function validateLcovFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`LCOV file not found at ${filePath}`);
    process.exit(1);
  }
}

function analyzeCoverage(files, lcov) {
  const filesData = lcov.split('SF:');
  const failures = [];

  files.forEach(file => {
		const normalizedPath = file.replace('frontend/', '');

    const fileBlock = filesData.find(block => {
      const line = block.split('\n')[0].trim();
      return line.endsWith(normalizedPath);
    });

    if (fileBlock) {
      const total = parseInt(fileBlock.match(/LF:(\d+)/)?.[1] || 0);
      const covered = parseInt(fileBlock.match(/LH:(\d+)/)?.[1] || 0);
      const percent = total === 0 ? 100 : (covered / total) * 100;

      if (percent < CONFIG.threshold) {
        failures.push({ file, percent: percent.toFixed(2) });
      }
    } else {
      failures.push({ file, percent: 0 });
    }
  });

  return failures;
}

function handleResults(failures) {
  if (failures.length > 0) {
    console.error(`Diff coverage is below ${CONFIG.threshold}%!`);

    failures.forEach(f => {
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::error file=${f.file},line=1,title=Low Coverage::Coverage is only ${f.percent}%`);
      }
      console.error(`- ${f.file}: ${f.percent}%`);
    });

    process.exit(1);
  }

  console.log(`\n✨ Perfect! All changed files meet the ${CONFIG.threshold}% threshold.`);
}

run();
