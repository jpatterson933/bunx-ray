import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import path from 'path';

const cli = path.resolve('dist/cli.js');
const fixture = path.resolve('fixtures/webpack-sample.json');

describe('CLI smoke tests', () => {
  it('prints legend and summary by default', async () => {
    const { stdout } = await execa('node', [cli, fixture, '--cols', '20', '--rows', '6']);
    expect(stdout).toMatch(/Legend/);
    expect(stdout).toMatch(/Total bundle/);
  });

  it('grid-only hides legend and summary', async () => {
    const { stdout } = await execa('node', [cli, fixture, '--grid-only', '--cols', '20', '--rows', '6']);
    expect(stdout).not.toMatch(/Legend/);
    expect(stdout).not.toMatch(/Total bundle/);
  });

  it('respects top flag', async () => {
    const { stdout } = await execa('node', [cli, fixture, '--top', '2', '--cols', '20', '--rows', '6']);
    const lines = stdout.split('\n').filter((l) => l.startsWith(' '));
    // last section lines start with space digit for table
    const tableLines = lines.filter((l) => /\d+ [░▒▓█]/.test(l));
    expect(tableLines.length).toBe(2);
  });
}); 