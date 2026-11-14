import { describe, it } from 'vitest';
import { BRANCHES } from '../src/core/data';
import { SCENARIOS, winRate } from '../tools/simulate';

/**
 * Báo cáo cân bằng: chỉ chạy khi gọi `npm run sim` (không chạy trong `npm test`).
 * Vitest 5 không còn kèm `vite-node`, nên báo cáo được in từ một test.
 */
const run = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.npm_lifecycle_event === 'sim';

describe('báo cáo cân bằng (npm run sim)', () => {
  (run ? it : it.skip)('in bảng tỉ lệ thắng của 8 nhánh', { timeout: 300000 }, () => {
    const branches = BRANCHES.filter((b: any) => b.playable).map((b: any) => b.id as string);
    const rows = [['Kịch bản'.padEnd(20), ...branches.map((b) => b.padEnd(14))].join(' ')];
    for (const sc of SCENARIOS) {
      const cells = branches.map((b) => { const r = winRate(b, sc, 150); return `${(r.win * 100).toFixed(0)}% hp${(r.hp * 100).toFixed(0)}`.padEnd(14); });
      rows.push([sc.name.padEnd(20), ...cells].join(' '));
    }
    console.log('\n' + rows.join('\n'));
  });
});
