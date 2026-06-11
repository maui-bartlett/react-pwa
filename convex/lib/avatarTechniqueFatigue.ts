export type TechniqueFatigue = {
  self: { mark: number; clear: number };
  target: { mark: number; clear: number };
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const FATIGUE_ACTION =
  /\b(mark(?:s|ed|ing)?|clear(?:s|ed|ing)?|inflict(?:s|ed|ing)?|suffer(?:s|ed|ing)?)\s+((?:an?\s+)?additional\s+|up\s+to\s+|more\s+than\s+)?(?:(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)[-\s])?fatigue\b/gi;

function fatigueCount(raw: string | undefined) {
  if (!raw) return 1;
  const parsed = /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : NUMBER_WORDS[raw.toLowerCase()];
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10, parsed)) : 1;
}

function isTargetAction(action: string, prefix: string, suffix: string, fullClause: string) {
  if (action.startsWith('inflict')) {
    return !(/\b(?:on|upon)\s+you\b/i.test(suffix) || /\bincoming attack\b/i.test(fullClause));
  }

  const targetSubject =
    /(?:foe|target|enemy|opponent|ally|them|they|combatant|attacker|character|everyone|anyone|someone)s?(?:\s+\w+){0,8}\s+(?:must\s+|may\s+|can\s+|would\s+|to\s+)?$/i;
  if (targetSubject.test(prefix)) return true;
  const targetContextIndex = Math.max(
    ...[
      'foe',
      'target',
      'enemy',
      'opponent',
      'ally',
      'them',
      'they',
      'everyone',
      'anyone',
      'someone',
    ].map((subject) => prefix.toLowerCase().lastIndexOf(subject)),
  );
  const selfContextIndex = Math.max(
    prefix.toLowerCase().lastIndexOf(' you '),
    prefix.toLowerCase().lastIndexOf(' yourself'),
    prefix.toLowerCase().lastIndexOf('the group'),
  );
  if (targetContextIndex > selfContextIndex) return true;
  if (/\b(?:the|a)\s+group(?:\s+\w+){0,5}\s+(?:must|may|can|would|to)\s+$/i.test(prefix))
    return true;

  if (action.startsWith('clear')) {
    if (/\bfrom\s+(?:them|the\s+target|an?\s+ally|a\s+foe|an?\s+enemy)\b/i.test(prefix))
      return true;
    if (/\bfrom\s+(?:them|the\s+target|a\s+target|an?\s+ally|a\s+foe|an?\s+enemy)\b/i.test(suffix))
      return true;
    if (/\b(?:heal|aid|help)\s+(?:them|the\s+target|a\s+target|an?\s+ally)\b/i.test(fullClause))
      return true;
  }

  if (action.startsWith('suffer')) {
    return !/(?:\byou\b|\byourself\b|\bthe group\b)(?:\s+\w+){0,8}\s+$/i.test(prefix);
  }

  return false;
}

function mergeFatigueValue(current: number, count: number, additional = false) {
  return additional ? current + count : Math.max(current, count);
}

export function deriveTechniqueFatigue(description: string, approach: string): TechniqueFatigue {
  const fatigue: TechniqueFatigue = {
    self: { mark: 0, clear: 0 },
    target: { mark: 0, clear: 0 },
  };
  const normalized = description
    .replace(
      /\([^)]*(?:normal|clearing)\s+1-fatigue[^)]*(?:evade\s+(?:and|&)\s+observe)[^)]*\)/gi,
      '',
    )
    .replace(/\bdo not mark fatigue\b/gi, '');
  const clauses = normalized.split(/[.;!?]+/);

  for (const clause of clauses) {
    FATIGUE_ACTION.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FATIGUE_ACTION.exec(clause))) {
      const action = match[1].toLowerCase();
      const modifier = (match[2] ?? '').toLowerCase();
      const count = fatigueCount(match[3]);
      const prefix = clause.slice(Math.max(0, match.index - 100), match.index);
      const suffix = clause.slice(FATIGUE_ACTION.lastIndex, FATIGUE_ACTION.lastIndex + 100);
      const owner = isTargetAction(action, prefix, suffix, clause) ? 'target' : 'self';
      const operation = action.startsWith('clear') ? 'clear' : 'mark';
      fatigue[owner][operation] = mergeFatigueValue(
        fatigue[owner][operation],
        count,
        modifier.includes('additional'),
      );
    }

    for (const alternative of clause.matchAll(
      /\binflict(?:s|ed|ing)?\b[^.;]{0,80}\bor\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]fatigue\b(?!\s+to\b)/gi,
    )) {
      fatigue.target.mark = mergeFatigueValue(fatigue.target.mark, fatigueCount(alternative[1]));
    }
    for (const alternative of clause.matchAll(
      /\bmark\b[^.;]{0,100}\bor\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]fatigue\s+to\b/gi,
    )) {
      fatigue.self.mark = mergeFatigueValue(fatigue.self.mark, fatigueCount(alternative[1]));
    }
    for (const additional of clause.matchAll(
      /\b(inflict|mark|clear|suffer)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+additional\s+fatigue\b/gi,
    )) {
      const action = additional[1].toLowerCase();
      const operation = action === 'clear' ? 'clear' : 'mark';
      const owner = action === 'inflict' ? 'target' : 'self';
      fatigue[owner][operation] = mergeFatigueValue(
        fatigue[owner][operation],
        fatigueCount(additional[2]),
        true,
      );
    }
    for (const incoming of clause.matchAll(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]fatigue\s+inflict(?:ed|s|ing)?\s+(?:on|upon)\s+you\b/gi,
    )) {
      fatigue.self.mark = mergeFatigueValue(fatigue.self.mark, fatigueCount(incoming[1]));
    }
  }

  if (approach === 'Evade & Observe') fatigue.self.clear += 1;
  return fatigue;
}

export function withTechniqueFatigue<T extends Record<string, unknown>>(
  technique: T,
): T & {
  fatigue: TechniqueFatigue;
} {
  const description = typeof technique.description === 'string' ? technique.description : '';
  const approach = typeof technique.approach === 'string' ? technique.approach : '';
  return { ...technique, fatigue: deriveTechniqueFatigue(description, approach) };
}
