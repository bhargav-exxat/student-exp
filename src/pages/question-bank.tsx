import { Suspense } from "react"
import { QuestionBankClient } from "@/components/question-bank-client"

/** `/[product]/question-bank` — Question Bank hub page. */
export default function QuestionBankPage() {
  return (
    <Suspense fallback={null}>
      <QuestionBankClient />
    </Suspense>
  )
}
