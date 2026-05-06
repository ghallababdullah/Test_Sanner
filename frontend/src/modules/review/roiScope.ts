export function buildRelevantRoiNames(totalQuestions?: number) {
  const questionCount = Math.max(0, Math.min(32, totalQuestions ?? 32));
  const metadata = ["date", "surname", "name", "class"];
  const questions = Array.from({ length: questionCount }, (_, index) => `q${index + 1}`);
  const corrections = Array.from({ length: 8 }, (_, index) => [`corr${index + 1}_num`, `corr${index + 1}_answer`]).flat();
  return [...metadata, ...questions, ...corrections];
}
