export type StageId = 'egg' | 'hatchling' | 'developer' | 'code_beast' | 'git_monster' | 'legend';

export interface Stage {
  id: StageId;
  title: string;
  minLevel: number;
}

export const STAGES: readonly Stage[] = [
  { id: 'egg', title: 'Egg', minLevel: 1 },
  { id: 'hatchling', title: 'Hatchling', minLevel: 2 },
  { id: 'developer', title: 'Developer', minLevel: 5 },
  { id: 'code_beast', title: 'Code Beast', minLevel: 10 },
  { id: 'git_monster', title: 'Git Monster', minLevel: 20 },
  { id: 'legend', title: 'GitHub Legend', minLevel: 50 },
];

export function stageForLevel(level: number): Stage {
  let current = STAGES[0];
  for (const stage of STAGES) if (level >= stage.minLevel) current = stage;
  return current;
}

export function nextStage(level: number): Stage | undefined {
  return STAGES.find((stage) => stage.minLevel > level);
}
