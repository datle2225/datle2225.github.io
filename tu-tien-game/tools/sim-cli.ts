import { BRANCHES } from '../src/core/data';
import { SCENARIOS, winRate } from './simulate';

{
  const branches = BRANCHES.filter((b: any) => b.playable).map((b: any) => b.id);
  console.log(['Kịch bản'.padEnd(20), ...branches.map((b: string) => b.padEnd(14))].join(' '));
  for (const sc of SCENARIOS) {
    const cells = branches.map((b: string) => { const r = winRate(b, sc, 150); return `${(r.win * 100).toFixed(0)}% hp${(r.hp * 100).toFixed(0)}`.padEnd(14); });
    console.log([sc.name.padEnd(20), ...cells].join(' '));
  }
}
