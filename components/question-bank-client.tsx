"use client"

/**
 * QuestionBankClient — hub page using ListPageTemplate + KeyMetrics + QuestionBankTable.
 * Route: /[product]/question-bank
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ListPageTemplate,
  type ViewTab,
} from "@/components/data-views"
import { KeyMetrics } from "@/components/key-metrics"
import { QuestionBankPageHeader } from "@/components/question-bank-page-header"
import { QuestionBankTable } from "@/components/question-bank-table"
import { QuestionBankSearchSheet } from "@/components/question-bank-search-sheet"
import { QUESTION_BANK_ITEMS } from "@/lib/mock/question-bank"
import { questionBankKpiMetrics, questionBankKpiInsight } from "@/lib/mock/question-bank-kpi"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"

const DEFAULT_TABS: ViewTab[] = [
  {
    id: "all-questions",
    label: "All Questions",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

export function QuestionBankClient() {
  const { productRootSegment } = useParams()
  const navigate = useNavigate()
  
  const [tabs, setTabs] = React.useState<ViewTab[]>(DEFAULT_TABS)
  const [activeTabId, setActiveTabId] = React.useState(DEFAULT_TABS[0].id)
  const [showMetrics, setShowMetrics] = React.useState(true)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [searchSheetOpen, setSearchSheetOpen] = React.useState(false)

  const items = QUESTION_BANK_ITEMS

  const metrics = React.useMemo(() => questionBankKpiMetrics(items), [items])
  const insight = React.useMemo(() => questionBankKpiInsight(items), [items])

  const count = items.length

  return (
    <>
      <PrimaryPageTemplate>
        <ListPageTemplate
          defaultTabs={DEFAULT_TABS}
          tabs={tabs}
          onTabsChange={setTabs}
          activeTabId={activeTabId}
          onActiveTabChange={setActiveTabId}
          getTabCount={() => count}
          showMetrics={showMetrics}
          exportOpen={exportOpen}
          onExportOpenChange={setExportOpen}
          exportTotalRows={count}
          header={
            <QuestionBankPageHeader
              questionCount={count}
              onAddQuestion={() => {
                // Demo: no-op add question
                console.info("[QuestionBank] Add Question clicked")
              }}
              onExport={() => setExportOpen(true)}
              onCreateAssessment={() => navigate(`/${productRootSegment}/create-assessment`)}
              showMetrics={showMetrics}
              onToggleMetrics={() => setShowMetrics(v => !v)}
            />
          }
          metrics={
            <KeyMetrics
              variant="flat"
              metrics={metrics}
              insight={insight}
              showHeader={false}
              metricsSingleRow
            />
          }
          renderContent={(_tab, _updateTab) => (
            <QuestionBankTable
              key={_tab.id}
              items={items}
            />
          )}
        />
      </PrimaryPageTemplate>

      <QuestionBankSearchSheet
        open={searchSheetOpen}
        onOpenChange={setSearchSheetOpen}
        assessmentTitle="PA Pharmacology Midterm"
      />
    </>
  )
}
