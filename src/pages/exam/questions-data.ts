export interface QuestionOption {
  letter: string;
  text: string;
  image?: string;
}

export interface QuestionBlank {
  options: string[];
}

export interface QuestionMatch {
  label: string;
  options: string[];
}

export interface Hotspot {
  label: string;
  left: string;
  top: string;
}

export interface QuestionAttachment {
  type: 'image' | 'video' | 'audio' | 'pdf' | 'chart' | 'html';
  src?: string;
  title?: string;
  caption?: string; // only used for image as alt text
  htmlContent?: string;
}

export interface Question {
  id: number;
  originalId: number;
  sectionId: number;
  sectionName: string;
  sectionTitle: string; // e.g. "Section 1 of 6"
  type: 'mcq-single' | 'mcq-multiple' | 'fill-blank' | 'essay' | 'hotspot' | 'match' | 'dropdown';
  text: string;
  options?: QuestionOption[];
  textWithPlaceholders?: string;
  blanks?: QuestionBlank[];
  matches?: QuestionMatch[];
  hotspots?: Hotspot[];
  image?: string; // hotspot base image
  attachments?: QuestionAttachment[] | null;
}

export const questionsData: Question[] = [
  // SECTION 1: Nervous System (1 to 16)
  {
    id: 1,
    originalId: 1,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Which of the following symptoms is most commonly associated with myocardial infarction?",
    options: [
      { letter: "A", text: "Chest pain" },
      { letter: "B", text: "Skin rash" },
      { letter: "C", text: "Hearing loss" },
      { letter: "D", text: "Blurred vision" }
    ],
    attachments: [
      {
        type: "image",
        title: "ECG Strip",
        src: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=900&q=80",
        caption: "ECG Strip showing ST-segment elevation in lead II, III, and aVF."
      },
      {
        type: "html",
        title: "Emergency Intake Report",
        htmlContent: `<div class="p-6 bg-muted rounded-xl border max-h-[400px] overflow-y-auto font-sans text-sm leading-relaxed">
          <h4 class="font-bold border-b pb-2 mb-3">Emergency Department Intake Report</h4>
          <p><strong>Patient Profile:</strong> 58-year-old female presents to the triage desk complaining of acute chest discomfort.</p>
          <p class="mt-2"><strong>Presenting Symptoms:</strong> Patient describes a sensation of "intense pressure and tightness" in the substernal chest area, radiating to her left arm and neck. The symptoms began approximately 30 minutes ago, accompanied by cold sweat, nausea, and shortness of breath.</p>
          <p class="mt-2"><strong>Past Medical History:</strong> Type 2 Diabetes Mellitus (managed with metformin), Hypercholesterolemia, and a 20 pack-year smoking history.</p>
          <p class="mt-2"><strong>Triage Vitals:</strong> BP 155/92 mmHg, HR 104 bpm (tachycardia), RR 22 bpm, Temp 36.8°C, SpO2 93% on room air.</p>
        </div>`
      },
      {
        type: "html",
        title: "Cardiac Biomarkers",
        htmlContent: `<div class="p-6 bg-card rounded-xl border overflow-hidden font-sans text-sm">
          <h4 class="font-bold border-b pb-2 mb-3">Cardiac Biomarkers Lab Panel</h4>
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b text-left font-bold bg-muted/50">
                <th class="p-2 text-foreground">Biomarker</th>
                <th class="p-2 text-foreground">Patient Result</th>
                <th class="p-2 text-foreground">Reference Range</th>
                <th class="p-2 text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border/40">
                <td class="p-2 font-medium text-foreground">Troponin I</td>
                <td class="p-2 text-destructive font-semibold">4.8 ng/mL</td>
                <td class="p-2 text-foreground">&lt; 0.04 ng/mL</td>
                <td class="p-2"><span class="px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-500 rounded">Critical High</span></td>
              </tr>
              <tr class="border-b border-border/40">
                <td class="p-2 font-medium text-foreground">CK-MB</td>
                <td class="p-2 text-destructive font-semibold">18.5 ng/mL</td>
                <td class="p-2 text-foreground">&lt; 5.0 ng/mL</td>
                <td class="p-2"><span class="px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-500 rounded">High</span></td>
              </tr>
              <tr class="border-b border-border/40">
                <td class="p-2 font-medium text-foreground">Myoglobin</td>
                <td class="p-2 text-destructive font-semibold">145 ng/mL</td>
                <td class="p-2 text-foreground">&lt; 85 ng/mL</td>
                <td class="p-2"><span class="px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-500 rounded">High</span></td>
              </tr>
              <tr class="border-b border-border/40">
                <td class="p-2 font-medium text-foreground">BNP</td>
                <td class="p-2 font-medium text-foreground">95 pg/mL</td>
                <td class="p-2 text-foreground">&lt; 100 pg/mL</td>
                <td class="p-2"><span class="px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-500 rounded">Normal</span></td>
              </tr>
            </tbody>
          </table>
          <p class="mt-3 text-xs text-muted-foreground italic">Note: Serial troponins should be obtained at 0, 3, and 6 hours to rule out dynamic changes.</p>
        </div>`
      },
      {
        type: "chart",
        title: "Vitals Trend"
      }
    ]
  },
  {
    id: 2,
    originalId: 4,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Review the clinical notes and identify the most likely diagnosis.",
    options: [
      { letter: "A", text: "Acute pericarditis (Flow: \\(Q = \\frac{\\Delta P}{R}\\) / <math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mi>Q</mi><mo>=</mo><mfrac><mrow><mi>&Delta;</mi><mi>P</mi></mrow><mi>R</mi></mfrac></math>)" },
      { letter: "B", text: "Myocardial infarction (Pressure: \\(P = \\frac{F}{A}\\) / <math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mi>P</mi><mo>=</mo><mfrac><mi>F</mi><mi>A</mi></mfrac></math>)" },
      { letter: "C", text: "Pulmonary embolism (Volume: \\(V = \\frac{m}{\\rho}\\) / <math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mi>V</mi><mo>=</mo><mfrac><mi>m</mi><mi>&rho;</mi></mfrac></math>)" },
      { letter: "D", text: "Aortic dissection (Work: \\(W = F \\times d\\) / <math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mi>W</mi><mo>=</mo><mi>F</mi><mo>&times;</mo><mi>d</mi></math>)" }
    ],
    attachments: [
      {
        type: "html",
        title: "Clinical Notes",
        htmlContent: `<div class="p-6 bg-muted rounded-xl border max-h-[400px] overflow-y-auto font-sans text-sm leading-relaxed">
          <h4 class="font-bold border-b pb-2 mb-3">Clinical Notes - Patient Case #9822</h4>
          <p><strong>Chief Complaint:</strong> Sudden onset of crushing substernal chest pain radiating to the left shoulder, which started 45 minutes ago while mowing the lawn.</p>
          <p class="mt-2"><strong>History of Present Illness:</strong> 62-year-old male with a history of hypertension and hyperlipidemia. Pain is described as a heavy pressure, 9/10 severity, accompanied by diaphoresis, nausea, and mild shortness of breath. Nitroglycerin sublingual x1 did not relieve the pain.</p>
          <p class="mt-2"><strong>Vital Signs:</strong> BP 142/88 mmHg, HR 96 bpm, RR 20 bpm, SpO2 95% on room air, Temp 37.1°C.</p>
        </div>`
      }
    ]
  },
  {
    id: 3,
    originalId: 12,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Based on the lab results table below, what is the most likely diagnosis?",
    options: [
      { letter: "A", text: "Macrocytic anemia" },
      { letter: "B", text: "Iron deficiency anemia" },
      { letter: "C", text: "Hemolytic anemia" },
      { letter: "D", text: "Aplastic anemia" }
    ],
    attachments: [
      {
        type: "html",
        title: "Lab Results",
        htmlContent: `<div class="p-4 bg-card rounded-xl border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left font-bold bg-muted/50"><th class="p-2">Test</th><th class="p-2">Patient Result</th><th class="p-2">Reference Range</th></tr>
            </thead>
            <tbody>
              <tr class="border-b"><td class="p-2 font-medium">Hemoglobin</td><td class="p-2 text-destructive">9.2 g/dL</td><td class="p-2">13.5 - 17.5 g/dL</td></tr>
              <tr class="border-b"><td class="p-2 font-medium">MCV</td><td class="p-2 text-destructive">115 fL</td><td class="p-2">80 - 100 fL</td></tr>
              <tr class="border-b"><td class="p-2 font-medium">Serum B12</td><td class="p-2 text-destructive">110 pg/mL</td><td class="p-2">200 - 900 pg/mL</td></tr>
              <tr class="border-b"><td class="p-2 font-medium">Folate</td><td class="p-2">8.5 ng/mL</td><td class="p-2">&gt; 4.6 ng/mL</td></tr>
            </tbody>
          </table>
        </div>`
      }
    ]
  },
  {
    id: 4,
    originalId: 13,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Listen to the heart sounds. What murmur is present?",
    options: [
      { letter: "A", text: "Aortic stenosis" },
      { letter: "B", text: "Mitral regurgitation" },
      { letter: "C", text: "Mitral stenosis" },
      { letter: "D", text: "Aortic regurgitation" }
    ],
    attachments: [
      {
        type: "audio",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      }
    ]
  },
  {
    id: 5,
    originalId: 14,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Watch the gait assessment video. What type of gait is demonstrated?",
    options: [
      { letter: "A", text: "Parkinsonian" },
      { letter: "B", text: "Hemiplegic" },
      { letter: "C", text: "Ataxic" },
      { letter: "D", text: "Diplegic" }
    ],
    attachments: [
      {
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4"
      }
    ]
  },

  {
    id: 7,
    originalId: 16,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Review the attached clinical guidelines PDF. According to page 2, what is the first-line treatment for uncomplicated UTI?",
    options: [
      { letter: "A", text: "Ciprofloxacin" },
      { letter: "B", text: "Nitrofurantoin" },
      { letter: "C", text: "Amoxicillin" },
      { letter: "D", text: "Azithromycin" }
    ],
    attachments: [
      {
        type: "pdf",
        src: "https://www.africau.edu/images/default/sample.pdf",
        title: "Clinical Guidelines PDF"
      }
    ]
  },

  {
    id: 10,
    originalId: 21,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Interpret the following arterial blood gas (ABG) results.",
    options: [
      { letter: "A", text: "Respiratory Acidosis" },
      { letter: "B", text: "Metabolic Acidosis" },
      { letter: "C", text: "Respiratory Alkalosis" },
      { letter: "D", text: "Metabolic Alkalosis" }
    ],
    attachments: [
      {
        type: "html",
        title: "ABG Results",
        htmlContent: `<div class="p-4 bg-card rounded-xl border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left font-bold bg-muted/50"><th class="p-2">Parameter</th><th class="p-2">Result</th><th class="p-2">Normal Range</th></tr>
            </thead>
            <tbody>
              <tr class="border-b"><td class="p-2 font-medium">pH</td><td class="p-2 text-destructive">7.28</td><td class="p-2">7.35 - 7.45</td></tr>
              <tr class="border-b"><td class="p-2 font-medium">PaCO2</td><td class="p-2 text-destructive">55 mmHg</td><td class="p-2">35 - 45 mmHg</td></tr>
              <tr class="border-b"><td class="p-2 font-medium">HCO3-</td><td class="p-2">25 mEq/L</td><td class="p-2">22 - 26 mEq/L</td></tr>
            </tbody>
          </table>
        </div>`
      }
    ]
  },

  {
    id: 13,
    originalId: 31,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Based on the patient vital signs trend chart below, at what time point did the patient likely develop sepsis?",
    options: [
      { letter: "A", text: "At 4 hours" },
      { letter: "B", text: "At 8 hours" },
      { letter: "C", text: "At 12 hours" },
      { letter: "D", text: "At 20 hours" }
    ],
    attachments: [
      {
        type: "chart"
      }
    ]
  },

  {
    id: 15,
    originalId: 3,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Identify the abnormality in the provided chest X-ray.",
    options: [
      { letter: "A", text: "Pneumothorax", image: "https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?w=400&q=80" },
      { letter: "B", text: "Pleural effusion", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
      { letter: "C", text: "Normal anatomy", image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80" },
      { letter: "D", text: "Cardiomegaly", image: "https://images.unsplash.com/photo-1584515901387-a7a1a7f153b4?w=400&q=80" }
    ],
    attachments: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1584515901387-a7a1a7f153b4?w=800&q=80",
        caption: "Posteroanterior Chest Radiograph"
      }
    ]
  },
  {
    id: 16,
    originalId: 30,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Select the appropriate triage category for a patient with a sprained ankle and stable vitals.",
    options: [
      { letter: "A", text: "Resuscitation (Level 1)" },
      { letter: "B", text: "Emergent (Level 2)" },
      { letter: "C", text: "Urgent (Level 3)" },
      { letter: "D", text: "Non-urgent (Level 4/5)" }
    ],
    attachments: null
  },
  {
    id: 28,
    originalId: 30,
    sectionId: 1,
    sectionName: "Nervous System",
    sectionTitle: "Section 1 of 6",
    type: "mcq-single",
    text: "Select the appropriate triage category for a patient with a sprained ankle and stable vitals. (Visual Reference Guide)",
    options: [
      { letter: "A", text: "Resuscitation (Level 1)", image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80" },
      { letter: "B", text: "Emergent (Level 2)", image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=400&q=80" },
      { letter: "C", text: "Urgent (Level 3)", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
      { letter: "D", text: "Non-urgent (Level 4/5)", image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=400&q=80" }
    ],
    attachments: null
  },

  // SECTION 2: Musculoskeletal & Cardiovascular (17 to 20)
  {
    id: 17,
    originalId: 2,
    sectionId: 2,
    sectionName: "Musculoskeletal & Cardiovascular",
    sectionTitle: "Section 2 of 6",
    type: "mcq-multiple",
    text: "Select all medications that are classified as beta-blockers.",
    options: [
      { letter: "A", text: "Metoprolol" },
      { letter: "B", text: "Lisinopril" },
      { letter: "C", text: "Atenolol" },
      { letter: "D", text: "Amlodipine" },
      { letter: "E", text: "Propranolol" }
    ],
    attachments: [
      {
        title: "Beta-Blocker Classes",
        type: "html",
        htmlContent: `<table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left bg-muted/50"><th class="p-2">Drug</th><th class="p-2">Selectivity</th><th class="p-2">Primary Use</th></tr>
          </thead>
          <tbody>
            <tr class="border-b"><td class="p-2">Metoprolol</td><td class="p-2">β1-selective</td><td class="p-2">HTN, angina, HF</td></tr>
            <tr class="border-b"><td class="p-2">Atenolol</td><td class="p-2">β1-selective</td><td class="p-2">HTN, post-MI</td></tr>
            <tr class="border-b"><td class="p-2">Propranolol</td><td class="p-2">Non-selective</td><td class="p-2">HTN, migraines, tremor</td></tr>
            <tr class="border-b"><td class="p-2">Carvedilol</td><td class="p-2">Non-selective + α1</td><td class="p-2">HF, HTN</td></tr>
          </tbody>
        </table>`
      },
      {
        title: "Drug Reference Chart",
        type: "html",
        htmlContent: `<div class="p-4"><p><strong>Reference Guide:</strong></p><p class="mt-2">Beta-blockers antagonize beta-adrenergic receptors. They are categorized into selective (β1-receptors) and non-selective (β1 and β2 receptors) types.</p></div>`
      },
      {
        title: "Pharmacology Guide",
        type: "html",
        htmlContent: `<div class="p-4"><p><strong>Pharmacology Quick Notes:</strong></p><ul class="list-disc pl-4 mt-2"><li>Beta-1 blockers act primarily on cardiac tissues.</li><li>Beta-2 blockers act on smooth muscle tissues in bronchioles and blood vessels.</li></ul></div>`
      }
    ]
  },
  {
    id: 18,
    originalId: 7,
    sectionId: 2,
    sectionName: "Musculoskeletal & Cardiovascular",
    sectionTitle: "Section 2 of 6",
    type: "mcq-multiple",
    text: "Which of the following is NOT a symptom of hyperthyroidism? (Select all that apply)",
    options: [
      { letter: "A", text: "Weight loss" },
      { letter: "B", text: "Heat intolerance" },
      { letter: "C", text: "Bradycardia" },
      { letter: "D", text: "Palpitations" },
      { letter: "E", text: "Tremor" }
    ],
    attachments: [
      {
        title: "Thyroid Hormone Effects",
        type: "image",
        src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80",
        caption: "Visual aid diagram for endocrine responses."
      },
      {
        title: "Hypo vs Hyper",
        type: "html",
        htmlContent: `<div class="p-4"><p><strong>Comparative Overview:</strong></p><p class="mt-2">Hyperthyroidism increases metabolic rates leading to tachycardia, sweating, weight loss, and tremors.</p><p class="mt-1">Hypothyroidism slows metabolic rates leading to bradycardia, cold intolerance, weight gain, and fatigue.</p></div>`
      }
    ]
  },
  {
    id: 19,
    originalId: 24,
    sectionId: 2,
    sectionName: "Musculoskeletal & Cardiovascular",
    sectionTitle: "Section 2 of 6",
    type: "mcq-multiple",
    text: "Select all potential adverse effects associated with ACE inhibitors.",
    options: [
      { letter: "A", text: "Dry cough" },
      { letter: "B", text: "Hypokalemia" },
      { letter: "C", text: "Hyperkalemia" },
      { letter: "D", text: "Angioedema" },
      { letter: "E", text: "Bradycardia" }
    ],
    attachments: null
  },
  {
    id: 20,
    originalId: 29,
    sectionId: 2,
    sectionName: "Musculoskeletal & Cardiovascular",
    sectionTitle: "Section 2 of 6",
    type: "mcq-multiple",
    text: "Cross out the diagnoses that are LEAST likely for a patient presenting with acute unilateral facial paralysis and no other neurological deficits.",
    options: [
      { letter: "A", text: "Bell's Palsy" },
      { letter: "B", text: "Ischemic Stroke" },
      { letter: "C", text: "Lyme Disease" },
      { letter: "D", text: "Brain Tumor" },
      { letter: "E", text: "Herpes Zoster Oticus" }
    ],
    attachments: null
  },

  // SECTION 3: Endocrine & Renal (21 to 22)
  {
    id: 21,
    originalId: 5,
    sectionId: 3,
    sectionName: "Endocrine & Renal",
    sectionTitle: "Section 3 of 6",
    type: "fill-blank",
    text: "Complete the physiological pathway:",
    textWithPlaceholders: "In the RAAS system, renin converts angiotensinogen into [blank1], which is then converted to [blank2] by ACE primarily in the lungs.",
    blanks: [
      { options: ["Angiotensin I", "Aldosterone", "Bradykinin"] },
      { options: ["Angiotensin II", "Angiotensin III", "Renin"] }
    ],
    attachments: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80",
        caption: "Renin-Angiotensin-Aldosterone System (RAAS) Cascade Diagram."
      }
    ]
  },
  {
    id: 22,
    originalId: 25,
    sectionId: 3,
    sectionName: "Endocrine & Renal",
    sectionTitle: "Section 3 of 6",
    type: "fill-blank",
    text: "Complete the coagulation cascade pathway:",
    textWithPlaceholders: "The intrinsic pathway is initiated by factor XII, while the extrinsic pathway is initiated by [blank1]. Both pathways converge at the activation of factor [blank2] to form the common pathway.",
    blanks: [
      { options: ["Tissue Factor", "Thrombin", "Fibrinogen"] },
      { options: ["X", "VIII", "V"] }
    ],
    attachments: null
  },

  // SECTION 4: Respiratory & Gastrointestinal (23 to 24)
  {
    id: 23,
    originalId: 10,
    sectionId: 4,
    sectionName: "Respiratory & Gastrointestinal",
    sectionTitle: "Section 4 of 6",
    type: "essay",
    text: "Explain the physiological impact of dehydration on the kidneys. (You may use dictation if available)",
    attachments: null
  },
  {
    id: 24,
    originalId: 28,
    sectionId: 4,
    sectionName: "Respiratory & Gastrointestinal",
    sectionTitle: "Section 4 of 6",
    type: "essay",
    text: "Describe the pathophysiology of asthma exacerbation.",
    attachments: null
  },

  // SECTION 5: Cardiovascular Anatomy (25)
  {
    id: 25,
    originalId: 9,
    sectionId: 5,
    sectionName: "Cardiovascular Anatomy",
    sectionTitle: "Section 5 of 6",
    type: "hotspot",
    text: "Select the hotspot corresponding to the Mitral Valve.",
    image: "/heart_anatomy_placeholder.svg",
    hotspots: [
      { label: "Aortic Valve", left: "45%", top: "30%" },
      { label: "Pulmonary Valve", left: "55%", top: "35%" },
      { label: "Tricuspid Valve", left: "40%", top: "60%" },
      { label: "Mitral Valve", left: "65%", top: "55%" }
    ],
    attachments: null
  },

  // SECTION 6: Pharmacology & Microbiology (26 to 27)
  {
    id: 26,
    originalId: 8,
    sectionId: 6,
    sectionName: "Pharmacology & Microbiology",
    sectionTitle: "Section 6 of 6",
    type: "match",
    text: "Match the cranial nerve to its primary function.",
    matches: [
      {
        label: "CN I (Olfactory)",
        options: ["Smell", "Vision", "Eye movement", "Facial sensation"]
      },
      {
        label: "CN II (Optic)",
        options: ["Smell", "Vision", "Eye movement", "Facial sensation"]
      },
      {
        label: "CN VII (Facial)",
        options: ["Facial expression", "Hearing", "Swallowing", "Tongue movement"]
      }
    ],
    attachments: null
  },
  {
    id: 27,
    originalId: 26,
    sectionId: 6,
    sectionName: "Pharmacology & Microbiology",
    sectionTitle: "Section 6 of 6",
    type: "match",
    text: "Match the antibiotic class to its mechanism of action.",
    matches: [
      {
        label: "Penicillins",
        options: ["Cell wall synthesis inhibitor", "Protein synthesis inhibitor", "DNA gyrase inhibitor"]
      },
      {
        label: "Macrolides",
        options: ["Cell wall synthesis inhibitor", "Protein synthesis inhibitor", "DNA gyrase inhibitor"]
      },
      {
        label: "Fluoroquinolones",
        options: ["Cell wall synthesis inhibitor", "Protein synthesis inhibitor", "DNA gyrase inhibitor"]
      }
    ],
    attachments: null
  }
];
