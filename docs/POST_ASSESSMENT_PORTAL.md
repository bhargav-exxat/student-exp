# Post-Assessment Review Portal & Simulator

The **Post-Assessment Review Portal** is a high-fidelity, interactive interface designed for students to review their performance after submitting an assessment. The portal dynamically responds to proctor/instructor visibility settings, which can be previewed in real-time using the **Admin View Simulator** panel.

---

## 🏗️ Architecture & Component Location

* **Main Screen**: [`src/pages/exam/take.tsx`](file:///Users/bhargav.a/Documents/exxat-ui-project/src/pages/exam/take.tsx#L1140) (Phase 4: Submitted Portal)
* **Global Theme Hotkey Router**: [`components/theme-provider.tsx`](file:///Users/bhargav.a/Documents/exxat-ui-project/components/theme-provider.tsx#L40) (Prevents keypress collision on exam/instructions screens)

---

## 🌟 Key Features

### 1. Sticky Navigation & Exam Branding
* **Top Bar Alignment**: Matches the exam phase header exactly, showing the **Exxat Logo**, the **Exam Name** (*Anatomy & Physiology — Midterm Exam*), and the **Course Code** (*BIO-301-A*).
* **Sticky Position**: Anchored to the top of the viewport (`sticky top-0 bg-card z-40`) to remain visible when scrolling long review feeds.
* **Metadata Badge**: Highlights the completion status with a clean, low-contrast `Completed` pill.

### 2. High-Visibility Alert Banner
* **Alert Format**: Features a modern, styled banner right under the sticky header notifying the student:
  > *"Assessment Submitted Successfully! Your responses have been successfully recorded and logged."*
* **Aesthetics**: Styled with a left green highlight border (`border-l-4 border-l-emerald-500`) and a soft green background tint (`bg-emerald-500/10`) to provide instant validation.

### 3. Dynamic Results Classification & Grading Splits
The performance widget handles two primary states:
* **Pending Evaluation ("Grading")**: If subjective (e.g., essay) questions require manual faculty grading, the widget displays a spinner with a `"Grading"` status. It hides overall final scores and weight contribution gauges to prevent confusing or incomplete score displays.
* **Grading Complete**: Displays finalized objective and subjective marks:
  * **Objective score**: e.g., `22 / 25 pts (88%)`
  * **Subjective score**: e.g., `1.8 / 2.0 pts (90%)`
  * **Final Overall Grade**: Rendered as a bold, clean bottom row inline with the scorecard rather than nested in a secondary card.

### 4. Course Grade Contribution Gauge
* **Course Weight Roll-up**: Automatically calculates the final score rollup contribution (e.g., `22.04% / 25.00% Course Weight`) using the formula: `Earned Score (%) × Course Weight (%)`.
* **Visibility Control**: Fully hides when subjective evaluation is pending and becomes visible once grading is complete.

### 5. Section-Level Breakdown with Visibility Locks
* **Breakdown Panel**: Displays points earned on a per-section basis (e.g., Section 1: Musculoskeletal, Section 2: Nervous System).
* **Granular Visibility**: Instructors can hide individual sections. Hidden sections display a lock icon with a `"Hidden"` badge.
* **Pending Section Grading**: If subjective grading is in progress, subjective sections display `"Evaluation in progress"` rather than incorrect partial totals.

### 6. Interactive Answer Key & Rationale Viewer
The viewer renders answer keys based on **4 distinct instructor-defined visibility types**:
1. **Correct Answers Only**: A dense grid showing question numbers and correct options (A, B, C, etc.) with a mock PDF download.
2. **Correct Options + Student Response**: Highlights the correct answer alongside the student's selected answer, highlighting matches (correct) and mismatches (incorrect).
3. **Correct Answers + Rationale + Student Response**: Renders the complete question body, student response, correct answer, and the educational rationale for the answer.
4. **Study Guide (Rationale Only)**: Renders the questions and their rationales only, acting as a study guide.

---

## 🎛️ Admin View Simulator (Collapsible Panel)

A collapsible blueprint-style control panel is pinned to the right side of the portal. It allows developers and designers to simulate student experiences under various instructor settings:

| Simulator Control | Description | Dynamic Impact |
| :--- | :--- | :--- |
| **Post-Assessment Visibility** | Checkbox to toggle student results visibility. | When disabled, hides all widgets and displays: *"Results are being processed by the faculty. You will receive an email when they are finalised."* |
| **Results Classification** | Button group: **Score**, **Pass/Fail**, or **Hidden**. | **Score** shows raw points. **Pass/Fail** displays a bold PASS/FAIL badge (75% threshold). **Hidden** hides the performance widget. |
| **Show Section Breakdown** | Checkbox to toggle the section list. | Hides or shows the Section-Level Breakdown card entirely. |
| **Subjective Grading Status** | Button group: **Pending Evaluation** or **Grading Complete**. | **Pending** sets subjective questions to `"Grading"` state and hides rollup grades. **Complete** calculates final scores. |
| **Pre-Curving Active** | Toggle switch. | Shows a disclaimer banner: *"The current scores reflect your raw performance. Final results will be shared once the grading and curving process is complete."* |
| **Course Weight (%)** | Slider input (0% to 100%). | Changes the math and gauge boundaries of the Course Grade Impact widget. |
| **Key & Rationales Visibility** | Toggle switch. | Hides or shows the entire Answer Key & Rationale viewer widget. |
| **Answer Key View Types** | Radio button group selecting the 4 key display modes. | Changes the structure and detail level of the question viewer. |
| **Section Visibility Locks** | Individual checkboxes for Sections 1–6. | Toggles individual section scores between visible stats and a locked `"Hidden"` state. |

---

## ♿ Accessibility & Hotkey Collision Fix

* **Hotkey Collision Resolved**: Toggling the theme using the letter **D** (global `<ThemeHotkey />` listener) is now **disabled on all `/exam/` pages**. This ensures that pressing the key **D** during MCQs exclusively selects Option D or focuses dropdowns/blanks without shifting the user theme.
* **Color Filter Filters**: Compatible with the top bar's accessibility overlays (Protanopia, Deuteranopia, Tritanopia filters).
* **Scale Compatibility**: Inherits global text scaling overrides (100%, 150%, 200%) dynamically without breaking widget layout alignments.
