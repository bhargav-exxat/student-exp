import * as React from "react";
import { Question, QuestionOption, QuestionAttachment } from "./questions-data";

interface QuestionRendererProps {
  question: Question;
  questionNumber?: number;
  answers: Record<number, any>; // Key: question.id, Value: answer state
  onAnswerChange: (questionId: number, answer: any) => void;
  crossedOut: Record<number, string[]>; // Key: question.id, Value: list of crossed out option letters
  onToggleCrossOut: (questionId: number, optionLetter: string) => void;
  highlights?: Record<number, Array<{ text: string; color: string }>>;
  onRemoveHighlight?: (text: string) => void;
  onUpdateHighlightColor?: (text: string, color: 'yellow' | 'blue' | 'pink' | 'green') => void;
}

const getHighlightColorCode = (color: string) => {
  switch (color) {
    case 'yellow': return '#fef08a';
    case 'blue': return '#bfdbfe';
    case 'pink': return '#fbcfe8';
    case 'green': return '#bbf7d0';
    default: return 'transparent';
  }
};

export function QuestionRenderer({
  question,
  questionNumber,
  answers,
  onAnswerChange,
  crossedOut,
  onToggleCrossOut,
  highlights,
  onRemoveHighlight,
  onUpdateHighlightColor,
}: QuestionRendererProps) {
  const currentAnswer = answers[question.id];
  const currentCrossedOut = crossedOut[question.id] || [];

  // Active highlight popover state
  const [activeHighlight, setActiveHighlight] = React.useState<{ text: string; x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!activeHighlight) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.highlight-popover-container')) {
        setActiveHighlight(null);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeHighlight]);

  // Active tab state for tabbed reference panels
  const [activeTab, setActiveTab] = React.useState<number>(0);

  // Dictation state for essay questions
  const [isDictating, setIsDictating] = React.useState(false);

  // Reset active tab and dictation when question changes
  React.useEffect(() => {
    setActiveTab(0);
    setIsDictating(false);
  }, [question.id]);

  const renderHighlightedText = (text: string) => {
    if (!text) return "";
    const questionHighlights = highlights ? (highlights[question.id] || []) : [];
    
    const handleHighlightClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'MARK') {
        setActiveHighlight({
          text: target.innerText,
          x: e.clientX,
          y: e.clientY
        });
      }
    };

    if (questionHighlights.length === 0) {
      return <span onClick={handleHighlightClick} dangerouslySetInnerHTML={{ __html: text }} />;
    }

    // Define helper to recursively highlight text nodes
    const highlightTextNodes = (node: ChildNode, textToHighlight: string, colorClass: string, colorStyle: string) => {
      if (node.nodeType === 3) { // Text Node
        const textContent = node.textContent || "";
        const escaped = textToHighlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        
        if (regex.test(textContent)) {
          const parent = node.parentNode;
          if (parent && parent.nodeName !== 'MARK') {
            const parts = textContent.split(regex);
            const fragment = document.createDocumentFragment();
            
            parts.forEach((part, index) => {
              if (index % 2 === 1) {
                const mark = document.createElement('mark');
                mark.className = colorClass;
                mark.setAttribute('style', colorStyle);
                mark.textContent = part;
                fragment.appendChild(mark);
              } else if (part) {
                fragment.appendChild(document.createTextNode(part));
              }
            });
            
            parent.replaceChild(fragment, node);
          }
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'MARK') { // Element Node
        const children = Array.from(node.childNodes);
        for (const child of children) {
          highlightTextNodes(child, textToHighlight, colorClass, colorStyle);
        }
      }
    };

    // Create a temporary element to parse the HTML string
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;

    // Sort highlights by length descending to match longer phrases first
    const sortedHighlights = [...questionHighlights].sort((a, b) => b.text.length - a.text.length);

    for (const hl of sortedHighlights) {
      if (!hl.text.trim()) continue;
      const colorClass = "rounded-xs px-0.5 cursor-pointer hover:opacity-80 transition-opacity";
      const colorStyle = `background-color: ${getHighlightColorCode(hl.color)}; color: inherit;`;
      highlightTextNodes(tempDiv, hl.text, colorClass, colorStyle);
    }

    const html = tempDiv.innerHTML;
    return <span onClick={handleHighlightClick} dangerouslySetInnerHTML={{ __html: html }} />;
  };

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

  function getAttachmentDefaultTitle(att: QuestionAttachment, index: number): string {
    switch (att.type) {
      case "image":
        return `Image Reference ${index + 1}`;
      case "audio":
        return `Audio Recording ${index + 1}`;
      case "video":
        return `Video Clip ${index + 1}`;
      case "pdf":
        return att.title || `Document ${index + 1}`;
      case "chart":
        return `Vital Signs Chart`;
      case "html":
        return att.title || `Clinical Details ${index + 1}`;
      default:
        return `Reference ${index + 1}`;
    }
  }

  const renderAttachmentContent = (att: QuestionAttachment, index: number) => {
    switch (att.type) {
      case "image":
        return (
          <div className="flex flex-col gap-3 h-full justify-center items-center">
            <div className="flex-1 w-full min-h-0 border rounded-xl overflow-hidden bg-muted flex items-center justify-center relative min-h-[280px]">
              <img
                alt={att.caption || att.title || "Reference image"}
                className="w-full h-auto max-h-full object-contain rounded-lg"
                src={att.src}
              />
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col gap-3 h-full justify-center">
            <div className="rounded-xl border p-6 flex flex-col items-center justify-center gap-4 bg-muted min-h-[120px]">
              <audio src={att.src} controls className="w-full max-w-md" aria-label="Question audio" />
            </div>
          </div>
        );

      case "video":
        return (
          <div className="flex flex-col gap-3 h-full justify-center">
            <div className="rounded-xl border p-2 bg-black overflow-hidden flex items-center justify-center min-h-[220px]">
              <video src={att.src} controls className="w-full max-h-[400px]" aria-label="Question video" />
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-0 border rounded-xl overflow-hidden bg-card flex flex-col min-h-[400px]">
              <div className="bg-muted px-4 py-2 border-b flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>{att.title || "Document Viewer"}</span>
                <span className="bg-background px-2 py-0.5 rounded border">PDF</span>
              </div>
              <iframe
                src={att.src}
                className="w-full flex-1 border-0"
                title={att.title || "PDF Viewer"}
                style={{ minHeight: "380px" }}
              />
            </div>
          </div>
        );

      case "html":
        return (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-0 border rounded-xl overflow-y-auto bg-card" style={{ minHeight: "250px" }}>
              <div dangerouslySetInnerHTML={{ __html: att.htmlContent || "" }} />
            </div>
          </div>
        );

      case "chart":
        return (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-0 border rounded-xl p-4 bg-card flex flex-col items-center min-h-[320px] shadow-sm">
              <h3 className="font-bold mb-4 text-center text-foreground">Patient Vital Signs Over 24 Hours</h3>
              <svg viewBox="0 0 600 300" className="w-full h-auto max-w-2xl" role="img" aria-label="Vital signs trend chart">
                <title>Patient Vital Signs Over 24 Hours</title>
                <line x1="40" y1="40" x2="560" y2="40" stroke="var(--border)" strokeWidth="1"></line>
                <line x1="40" y1="95" x2="560" y2="95" stroke="var(--border)" strokeWidth="1"></line>
                <line x1="40" y1="150" x2="560" y2="150" stroke="var(--border)" strokeWidth="1"></line>
                <line x1="40" y1="205" x2="560" y2="205" stroke="var(--border)" strokeWidth="1"></line>
                <line x1="40" y1="260" x2="560" y2="260" stroke="var(--border)" strokeWidth="1"></line>
                
                <text x="40" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">0h</text>
                <text x="126" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">4h</text>
                <text x="213" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">8h</text>
                <text x="300" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">12h</text>
                <text x="386" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">16h</text>
                <text x="473" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">20h</text>
                <text x="560" y="290" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">24h</text>

                {/* Heart Rate (Red Line) */}
                <polyline points="40,255 126,253 213,244 300,228 386,226 473,230 560,235" fill="none" stroke="#EF4444" strokeWidth="3"></polyline>
                <circle cx="40" cy="255" r="4" fill="#EF4444"></circle>
                <circle cx="126" cy="253" r="4" fill="#EF4444"></circle>
                <circle cx="213" cy="244" r="4" fill="#EF4444"></circle>
                <circle cx="300" cy="228" r="4" fill="#EF4444"></circle>
                <circle cx="386" cy="226" r="4" fill="#EF4444"></circle>
                <circle cx="473" cy="230" r="4" fill="#EF4444"></circle>
                <circle cx="560" cy="235" r="4" fill="#EF4444"></circle>

                {/* SBP (Blue Line) */}
                <polyline points="40,233 126,235 213,244 300,257 386,260 473,255 560,250" fill="none" stroke="#3B82F6" strokeWidth="3"></polyline>
                <circle cx="40" cy="233" r="4" fill="#3B82F6"></circle>
                <circle cx="126" cy="235" r="4" fill="#3B82F6"></circle>
                <circle cx="213" cy="244" r="4" fill="#3B82F6"></circle>
                <circle cx="300" cy="257" r="4" fill="#3B82F6"></circle>
                <circle cx="386" cy="260" r="4" fill="#3B82F6"></circle>
                <circle cx="473" cy="255" r="4" fill="#3B82F6"></circle>
                <circle cx="560" cy="250" r="4" fill="#3B82F6"></circle>

                {/* Temperature (Yellow Line) */}
                <polyline points="40,60 126,57 213,51 300,40 386,40 473,42 560,47" fill="none" stroke="#F59E0B" strokeWidth="3"></polyline>
                <circle cx="40" cy="60" r="4" fill="#F59E0B"></circle>
                <circle cx="126" cy="57" r="4" fill="#F59E0B"></circle>
                <circle cx="213" cy="51" r="4" fill="#F59E0B"></circle>
                <circle cx="300" cy="40" r="4" fill="#F59E0B"></circle>
                <circle cx="386" cy="40" r="4" fill="#F59E0B"></circle>
                <circle cx="473" cy="42" r="4" fill="#F59E0B"></circle>
                <circle cx="560" cy="47" r="4" fill="#F59E0B"></circle>

                {/* Legend */}
                <g transform="translate(40, 15)">
                  <rect x="0" y="0" width="12" height="12" fill="#EF4444" rx="2"></rect>
                  <text x="20" y="10" fontSize="12" fill="var(--muted-foreground)">HR (bpm)</text>
                  
                  <rect x="130" y="0" width="12" height="12" fill="#3B82F6" rx="2"></rect>
                  <text x="150" y="10" fontSize="12" fill="var(--muted-foreground)">SBP (mmHg)</text>
                  
                  <rect x="260" y="0" width="12" height="12" fill="#F59E0B" rx="2"></rect>
                  <text x="280" y="10" fontSize="12" fill="var(--muted-foreground)">Temp (°C × 10)</text>
                </g>
              </svg>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAttachmentsPanel = () => {
    const attachments = question.attachments || [];
    if (attachments.length === 0) return null;

    if (attachments.length === 1) {
      return (
        <div className="flex-grow flex-shrink flex flex-col rounded-2xl border bg-card border-border shadow-sm overflow-hidden p-6 min-h-0 h-full">
          {renderAttachmentContent(attachments[0], 0)}
        </div>
      );
    }

    return (
      <div className="flex-grow flex-shrink flex flex-col rounded-2xl border bg-card border-border shadow-sm overflow-hidden min-h-0 h-full animate-card-enter">
        {/* Tab Header */}
        <div className="shrink-0 border-b border-border bg-muted/30 flex overflow-x-auto">
          {attachments.map((att, idx) => {
            const title = att.title || getAttachmentDefaultTitle(att, idx);
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`flex-1 min-w-[120px] py-3 px-4 font-semibold text-xs uppercase tracking-wider outline-none text-center cursor-pointer border-b-2 transition-all ${
                  isActive
                    ? "border-[var(--exam-accent)] text-[var(--exam-accent)] bg-card font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {title}
              </button>
            );
          })}
        </div>
        {/* Tab Content */}
        <div className="flex-grow flex-shrink overflow-y-auto p-6 bg-card min-h-0">
          {renderAttachmentContent(attachments[activeTab], activeTab)}
        </div>
      </div>
    );
  };

  const renderQuestionOptions = () => {
    switch (question.type) {
      case "mcq-single": {
        const options = question.options || [];
        return (
          <div className="flex flex-col gap-3" role="radiogroup">
            {options.map((opt) => {
              const isSelected = currentAnswer === opt.letter;
              const isCrossed = currentCrossedOut.includes(opt.letter);
              return (
                <div
                  key={opt.letter}
                  className="group relative flex flex-row items-center w-full"
                >
                  <button
                    onClick={() => {
                      if (!isCrossed) {
                        onAnswerChange(question.id, isSelected ? "" : opt.letter);
                      }
                    }}
                    disabled={isCrossed}
                    className={`w-full text-left transition-all flex flex-row items-center gap-3 p-[1em] pe-12 rounded-xl border-2 cursor-pointer ${
                      isSelected
                        ? "border-[var(--exam-accent)] bg-[var(--exam-accent-light)]"
                        : "border-border bg-card hover:bg-muted/40"
                    } ${isCrossed ? "opacity-30 line-through pointer-events-none" : ""}`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span
                      className={`inline-flex items-center justify-center rounded-md font-bold text-[12px] shrink-0 transition-colors w-8 h-8 border ${
                        isSelected
                          ? "bg-[var(--exam-accent)] text-white border-transparent"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                    <span className={`text-[12px] font-bold leading-none ${isSelected ? "text-white" : "text-foreground"}`}>{opt.letter}</span>
                    </span>
                    <div className="flex-grow flex flex-col items-start gap-1 py-1 w-full overflow-hidden">
                      {opt.text.includes('<math') || opt.text.includes('</math>') ? (
                        <span className="text-[1em] text-foreground font-semibold text-left leading-snug" dangerouslySetInnerHTML={{ __html: opt.text }} />
                      ) : (
                        <span className="text-[1em] text-foreground font-semibold text-left leading-snug">{opt.text}</span>
                      )}
                      {opt.image && (
                        <img 
                          src={opt.image} 
                          alt={`Option ${opt.letter}`} 
                          className="max-h-[140px] max-w-full rounded-lg border border-border/60 bg-muted/20 object-contain mt-1"
                        />
                      )}
                    </div>
                  </button>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                    <button
                      onClick={() => onToggleCrossOut(question.id, opt.letter)}
                      className={`inline-flex cursor-pointer items-center justify-center rounded-md border p-1 size-7 transition-opacity ${
                        isCrossed ? "opacity-100 bg-destructive/10 text-destructive border-destructive/20" : "opacity-30 hover:opacity-100 focus:opacity-100 bg-background text-muted-foreground border-border"
                      }`}
                      title={isCrossed ? "Restore option" : "Cross out option"}
                      aria-label="Cross out option"
                    >
                      <i className={`fa-light ${isCrossed ? "fa-eye" : "fa-eye-slash"}`} style={{ fontSize: "14px" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case "mcq-multiple": {
        const options = question.options || [];
        const selectedList: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
        return (
          <div className="flex flex-col gap-3">
            {options.map((opt) => {
              const isSelected = selectedList.includes(opt.letter);
              const isCrossed = currentCrossedOut.includes(opt.letter);
              return (
                <div
                  key={opt.letter}
                  className="group relative flex flex-row items-center w-full"
                >
                  <button
                    onClick={() => {
                      if (!isCrossed) {
                        const newList = isSelected
                          ? selectedList.filter((x) => x !== opt.letter)
                          : [...selectedList, opt.letter];
                        onAnswerChange(question.id, newList);
                      }
                    }}
                    disabled={isCrossed}
                    className={`w-full text-left transition-all flex flex-row items-center gap-3 p-[1em] pe-12 rounded-xl border-2 cursor-pointer ${
                      isSelected
                        ? "border-[var(--exam-accent)] bg-[var(--exam-accent-light)]"
                        : "border-border bg-card hover:bg-muted/40"
                    } ${isCrossed ? "opacity-30 line-through pointer-events-none" : ""}`}
                    role="checkbox"
                    aria-checked={isSelected}
                  >
                    <span
                      className={`inline-flex items-center justify-center rounded-md font-bold text-[12px] shrink-0 transition-colors w-8 h-8 border ${
                        isSelected
                          ? "bg-[var(--exam-accent)] text-white border-transparent"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                    <span className={`text-[12px] font-bold leading-none ${isSelected ? "text-white" : "text-foreground"}`}>{opt.letter}</span>
                    </span>
                    <div className="flex-grow flex flex-col items-start gap-1 py-1 w-full overflow-hidden">
                      {opt.text.includes('<math') || opt.text.includes('</math>') ? (
                        <span className="text-[1em] text-foreground font-semibold text-left leading-snug" dangerouslySetInnerHTML={{ __html: opt.text }} />
                      ) : (
                        <span className="text-[1em] text-foreground font-semibold text-left leading-snug">{opt.text}</span>
                      )}
                      {opt.image && (
                        <img 
                          src={opt.image} 
                          alt={`Option ${opt.letter}`} 
                          className="max-h-[140px] max-w-full rounded-lg border border-border/60 bg-muted/20 object-contain mt-1"
                        />
                      )}
                    </div>
                  </button>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                    <button
                      onClick={() => onToggleCrossOut(question.id, opt.letter)}
                      className={`inline-flex cursor-pointer items-center justify-center rounded-md border p-1 size-7 transition-opacity ${
                        isCrossed ? "opacity-100 bg-destructive/10 text-destructive border-destructive/20" : "opacity-30 hover:opacity-100 focus:opacity-100 bg-background text-muted-foreground border-border"
                      }`}
                      title={isCrossed ? "Restore option" : "Cross out option"}
                      aria-label="Cross out option"
                    >
                      <i className={`fa-light ${isCrossed ? "fa-eye" : "fa-eye-slash"}`} style={{ fontSize: "14px" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case "dropdown": {
        const options = question.options || [];
        return (
          <div className="w-full">
            <select
              value={currentAnswer || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              className="w-full p-[1em] rounded-xl border-2 text-[1em] bg-card text-foreground border-border focus:border-[var(--exam-accent)] focus:outline-none"
              aria-label="Select your answer from the dropdown options"
            >
              <option value="">Select an option...</option>
              {options.map((opt) => (
                <option key={opt.letter} value={opt.text}>{opt.text}</option>
              ))}
            </select>
          </div>
        );
      }

      case "fill-blank": {
        const blanks = question.blanks || [];
        const template = question.textWithPlaceholders || "";
        const parts = template.split(/\[blank\d+\]/);
        const currentAnswers: Record<string, string> = currentAnswer || {};

        const onBlankChange = (index: number, val: string) => {
          const newAnswers = { ...currentAnswers, [`blank${index + 1}`]: val };
          onAnswerChange(question.id, newAnswers);
        };

        return (
          <div className="p-6 rounded-xl border bg-card text-[1.125em] text-foreground leading-[2.8]" style={{ borderColor: "var(--border)" }}>
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                <span className="align-middle">{part}</span>
                {index < blanks.length && (
                  <select
                    id={`blank-select-${index}`}
                    value={currentAnswers[`blank${index + 1}`] || ""}
                    onChange={(e) => onBlankChange(index, e.target.value)}
                    className="exam-select py-1 px-3 rounded-lg border-2 text-[0.85em] font-semibold align-middle mx-1 bg-card text-foreground focus:border-[var(--exam-accent)] focus:outline-none"
                    style={{ minWidth: "9rem", borderColor: "var(--border)" }}
                    aria-label={`Select the correct term for blank ${index + 1}`}
                  >
                    <option value="">Select an option...</option>
                    {blanks[index].options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </React.Fragment>
            ))}
          </div>
        );
      }

      case "essay": {
        const wordCount = (currentAnswer || "").trim().split(/\s+/).filter(Boolean).length;

        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="relative w-full">
              <textarea
                value={currentAnswer || ""}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder="Type your essay response here..."
                rows={10}
                className="w-full p-4 rounded-xl border-2 text-[1em] bg-card text-foreground border-border focus:border-[var(--exam-accent)] focus:outline-none resize-y"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
              <span>Limit: 500 words</span>
              <span className="font-semibold">{wordCount} words</span>
            </div>
          </div>
        );
      }

      case "hotspot": {
        const hotspots = question.hotspots || [];
        const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return (
          <div className="flex flex-col items-center">
            <div className="relative inline-block border rounded-xl overflow-hidden shadow-sm bg-muted border-border">
              <img
                src={question.image}
                alt={question.text}
                className="max-w-full h-auto block"
                style={{ maxHeight: "450px" }}
              />
              {hotspots.map((spot, idx) => {
                const isSelected = currentAnswer === spot.label;
                const spotLetter = optionKeys[idx] || '';
                return (
                  <button
                    key={spot.label}
                    onClick={() => onAnswerChange(question.id, isSelected ? "" : spot.label)}
                    className={`absolute rounded-full border-2 transition-all flex items-center justify-center p-0 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--exam-accent)] border-transparent text-white"
                        : "bg-white hover:bg-muted border-[var(--exam-accent)] text-muted-foreground shadow-sm"
                    }`}
                    style={{
                      left: spot.left,
                      top: spot.top,
                      width: "1.8em",
                      height: "1.8em",
                      marginLeft: "-0.9em",
                      marginTop: "-0.9em",
                      zIndex: 10,
                    }}
                    title={`Select ${spot.label}`}
                    aria-label={`Select ${spot.label}`}
                  >
                    {isSelected ? (
                      <i className="fa-solid fa-check" style={{ fontSize: "10px" }} />
                    ) : (
                      <span className="text-[9px] font-extrabold text-[var(--exam-accent)]">{spotLetter}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case "match": {
        const matches = question.matches || [];
        const currentMatches: Record<string, string> = currentAnswer || {};

        const onMatchChange = (label: string, val: string) => {
          const newMatches = { ...currentMatches, [label]: val };
          onAnswerChange(question.id, newMatches);
        };

        // Gather all unique options across matches to serve as dropdown items
        const allDropdownOptions = Array.from(
          new Set(matches.flatMap((m) => m.options))
        );

        return (
          <div className="flex flex-col gap-4 w-full">
            {matches.map((match, idx) => (
              <div
                key={match.label}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card border-border focus-within:border-[var(--exam-accent)] focus-within:ring-2 focus-within:ring-[var(--exam-accent-light)] transition-all"
              >
                <div className="flex-1 font-semibold text-foreground">{match.label}</div>
                <select
                  id={`match-select-${idx}`}
                  value={currentMatches[match.label] || ""}
                  onChange={(e) => onMatchChange(match.label, e.target.value)}
                  className="exam-select flex-1 py-2 px-3 rounded-lg border-2 text-[0.95em] bg-card text-foreground border-border focus:border-[var(--exam-accent)] focus:outline-none"
                  aria-label={`Match ${match.label} with the correct option`}
                  title={`Choose match for ${match.label}`}
                >
                  <option value="">Select an option...</option>
                  {allDropdownOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const attachments = question.attachments || [];
  const hasReference = attachments.length > 0;

  return (
    <div className="w-full flex-1 min-h-0 animate-card-enter flex flex-col overflow-hidden">
      <div className={`flex-1 min-h-0 flex gap-6 overflow-hidden flex-col ${hasReference ? "md:flex-row-reverse" : "max-w-4xl mx-auto w-full"}`}>
        {/* Left Side: Question content (or full-width if no reference) */}
        <div className={`${hasReference ? "md:w-1/2" : "w-full"} min-h-0 overflow-y-auto rounded-2xl border shadow-sm flex flex-col bg-card border-border`}>
          <div className="p-8 flex flex-col gap-6 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-grow">
                <span className="font-bold text-[1.2em] text-foreground mt-0.5 shrink-0">
                  {questionNumber || question.id}.
                </span>
                <h2 className="text-[1.125em] font-semibold leading-relaxed text-foreground">
                  {renderHighlightedText(question.text)}
                </h2>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border/80 select-none shrink-0 mt-1">
                {question.points ?? 2} points
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-start">
              <h3 className="font-semibold text-xs mb-4 uppercase tracking-wider text-muted-foreground">
                {question.type === "mcq-multiple"
                  ? "Select all correct options:"
                  : question.type === "fill-blank"
                  ? "Select terms for the blanks:"
                  : question.type === "match"
                  ? "Match the following items:"
                  : question.type === "essay"
                  ? "Write your answer:"
                  : question.type === "hotspot"
                  ? "Click on the diagram:"
                  : "Select your answer:"}
              </h3>
              {renderQuestionOptions()}
            </div>
          </div>
        </div>

        {/* Right Side: Reference Panel (Only if exists) */}
        {hasReference && (
          <div className="md:w-1/2 min-h-[320px] md:min-h-0 flex flex-col gap-3">
            {renderAttachmentsPanel()}
          </div>
        )}
      </div>

      {activeHighlight && (
        <div
          className="fixed z-50 bg-card border border-border shadow-2xl rounded-xl p-2 flex items-center gap-2 text-xs animate-card-enter highlight-popover-container"
          style={{
            top: `${activeHighlight.y}px`,
            left: `${activeHighlight.x}px`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className="flex gap-1.5 items-center mr-1">
            {(['yellow', 'blue', 'pink', 'green'] as const).map((color) => {
              const colorBg = {
                yellow: 'bg-yellow-200 dark:bg-yellow-500/40 border-yellow-400',
                blue: 'bg-blue-200 dark:bg-blue-500/40 border-blue-400',
                pink: 'bg-pink-200 dark:bg-pink-500/40 border-pink-400',
                green: 'bg-green-200 dark:bg-green-500/40 border-green-400'
              }[color];
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    if (onUpdateHighlightColor) {
                      onUpdateHighlightColor(activeHighlight.text, color);
                    }
                    setActiveHighlight(null);
                  }}
                  className={`size-6 rounded-full border transition-all cursor-pointer ${colorBg} hover:scale-110`}
                  title={`Change highlight color to ${color}`}
                />
              );
            })}
          </div>
          <div className="h-4 w-px bg-border"></div>
          <button
            onClick={() => {
              if (onRemoveHighlight) {
                onRemoveHighlight(activeHighlight.text);
              }
              setActiveHighlight(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-white hover:opacity-90 rounded-lg font-bold cursor-pointer transition-all shadow-md text-[11px]"
          >
            <i className="fa-solid fa-trash" />
            remove
          </button>
          <button
            onClick={() => setActiveHighlight(null)}
            className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg font-semibold cursor-pointer transition-all text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
