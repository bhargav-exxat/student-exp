import { Suspense } from "react"
import { CreateAssessmentClient } from "@/components/create-assessment-client"

/** `/[product]/create-assessment` — Create Assessment workspace page. */
export default function CreateAssessmentPage() {
  return (
    <Suspense fallback={null}>
      <CreateAssessmentClient />
    </Suspense>
  )
}
