// src/utils/embeddingUtils.ts

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:5050/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch embedding');
  }

  const data = await response.json();
  return data.embedding;
}

export async function cosineSimilarity(
  vec1: number[],
  vec2: number[],
): Promise<number> {
  const response = await fetch('http://localhost:5050/similarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedding1: vec1, embedding2: vec2 }),
  });

  if (!response.ok) {
    throw new Error('Failed to compute similarity');
  }

  const data = await response.json();
  return data.similarity;
}

// --- New: Load rule embeddings once ---
type RuleEmbeddingSet = Record<
  string,
  {
    variants: string[];
    embeddings: number[][];
  }
>;

let cachedRuleEmbeddings: RuleEmbeddingSet | null = null;

export async function loadRuleEmbeddings(): Promise<RuleEmbeddingSet> {
  if (cachedRuleEmbeddings !== null) {
    return cachedRuleEmbeddings;
  }

  const response = await fetch('/all_rule_embeddings.json');
  if (!response.ok) {
    throw new Error('Failed to load rule embeddings');
  }

  const data: RuleEmbeddingSet = await response.json();
  cachedRuleEmbeddings = data;
  return data;
}

// --- New: Match guess to correct rule ---
export async function isGuessCorrect(
  guessEmbedding: number[],
  ruleKey: string,
  threshold = 0.85,
): Promise<boolean> {
  const ruleEmbeddings = await loadRuleEmbeddings();
  const rule = ruleEmbeddings[ruleKey];

  if (!rule) {
    throw new Error(`Rule "${ruleKey}" not found in embeddings`);
  }

  const similarities = await Promise.all(
    rule.embeddings.map((correctEmbedding) => cosineSimilarity(guessEmbedding, correctEmbedding)),
  );

  return similarities.some((sim) => sim >= threshold);
}
