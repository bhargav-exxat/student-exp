# Context: Anatomy & Physiology Midterm Exam Portal

This file provides the essential context, configurations, features, and implementation details for a new assistant chat session to resume work on this repository.

---

## 1. Project Overview & Dev Environment
- **Core Technology Stack:** React, TypeScript, Vite, Tailwind CSS, FontAwesome icons.
- **Vite Dev Server URL:** [http://127.0.0.1:5000/](http://127.0.0.1:5000/) (runs as a background task).
- **Exam Taking Route:** `/exam/:examId/take` (e.g., [http://127.0.0.1:5000/exam/midterm/take](http://127.0.0.1:5000/exam/midterm/take)).
- **System Binaries Requirement:** Node and pnpm are located in `~/node-dist/bin`. Any terminal execution (such as `pnpm typecheck` or dev commands) **must** prepend the path:
  ```bash
  export PATH="/Users/bhargav.a/node-dist/bin:$PATH" && pnpm typecheck
  ```

---

## 2. Page & Assessment Flow
The portal has four main phases managed inside `take.tsx`:
1. **Instructions Phase (`phase = 'instructions'`):**
   - **Consolidated Entry:** The student lands directly on this page (there is no separate initial login or password gate screen).
   - **Left Column:** Displays Faculty Instructions and General Instructions (fixed height of `140px`, scrollable vertical container: `overflow-y-auto`).
   - **Right Column Sidebar Card (Borderless Inline Style):**
     - **Header Stats:** Displays Questions (27), Time (2h 00m), and Pass percentage (75%).
     - **Proctor Password Section:** Borderless text field with key/lock icons. Accepts `exam2026` to validate.
     - **Attestation Section:** Borderless inline checkbox with text: `"I understand the instructions and agree to all the terms and conditions"`, where "terms and conditions" is styled with an underline link.
     - **Start Exam CTA:** Enabled only when attestation is checked and password is typed. Pressing **Enter** inside the password field or clicking the CTA starts the exam (triggers section-intro).
     - **Accommodations Section:** Borderless inline text displaying active rules: *"Extra Time (+5 mins added)"* and *"External Keyboard Allowed"*.
     - **Metadata Details:** Clean, low-weight list (Exam Name, Course, Results display, Security level) at the very bottom.
2. **Section Intro Phase (`phase = 'section-intro'`):** Section overview showing instructions and total questions before commencing a section.
3. **Exam Phase (`phase = 'exam'`):** The active question-solving workspace.
4. **Submitted Phase (`phase = 'submitted'`):** Secure summary screen shown after submission.

---

## 3. Question Workspace & Navigator Sidebar
- **Tabbed Attachments:** Question 1 is structured to accept multiple attachments and displays them in a high-fidelity tabbed interface.
- **Hotspot SVG Question:** Renders SVG diagrams using explicit height/width attributes so SVG models don't collapse.
- **Keyboard Selection (`a/b/c/d/e`):** Pressing key matches will select MCQ choices or automatically focus match/blank dropdown inputs.
- **Questions Navigator Sidebar Drawer:**
  - Includes a **Flagged for Review** list at the top.
  - Lists circular question indices colored by status (Answered = Green, Unanswered = Gray, Flagged = Amber tag).
  - Includes a visual **Status Legend** at the bottom.

---

## 4. Final Submit Verification Modal
- Displays a real-time **Time Remaining** countdown.
- Has a close icon (`X`) in the top-right corner.
- **Overlay click-close is disabled** (clicking backdrop has no effect; must use `X` or CTAs).
- **Bottom Row CTAs:**
  - **Review Flagged (Left CTA):** Disabled if 0 flagged questions exist. If enabled, clicking it closes the modal and navigates the student directly to the first flagged question.
  - **Submit & Finish (Right CTA):** Submits responses, sets phase to `submitted`, and destroys active timer instances.

---

## 5. File Structure Reference
- [take.tsx](file:///Users/bhargav.a/Documents/exxat-ui-project/src/pages/exam/take.tsx): Component managing global states, phases, keyboard short-cuts, navigator sidebar, and submit verification modal.
- [question-renderer.tsx](file:///Users/bhargav.a/Documents/exxat-ui-project/src/pages/exam/question-renderer.tsx): Dynamic question template compiler.
- [questions-data.ts](file:///Users/bhargav.a/Documents/exxat-ui-project/src/pages/exam/questions-data.ts): Assessment question database.
- [walkthrough.md](file:///Users/bhargav.a/.gemini/antigravity/brain/12b57c8b-5d18-4c4a-a6a6-b51264cdff65/walkthrough.md): Comprehensive walkthrough and verification manual.
