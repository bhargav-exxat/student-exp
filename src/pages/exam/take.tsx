import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme";
import { questionsData, Question } from "./questions-data";
import { QuestionRenderer } from "./question-renderer";

export default function ExamTakePage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { setTheme: setGlobalTheme } = useTheme();

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  // Phase State: 'instructions' | 'section-intro' | 'exam' | 'submitted'
  const [phase, setPhase] = React.useState<'instructions' | 'section-intro' | 'exam' | 'submitted'>('instructions');
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [attested, setAttested] = React.useState(false);

  // Exam States
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, any>>({});
  const [crossedOut, setCrossedOut] = React.useState<Record<number, string[]>>({});
  const [bookmarks, setBookmarks] = React.useState<Set<number>>(new Set());

  // Section intro targeting
  const [targetSectionId, setTargetSectionId] = React.useState(1);

  // Modal / Sidebar States
  const [isNavigatorOpen, setIsNavigatorOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
  const [isHelpFormOpen, setIsHelpFormOpen] = React.useState(false);
  const [helpComment, setHelpComment] = React.useState('');

  // Floating Tool States
  const [showCalculator, setShowCalculator] = React.useState(false);
  const [calcInput, setCalcInput] = React.useState('');
  const [calcResult, setCalcResult] = React.useState('');

  const [showKeyboard, setShowKeyboard] = React.useState(false);

  // Global Reference Modal State
  const [isGlobalRefOpen, setIsGlobalRefOpen] = React.useState(false);
  const [globalRefTab, setGlobalRefTab] = React.useState(0);

  // Settings / Accessibility States
  const [theme, setThemeState] = React.useState<'light' | 'dark' | 'contrast'>('light');
  const [fontSizePercent, setFontSizePercent] = React.useState<number>(100);
  const [colorFilter, setColorFilter] = React.useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');

  // Tab sync state to detect duplicate tabs running the same exam
  const [isDuplicateTab, setIsDuplicateTab] = React.useState(false);
  const isDuplicateTabRef = React.useRef(isDuplicateTab);

  // ==========================================
  // ADMIN SIMULATION STATES & DATA
  // ==========================================
  const [adminShowResults, setAdminShowResults] = React.useState(true);
  const [adminResultType, setAdminResultType] = React.useState<'score' | 'pass-fail' | 'hidden'>('score');
  const [adminGradingStatus, setAdminGradingStatus] = React.useState<'complete' | 'pending'>('pending');
  const [adminPreCurving, setAdminPreCurving] = React.useState(false);
  const [adminCourseWeight, setAdminCourseWeight] = React.useState(25);
  const [adminKeyVisibility, setAdminKeyVisibility] = React.useState(true);
  const [adminKeyType, setAdminKeyType] = React.useState<'answers-only' | 'match' | 'match-rationale' | 'rationale-only'>('match-rationale');
  const [adminSectionVisibility, setAdminSectionVisibility] = React.useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true
  });
  const [adminShowSectionPerformance, setAdminShowSectionPerformance] = React.useState(true);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState(true);
  const [keyFilter, setKeyFilter] = React.useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  // Master Answer Key
  const correctAnswers: Record<number, any> = {
    1: 'A',
    2: 'B',
    3: 'A',
    4: 'A',
    5: 'C',
    6: 'B',
    7: 'B',
    8: 'C',
    9: 'A',
    10: 'A',
    11: 'B',
    12: 'A',
    13: 'C',
    14: 'B',
    15: 'A',
    16: 'D',
    28: 'D',
    17: ['A', 'C', 'E'],
    18: ['C'],
    19: ['A', 'C', 'D'],
    20: ['B', 'D'],
    21: { blank1: 'Angiotensin I', blank2: 'Angiotensin II' },
    22: { blank1: 'Tissue Factor', blank2: 'X' },
    23: 'Dehydration impacts renal function...', // Subjective
    24: 'Asthma exacerbation pathophysiology...', // Subjective
    25: 'Mitral Valve',
    26: { 'CN I (Olfactory)': 'Smell', 'CN II (Optic)': 'Vision', 'CN VII (Facial)': 'Facial expression' },
    27: { Penicillins: 'Cell wall synthesis inhibitor', Macrolides: 'Protein synthesis inhibitor', Fluoroquinolones: 'DNA gyrase inhibitor' }
  };

  // Master Rationales
  const rationales: Record<number, string> = {
    1: "Myocardial infarction commonly presents with acute retrosternal chest pain/pressure that can radiate to the left arm, neck, or jaw, often accompanied by diaphoresis and shortness of breath.",
    2: "The patient is presenting with crushing substernal chest pain radiating to the left shoulder, diaphoresis, and nausea that was not relieved by nitroglycerin, which is classic for a myocardial infarction.",
    3: "High MCV (115 fL) indicates macrocytosis, and low B12 (110 pg/mL) explains the macrocytic anemia.",
    4: "Mid-systolic crescendo-decrescendo murmur is characteristic of Aortic Stenosis.",
    5: "Cerebellar dysfunction typically presents with an uncoordinated, wide-based ataxic gait.",
    6: "A papule is a solid, raised lesion less than 1 cm in diameter.",
    7: "Guidelines list Nitrofurantoin or TMP-SMX as first-line options for uncomplicated cystitis.",
    8: "Signs point to acute appendicitis, which is a surgical emergency requiring immediate evaluation.",
    9: "Testing pupillary light reflex and extraocular movements evaluates CN III (Oculomotor nerve).",
    10: "Low pH (<7.35) indicates acidosis. High PaCO2 (>45) indicates a respiratory cause. HCO3- is normal, indicating acute respiratory acidosis.",
    11: "Metformin's primary mechanism is decreasing hepatic glucose production (gluconeogenesis) and increasing peripheral insulin sensitivity.",
    12: "The arrow points to the C-shaped nerve fiber bundle connecting the hemispheres, which is the corpus callosum.",
    13: "Sepsis development is indicated by a spike in heart rate (>100 bpm) and temperature accompanied by a sharp decline in blood pressure starting at 12 hours.",
    14: "An irregularly irregular rhythm with absent P-waves is characteristic of atrial fibrillation.",
    15: "The absence of lung markings in the periphery of the hemithorax on the chest X-ray indicates a pneumothorax.",
    16: "Stable vitals and a sprained ankle represent a non-urgent triage case (Level 4/5).",
    28: "Stable vitals and a sprained ankle represent a non-urgent triage case (Level 4/5).",
    17: "Metoprolol, Atenolol, and Propranolol are beta-adrenergic antagonists (beta-blockers). Lisinopril is an ACE inhibitor and Amlodipine is a calcium channel blocker.",
    18: "Hyperthyroidism increases metabolic rates and stimulates the cardiovascular system, causing tachycardia (fast heart rate) and palpitations. Bradycardia is a classic symptom of hypothyroidism.",
    19: "ACE inhibitors inhibit angiotensin-converting enzyme, leading to accumulation of bradykinin (causing dry cough) and reduced aldosterone secretion (leading to potassium retention and hyperkalemia), and can cause life-threatening angioedema.",
    20: "Bell's palsy causes peripheral unilateral facial weakness affecting both the upper and lower face (including forehead). Ischemic stroke and brain tumors cause central weakness sparing the forehead, making central causes least likely here.",
    21: "Renin converts angiotensinogen into Angiotensin I, which is subsequently converted into Angiotensin II by Angiotensin-Converting Enzyme (ACE) primarily in the lungs.",
    22: "The extrinsic coagulation pathway is initiated by Tissue Factor (Factor III). Both intrinsic and extrinsic pathways converge at the common pathway to activate Factor X.",
    23: "Dehydration reduces intravascular volume, decreasing renal perfusion. In response, kidneys activate the renin-angiotensin-aldosterone system (RAAS) to conserve water/sodium, and release Antidiuretic Hormone (ADH) to increase water reabsorption in the collecting ducts.",
    24: "Asthma exacerbation is characterized by chronic airway inflammation leading to hyperresponsiveness. Exposure to triggers causes bronchoconstriction, airway edema, and mucus plugging, creating airway resistance and airflow limitation.",
    25: "The mitral (bicuspid) valve is located between the left atrium and left ventricle, allowing blood to flow into the left ventricle.",
    26: "CN I (Olfactory) controls smell. CN II (Optic) controls vision. CN VII (Facial) controls facial expression.",
    27: "Penicillins inhibit cell wall synthesis. Macrolides bind to the 50S ribosomal subunit to inhibit protein synthesis. Fluoroquinolones target DNA gyrase to prevent bacterial replication."
  };

  // Helper to check if a student's answer is correct
  const isQuestionCorrect = (q: Question) => {
    const studentAns = answers[q.id];
    const correctAns = correctAnswers[q.id];
    
    if (studentAns === undefined || studentAns === null) return false;
    
    if (q.type === 'mcq-single' || q.type === 'dropdown' || q.type === 'hotspot') {
      return studentAns === correctAns;
    }
    
    if (q.type === 'mcq-multiple') {
      if (!Array.isArray(studentAns)) return false;
      if (studentAns.length !== correctAns.length) return false;
      return studentAns.every(v => correctAns.includes(v));
    }
    
    if (q.type === 'fill-blank' || q.type === 'match') {
      const keys = Object.keys(correctAns);
      if (keys.length === 0) return false;
      return keys.every(k => studentAns[k] === correctAns[k]);
    }
    
    return false; // Subjective questions (essay) are graded by faculty
  };

  // Fill mock answers on submit if the user hasn't filled them
  const fillMockAnswers = () => {
    const newAnswers = { ...answers };
    questions.forEach(q => {
      if (newAnswers[q.id] === undefined || newAnswers[q.id] === "") {
        if (q.id === 3) {
          newAnswers[q.id] = 'C'; // mock wrong answer (correct is A)
        } else if (q.id === 14) {
          newAnswers[q.id] = 'A'; // mock wrong answer (correct is B)
        } else if (q.id === 19) {
          newAnswers[q.id] = ['A', 'C']; // mock partially wrong (correct is A, C, D)
        } else if (q.type === 'mcq-single') {
          newAnswers[q.id] = correctAnswers[q.id];
        } else if (q.type === 'mcq-multiple') {
          newAnswers[q.id] = correctAnswers[q.id];
        } else if (q.type === 'dropdown') {
          newAnswers[q.id] = correctAnswers[q.id];
        } else if (q.type === 'fill-blank') {
          newAnswers[q.id] = correctAnswers[q.id];
        } else if (q.type === 'essay') {
          if (q.id === 23) {
            newAnswers[q.id] = "Dehydration causes a drop in blood volume and pressure. The kidneys sense this through baroreceptors and macular densa cells, triggering renin release. Renin acts on angiotensinogen to produce Angiotensin I. ACE in pulmonary vasculature converts this to Angiotensin II, which triggers systemic vasoconstriction and signals the adrenal gland to secrete aldosterone. Aldosterone increases Na+ and water retention, conserving fluid.";
          } else {
            newAnswers[q.id] = "Asthma exacerbation is characterized by bronchospasm, mucous hypersecretion, and mucosal edema. Trigger exposure causes IgE crosslinking on mast cells, degranulation, and mediator release (leukotrienes, histamine). This narrows airway lumens, causing severe airflow limitation, wheezing, and dyspnea.";
          }
        } else if (q.type === 'hotspot') {
          newAnswers[q.id] = correctAnswers[q.id];
        } else if (q.type === 'match') {
          newAnswers[q.id] = correctAnswers[q.id];
        }
      }
    });
    setAnswers(newAnswers);
  };
  isDuplicateTabRef.current = isDuplicateTab;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const channelName = `exam-tab-sync-${examId || 'default'}`;
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel(channelName);
    } catch (e) {
      console.error("BroadcastChannel not supported", e);
      return;
    }

    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'PING') {
        if (!isDuplicateTabRef.current) {
          bc?.postMessage({ type: 'PONG' });
        }
      } else if (event.data && event.data.type === 'PONG') {
        setIsDuplicateTab(true);
      }
    };

    // Broadcast our presence to detect other instances
    bc.postMessage({ type: 'PING' });

    return () => {
      bc?.close();
    };
  }, [examId]);

  const setTheme = (newTheme: 'light' | 'dark' | 'contrast') => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      setGlobalTheme('dark');
    } else {
      setGlobalTheme('light');
    }
  };

  const handleCalcBtnClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === 'del') {
      setCalcInput((prev) => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return;
        const result = new Function(`return ${sanitized}`)();
        setCalcResult(String(result));
      } catch (err) {
        setCalcResult('Error');
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  };

  const handleKeyClick = (char: string) => {
    const currentVal = answers[currentQuestion.id] || "";
    if (char === 'Backspace') {
      handleAnswerChange(currentQuestion.id, currentVal.slice(0, -1));
    } else if (char === 'Space') {
      handleAnswerChange(currentQuestion.id, currentVal + " ");
    } else if (char === 'Enter') {
      handleAnswerChange(currentQuestion.id, currentVal + "\n");
    } else {
      handleAnswerChange(currentQuestion.id, currentVal + char);
    }
  };

  // Timer State (120 minutes = 7200 seconds)
  const [timeLeft, setTimeLeft] = React.useState(7200);

  // Load questions database
  const questions = questionsData;
  const currentQuestion = questions[currentQuestionIndex];

  // Trigger KaTeX auto-render to parse LaTeX formulas
  React.useEffect(() => {
    const renderMath = () => {
      if (typeof (window as any).renderMathInElement === "function") {
        (window as any).renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
        return true;
      }
      return false;
    };

    // Try rendering immediately
    if (!renderMath()) {
      // If scripts aren't loaded yet, poll for them
      const timer = setInterval(() => {
        if (renderMath()) {
          clearInterval(timer);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  });

  // Timer countdown hook
  React.useEffect(() => {
    if (phase !== 'exam' && phase !== 'section-intro') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fillMockAnswers();
          setPhase('submitted');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Keyboard Shortcuts Hook
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. View keyboard shortcuts: CTRL + / or CMD + /
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.code === 'Slash')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // If the exam is not in active phase, don't trigger exam-related shortcuts
      if (phase !== 'exam') return;

      // 2. Flag for review: ALT + F or Option + F
      if (e.altKey && (e.key.toLowerCase() === 'f' || e.code === 'KeyF')) {
        e.preventDefault();
        handleToggleBookmark(currentQuestion.id);
        return;
      }

      // 3. Calculator: ALT + C or Option + C
      if (e.altKey && (e.key.toLowerCase() === 'c' || e.code === 'KeyC')) {
        e.preventDefault();
        setShowCalculator((prev) => !prev);
        return;
      }

      // 4. Forward navigation: ALT + N or Option + N
      if (e.altKey && (e.key.toLowerCase() === 'n' || e.code === 'KeyN')) {
        e.preventDefault();
        handleNext();
        return;
      }

      // 5. Backward navigation: ALT + P or Option + P
      if (e.altKey && (e.key.toLowerCase() === 'p' || e.code === 'KeyP')) {
        e.preventDefault();
        handlePrevious();
        return;
      }

      // 6. Scratch an option: ALT + W or Option + W
      if (e.altKey && (e.key.toLowerCase() === 'w' || e.code === 'KeyW')) {
        e.preventDefault();
        const options = currentQuestion.options || [];
        if (options.length > 0) {
          const currentAnswers = answers[currentQuestion.id];
          const selectedLetters = Array.isArray(currentAnswers)
            ? currentAnswers
            : currentAnswers
            ? [currentAnswers]
            : [];
          const currentCrossed = crossedOut[currentQuestion.id] || [];

          // Find the first option that is NOT selected and NOT crossed out to cross it out
          const optionToCross = options.find(
            (opt) => !selectedLetters.includes(opt.letter) && !currentCrossed.includes(opt.letter)
          );

          if (optionToCross) {
            handleToggleCrossOut(currentQuestion.id, optionToCross.letter);
          } else {
            // If all unselected options are already crossed out, toggle the first option
            const firstOpt = options[0];
            if (firstOpt) {
              handleToggleCrossOut(currentQuestion.id, firstOpt.letter);
            }
          }
        }
        return;
      }

      // 7. Adjust font size: Ctrl + '+' / '-' or CMD + '+' / '-'
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-' || e.code === 'Equal' || e.code === 'Minus')) {
        e.preventDefault();
        if (e.key === '+' || e.key === '=' || e.code === 'Equal') {
          setFontSizePercent((prev) => Math.min(200, prev + 50));
        } else if (e.key === '-' || e.code === 'Minus') {
          setFontSizePercent((prev) => Math.max(100, prev - 50));
        }
        return;
      }

      // 8. Select options or focus matching/blank dropdowns via A/B/C/D/E keys
      const optionKeys = ['a', 'b', 'c', 'd', 'e'];
      if (optionKeys.includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only run if the user is not currently typing in a text field
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true')
        ) {
          return;
        }

        const letter = e.key.toUpperCase();
        if (currentQuestion.type === 'mcq-single') {
          e.preventDefault();
          const hasOption = currentQuestion.options?.some((opt) => opt.letter === letter);
          if (hasOption) {
            handleAnswerChange(currentQuestion.id, letter);
          }
          return;
        }

        if (currentQuestion.type === 'mcq-multiple') {
          e.preventDefault();
          const hasOption = currentQuestion.options?.some((opt) => opt.letter === letter);
          if (hasOption) {
            const currentAnswers: string[] = Array.isArray(answers[currentQuestion.id])
              ? answers[currentQuestion.id]
              : [];
            const newAnswers = currentAnswers.includes(letter)
              ? currentAnswers.filter((x) => x !== letter)
              : [...currentAnswers, letter];
            handleAnswerChange(currentQuestion.id, newAnswers);
          }
          return;
        }

        if (currentQuestion.type === 'dropdown') {
          e.preventDefault();
          const options = currentQuestion.options || [];
          const optionIndex = e.key.toLowerCase().charCodeAt(0) - 97;
          if (optionIndex < options.length) {
            handleAnswerChange(currentQuestion.id, options[optionIndex].text);
          }
          return;
        }

        if (currentQuestion.type === 'match') {
          e.preventDefault();
          const matches = currentQuestion.matches || [];
          const matchIndex = e.key.toLowerCase().charCodeAt(0) - 97;
          if (matchIndex < matches.length) {
            const selectId = `match-select-${matchIndex}`;
            const selectEl = document.getElementById(selectId);
            if (selectEl) {
              selectEl.focus();
            }
          }
          return;
        }

        if (currentQuestion.type === 'fill-blank') {
          e.preventDefault();
          const blanks = currentQuestion.blanks || [];
          const blankIndex = e.key.toLowerCase().charCodeAt(0) - 97;
          if (blankIndex < blanks.length) {
            const selectId = `blank-select-${blankIndex}`;
            const selectEl = document.getElementById(selectId);
            if (selectEl) {
              selectEl.focus();
            }
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, currentQuestionIndex, answers, crossedOut, bookmarks, showCalculator]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };


  const handleStartExam = () => {
    if (password === 'exam2026') {
      setPasswordError('');
      setPhase('section-intro');
      setTargetSectionId(1);
    } else {
      setPasswordError('Invalid password. Please try again.');
    }
  };

  const handleBeginSection = () => {
    // Locate the first question in the target section
    const firstQIdx = questions.findIndex(q => q.sectionId === targetSectionId);
    if (firstQIdx !== -1) {
      setCurrentQuestionIndex(firstQIdx);
    }
    setPhase('exam');
  };

  const handleAnswerChange = (questionId: number, val: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleToggleCrossOut = (questionId: number, letter: string) => {
    setCrossedOut((prev) => {
      const current = prev[questionId] || [];
      const isCrossingOut = !current.includes(letter);
      const updated = isCrossingOut
        ? [...current, letter]
        : current.filter(x => x !== letter);

      if (isCrossingOut) {
        const q = questions.find(x => x.id === questionId);
        if (q) {
          if (q.type === 'mcq-single') {
            setAnswers(prevAns => {
              if (prevAns[questionId] === letter) {
                return { ...prevAns, [questionId]: "" };
              }
              return prevAns;
            });
          } else if (q.type === 'mcq-multiple') {
            setAnswers(prevAns => {
              const currentAns = prevAns[questionId];
              if (Array.isArray(currentAns) && currentAns.includes(letter)) {
                return { ...prevAns, [questionId]: currentAns.filter(x => x !== letter) };
              }
              return prevAns;
            });
          }
        }
      }

      return { ...prev, [questionId]: updated };
    });
  };

  const handleHelpSubmit = () => {
    setIsHelpFormOpen(false);
    setHelpComment("");
    setIsSettingsOpen(false);
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 bg-foreground text-background px-4 py-3 rounded-xl shadow-lg font-semibold text-xs flex items-center gap-2 animate-bounce z-50';
    toast.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500 text-base" /> Help request submitted successfully!';
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleToggleBookmark = (questionId: number) => {
    setBookmarks((prev) => {
      const updated = new Set(prev);
      if (updated.has(questionId)) {
        updated.delete(questionId);
      } else {
        updated.add(questionId);
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextQ = questions[currentQuestionIndex + 1];
      // Check if the next question belongs to a new section
      if (nextQ.sectionId !== currentQuestion.sectionId) {
        setTargetSectionId(nextQ.sectionId);
        setPhase('section-intro');
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } else {
      // Last question - open submit verification dialog
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Helper to determine if a question has been answered
  const isQuestionAnswered = (q: Question) => {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) return false;
    if (q.type === 'mcq-multiple') {
      return Array.isArray(ans) && ans.length > 0;
    }
    if (q.type === 'fill-blank') {
      const keys = Object.keys(ans);
      return keys.length > 0 && keys.every(k => ans[k] !== "");
    }
    if (q.type === 'match') {
      const keys = Object.keys(ans);
      return keys.length === (q.matches?.length || 0) && keys.every(k => ans[k] !== "");
    }
    return ans !== "";
  };

  const getAnsweredCount = () => {
    return questions.filter(isQuestionAnswered).length;
  };

  const getSectionDetails = (sectionId: number) => {
    const sectionQuestions = questions.filter(q => q.sectionId === sectionId);
    const count = sectionQuestions.length;
    const firstQ = sectionQuestions[0];
    let name = firstQ ? firstQ.sectionName : "";
    let instructions = "";

    switch (sectionId) {
      case 1:
        instructions = "Questions in this section focus on physiological concepts and clinical findings. Select the single best answer for each question.";
        break;
      case 2:
        instructions = "Select all correct options for each question. Points are awarded only when all correct options are selected.";
        break;
      case 3:
        instructions = "Complete the sentences by selecting the correct medical term from each inline dropdown.";
        break;
      case 4:
        instructions = "Write a comprehensive explanatory essay for each prompt. You may use the mockup dictation button to record your response.";
        break;
      case 5:
        instructions = "Identify anatomical structures on the SVG model. Click the hotspot button corresponding to the named target.";
        break;
      case 6:
        instructions = "Match each item in the left column with its correct corresponding partner in the right dropdown.";
        break;
    }

    return { name, count, instructions };
  };

  const activeSectionInfo = getSectionDetails(targetSectionId);

  // Progress Bar Details
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${
        theme === 'dark'
          ? 'dark theme-dark bg-background text-foreground'
          : theme === 'contrast'
          ? 'theme-contrast bg-[#000] text-[#fff]'
          : 'theme-light bg-background text-foreground'
      }`}
      style={{
        fontSize: `${fontSizePercent}%`,
        filter: colorFilter !== 'none' ? `url(#${colorFilter})` : undefined
      }}
    >
      {/* Dynamic styling tags loaded directly inside the component for perfect encapsulation */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --exam-accent: oklch(50% .14 286.1);
          --exam-accent-light: oklch(94.5% .024 286.1);
          --exam-accent-border: oklch(78% .09 286.1);
          --state-answered-bg: oklch(93% .05 145);
          --state-answered-border: oklch(75% .1 145);
          --state-answered-text: oklch(40% .12 145);
          --state-flagged-bg: oklch(97% .03 85);
          --state-flagged-border: oklch(85% .08 85);
          --state-flagged-text: oklch(52% .12 85);
        }

        .dark.theme-dark {
          --exam-accent: oklch(65% .16 286.1);
          --exam-accent-light: oklch(25% .04 286.1);
          --exam-accent-border: oklch(45% .08 286.1);
          --state-answered-bg: oklch(25% .06 145);
          --state-answered-border: oklch(40% .1 145);
          --state-answered-text: oklch(75% .08 145);
          --state-flagged-bg: oklch(25% .04 85);
          --state-flagged-border: oklch(45% .08 85);
          --state-flagged-text: oklch(75% .1 85);
        }

        .theme-contrast {
          --background: #000000;
          --foreground: #ffffff;
          --card: #000000;
          --border: #ffffff;
          --muted: #1a1a1a;
          --muted-foreground: #cccccc;
          --exam-accent: #00ffff;
          --exam-accent-light: #002222;
          --exam-accent-border: #00ffff;
          --state-answered-bg: #003300;
          --state-answered-border: #00ff00;
          --state-answered-text: #00ff00;
          --state-flagged-bg: #332200;
          --state-flagged-border: #ffcc00;
          --state-flagged-text: #ffcc00;
        }

        .font-timer {
          font-family: Menlo, Monaco, Courier New, monospace;
        }

        .exam-select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-position: right 0.6em center;
          background-repeat: no-repeat;
          background-size: 1em;
          padding-right: 2.2em !important;
        }
        
        .dark .exam-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        }
      ` }} />

      {/* SVG COLORBLIND FILTERS */}
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" />
          </filter>
        </defs>
      </svg>

      {/* PHASE 1.5: GENERAL ASSESSMENT INSTRUCTIONS */}
      {phase === 'instructions' && (
        <>
          {/* HEADER */}
          <header className="border-b flex flex-col shrink-0 z-40 sticky top-0 bg-card border-border shadow-sm">
            <div className="h-14 flex items-center justify-between px-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <svg viewBox="0 0 514 164" className="hidden sm:block shrink-0 h-6 text-foreground" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Exxat Logo">
                  <path
                    d="M73.49 155.24C114.08 155.24 146.99 122.33 146.99 81.74C146.99 41.15 114.08 8.25 73.49 8.25C32.9 8.25 0 41.15 0 81.74C0 122.33 32.9 155.24 73.49 155.24Z"
                    fill="url(#exxat-gradient-header)"
                  />
                  <path
                    d="M0.59 90.99C4.6 122.92 29.09 148.47 60.5 154.09L102.46 116.36V102.3H86.83L102.46 88.25V74.2H86.83L102.46 60.14V46.09H50.56L0.59 90.99Z"
                    fill="#BE1E6D"
                  />
                  <path d="M102.47 116.36H50.56L58.68 102.3H102.47V116.36Z" fill="white" />
                  <path d="M102.47 60.13H58.68L50.56 46.08H102.47V60.13Z" fill="white" />
                  <path d="M102.47 88.24H66.79L70.85 81.21L66.79 74.18H102.47V88.24Z" fill="white" />
                  <path d="M39.22 74.18H66.8L58.68 60.13H39.22V74.18Z" fill="white" />
                  <path d="M39.22 102.3H58.68L66.8 88.24H39.22V102.3Z" fill="white" />

                  <g className="fill-current">
                    {/* E */}
                    <path d="M196 35.76L235.63 35.81C239.71 35.81 250.8 36.09 254.42 35.65L254.41 50.88C240.77 50.8 227.13 50.8 213.49 50.88L213.5 74.35C224.55 74.34 238.41 74.73 249.19 74.27L249.2 89.72C245.21 89.42 239.53 89.58 235.43 89.59L213.5 89.63L213.48 113L256.08 112.93L256.07 128.1C251.92 127.62 239.13 127.9 234.38 127.93C221.69 128 208.64 127.75 196 127.94V35.76Z" />
                    {/* x */}
                    <path d="M311.84 57.11C314.84 57.1 327.11 56.86 329.38 57.21L329.61 57.85C329.33 60.38 324.21 67.34 322.51 69.92C317.65 77.19 312.85 84.49 308.1 91.83C309.12 93.85 311.98 98.15 313.27 100.2L323.96 117.11C325.9 120.18 329.18 124.46 329.55 127.99C323.66 127.75 316.57 127.94 310.59 127.95C307.78 122.8 304.08 117.69 301.1 112.6C299.2 109.35 296.93 105.77 294.71 102.75C293.77 104.89 290.7 109.57 289.36 111.72C285.99 117.17 282.58 122.58 279.12 127.96C276.6 127.91 261.82 128.24 260.67 127.62C260.25 126.01 261.8 123.53 262.7 122.21C269.33 112.52 275.11 101.26 281.98 91.83C281.56 91.33 281.15 90.8 280.77 90.26C279.99 89.13 279.24 87.93 278.49 86.76C272.55 77.6 266.26 68.63 260.48 59.37C260.19 58.91 260.44 57.65 260.54 57.11C266.33 57.05 272.13 57.07 277.92 57.16C283.45 64.94 289.73 74.44 294.84 82.5C296.78 80.01 299.25 76.07 301.02 73.39L311.84 57.11Z" />
                    {/* x */}
                    <path d="M331.8 57.07C337.59 57.12 343.35 57.01 349.16 57.17C351.07 59.34 353.39 63.17 355.06 65.63C358.85 71.21 362.43 77.01 366.36 82.49C370.85 75.07 378.27 64.14 383.33 57.1C385.63 57.09 399.69 56.84 400.87 57.31C401.39 58.6 399.76 61.11 399.01 62.17C392.22 71.73 386.21 82.47 379.27 91.86C383.35 97.67 387.27 104.53 391.17 110.53C393.16 113.61 400.63 124.78 400.95 127.56C399.88 128.24 384.1 127.95 382 127.95C377.12 119.68 371.36 110.9 366.22 102.72C364.99 105.11 362.37 109.02 360.85 111.44C357.4 116.92 353.99 122.43 350.62 127.97C348.24 127.9 332.9 128.28 332.17 127.57C332.12 126.75 332.07 125.83 332.45 125.1C334.5 121.17 337.29 117.06 339.66 113.31L353.19 91.8C352.42 90.71 351.63 89.5 350.9 88.36C344.71 78.72 337.87 69.39 332.08 59.51C331.71 58.88 331.75 57.78 331.8 57.07Z" />
                    {/* a */}
                    <path d="M430.76 55.73C443.6 55.26 459.71 58.4 463.18 73.14C464.17 77.36 463.88 82.7 463.88 87.04L463.85 105.91C463.86 112.15 463.05 112.65 469.33 113.21C469.06 117.66 469.23 123.63 469.24 128.19C461.17 128.15 448.96 129.82 446.76 119.67C444.47 122.42 443.57 123.61 440.36 125.6C433.88 129.64 423.42 129.93 416.18 128.17C410.38 126.76 405.62 123.52 402.51 118.29C400.53 114.23 400.12 109.48 400.65 105.07C402.51 89.56 418.76 87.6 431.17 85.93C435.52 85.24 440.83 84.65 444.47 82.01C447.55 79.77 447.17 76.53 444.97 73.79C440.68 68.46 429.52 68.1 424.36 72.21C421.36 74.59 420.83 77.87 420.5 81.44C414.44 81.38 408.37 81.38 402.31 81.45C402.5 79.52 402.65 77.4 403.03 75.51C405.77 61.78 418.1 56.41 430.76 55.73ZM420.85 112.9C428.03 116.95 440.99 113.87 444.94 106.31C445.85 104.56 447.93 97.68 446.7 95.97L446.34 95.91C442.71 97.49 435.91 98.87 431.8 99.34C425.34 100.07 411.45 104.69 420.85 112.9Z" />
                    {/* t */}
                    <path d="M479.84 35.85C485.68 35.89 491.52 35.89 497.37 35.85C497.15 42.48 497.33 50.27 497.32 56.98L514.28 56.95L514.29 72.1C508.64 72.05 502.99 72.04 497.34 72.05L497.31 93.56C497.31 97.07 496.58 108.12 499.41 110.47C502.23 112.82 510.46 112.62 514.29 112.14L514.28 123.53L514.28 127.44C511.12 127.9 507.91 128.15 504.7 128.19C479.71 128.49 479.89 117.27 479.92 96.95C479.95 88.66 479.94 80.38 479.88 72.09C479.84 35.85 479.84 35.85 479.84 35.85Z" />
                  </g>

                  <defs>
                    <linearGradient id="exxat-gradient-header" x1="28.37" y1="134.25" x2="117.19" y2="30.9" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stop-color="#E21C79" />
                      <stop offset="1" stop-color="#EF609D" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="w-px h-5 hidden sm:block bg-border shrink-0"></div>
                <div className="flex flex-col min-w-0">
                  <h1 className="font-bold text-sm truncate text-foreground leading-tight">
                    Anatomy &amp; Physiology — Midterm Exam
                  </h1>
                  <span className="text-xs text-muted-foreground truncate font-medium">
                    BIO-301-A · AY 2025-2026 · Spring Term
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col justify-start items-center p-6 md:p-8 overflow-y-auto bg-background animate-card-enter">
            {/* Split layout container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto text-left items-start mt-4">
              
              {/* Left Column: Instructions (col-span-2) */}
              <div className="md:col-span-2 flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
                    Instructions
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Read the following carefully before you begin.
                  </p>
                </div>

                {/* Exam instructions */}
                <div className="p-5 rounded-xl border bg-card border-border shadow-xs flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-2">Exam instructions</h3>
                    <div className="text-xs leading-relaxed text-foreground/80 overflow-y-auto font-medium">
                      <p>Covers Chapters 12–18. Closed book. No reference materials. A proctor password will be provided at exam time.</p>
                      <div className="mt-3 border-t pt-3 border-border/60">
                        <span className="text-xs font-bold text-muted-foreground block mb-2">Reference Materials Available:</span>
                        <ul className="list-disc pl-4 text-xs flex flex-col gap-2 text-muted-foreground font-semibold">
                          <li className="flex items-center gap-1.5"><i className="fa-light fa-function" style={{ fontSize: "14px" }} /> Pharmacokinetic Formulas</li>
                          <li className="flex items-center gap-1.5"><i className="fa-light fa-calculator" style={{ fontSize: "14px" }} /> Dosage Calculations</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  <div className="text-xs leading-relaxed text-foreground/80 font-medium">
                    <p>By taking this assessment, you agree to complete all questions independently without the assistance of any unauthorized resources, other students, or external parties. You understand that any form of academic dishonesty may result in a failing grade, academic probation, or dismissal from the program in accordance with your institution's code of conduct.</p>
                  </div>
                </div>

                {/* Attestation Checkbox */}
                <div className="flex items-start gap-2 py-1 px-0.5 select-none text-left">
                  <input
                    type="checkbox"
                    id="attestation"
                    checked={attested}
                    onChange={(e) => setAttested(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border text-[var(--exam-accent)] focus:ring-[var(--exam-accent)] cursor-pointer"
                  />
                  <label htmlFor="attestation" className="text-xs font-medium text-foreground cursor-pointer select-none leading-normal">
                    I understand the instructions and agree to all the <span className="underline hover:text-[var(--exam-accent)] transition-colors">terms and conditions</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Exam Details & CTA Card (col-span-1) */}
              <div className="md:col-span-1 flex flex-col gap-5 p-5 bg-card border border-border rounded-2xl shadow-md sticky top-6">
                
                {/* 1. Exam summary */}
                <div className="grid grid-cols-3 gap-2 text-center border-b pb-4 border-border">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-foreground">{questions.length}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Questions</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-border">
                    <span className="text-base font-bold text-foreground">{Array.from(new Set(questions.map(q => q.sectionId))).length}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Sections</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-foreground">2h 00m</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Time</span>
                  </div>
                </div>

                {/* 2. Exam details */}
                <div className="flex flex-col gap-2 text-[10px] text-muted-foreground border-b pb-4 border-border/60">
                  <div className="flex justify-between items-center">
                    <span>Results</span>
                    <span className="font-semibold text-foreground/80 text-right">Released after instructor review</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Security</span>
                    <span className="font-semibold text-foreground/80 text-right">Lockdown browser</span>
                  </div>
                </div>

                {/* Accommodations */}
                <div className="flex flex-col gap-1.5 text-left text-amber-600 dark:text-amber-400 px-0.5 border-b pb-4 border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <i className="fa-solid fa-universal-access" />
                    Accommodations
                  </span>
                  <ul className="list-disc pl-4 text-[10px] leading-relaxed font-semibold flex flex-col gap-0.5 font-sans">
                    <li>Extra Time (+5 mins added)</li>
                    <li>External Keyboard Allowed</li>
                  </ul>
                </div>

                {/* 3. Password */}
                <div className="flex flex-col gap-1.5 text-left px-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assessment password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && attested && password) {
                          handleStartExam();
                        }
                      }}
                      placeholder="Enter assessment password"
                      className="w-full px-3 py-2.5 rounded-xl border bg-background border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-[var(--exam-accent)]/20 focus:border-[var(--exam-accent)] font-semibold transition-all"
                    />
                  </div>
                  {passwordError && (
                    <span className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                      <i className="fa-solid fa-circle-exclamation" /> {passwordError}
                    </span>
                  )}
                </div>

                {/* 4. Start CTA */}
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <button
                    onClick={handleStartExam}
                    disabled={!attested || !password}
                    className="w-full bg-[var(--exam-accent)] hover:opacity-90 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    Start Exam <i className="fa-light fa-play" />
                  </button>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Clicking 'Start Exam' will start the exam timer
                  </span>
                </div>

              </div>

            </div>
          </div>
        </>
      )}

      {/* PHASE 2: SECTION INTRO */}
      {phase === 'section-intro' && (
        <div className="flex-1 flex flex-row bg-background h-full overflow-hidden relative">
          
          {/* Left Sidebar: Section Navigation */}
          <div className="w-72 border-r border-border bg-card flex flex-col p-4 shrink-0 overflow-y-auto hidden md:flex">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 px-2 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-[var(--exam-accent)]" />
              Exam Sections
            </h3>
            <div className="flex flex-col gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((secId) => {
                const secDetails = getSectionDetails(secId);
                const isCurrent = targetSectionId === secId;
                return (
                  <button
                    key={secId}
                    onClick={() => {
                      setTargetSectionId(secId);
                    }}
                    className={`text-left p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 border ${
                      isCurrent
                        ? "bg-[var(--exam-accent-light)] border-[var(--exam-accent-border)] text-[var(--exam-accent)] shadow-xs"
                        : "border-transparent bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        Section {secId} of 6
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${isCurrent ? 'bg-[var(--exam-accent)]/15 text-[var(--exam-accent)]' : 'bg-muted text-muted-foreground'}`}>
                        {secDetails.count} Qs
                      </span>
                    </div>
                    <span className={`text-xs font-extrabold truncate leading-tight ${isCurrent ? "text-foreground" : "text-foreground/80"}`}>
                      {secDetails.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Area: Centered Section Intro Card */}
          <div className="flex-grow flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <div className="max-w-xl w-full text-center flex flex-col gap-6 animate-card-enter">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Section {targetSectionId} of 6
                </p>
                <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-4 text-[var(--exam-accent)]">
                  <i className="fa-light fa-layer-group" style={{ fontSize: "28px" }} />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
                  {activeSectionInfo.name}
                </h2>
                <p className="text-sm text-muted-foreground font-semibold">
                  Contains {activeSectionInfo.count} questions
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-2xl text-left shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Section Instructions
                </h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {activeSectionInfo.instructions}
                </p>
              </div>

              <button
                onClick={handleBeginSection}
                className="w-full bg-[var(--exam-accent)] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 text-md"
              >
                Begin Section {targetSectionId} <i className="fa-light fa-arrow-right" />
              </button>
            </div>
          </div>
          
        </div>
      )}

      {/* PHASE 3: ACTIVE EXAM */}
      {phase === 'exam' && (
        <>
          {/* HEADER */}
          <header className="border-b flex flex-col shrink-0 z-40 relative bg-card border-border shadow-sm">
            <div className="h-14 flex items-center justify-between px-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <svg viewBox="0 0 514 164" className="hidden sm:block shrink-0 h-6 text-foreground" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Exxat Logo">
                  <path
                    d="M73.49 155.24C114.08 155.24 146.99 122.33 146.99 81.74C146.99 41.15 114.08 8.25 73.49 8.25C32.9 8.25 0 41.15 0 81.74C0 122.33 32.9 155.24 73.49 155.24Z"
                    fill="url(#exxat-gradient-header)"
                  />
                  <path
                    d="M0.59 90.99C4.6 122.92 29.09 148.47 60.5 154.09L102.46 116.36V102.3H86.83L102.46 88.25V74.2H86.83L102.46 60.14V46.09H50.56L0.59 90.99Z"
                    fill="#BE1E6D"
                  />
                  <path d="M102.47 116.36H50.56L58.68 102.3H102.47V116.36Z" fill="white" />
                  <path d="M102.47 60.13H58.68L50.56 46.08H102.47V60.13Z" fill="white" />
                  <path d="M102.47 88.24H66.79L70.85 81.21L66.79 74.18H102.47V88.24Z" fill="white" />
                  <path d="M39.22 74.18H66.8L58.68 60.13H39.22V74.18Z" fill="white" />
                  <path d="M39.22 102.3H58.68L66.8 88.24H39.22V102.3Z" fill="white" />

                  <g className="fill-current">
                    {/* E */}
                    <path d="M196 35.76L235.63 35.81C239.71 35.81 250.8 36.09 254.42 35.65L254.41 50.88C240.77 50.8 227.13 50.8 213.49 50.88L213.5 74.35C224.55 74.34 238.41 74.73 249.19 74.27L249.2 89.72C245.21 89.42 239.53 89.58 235.43 89.59L213.5 89.63L213.48 113L256.08 112.93L256.07 128.1C251.92 127.62 239.13 127.9 234.38 127.93C221.69 128 208.64 127.75 196 127.94V35.76Z" />
                    {/* x */}
                    <path d="M311.84 57.11C314.84 57.1 327.11 56.86 329.38 57.21L329.61 57.85C329.33 60.38 324.21 67.34 322.51 69.92C317.65 77.19 312.85 84.49 308.1 91.83C309.12 93.85 311.98 98.15 313.27 100.2L323.96 117.11C325.9 120.18 329.18 124.46 329.55 127.99C323.66 127.75 316.57 127.94 310.59 127.95C307.78 122.8 304.08 117.69 301.1 112.6C299.2 109.35 296.93 105.77 294.71 102.75C293.77 104.89 290.7 109.57 289.36 111.72C285.99 117.17 282.58 122.58 279.12 127.96C276.6 127.91 261.82 128.24 260.67 127.62C260.25 126.01 261.8 123.53 262.7 122.21C269.33 112.52 275.11 101.26 281.98 91.83C281.56 91.33 281.15 90.8 280.77 90.26C279.99 89.13 279.24 87.93 278.49 86.76C272.55 77.6 266.26 68.63 260.48 59.37C260.19 58.91 260.44 57.65 260.54 57.11C266.33 57.05 272.13 57.07 277.92 57.16C283.45 64.94 289.73 74.44 294.84 82.5C296.78 80.01 299.25 76.07 301.02 73.39L311.84 57.11Z" />
                    {/* x */}
                    <path d="M331.8 57.07C337.59 57.12 343.35 57.01 349.16 57.17C351.07 59.34 353.39 63.17 355.06 65.63C358.85 71.21 362.43 77.01 366.36 82.49C370.85 75.07 378.27 64.14 383.33 57.1C385.63 57.09 399.69 56.84 400.87 57.31C401.39 58.6 399.76 61.11 399.01 62.17C392.22 71.73 386.21 82.47 379.27 91.86C383.35 97.67 387.27 104.53 391.17 110.53C393.16 113.61 400.63 124.78 400.95 127.56C399.88 128.24 384.1 127.95 382 127.95C377.12 119.68 371.36 110.9 366.22 102.72C364.99 105.11 362.37 109.02 360.85 111.44C357.4 116.92 353.99 122.43 350.62 127.97C348.24 127.9 332.9 128.28 332.17 127.57C332.12 126.75 332.07 125.83 332.45 125.1C334.5 121.17 337.29 117.06 339.66 113.31L353.19 91.8C352.42 90.71 351.63 89.5 350.9 88.36C344.71 78.72 337.87 69.39 332.08 59.51C331.71 58.88 331.75 57.78 331.8 57.07Z" />
                    {/* a */}
                    <path d="M430.76 55.73C443.6 55.26 459.71 58.4 463.18 73.14C464.17 77.36 463.88 82.7 463.88 87.04L463.85 105.91C463.86 112.15 463.05 112.65 469.33 113.21C469.06 117.66 469.23 123.63 469.24 128.19C461.17 128.15 448.96 129.82 446.76 119.67C444.47 122.42 443.57 123.61 440.36 125.6C433.88 129.64 423.42 129.93 416.18 128.17C410.38 126.76 405.62 123.52 402.51 118.29C400.53 114.23 400.12 109.48 400.65 105.07C402.51 89.56 418.76 87.6 431.17 85.93C435.52 85.24 440.83 84.65 444.47 82.01C447.55 79.77 447.17 76.53 444.97 73.79C440.68 68.46 429.52 68.1 424.36 72.21C421.36 74.59 420.83 77.87 420.5 81.44C414.44 81.38 408.37 81.38 402.31 81.45C402.5 79.52 402.65 77.4 403.03 75.51C405.77 61.78 418.1 56.41 430.76 55.73ZM420.85 112.9C428.03 116.95 440.99 113.87 444.94 106.31C445.85 104.56 447.93 97.68 446.7 95.97L446.34 95.91C442.71 97.49 435.91 98.87 431.8 99.34C425.34 100.07 411.45 104.69 420.85 112.9Z" />
                    {/* t */}
                    <path d="M479.84 35.85C485.68 35.89 491.52 35.89 497.37 35.85C497.15 42.48 497.33 50.27 497.32 56.98L514.28 56.95L514.29 72.1C508.64 72.05 502.99 72.04 497.34 72.05L497.31 93.56C497.31 97.07 496.58 108.12 499.41 110.47C502.23 112.82 510.46 112.62 514.29 112.14L514.28 123.53L514.29 127.44C511.12 127.9 507.91 128.15 504.7 128.19C479.71 128.49 479.89 117.27 479.92 96.95C479.95 88.66 479.94 80.38 479.88 72.09C479.84 35.85 479.84 35.85 479.84 35.85Z" />
                  </g>

                  <defs>
                    <linearGradient id="exxat-gradient-header" x1="28.37" y1="134.25" x2="117.19" y2="30.9" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stop-color="#E21C79" />
                      <stop offset="1" stop-color="#EF609D" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="w-px h-5 hidden sm:block bg-border shrink-0"></div>
                <div className="flex flex-col min-w-0">
                  <h1 className="font-bold text-sm truncate text-foreground leading-tight">
                    Anatomy &amp; Physiology — Midterm Exam
                  </h1>
                  <span className="text-xs text-muted-foreground truncate font-medium">
                    Section {currentQuestion.sectionId} · {currentQuestion.sectionName}
                  </span>
                </div>
              </div>

              {/* TIMER */}
              <div className="flex items-center justify-center">
                <div
                  className={`px-4 py-1.5 rounded-lg border font-timer font-bold text-sm tracking-wider shadow-sm flex items-center gap-2 ${
                    timeLeft <= 300
                      ? "bg-destructive/10 border-destructive text-destructive animate-pulse"
                      : "bg-muted border-border text-foreground"
                  }`}
                  aria-label={`Time remaining: ${formatTime(timeLeft)}`}
                >
                  <i className="fa-light fa-clock" />
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex items-center justify-end gap-3 flex-1">
                {/* GLOBAL REFERENCES */}
                <button
                  onClick={() => setIsGlobalRefOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border bg-background border-border text-foreground hover:bg-muted font-semibold text-xs cursor-pointer"
                >
                  <i className="fa-light fa-file-shield text-sm" />
                  <span className="hidden md:inline">References</span>
                </button>

                {/* CALCULATOR */}
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`flex items-center justify-center border rounded-lg size-9 cursor-pointer transition-all ${
                    showCalculator
                      ? "bg-[var(--exam-accent-light)] border-[var(--exam-accent)] text-[var(--exam-accent)]"
                      : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title="On-Screen Calculator"
                >
                  <i className="fa-light fa-calculator" style={{ fontSize: "16px" }} />
                </button>

                {/* KEYBOARD */}
                <button
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className={`flex items-center justify-center border rounded-lg size-9 cursor-pointer transition-all ${
                    showKeyboard
                      ? "bg-[var(--exam-accent-light)] border-[var(--exam-accent)] text-[var(--exam-accent)]"
                      : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title="On-Screen Keyboard"
                >
                  <i className="fa-light fa-keyboard" style={{ fontSize: "16px" }} />
                </button>

                {/* FLAG / BOOKMARK */}
                <button
                  onClick={() => handleToggleBookmark(currentQuestion.id)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border font-semibold text-xs transition-all cursor-pointer ${
                    bookmarks.has(currentQuestion.id)
                      ? "bg-[var(--state-flagged-bg)] border-[var(--state-flagged-border)] text-[var(--state-flagged-text)]"
                      : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <i className={bookmarks.has(currentQuestion.id) ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"} />
                  <span className="hidden lg:inline">Flag</span>
                </button>

                {/* QUESTIONS DRAWER TRIGGER */}
                <button
                  onClick={() => setIsNavigatorOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border bg-background border-border text-foreground hover:bg-muted font-semibold text-xs cursor-pointer"
                >
                  <i className="fa-light fa-list-ul" />
                  <span className="hidden sm:inline">Questions</span>
                </button>

                {/* ACCESSIBILITY GEAR */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center justify-center border border-border bg-background hover:bg-muted rounded-lg size-9 cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Accessibility Settings"
                >
                  <i className="fa-light fa-gear" style={{ fontSize: "18px" }} />
                </button>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-1 bg-muted relative">
              <div
                className="transition-all duration-300 h-full bg-[var(--exam-accent)]"
                style={{ width: `${progressPercent}%` }}
              ></div>
              
              {/* Section indicators/tick marks */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div style={{ left: "59.2%" }} className="absolute top-0 bottom-0 w-0.5 bg-card z-10"></div> {/* Sec 1 ends */}
                <div style={{ left: "74.0%" }} className="absolute top-0 bottom-0 w-0.5 bg-card z-10"></div> {/* Sec 2 ends */}
                <div style={{ left: "81.4%" }} className="absolute top-0 bottom-0 w-0.5 bg-card z-10"></div> {/* Sec 3 ends */}
                <div style={{ left: "88.8%" }} className="absolute top-0 bottom-0 w-0.5 bg-card z-10"></div> {/* Sec 4 ends */}
                <div style={{ left: "92.5%" }} className="absolute top-0 bottom-0 w-0.5 bg-card z-10"></div> {/* Sec 5 ends */}
              </div>
            </div>
          </header>

          {/* QUESTION PANEL */}
          <div className="flex-1 overflow-hidden flex flex-col bg-background p-6">
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              crossedOut={crossedOut}
              onToggleCrossOut={handleToggleCrossOut}
            />
          </div>

          {/* FOOTER */}
          <footer className="shrink-0 h-16 border-t flex items-center justify-between px-6 bg-card border-border shadow-lg z-30">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 h-10 border rounded-lg bg-background border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none font-semibold text-sm cursor-pointer"
            >
              <i className="fa-light fa-arrow-left" />
              <span>Previous</span>
            </button>

            <span className="text-sm font-semibold text-muted-foreground">
              Question {currentQuestionIndex + 1} <span className="text-muted-foreground/60">of {questions.length}</span>
            </span>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 h-10 bg-[var(--exam-accent)] text-white rounded-lg hover:opacity-90 font-semibold text-sm cursor-pointer"
            >
              <span>{currentQuestionIndex === questions.length - 1 ? "Submit Exam" : "Next"}</span>
              <i className="fa-light fa-arrow-right" />
            </button>
          </footer>
        </>
      )}

      {/* PHASE 4: SUBMITTED PORTAL */}
      {phase === 'submitted' && (() => {
        // Calculate scores
        const objCorrect = questions.filter(q => q.type !== 'essay' && isQuestionCorrect(q)).length;
        const subjectiveScore = adminGradingStatus === 'complete' ? 1.8 : 0;
        const totalPointsEarned = objCorrect + subjectiveScore;
        const objectiveMaxPoints = questions.filter(q => q.type !== 'essay').length;
        const subjectiveMaxPoints = 2.0; // Essay section has 2 questions with total 2.0 pts
        const totalMaxPoints = objectiveMaxPoints + subjectiveMaxPoints;
        
        const rawObjectivePercent = (objCorrect / objectiveMaxPoints) * 100;
        const finalOverallPercent = (totalPointsEarned / totalMaxPoints) * 100;
        
        // Section details helper
        const getSectionStats = (secId: number) => {
          const secQ = questions.filter(q => q.sectionId === secId);
          const total = secQ.length;
          
          if (secId === 4) { // Subjective section
            if (adminGradingStatus === 'pending') {
              return { scoreText: 'Evaluation in progress', percent: 0, status: 'pending', correct: 0, total };
            } else {
              return { scoreText: '1.8 / 2.0 pts', percent: 90, status: 'complete', correct: 1.8, total };
            }
          }
          
          const correct = secQ.filter(isQuestionCorrect).length;
          const percent = total > 0 ? (correct / total) * 100 : 0;
          return {
            scoreText: `${correct} / ${total}`,
            percent,
            status: 'complete',
            correct,
            total
          };
        };

        // Determine Pass/Fail status (Threshold 75%)
        const passingThreshold = 75;
        const isPassed = adminGradingStatus === 'complete' 
          ? finalOverallPercent >= passingThreshold 
          : rawObjectivePercent >= passingThreshold;

        // Custom download PDF action
        const handleDownloadKey = () => {
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-5 right-5 bg-foreground text-background px-4 py-3 rounded-xl shadow-lg font-semibold text-xs flex items-center gap-2 animate-bounce z-50';
          toast.innerHTML = '<i class="fa-light fa-file-arrow-down text-base" /> Generating PDF Answer Key download...';
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500 text-base" /> Download Complete: A&P_Midterm_Key.pdf';
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 2000);
          }, 1500);
        };

        // Filtered questions list for key review
        const filteredQuestions = questions.filter(q => {
          if (keyFilter === 'all') return true;
          const correct = q.type !== 'essay' && isQuestionCorrect(q);
          const answered = isQuestionAnswered(q);
          if (keyFilter === 'correct') return q.type !== 'essay' && correct;
          if (keyFilter === 'incorrect') return q.type !== 'essay' && answered && !correct;
          if (keyFilter === 'unanswered') return !answered;
          return true;
        });

        return (
          <div className="flex-1 w-full overflow-y-auto bg-muted/10">
            {/* HEADER */}
            <header className="border-b flex flex-col shrink-0 z-40 sticky top-0 bg-card border-border shadow-sm w-full">
              <div className="h-14 flex items-center justify-between px-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <svg viewBox="0 0 514 164" className="hidden sm:block shrink-0 h-6 text-foreground" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Exxat Logo">
                    <path
                      d="M73.49 155.24C114.08 155.24 146.99 122.33 146.99 81.74C146.99 41.15 114.08 8.25 73.49 8.25C32.9 8.25 0 41.15 0 81.74C0 122.33 32.9 155.24 73.49 155.24Z"
                      fill="url(#exxat-gradient-header)"
                    />
                    <path
                      d="M0.59 90.99C4.6 122.92 29.09 148.47 60.5 154.09L102.46 116.36V102.3H86.83L102.46 88.25V74.2H86.83L102.46 60.14V46.09H50.56L0.59 90.99Z"
                      fill="#BE1E6D"
                    />
                    <path d="M102.47 116.36H50.56L58.68 102.3H102.47V116.36Z" fill="white" />
                    <path d="M102.47 60.13H58.68L50.56 46.08H102.47V60.13Z" fill="white" />
                    <path d="M102.47 88.24H66.79L70.85 81.21L66.79 74.18H102.47V88.24Z" fill="white" />
                    <path d="M39.22 74.18H66.8L58.68 60.13H39.22V74.18Z" fill="white" />
                    <path d="M39.22 102.3H58.68L66.8 88.24H39.22V102.3Z" fill="white" />

                    <g className="fill-current">
                      {/* E */}
                      <path d="M196 35.76L235.63 35.81C239.71 35.81 250.8 36.09 254.42 35.65L254.41 50.88C240.77 50.8 227.13 50.8 213.49 50.88L213.5 74.35C224.55 74.34 238.41 74.73 249.19 74.27L249.2 89.72C245.21 89.42 239.53 89.58 235.43 89.59L213.5 89.63L213.48 113L256.08 112.93L256.07 128.1C251.92 127.62 239.13 127.9 234.38 127.93C221.69 128 208.64 127.75 196 127.94V35.76Z" />
                      {/* x */}
                      <path d="M311.84 57.11C314.84 57.1 327.11 56.86 329.38 57.21L329.61 57.85C329.33 60.38 324.21 67.34 322.51 69.92C317.65 77.19 312.85 84.49 308.1 91.83C309.12 93.85 311.98 98.15 313.27 100.2L323.96 117.11C325.9 120.18 329.18 124.46 329.55 127.99C323.66 127.75 316.57 127.94 310.59 127.95C307.78 122.8 304.08 117.69 301.1 112.6C299.2 109.35 296.93 105.77 294.71 102.75C293.77 104.89 290.7 109.57 289.36 111.72C285.99 117.17 282.58 122.58 279.12 127.96C276.6 127.91 261.82 128.24 260.67 127.62C260.25 126.01 261.8 123.53 262.7 122.21C269.33 112.52 275.11 101.26 281.98 91.83C281.56 91.33 281.15 90.8 280.77 90.26C279.99 89.13 279.24 87.93 278.49 86.76C272.55 77.6 266.26 68.63 260.48 59.37C260.19 58.91 260.44 57.65 260.54 57.11C266.33 57.05 272.13 57.07 277.92 57.16C283.45 64.94 289.73 74.44 294.84 82.5C296.78 80.01 299.25 76.07 301.02 73.39L311.84 57.11Z" />
                      {/* x */}
                      <path d="M331.8 57.07C337.59 57.12 343.35 57.01 349.16 57.17C351.07 59.34 353.39 63.17 355.06 65.63C358.85 71.21 362.43 77.01 366.36 82.49C370.85 75.07 378.27 64.14 383.33 57.1C385.63 57.09 399.69 56.84 400.87 57.31C401.39 58.6 399.76 61.11 399.01 62.17C392.22 71.73 386.21 82.47 379.27 91.86C383.35 97.67 387.27 104.53 391.17 110.53C393.16 113.61 400.63 124.78 400.95 127.56C399.88 128.24 384.1 127.95 382 127.95C377.12 119.68 371.36 110.9 366.22 102.72C364.99 105.11 362.37 109.02 360.85 111.44C357.4 116.92 353.99 122.43 350.62 127.97C348.24 127.9 332.9 128.28 332.17 127.57C332.12 126.75 332.07 125.83 332.45 125.1C334.5 121.17 337.29 117.06 339.66 113.31L353.19 91.8C352.42 90.71 351.63 89.5 350.9 88.36C344.71 78.72 337.87 69.39 332.08 59.51C331.71 58.88 331.75 57.78 331.8 57.07Z" />
                      {/* a */}
                      <path d="M430.76 55.73C443.6 55.26 459.71 58.4 463.18 73.14C464.17 77.36 463.88 82.7 463.88 87.04L463.85 105.91C463.86 112.15 463.05 112.65 469.33 113.21C469.06 117.66 469.23 123.63 469.24 128.19C461.17 128.15 448.96 129.82 446.76 119.67C444.47 122.42 443.57 123.61 440.36 125.6C433.88 129.64 423.42 129.93 416.18 128.17C410.38 126.76 405.62 123.52 402.51 118.29C400.53 114.23 400.12 109.48 400.65 105.07C402.51 89.56 418.76 87.6 431.17 85.93C435.52 85.24 440.83 84.65 444.47 82.01C447.55 79.77 447.17 76.53 444.97 73.79C440.68 68.46 429.52 68.1 424.36 72.21C421.36 74.59 420.83 77.87 420.5 81.44C414.44 81.38 408.37 81.38 402.31 81.45C402.5 79.52 402.65 77.4 403.03 75.51C405.77 61.78 418.1 56.41 430.76 55.73ZM420.85 112.9C428.03 116.95 440.99 113.87 444.94 106.31C445.85 104.56 447.93 97.68 446.7 95.97L446.34 95.91C442.71 97.49 435.91 98.87 431.8 99.34C425.34 100.07 411.45 104.69 420.85 112.9Z" />
                      {/* t */}
                      <path d="M479.84 35.85C485.68 35.89 491.52 35.89 497.37 35.85C497.15 42.48 497.33 50.27 497.32 56.98L514.28 56.95L514.29 72.1C508.64 72.05 502.99 72.04 497.34 72.05L497.31 93.56C497.31 97.07 496.58 108.12 499.41 110.47C502.23 112.82 510.46 112.62 514.29 112.14L514.28 123.53L514.28 127.44C511.12 127.9 507.91 128.15 504.7 128.19C479.71 128.49 479.89 117.27 479.92 96.95C479.95 88.66 479.94 80.38 479.88 72.09C479.84 35.85 479.84 35.85 479.84 35.85Z" />
                    </g>

                    <defs>
                      <linearGradient id="exxat-gradient-header" x1="28.37" y1="134.25" x2="117.19" y2="30.9" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#E21C79" />
                        <stop offset="1" stop-color="#EF609D" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="w-px h-5 hidden sm:block bg-border shrink-0"></div>
                  <div className="flex flex-col min-w-0">
                    <h1 className="font-bold text-sm truncate text-foreground leading-tight">
                      Anatomy &amp; Physiology — Midterm Exam
                    </h1>
                    <span className="text-xs text-muted-foreground truncate font-medium">
                      BIO-301-A
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    Completed
                  </span>
                  <button
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isAdminPanelOpen 
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs' 
                        : 'bg-muted border-border text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <i className="fa-light fa-sliders text-xs" />
                    <span>{isAdminPanelOpen ? "Hide Simulator" : "Show Simulator"}</span>
                  </button>
                  <button
                    onClick={() => navigate("/design-os/dashboard")}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold transition-all border border-border cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
              
              {/* Left Column: Student Portal View */}
              <div className="flex-grow lg:flex-1 min-w-0 flex flex-col gap-6">
                
                {/* Sleek Successful Submission Banner */}
                <div className="bg-emerald-500/10 border-l-4 border-l-emerald-500 border-y border-r border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 shadow-xs animate-card-enter">
                  <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 text-base mt-0.5" />
                  <div>
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Assessment Submitted Successfully!</h2>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Your responses have been successfully recorded and logged.
                    </p>
                  </div>
                </div>

                {/* 1. Results Summary Widget (Fully removed if results visibility is off) */}
                {!adminShowResults ? (
                  <div className="bg-card border border-border p-8 rounded-2xl shadow-sm text-center flex flex-col items-center gap-4 animate-card-enter">
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                      <i className="fa-solid fa-clock-three text-xl" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Results are being processed by the faculty</h2>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                        You will receive an email when they are finalised.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Score Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Score Widget */}
                      {adminResultType !== 'hidden' && (
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4 animate-card-enter">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assessment Performance</h3>
                              {adminGradingStatus === 'pending' ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md uppercase tracking-wider flex items-center gap-1">
                                  <i className="fa-solid fa-spinner animate-spin text-[9px]" /> Grading
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md uppercase tracking-wider flex items-center gap-1">
                                  <i className="fa-solid fa-badge-check text-[9px]" /> Graded
                                </span>
                              )}
                            </div>

                            {/* Split Scores: Objective and Subjective */}
                            <div className="flex flex-col gap-3.5 my-2">
                              {/* Objective Questions Row */}
                              <div className="flex justify-between items-center py-2 border-b border-border/40">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objective Questions</span>
                                <span className="text-sm font-extrabold text-foreground">
                                  {objCorrect} / {objectiveMaxPoints} pts <span className="text-muted-foreground text-xs font-semibold">({rawObjectivePercent.toFixed(0)}%)</span>
                                </span>
                              </div>

                              {/* Subjective Questions Row */}
                              <div className="flex justify-between items-start py-1.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjective Questions</span>
                                  {adminGradingStatus === 'pending' && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1 leading-none">
                                      <i className="fa-solid fa-circle-info text-[9px]" /> Subjective portion being evaluated
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-extrabold text-foreground shrink-0">
                                  {adminGradingStatus === 'pending' ? (
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">In Progress</span>
                                  ) : (
                                    `${subjectiveScore.toFixed(1)} / 2.0 pts (${(subjectiveScore / 2 * 100).toFixed(0)}%)`
                                  )}
                                </span>
                              </div>

                              {/* Total Overall Score (Only shown if grading is complete and result type is score) */}
                              {adminGradingStatus === 'complete' && adminResultType === 'score' && (
                                <div className="mt-2 pt-3.5 border-t border-border flex justify-between items-center">
                                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Final Overall Grade</span>
                                  <span className="text-sm font-black text-[var(--exam-accent)]">
                                    {totalPointsEarned.toFixed(1)} / {totalMaxPoints} pts ({finalOverallPercent.toFixed(1)}%)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Pass / Fail Display */}
                            {adminResultType === 'pass-fail' && (
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60">
                                {adminGradingStatus === 'pending' ? (
                                  <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                      <i className="fa-solid fa-clock text-[10px]" /> Status Pending
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                      Objective performance is {rawObjectivePercent.toFixed(0)}% (Requires {passingThreshold}% overall)
                                    </span>
                                  </div>
                                ) : isPassed ? (
                                  <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 animate-card-enter">
                                    <i className="fa-solid fa-circle-check" /> PASS
                                  </div>
                                ) : (
                                  <div className="px-4 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 animate-card-enter">
                                    <i className="fa-solid fa-circle-exclamation" /> FAIL
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Course Weight Contribution Roll-up (Fully hidden when subjective evaluation is pending) */}
                      {adminShowResults && adminGradingStatus === 'complete' && (
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4 animate-card-enter">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Course Grade Impact</h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                                {((finalOverallPercent / 100) * adminCourseWeight).toFixed(2)}%
                              </span>
                              <span className="text-sm font-semibold text-muted-foreground">
                                / {adminCourseWeight}% Course Weight
                              </span>
                            </div>
                            <div className="w-full bg-muted h-2.5 rounded-full mt-4 overflow-hidden relative border border-border/40">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${finalOverallPercent}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-medium pt-1">
                            Calculated as: <span className="font-semibold text-foreground">Earned Score (%) × Course Weight ({adminCourseWeight}%)</span>.
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Pre-curving Active Disclaimer */}
                    {adminPreCurving && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal text-amber-800 dark:text-amber-300 font-medium animate-card-enter">
                        <i className="fa-solid fa-circle-exclamation text-base mt-0.5 shrink-0" />
                        <div>
                          The current scores reflect your raw performance. Final results will be shared once the grading and curving process is complete.
                        </div>
                      </div>
                    )}

                    {/* 2. Section Level Breakdown (Fully removed if section performance visibility is off) */}
                    {adminShowSectionPerformance && (
                      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm animate-card-enter">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                          <i className="fa-light fa-layer-group text-[var(--exam-accent)]" /> Section-Level Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4, 5, 6].map((secId) => {
                            const isSecVisible = adminSectionVisibility[secId];
                            const stats = getSectionStats(secId);
                            const name = secId === 1 ? "Nervous System"
                              : secId === 2 ? "Musculoskeletal & Cardiovascular"
                              : secId === 3 ? "Endocrine & Renal"
                              : secId === 4 ? "Respiratory & Gastrointestinal"
                              : secId === 5 ? "Cardiovascular Anatomy"
                              : "Pharmacology & Microbiology";

                            return (
                              <div key={secId} className="border border-border/60 rounded-xl p-4 bg-muted/20 flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <span className="text-xs font-bold text-foreground leading-snug">Sec {secId}: {name}</span>
                                  {!isSecVisible ? (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-muted border border-border rounded text-muted-foreground uppercase flex items-center gap-1 shrink-0 select-none">
                                      <i className="fa-solid fa-lock" /> Hidden
                                    </span>
                                  ) : (
                                    <span className={`text-xs font-bold ${stats.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'} shrink-0`}>
                                      {stats.scoreText}
                                    </span>
                                  )}
                                </div>
                                
                                {isSecVisible ? (
                                  stats.status === 'pending' ? (
                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-1 font-semibold flex items-center gap-1">
                                      <i className="fa-solid fa-spinner animate-spin text-[9px]" /> Evaluation in progress
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 mt-1">
                                      <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-300 ${
                                            stats.percent >= 75 ? 'bg-emerald-500' : 'bg-indigo-500'
                                          }`}
                                          style={{ width: `${stats.percent}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-muted-foreground">
                                        {stats.percent.toFixed(0)}%
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <div className="text-[10px] italic text-muted-foreground mt-1">
                                    Section details restricted by administrator.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Answer Key & Rationale Viewer (Fully removed if key visibility is off) */}
                {adminKeyVisibility && (
                  <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col animate-card-enter">
                    {/* Header bar (PDF Download button is exclusive/always visible in key widget) */}
                    <div className="bg-muted/30 border-b border-border px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                          <i className="fa-light fa-spell-check text-[var(--exam-accent)]" />
                          Answer Key &amp; Explanations
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {adminKeyType === 'answers-only' ? 'Compact master key' 
                            : adminKeyType === 'match' ? 'Detailed correct/incorrect comparison'
                            : adminKeyType === 'match-rationale' ? 'Comparison with answers, rationales, and details'
                            : 'Study Guide mode (Student choices hidden)'}
                        </p>
                      </div>
                      
                      <button
                        onClick={handleDownloadKey}
                        className="px-3 py-1.5 bg-[var(--exam-accent)] text-white hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                      >
                        <i className="fa-light fa-file-arrow-down" /> Download Key (PDF)
                      </button>
                    </div>

                    {/* Filter controls (Only for Type 2, 3, 4) */}
                    {adminKeyType !== 'answers-only' && (
                      <div className="px-6 py-3 border-b border-border/60 bg-muted/10 flex flex-wrap gap-2 items-center text-xs">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider mr-2">Filter questions:</span>
                        {[
                          { id: 'all', label: `All (${questions.length})` },
                          { id: 'correct', label: `Correct (${objCorrect})` },
                          { id: 'incorrect', label: `Incorrect (${25 - objCorrect})` },
                          { id: 'unanswered', label: 'Unanswered (0)' }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setKeyFilter(btn.id as any)}
                            className={`px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                              keyFilter === btn.id
                                ? 'bg-[var(--exam-accent-light)] border-[var(--exam-accent)] text-[var(--exam-accent)] font-bold'
                                : 'border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Inner content switcher based on adminKeyType */}
                    <div className="p-6">
                      
                      {/* TYPE 1: Answers Only (Compact Grid) */}
                      {adminKeyType === 'answers-only' && (
                        <div className="flex flex-col gap-6 animate-card-enter">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {questions.map((q, idx) => {
                              const isSubj = q.type === 'essay';
                              const correctAnsLetter = isSubj 
                                ? 'Faculty Graded'
                                : q.type === 'mcq-single' || q.type === 'dropdown' || q.type === 'hotspot'
                                ? correctAnswers[q.id]
                                : q.type === 'mcq-multiple'
                                ? correctAnswers[q.id].join(', ')
                                : q.type === 'fill-blank'
                                ? `${correctAnswers[q.id].blank1}, ${correctAnswers[q.id].blank2}`
                                : 'Match Key';

                              return (
                                <div key={q.id} className="border border-border/80 rounded-xl p-3 bg-muted/20 text-center flex flex-col items-center justify-center min-h-[80px]">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Q{idx + 1}</span>
                                  <span className={`text-xs font-black mt-1.5 leading-tight ${isSubj ? 'text-amber-500 font-bold' : 'text-foreground font-sans'}`}>
                                    {correctAnsLetter}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* TYPE 2, 3, 4: Detailed Question lists */}
                      {adminKeyType !== 'answers-only' && (
                        <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-1">
                          {filteredQuestions.length === 0 ? (
                            <div className="text-center py-8 text-xs text-muted-foreground italic">
                              No questions match the selected filter.
                            </div>
                          ) : (
                            filteredQuestions.map((q) => {
                              const isCorrect = q.type !== 'essay' && isQuestionCorrect(q);
                              const isAnswered = isQuestionAnswered(q);
                              const stuAns = answers[q.id];
                              const corrAns = correctAnswers[q.id];
                              const hasRationale = adminKeyType === 'match-rationale' || adminKeyType === 'rationale-only';
                              const showComparison = adminKeyType !== 'rationale-only'; // Hide student choices in Rationale-Only Study Guide

                              return (
                                <div 
                                  key={q.id} 
                                  className="border border-border rounded-xl p-5 bg-card flex flex-col gap-4 transition-all hover:border-border/80 animate-card-enter"
                                >
                                  {/* Header Info */}
                                  <div className="flex justify-between items-center border-b pb-2.5 border-border/60">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-xs text-foreground">QUESTION {questions.findIndex(x => x.id === q.id) + 1}</span>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                        · Section {q.sectionId}
                                      </span>
                                    </div>
                                    
                                    {showComparison && (
                                      q.type === 'essay' ? (
                                        adminGradingStatus === 'pending' ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest flex items-center gap-1">
                                            <i className="fa-solid fa-spinner animate-spin text-[8px]" /> Evaluation Pending
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                                            Graded: 1.8 / 2.0 pts
                                          </span>
                                        )
                                      ) : isCorrect ? (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                                          <i className="fa-solid fa-circle-check text-[10px]" /> Correct
                                        </span>
                                      ) : !isAnswered ? (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-muted border border-border text-muted-foreground uppercase tracking-widest">
                                          Unanswered
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-widest flex items-center gap-1">
                                          <i className="fa-solid fa-circle-xmark text-[10px]" /> Incorrect
                                        </span>
                                      )
                                    )}
                                  </div>

                                  {/* Question Text */}
                                  <p className="text-xs font-bold text-foreground leading-relaxed">
                                    {q.text}
                                  </p>

                                  {/* Answers Match Comparison Area */}
                                  <div className="p-4 bg-muted/30 border border-border/40 rounded-xl flex flex-col gap-3 text-xs leading-normal">
                                    {/* Render by type */}
                                    {q.type === 'mcq-single' && (
                                      <div className="flex flex-col gap-2">
                                        {q.options?.map((opt) => {
                                          const isOptCorrect = opt.letter === corrAns;
                                          const isOptChosen = stuAns === opt.letter;
                                          
                                          let borderClass = "border-border/60 bg-card";
                                          let badge = null;

                                          if (isOptCorrect) {
                                            borderClass = "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10";
                                            badge = <span className="text-[10px] font-bold text-emerald-500 ml-auto flex items-center gap-1"><i className="fa-solid fa-check" /> Correct Option</span>;
                                          } else if (isOptChosen && showComparison) {
                                            borderClass = "border-destructive bg-destructive/5 dark:bg-destructive/10";
                                            badge = <span className="text-[10px] font-bold text-destructive ml-auto flex items-center gap-1"><i className="fa-solid fa-xmark" /> Your Choice</span>;
                                          }

                                          return (
                                            <div key={opt.letter} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${borderClass}`}>
                                              <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                                                isOptCorrect ? 'bg-emerald-500 text-white' : isOptChosen && showComparison ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'
                                              }`}>
                                                {opt.letter}
                                              </span>
                                              <div className="flex flex-col items-start gap-1">
                                                {opt.text.includes('<math') || opt.text.includes('</math>') ? (
                                                  <span className="text-foreground font-medium" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                                ) : (
                                                  <span className="text-foreground font-medium">{opt.text}</span>
                                                )}
                                                {opt.image && (
                                                  <img 
                                                    src={opt.image} 
                                                    alt={`Option ${opt.letter}`} 
                                                    className="max-h-[80px] max-w-full rounded border border-border/40 bg-muted/10 object-contain mt-0.5"
                                                  />
                                                )}
                                              </div>
                                              {badge}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {q.type === 'mcq-multiple' && (
                                      <div className="flex flex-col gap-2">
                                        {q.options?.map((opt) => {
                                          const isOptCorrect = corrAns.includes(opt.letter);
                                          const isOptChosen = Array.isArray(stuAns) && stuAns.includes(opt.letter);
                                          
                                          let borderClass = "border-border/60 bg-card";
                                          let badge = null;

                                          if (isOptCorrect) {
                                            borderClass = "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10";
                                            badge = <span className="text-[10px] font-bold text-emerald-500 ml-auto flex items-center gap-1"><i className="fa-solid fa-check" /> Correct Option</span>;
                                          } else if (isOptChosen && showComparison) {
                                            borderClass = "border-destructive bg-destructive/5 dark:bg-destructive/10";
                                            badge = <span className="text-[10px] font-bold text-destructive ml-auto flex items-center gap-1"><i className="fa-solid fa-xmark" /> Your Choice</span>;
                                          }

                                          return (
                                            <div key={opt.letter} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${borderClass}`}>
                                              <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                                                isOptCorrect ? 'bg-emerald-500 text-white' : isOptChosen && showComparison ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'
                                              }`}>
                                                {opt.letter}
                                              </span>
                                              <div className="flex flex-col items-start gap-1">
                                                {opt.text.includes('<math') || opt.text.includes('</math>') ? (
                                                  <span className="text-foreground font-medium" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                                ) : (
                                                  <span className="text-foreground font-medium">{opt.text}</span>
                                                )}
                                                {opt.image && (
                                                  <img 
                                                    src={opt.image} 
                                                    alt={`Option ${opt.letter}`} 
                                                    className="max-h-[80px] max-w-full rounded border border-border/40 bg-muted/10 object-contain mt-0.5"
                                                  />
                                                )}
                                              </div>
                                              {badge}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {q.type === 'dropdown' && (
                                      <div className="flex flex-col gap-2 text-xs font-semibold">
                                        {showComparison && (
                                          <div className="flex justify-between border-b pb-1.5 border-border/40">
                                            <span className="text-muted-foreground">Your response:</span>
                                            <span className={stuAns === corrAns ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'}>
                                              {stuAns || '(Unanswered)'}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Correct response:</span>
                                          <span className="text-emerald-500 font-bold">{corrAns}</span>
                                        </div>
                                      </div>
                                    )}

                                    {q.type === 'hotspot' && (
                                      <div className="flex flex-col gap-2 text-xs font-semibold">
                                        {showComparison && (
                                          <div className="flex justify-between border-b pb-1.5 border-border/40">
                                            <span className="text-muted-foreground">Your response:</span>
                                            <span className={stuAns === corrAns ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'}>
                                              {stuAns || '(Unanswered)'}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Correct response:</span>
                                          <span className="text-emerald-500 font-bold">{corrAns}</span>
                                        </div>
                                      </div>
                                    )}

                                    {q.type === 'fill-blank' && (
                                      <div className="flex flex-col gap-2.5">
                                        {Object.keys(corrAns).map((blankName, idx) => {
                                          const stuVal = stuAns?.[blankName] || '';
                                          const corrVal = corrAns[blankName];
                                          const isBlankCorrect = stuVal === corrVal;

                                          return (
                                            <div key={blankName} className="flex flex-col gap-1 text-[11px]">
                                              <span className="font-bold text-muted-foreground uppercase tracking-wider">Blank {idx+1}</span>
                                              {showComparison && (
                                                <div className="flex justify-between border-b pb-1 border-border/30">
                                                  <span className="text-muted-foreground">Your selection:</span>
                                                  <span className={isBlankCorrect ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'}>
                                                    {stuVal || '(Empty)'}
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Correct selection:</span>
                                                <span className="text-emerald-500 font-bold">{corrVal}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {q.type === 'match' && (
                                      <div className="flex flex-col gap-2.5">
                                        {Object.keys(corrAns).map((label) => {
                                          const stuVal = stuAns?.[label] || '';
                                          const corrVal = corrAns[label];
                                          const isMatchCorrect = stuVal === corrVal;

                                          return (
                                            <div key={label} className="border border-border/40 rounded-lg p-2.5 bg-card flex flex-col gap-1 text-[11px]">
                                              <span className="font-bold text-foreground">{label}</span>
                                              {showComparison && (
                                                <div className="flex justify-between border-b pb-1 border-border/30">
                                                  <span className="text-muted-foreground">Your match:</span>
                                                  <span className={isMatchCorrect ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'}>
                                                    {stuVal || '(Unmatched)'}
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Correct match:</span>
                                                <span className="text-emerald-500 font-bold">{corrVal}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {q.type === 'essay' && (
                                      <div className="flex flex-col gap-2">
                                        {showComparison && (
                                          <div className="flex flex-col gap-1 border-b pb-2 border-border/40">
                                            <span className="font-bold text-muted-foreground">Your submitted essay response:</span>
                                            <p className="p-3 bg-card border rounded-lg text-foreground/80 text-[11px] leading-relaxed max-h-[140px] overflow-y-auto italic">
                                              "{stuAns || 'No response submitted.'}"
                                            </p>
                                          </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                          <span className="font-bold text-muted-foreground">Model Answer Guideline:</span>
                                          <p className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-foreground/80 text-[11px] leading-relaxed">
                                            {q.id === 23 
                                              ? "The response should identify: (1) hypovolemia triggers renal baroreceptors, (2) release of renin from juxtaglomerular cells converts angiotensinogen to Angiotensin I, (3) ACE in pulmonary capillary beds converts Angiotensin I to Angiotensin II, (4) Angiotensin II triggers release of aldosterone and ADH to increase sodium and free-water reabsorption, reducing urine output."
                                              : "The response must describe: (1) allergen exposure triggers IgE crosslinking on mast cells, (2) degranulation releases histamine/leukotrienes, (3) results in smooth muscle contraction (bronchospasm), bronchial mucosal edema, and mucus hypersecretion, culminating in severe narrowing of airways."
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                  </div>

                                  {/* Rationale block */}
                                  {hasRationale && q.type !== 'essay' && (
                                    <div className="bg-indigo-500/5 border border-indigo-500/15 p-4 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-300 leading-normal font-medium">
                                      <i className="fa-light fa-circle-info text-base mt-0.5 text-indigo-500 shrink-0" />
                                      <div>
                                        <strong className="font-bold block mb-1 text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Answer Explanation &amp; Rationale</strong>
                                        {rationales[q.id] || "No explanation defined for this item."}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Admin Settings Simulator Panel */}
              {isAdminPanelOpen && (
                <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-6 self-start animate-card-enter">
                  <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-col gap-5 select-none relative overflow-hidden">
                  
                  {/* Decorative Blueprint Lines */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Title */}
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                      <i className="fa-light fa-sliders text-base animate-pulse" />
                      Admin View Simulator
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-widest uppercase">
                      Blueprint
                    </span>
                  </div>

                  {/* 1. Results Visibility */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 justify-between">
                      <span>1. Post-Assessment Visibility</span>
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                      <span className="text-xs font-semibold text-slate-200">Show Results to Student</span>
                      <input 
                        type="checkbox"
                        checked={adminShowResults}
                        onChange={(e) => setAdminShowResults(e.target.checked)}
                        className="size-4.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-600 bg-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 2. Results Classification Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      2. Results Classification
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'score', label: 'Score' },
                        { id: 'pass-fail', label: 'Pass/Fail' },
                        { id: 'hidden', label: 'Hidden' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setAdminResultType(type.id as any)}
                          disabled={!adminShowResults}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            !adminShowResults 
                              ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-950/20'
                              : adminResultType === type.id
                              ? 'bg-indigo-500 border-transparent text-white shadow-md'
                              : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:bg-slate-950/50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Section Performance Visibility */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                      <span>3. Section Performance Card</span>
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                      <span className="text-xs font-semibold text-slate-200">Show Section Breakdown</span>
                      <input 
                        type="checkbox"
                        checked={adminShowSectionPerformance}
                        onChange={(e) => setAdminShowSectionPerformance(e.target.checked)}
                        className="size-4.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-600 bg-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 4. Subjective Grading Status */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                      <span>4. Subjective Grading Status</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'pending', label: 'Pending Evaluation' },
                        { id: 'complete', label: 'Grading Complete' }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => setAdminGradingStatus(status.id as any)}
                          disabled={!adminShowResults}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            !adminShowResults
                              ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600 bg-slate-950/20'
                              : adminGradingStatus === status.id
                              ? 'bg-indigo-500 border-transparent text-white shadow-md'
                              : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:bg-slate-950/50'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Pre-Curving Mode */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      5. Curve Status
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                      <span className="text-xs font-semibold text-slate-200">Pre-Curving Active</span>
                      <input 
                        type="checkbox"
                        checked={adminPreCurving}
                        disabled={!adminShowResults}
                        onChange={(e) => setAdminPreCurving(e.target.checked)}
                        className={`size-4.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-600 bg-slate-900 cursor-pointer ${!adminShowResults ? 'opacity-30 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* 6. Course Rollup slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>6. Course Weight Contribution</span>
                      <span className="text-indigo-400 font-bold font-mono">{adminCourseWeight}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col gap-2">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={adminCourseWeight} 
                        disabled={!adminShowResults || adminGradingStatus === 'pending'}
                        onChange={(e) => setAdminCourseWeight(parseInt(e.target.value))}
                        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${(!adminShowResults || adminGradingStatus === 'pending') ? 'opacity-30 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* 7. Key visibility */}
                  <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        7. Answer Key Visibility
                      </label>
                      <input 
                        type="checkbox"
                        checked={adminKeyVisibility}
                        onChange={(e) => setAdminKeyVisibility(e.target.checked)}
                        className="size-4.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-600 bg-slate-900 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Key Display Option</span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { id: 'answers-only', label: 'Correct Answers Only + Download' },
                          { id: 'match', label: 'Correct Options + Student Choices' },
                          { id: 'match-rationale', label: 'Options + Choices + Rationales' },
                          { id: 'rationale-only', label: 'Correct Answers + Rationales Only' }
                        ].map((opt) => (
                          <label 
                            key={opt.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                              !adminKeyVisibility 
                                ? 'opacity-30 cursor-not-allowed border-slate-800/40 text-slate-600 bg-transparent'
                                : adminKeyType === opt.id
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold'
                                : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700/60'
                            }`}
                          >
                            <input 
                              type="radio"
                              name="keyTypeRadio"
                              disabled={!adminKeyVisibility}
                              checked={adminKeyType === opt.id}
                              onChange={() => setAdminKeyType(opt.id as any)}
                              className="size-3.5 text-indigo-500 border-slate-700 bg-slate-900 focus:ring-indigo-600"
                            />
                            <span className="text-[10px] leading-tight">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 8. Section Level Results Visibility */}
                  <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-4">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      8. Section Visibility Locks
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-300">
                      {[1, 2, 3, 4, 5, 6].map((secId) => (
                        <label 
                          key={secId} 
                          className={`flex items-center gap-2 p-2 rounded-lg bg-slate-950/30 border border-slate-850 hover:border-slate-750 transition-colors cursor-pointer ${(!adminShowResults || !adminShowSectionPerformance) ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <input 
                            type="checkbox"
                            checked={adminSectionVisibility[secId]}
                            disabled={!adminShowResults || !adminShowSectionPerformance}
                            onChange={(e) => {
                              setAdminSectionVisibility(prev => ({
                                ...prev,
                                [secId]: e.target.checked
                              }));
                            }}
                            className="size-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-600 bg-slate-900 cursor-pointer"
                          />
                          <span>Section {secId}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* QUESTION NAVIGATOR SIDEBAR */}
      {isNavigatorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay background */}
          <div
            onClick={() => setIsNavigatorOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          ></div>
          
          {/* Sidebar frame */}
          <div className="relative w-80 max-w-full h-full bg-card border-l border-border flex flex-col shadow-2xl p-6 z-10 animate-slide-in">
            <div className="flex justify-between items-center border-b pb-4 mb-4 border-border">
              <h3 className="font-bold text-md text-foreground flex items-center gap-2">
                <i className="fa-light fa-list-ul" />
                Assessment Navigator
              </h3>
              <button
                onClick={() => setIsNavigatorOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: "16px" }} />
              </button>
            </div>

            {/* Navigator Overview */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 bg-muted/30 p-3 rounded-xl border border-border">
              <div>
                <div className="text-foreground text-sm font-bold">{getAnsweredCount()}</div>
                <div>Answered</div>
              </div>
              <div>
                <div className="text-foreground text-sm font-bold">{bookmarks.size}</div>
                <div>Flagged</div>
              </div>
              <div>
                <div className="text-foreground text-sm font-bold">{questions.length - getAnsweredCount()}</div>
                <div>Left</div>
              </div>
            </div>

            {/* Flagged Questions Section */}
            <div className="mb-4 pb-4 border-b border-border">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <i className="fa-solid fa-bookmark text-[var(--state-flagged-text)]" />
                Flagged for Review ({bookmarks.size})
              </h4>
              {bookmarks.size === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-1">No questions flagged yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {questions
                    .filter((q) => bookmarks.has(q.id))
                    .map((q) => {
                      const idx = questions.findIndex((x) => x.id === q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentQuestionIndex(idx);
                            setIsNavigatorOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--state-flagged-bg)] border border-[var(--state-flagged-border)] text-[var(--state-flagged-text)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          Q{idx + 1}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Grid Circles Header */}
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <i className="fa-light fa-grid-2" />
              All Questions ({questions.length})
            </h4>

            {/* Grid Circles */}
            <div className="flex-grow overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-3.5 justify-items-center">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = isQuestionAnswered(q);
                  const isFlagged = bookmarks.has(q.id);
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setIsNavigatorOpen(false);
                      }}
                      className={`relative w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? "border-2 border-[var(--exam-accent)] text-[var(--exam-accent)] shadow-sm bg-transparent"
                          : isAnswered
                          ? "bg-[var(--state-answered-bg)] border border-[var(--state-answered-border)] text-[var(--state-answered-text)]"
                          : "bg-muted border border-border text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--state-flagged-bg)] border border-[var(--state-flagged-border)] text-[var(--state-flagged-text)]" style={{ fontSize: "7px" }}>
                          <i className="fa-solid fa-bookmark" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend Section */}
            <div className="border-t pt-4 mt-4 border-border flex flex-col gap-2 shrink-0">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <i className="fa-light fa-circle-info" />
                Status Legend
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded-full bg-[var(--state-answered-bg)] border border-[var(--state-answered-border)] text-[var(--state-answered-text)] flex items-center justify-center font-bold text-[9px]">✓</span>
                  <span className="text-foreground font-medium text-[11px]">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4.5 h-4.5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center font-bold text-[9px]">•</span>
                  <span className="text-foreground font-medium text-[11px]">Unanswered</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="relative w-4.5 h-4.5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center font-bold text-[9px]">
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--state-flagged-bg)] border border-[var(--state-flagged-border)] text-[var(--state-flagged-text)]" style={{ fontSize: "6px" }}>
                      <i className="fa-solid fa-bookmark" />
                    </span>
                    1
                  </span>
                  <span className="text-foreground font-medium text-[11px]">Flagged for Review</span>
                </div>
              </div>
            </div>

            {/* Final Submit Trigger */}
            <div className="border-t pt-4 mt-4 border-border">
              <button
                onClick={() => {
                  setIsNavigatorOpen(false);
                  setIsSubmitModalOpen(true);
                }}
                className="w-full bg-[var(--exam-accent)] hover:opacity-90 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
              >
                Review &amp; Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESSIBILITY / SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            onClick={() => setIsSettingsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          ></div>
          
          <div className="relative max-w-md w-full p-6 bg-card border border-border rounded-2xl shadow-2xl flex flex-col gap-5 animate-card-enter text-left z-10">
            <div className="flex justify-between items-center border-b pb-3 border-border">
              <h3 className="font-bold text-md text-foreground flex items-center gap-2">
                <i className="fa-light fa-sliders" />
                Accessibility Settings
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: "16px" }} />
              </button>
            </div>

            {/* Themes */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color Theme</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['light', 'dark', 'contrast'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs capitalize cursor-pointer transition-all ${
                      theme === t
                        ? "bg-[var(--exam-accent-light)] border-[var(--exam-accent)] text-[var(--exam-accent)]"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Stepper */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Text Size</label>
                <span className="text-xs font-bold text-[var(--exam-accent)]">{fontSizePercent}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={fontSizePercent <= 100}
                  onClick={() => setFontSizePercent(prev => Math.max(100, prev - 50))}
                  className="py-2 px-3 rounded-lg border bg-background border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <i className="fa-solid fa-minus" /> Decrease (50%)
                </button>
                <button
                  type="button"
                  disabled={fontSizePercent >= 200}
                  onClick={() => setFontSizePercent(prev => Math.min(200, prev + 50))}
                  className="py-2 px-3 rounded-lg border bg-background border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <i className="fa-solid fa-plus" /> Increase (50%)
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                WCAG compliance: Increase/decrease text size (up to 200%, with a stepper of 50%).
              </p>
            </div>

            {/* Color Filters */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colorblindness Filter</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setColorFilter(f)}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs capitalize cursor-pointer transition-all ${
                      colorFilter === f
                        ? "bg-[var(--exam-accent-light)] border-[var(--exam-accent)] text-[var(--exam-accent)]"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f === 'none' ? 'None' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Keyboard Shortcuts</label>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsShortcutsOpen(true);
                }}
                className="w-full py-2 px-3 rounded-lg border font-semibold text-xs cursor-pointer transition-all bg-background border-border text-foreground hover:bg-muted flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <i className="fa-light fa-keyboard text-muted-foreground" />
                  View Keyboard Shortcuts
                </span>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-muted-foreground">
                  {isMac ? '⌘ + /' : 'Ctrl + /'}
                </kbd>
              </button>
            </div>

            {/* Help Request */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Help & Support</label>
              {!isHelpFormOpen ? (
                <button
                  type="button"
                  onClick={() => setIsHelpFormOpen(true)}
                  className="w-full py-2 px-3 rounded-lg border font-semibold text-xs cursor-pointer transition-all bg-background border-border text-foreground hover:bg-muted flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <i className="fa-light fa-circle-question text-muted-foreground" />
                    Submit Help Request
                  </span>
                  <i className="fa-solid fa-chevron-right text-muted-foreground text-[10px]" />
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-3 bg-muted/30 border border-border rounded-xl animate-card-enter">
                  <span className="text-xs font-bold text-foreground">Describe your issue:</span>
                  <textarea
                    value={helpComment}
                    onChange={(e) => setHelpComment(e.target.value)}
                    placeholder="Describe what you need help with..."
                    rows={3}
                    className="w-full p-2 bg-card border border-border rounded-lg text-xs focus:outline-none focus:border-[var(--exam-accent)] resize-none text-foreground bg-background"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHelpFormOpen(false);
                        setHelpComment("");
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleHelpSubmit}
                      disabled={!helpComment.trim()}
                      className="px-3 py-1.5 text-xs font-bold bg-[var(--exam-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-[var(--exam-accent)] hover:opacity-90 text-white font-bold py-2.5 rounded-xl transition-all mt-2 cursor-pointer text-sm"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            onClick={() => setIsShortcutsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          ></div>
          
          <div className="relative max-w-lg w-full p-6 bg-card border border-border rounded-2xl shadow-2xl flex flex-col gap-5 animate-card-enter text-left z-10">
            <div className="flex justify-between items-center border-b pb-3 border-border">
              <h3 className="font-bold text-md text-foreground flex items-center gap-2">
                <i className="fa-light fa-keyboard text-[var(--exam-accent)]" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: "16px" }} />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto pr-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left font-bold bg-muted/50">
                    <th className="p-3 text-foreground rounded-l-lg">Action</th>
                    <th className="p-3 text-foreground">Windows Shortcuts</th>
                    <th className="p-3 text-foreground rounded-r-lg">Mac OS Shortcuts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">Flag for review</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">ALT + F</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">Option + F</kbd></td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">Calculator</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">ALT + C</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">Option + C</kbd></td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">Forward navigation</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">ALT + N</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">Option + N</kbd></td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">Backward navigation</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">ALT + P</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">Option + P</kbd></td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">Scratch an option</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">ALT + W</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">Option + W</kbd></td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">Adjust font size</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">Ctrl + '+' / '-'</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">CMD + '+' / '-'</kbd></td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">View keyboard shortcuts</td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">CTRL + /</kbd></td>
                    <td className="p-3"><kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-bold shadow-xs">CMD + /</kbd></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="w-full bg-[var(--exam-accent)] hover:opacity-90 text-white font-bold py-2.5 rounded-xl transition-all mt-2 cursor-pointer text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FINAL SUBMIT VERIFICATION MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Overlay (clicking outside will NOT close the modal) */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs"></div>
          
          <div className="relative max-w-md w-full p-6 bg-card border border-border rounded-2xl shadow-2xl flex flex-col gap-5 animate-card-enter text-center z-10">
            {/* Close Icon top right */}
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: "16px" }} />
            </button>

            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
              <i className="fa-light fa-file-shield" style={{ fontSize: "20px" }} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-foreground">Submit Exam</h3>
              <p className="text-sm text-muted-foreground">
                Please review your exam completion summary.
              </p>
            </div>

            <div className="p-4 rounded-xl border text-left bg-muted/40 border-border">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase">Questions Answered</span>
                <span className="text-sm font-bold text-foreground">{getAnsweredCount()} / {questions.length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase">Unanswered Questions</span>
                <span className={`text-sm font-bold ${questions.length - getAnsweredCount() > 0 ? "text-destructive" : "text-foreground"}`}>
                  {questions.length - getAnsweredCount()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase">Flagged for Review</span>
                <span className="text-sm font-bold text-foreground">{bookmarks.size}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase">Time Remaining</span>
                <span className={`text-sm font-bold font-timer ${timeLeft <= 300 ? "text-destructive animate-pulse" : "text-foreground"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {bookmarks.size > 0 && (
              <div className="p-3 bg-[var(--state-flagged-bg)] border border-[var(--state-flagged-border)] rounded-xl text-left flex items-start gap-2 text-xs text-[var(--state-flagged-text)] leading-relaxed animate-card-enter">
                <i className="fa-solid fa-bookmark mt-0.5 shrink-0 text-sm" />
                <span>
                  You have <strong>{bookmarks.size}</strong> question{bookmarks.size > 1 ? 's' : ''} flagged for review. Use the review CTA below to inspect them.
                </span>
              </div>
            )}

            <div className="p-3.5 bg-destructive/5 border border-destructive/10 rounded-xl text-xs text-destructive text-left leading-relaxed flex items-start gap-2.5">
              <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0" style={{ fontSize: "14px" }} />
              <span>
                <strong>Warning:</strong> Once submitted, you will no longer be able to modify your answers or return to this assessment.
              </span>
            </div>

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                disabled={bookmarks.size === 0}
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  const firstFlaggedQ = questions.find((q) => bookmarks.has(q.id));
                  if (firstFlaggedQ) {
                    const idx = questions.findIndex((x) => x.id === firstFlaggedQ.id);
                    setCurrentQuestionIndex(idx !== -1 ? idx : 0);
                  }
                }}
                className="flex-1 border border-border bg-background hover:bg-muted font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
                title={bookmarks.size === 0 ? "No flagged questions to review" : "Review Flagged Questions"}
              >
                <i className="fa-solid fa-bookmark text-[var(--state-flagged-text)]" /> Review Flagged
              </button>
              <button
                onClick={() => {
                  fillMockAnswers();
                  setIsSubmitModalOpen(false);
                  setPhase('submitted');
                }}
                className="flex-1 bg-destructive hover:opacity-90 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-sm shadow-md"
              >
                Submit &amp; Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL REFERENCES DRAWER */}
      {isGlobalRefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            onClick={() => setIsGlobalRefOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          ></div>
          
          <div className="relative max-w-4xl w-full h-[85vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-card-enter">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-bold text-md text-foreground flex items-center gap-2">
                <i className="fa-light fa-file-shield text-[var(--exam-accent)]" />
                Assessment Global References
              </h3>
              <button
                onClick={() => setIsGlobalRefOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: "16px" }} />
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-border bg-muted/10 shrink-0 overflow-x-auto">
              {['Formulae Sheet', 'Reference PDF', 'Reference Image', 'Auscultation Audio', 'Assessment Video'].map((title, idx) => (
                <button
                  key={title}
                  onClick={() => setGlobalRefTab(idx)}
                  className={`py-3 px-5 font-semibold text-xs uppercase tracking-wider outline-none text-center cursor-pointer border-b-2 transition-all min-w-[150px] ${
                    globalRefTab === idx
                      ? "border-[var(--exam-accent)] text-[var(--exam-accent)] bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="flex-1 overflow-y-auto p-6 bg-card">
              {globalRefTab === 0 && (
                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Medical Formula Guide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <span className="text-xs font-bold text-[var(--exam-accent)] uppercase">Renal Clearance</span>
                      <p className="text-sm font-semibold mt-1 font-mono text-foreground">Cx = (Ux * V) / Px</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Cx = clearance of x, Ux = urine conc, V = urine flow rate, Px = plasma conc</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <span className="text-xs font-bold text-[var(--exam-accent)] uppercase">Acid-Base Balance</span>
                      <p className="text-sm font-semibold mt-1 font-mono text-foreground">pH = pKa + log([HCO3-] / [0.03 * PaCO2])</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Henderson-Hasselbalch equation for arterial blood gas interpretation</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <span className="text-xs font-bold text-[var(--exam-accent)] uppercase">Cardiology - Cardiac Output</span>
                      <p className="text-sm font-semibold mt-1 font-mono text-foreground">CO = SV * HR</p>
                      <p className="text-[11px] text-muted-foreground mt-1">SV = stroke volume, HR = heart rate, CO = cardiac output</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <span className="text-xs font-bold text-[var(--exam-accent)] uppercase">Cardiology - Blood Pressure</span>
                      <p className="text-sm font-semibold mt-1 font-mono text-foreground">MAP = DBP + 1/3 (SBP - DBP)</p>
                      <p className="text-[11px] text-muted-foreground mt-1">MAP = Mean Arterial Pressure, SBP = Systolic BP, DBP = Diastolic BP</p>
                    </div>
                  </div>
                </div>
              )}

              {globalRefTab === 1 && (
                <div className="w-full h-full flex flex-col border rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src="https://www.africau.edu/images/default/sample.pdf"
                    className="w-full h-full min-h-[450px]"
                    title="Global Guidelines PDF"
                  />
                </div>
              )}

              {globalRefTab === 2 && (
                <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                  <img
                    src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=900&q=80"
                    alt="Anatomy Reference Chart"
                    className="max-w-full max-h-[450px] object-contain rounded-lg border shadow-sm"
                  />
                </div>
              )}

              {globalRefTab === 3 && (
                <div className="w-full h-full flex flex-col items-center justify-center min-h-[350px] gap-4">
                  <div className="rounded-xl border p-6 bg-muted max-w-md w-full flex flex-col items-center justify-center gap-4">
                    <audio
                      src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                      controls
                      className="w-full"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Cardiac Auscultation Reference Recording</span>
                </div>
              )}

              {globalRefTab === 4 && (
                <div className="w-full h-full flex flex-col items-center justify-center min-h-[380px] gap-4">
                  <div className="rounded-xl border p-2 bg-black overflow-hidden max-w-xl w-full flex items-center justify-center">
                    <video
                      src="https://www.w3schools.com/html/mov_bbb.mp4"
                      controls
                      className="w-full max-h-[350px]"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Patient Gait Mobility Assessment Video</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end shrink-0">
              <button
                onClick={() => setIsGlobalRefOpen(false)}
                className="bg-[var(--exam-accent)] hover:opacity-90 text-white font-bold py-2 px-5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Close References
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CALCULATOR */}
      {showCalculator && (
        <div className="fixed top-20 right-6 z-50 w-64 bg-card border border-border rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-card-enter">
          <div className="flex justify-between items-center border-b pb-2 border-border">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <i className="fa-light fa-calculator" />
              Calculator
            </span>
            <button
              onClick={() => setShowCalculator(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: "14px" }} />
            </button>
          </div>

          {/* Calculator Readout */}
          <div className="bg-muted p-3 rounded-xl border border-border text-right min-h-[60px] flex flex-col justify-between overflow-hidden">
            <div className="text-xs text-muted-foreground truncate font-mono">{calcInput || '0'}</div>
            <div className="text-lg font-bold text-foreground truncate font-mono">{calcResult || '0'}</div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2 text-sm font-semibold font-mono">
            {/* Row 1 */}
            <button onClick={() => handleCalcBtnClick('C')} className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg cursor-pointer">C</button>
            <button onClick={() => handleCalcBtnClick('del')} className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg cursor-pointer">del</button>
            <button onClick={() => handleCalcBtnClick('/')} className="p-2 bg-muted hover:bg-muted/80 text-[var(--exam-accent)] rounded-lg cursor-pointer">/</button>
            <button onClick={() => handleCalcBtnClick('*')} className="p-2 bg-muted hover:bg-muted/80 text-[var(--exam-accent)] rounded-lg cursor-pointer">*</button>

            {/* Row 2 */}
            <button onClick={() => handleCalcBtnClick('7')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">7</button>
            <button onClick={() => handleCalcBtnClick('8')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">8</button>
            <button onClick={() => handleCalcBtnClick('9')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">9</button>
            <button onClick={() => handleCalcBtnClick('-')} className="p-2 bg-muted hover:bg-muted/80 text-[var(--exam-accent)] rounded-lg cursor-pointer">-</button>

            {/* Row 3 */}
            <button onClick={() => handleCalcBtnClick('4')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">4</button>
            <button onClick={() => handleCalcBtnClick('5')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">5</button>
            <button onClick={() => handleCalcBtnClick('6')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">6</button>
            <button onClick={() => handleCalcBtnClick('+')} className="p-2 bg-muted hover:bg-muted/80 text-[var(--exam-accent)] rounded-lg cursor-pointer">+</button>

            {/* Row 4 */}
            <button onClick={() => handleCalcBtnClick('1')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">1</button>
            <button onClick={() => handleCalcBtnClick('2')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">2</button>
            <button onClick={() => handleCalcBtnClick('3')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">3</button>
            <button onClick={() => handleCalcBtnClick('=')} className="row-span-2 p-2 bg-[var(--exam-accent)] text-white hover:opacity-90 rounded-lg cursor-pointer flex items-center justify-center font-bold">=</button>

            {/* Row 5 */}
            <button onClick={() => handleCalcBtnClick('0')} className="col-span-2 p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">0</button>
            <button onClick={() => handleCalcBtnClick('.')} className="p-2 bg-background border border-border hover:bg-muted text-foreground rounded-lg cursor-pointer">.</button>
          </div>
        </div>
      )}

      {/* FLOATING ON-SCREEN KEYBOARD */}
      {showKeyboard && (
        <div className="fixed bottom-20 left-6 z-50 w-[480px] max-w-full bg-card border border-border rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-card-enter">
          <div className="flex justify-between items-center border-b pb-2 border-border">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <i className="fa-light fa-keyboard" />
              On-Screen Keyboard
            </span>
            <button
              onClick={() => setShowKeyboard(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: "14px" }} />
            </button>
          </div>
          
          <div className="text-[11px] text-muted-foreground text-center font-semibold mb-1">
            {currentQuestion.type === 'essay' ? 'Click keys below to type directly into the Essay text field:' : 'Applicable for typing in Essay questions.'}
          </div>

          {/* Virtual Keyboard Rows */}
          <div className="flex flex-col gap-1.5 text-xs font-bold text-foreground">
            {/* Row 1 */}
            <div className="flex gap-1 justify-center">
              {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(k => (
                <button key={k} onClick={() => handleKeyClick(k)} className="w-8 h-8 rounded-md bg-muted border border-border hover:bg-muted/80 flex items-center justify-center cursor-pointer">{k}</button>
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex gap-1 justify-center">
              {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(k => (
                <button key={k} onClick={() => handleKeyClick(k)} className="w-8 h-8 rounded-md bg-muted border border-border hover:bg-muted/80 flex items-center justify-center cursor-pointer">{k}</button>
              ))}
            </div>
            {/* Row 3 */}
            <div className="flex gap-1 justify-center">
              {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(k => (
                <button key={k} onClick={() => handleKeyClick(k)} className="w-8 h-8 rounded-md bg-muted border border-border hover:bg-muted/80 flex items-center justify-center cursor-pointer">{k}</button>
              ))}
              <button onClick={() => handleKeyClick('Backspace')} className="px-2 h-8 rounded-md bg-muted border border-border hover:bg-muted/80 text-[10px] uppercase flex items-center justify-center cursor-pointer" title="Backspace">
                <i className="fa-light fa-delete-left" />
              </button>
            </div>
            {/* Row 4 */}
            <div className="flex gap-1.5 justify-center">
              <button onClick={() => handleKeyClick(' ')} className="w-48 h-8 rounded-md bg-muted border border-border hover:bg-muted/80 text-[10px] uppercase flex items-center justify-center cursor-pointer">Space</button>
              <button onClick={() => handleKeyClick('Enter')} className="px-3 h-8 rounded-md bg-[var(--exam-accent-light)] border border-[var(--exam-accent-border)] text-[var(--exam-accent)] hover:opacity-95 text-[10px] uppercase flex items-center justify-center cursor-pointer">Enter</button>
            </div>
          </div>
        </div>
      )}

      {isDuplicateTab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
          <div className="max-w-md w-full p-8 rounded-2xl border bg-card shadow-2xl text-center flex flex-col gap-6 animate-card-enter border-destructive/30">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto animate-pulse">
              <i className="fa-solid fa-clone text-[28px]" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Duplicate Tab Detected
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your exam is already running in another tab. If you have closed the tab, refresh this screen and try starting again.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[var(--exam-accent)] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <i className="fa-light fa-arrows-rotate" />
              Refresh Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
