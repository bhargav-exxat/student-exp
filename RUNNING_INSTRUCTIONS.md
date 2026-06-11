# Anatomy & Physiology Exam Portal - Running Instructions

This guide provides step-by-step instructions on how to set up, build, and run the Anatomy & Physiology Midterm Exam Portal locally.

---

## 📋 Prerequisites

Before running the project, make sure you have the following installed on your machine:
* **Node.js**: Version `20.0.0` or higher
* **Git**: To clone the repository
* **Package Manager**: `npm` (bundled with Node) or `pnpm`

---

## 🚀 Getting Started

### 1. Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/bhargav-exxat/student-exp.git
cd student-exp
```

### 2. Install Dependencies
Run the installation command depending on your package manager:
```bash
# Using npm
npm install

# Or using pnpm
pnpm install
```

### 3. Run the Development Server
Start the local server:
```bash
# Using npm
npm run dev

# Or using pnpm
pnpm run dev
```

The app will start running. By default, Vite will host it at **[http://localhost:5000/](http://localhost:5000/)** (or similar port indicated in the terminal output).

---

## 📝 How to Access and Start the Exam

1. Open your browser and navigate to the exam portal route:
   **[http://localhost:5000/exam/midterm/take](http://localhost:5000/exam/midterm/take)**
2. In the right-hand **Proctor Password** sidebar card, type the proctor password:
   👉 Password: `exam2026`
3. Check the **Attestation** box (*"I understand the instructions and agree to all the terms and conditions"*).
4. Click the **Start Exam** button (or press **Enter** inside the password field) to begin.

---

## ⌨️ Useful Keyboard Shortcuts

While taking the exam, the portal supports the following keyboard shortcuts:

| Action | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **View Keyboard Shortcuts Modal** | `Ctrl + /` | `Cmd + /` |
| **Flag / Bookmark Question** | `Alt + F` | `Option + F` |
| **Toggle Floating Calculator** | `Alt + C` | `Option + C` |
| **Next Question** | `Alt + N` | `Option + N` |
| **Previous Question** | `Alt + P` | `Option + P` |
| **Scratch / Strikeout Option** | `Alt + W` | `Option + W` |
| **Increase / Decrease Font Size** | `Ctrl + '+' / '-'` | `Cmd + '+' / '-'` |
| **Select Answer Option** | `A` / `B` / `C` / `D` / `E` | `A` / `B` / `C` / `D` / `E` |

---

## 🛠️ Verification & Building

To verify code correctness and create a production build:

* **Typechecking**:
  ```bash
  npm run typecheck
  ```
* **Production Build**:
  ```bash
  npm run build
  ```
