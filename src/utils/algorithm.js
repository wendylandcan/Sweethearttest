import { CHARACTERS } from "../data/characters";

export function calculateScores(answers) {
  const scores = [0, 0, 0, 0, 0, 0];
  answers.forEach((answer) => {
    answer.score.forEach((val, i) => {
      scores[i] += val;
    });
  });
  return scores;
}

function euclideanDistance(p, c) {
  return Math.sqrt(p.reduce((sum, val, i) => sum + Math.pow(val - c[i], 2), 0));
}

export function findMatch(scores) {
  let minDist = Infinity;
  let matches = [];

  CHARACTERS.forEach((char) => {
    const dist = euclideanDistance(scores, char.coords);
    if (dist < minDist) {
      minDist = dist;
      matches = [char];
    } else if (Math.abs(dist - minDist) < 0.0001) {
      matches.push(char);
    }
  });

  if (matches.length === 1) return matches[0];

  // Tiebreak: highest scoring dimension wins
  const maxDimIdx = scores.indexOf(Math.max(...scores));
  return matches.reduce((best, char) =>
    char.coords[maxDimIdx] > best.coords[maxDimIdx] ? char : best
  );
}

export function getDimensionPercentages(scores) {
  const total = scores.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  return scores.map((v) => Math.round((Math.max(0, v) / total) * 100));
}
