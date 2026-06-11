import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import type { QuestionBankItem } from "@/lib/mock/question-bank"

export function questionBankKpiMetrics(rows: QuestionBankItem[]): MetricItem[] {
  const total = rows.length
  const highQuality = rows.filter(r => r.qualityTier === "high").length
  const highQualityPct = total > 0 ? Math.round((highQuality / total) * 100) : 0
  const topics = new Set(rows.map(r => r.topic)).size
  const difficultyScore: Record<string, number> = { easy: 1, moderate: 2, hard: 3 }
  const avgDiff =
    total > 0
      ? rows.reduce((acc, r) => acc + (difficultyScore[r.difficulty] ?? 2), 0) / total
      : 0
  const avgDiffLabel =
    avgDiff < 1.67 ? "Easy" : avgDiff < 2.33 ? "Moderate" : "Hard"

  return [
    {
      id: "total",
      label: "Total Questions",
      value: total,
      delta: "",
      trend: "neutral",
      href: "#",
      metricVariant: "hero",
    },
    {
      id: "high-quality",
      label: "High Quality",
      value: `${highQualityPct}%`,
      delta: highQualityPct >= 60 ? "+5%" : "",
      trend: highQualityPct >= 60 ? "up" : "neutral",
      href: "#",
    },
    {
      id: "topics",
      label: "Topics Covered",
      value: topics,
      delta: "",
      trend: "neutral",
      href: "#",
    },
    {
      id: "avg-difficulty",
      label: "Avg Difficulty",
      value: avgDiffLabel,
      delta: "",
      trend: "neutral",
      href: "#",
    },
  ]
}

export function questionBankKpiInsight(rows: QuestionBankItem[]): MetricInsight {
  const reviewCount = rows.filter(r => r.qualityTier === "review" || r.qualityTier === "poor").length
  const overexposed = rows.filter(r => r.lastUsedSemester !== null && r.usageCount > 1).length

  return {
    title: "Question Bank snapshot",
    description:
      rows.length === 0
        ? "Add questions to populate metrics."
        : overexposed > 0
          ? `${overexposed} question${overexposed === 1 ? "" : "s"} may be overexposed — consider rotating alternates before the next assessment.`
          : reviewCount > 0
            ? `${reviewCount} question${reviewCount === 1 ? "" : "s"} flagged for psychometric review. Check p-value and point-biserial.`
            : `${rows.length} questions across ${new Set(rows.map(r => r.topic)).size} topics. Quality distribution looks healthy.`,
    href: "#",
    severity: overexposed > 0 ? "warning" : reviewCount > 0 ? "info" : "info",
    actionLabel: "Ask Leo",
  }
}
