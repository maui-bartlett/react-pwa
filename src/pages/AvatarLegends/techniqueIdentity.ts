type TechniqueIdentity = {
  approach: string;
  name: string;
  type: string;
};

function getTechniqueIdentityKey(technique: Pick<TechniqueIdentity, 'name'>) {
  return technique.name.trim().toLowerCase();
}

function getTechniquePersistenceKey(technique: TechniqueIdentity) {
  return [technique.type, technique.approach, technique.name]
    .map((value) => value.trim().toLowerCase())
    .join(':');
}

function dedupeTechniques<T extends TechniqueIdentity>(techniques: T[]) {
  const unique: T[] = [];
  const indexByKey = new Map<string, number>();

  techniques.forEach((technique) => {
    const key = getTechniqueIdentityKey(technique);
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, unique.length);
      unique.push(technique);
      return;
    }
    unique[existingIndex] = technique;
  });

  return unique;
}

export { dedupeTechniques, getTechniqueIdentityKey, getTechniquePersistenceKey };
export type { TechniqueIdentity };
