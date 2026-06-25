const MOCK_QUESTIONS = [
  {
    id: "mock-1",
    question: "Which of the following elements has the highest electronegativity on the Pauling scale?",
    options: ["Oxygen", "Fluorine", "Chlorine", "Nitrogen"],
    answer: "Fluorine",
    subject: "Chemistry",
    topic: "Periodic Properties",
    difficulty: "easy",
    type: "mcq",
    marks: 1
  },
  {
    id: "mock-2",
    question: "Describe the process of photosynthesis, detailing the light-dependent and light-independent reactions.",
    options: null,
    answer: "Photosynthesis occurs in two main stages: Light-dependent reactions (in the thylakoid membrane, converting solar energy to chemical energy in ATP and NADPH, releasing O2 from water splitting) and Light-independent reactions/Calvin Cycle (in the stroma, using ATP and NADPH to fix CO2 into glucose/G3P).",
    subject: "Biology",
    topic: "Plant Physiology",
    difficulty: "medium",
    type: "long",
    marks: 5
  },
  {
    id: "mock-3",
    question: "Solve the quadratic equation: x² - 5x + 6 = 0.",
    options: ["x = 2, 3", "x = -2, -3", "x = 1, 6", "x = -1, -6"],
    answer: "x = 2, 3 (Factorizing gives (x-2)(x-3) = 0)",
    subject: "Mathematics",
    topic: "Algebra",
    difficulty: "easy",
    type: "mcq",
    marks: 2
  },
  {
    id: "mock-4",
    question: "State and prove Gauss's Law in electrostatics, detailing its differential and integral forms.",
    options: null,
    answer: "Gauss's law states that the net electric flux through any closed surface is equal to the net charge enclosed divided by the permittivity of free space: ∮ E · dA = Q_enclosed / ε₀. Differential form: ∇ · E = ρ / ε₀. Proof utilizes Coulomb's Law and the divergence theorem applied to a point charge and spherical Gaussian surface.",
    subject: "Physics",
    topic: "Electrostatics",
    difficulty: "hard",
    type: "long",
    marks: 10
  },
  {
    id: "mock-5",
    question: "The Treaty of Versailles, signed in 1919, officially ended which major global conflict?",
    options: null,
    answer: "World War I (WWI)",
    subject: "History",
    topic: "World War I",
    difficulty: "easy",
    type: "fill",
    marks: 1
  },
  {
    id: "mock-6",
    question: "Find the derivative of f(x) = ln(sin(x)) with respect to x.",
    options: ["tan(x)", "cot(x)", "1/sin(x)", "-cot(x)"],
    answer: "cot(x) (By chain rule: 1/sin(x) * d(sin(x))/dx = cos(x)/sin(x) = cot(x))",
    subject: "Mathematics",
    topic: "Calculus",
    difficulty: "medium",
    type: "mcq",
    marks: 2
  },
  {
    id: "mock-7",
    question: "Explain the concept of Heisenberg's Uncertainty Principle and its physical implications.",
    options: null,
    answer: "Heisenberg's Uncertainty Principle states that it is fundamentally impossible to measure both the precise position (Δx) and momentum (Δp) of a subatomic particle simultaneously. Mathematically: Δx * Δp ≥ h/4π. This implies that particles do not possess well-defined classical trajectories, but are instead described by wavefunctions representing probability distributions.",
    subject: "Physics",
    topic: "Quantum Mechanics",
    difficulty: "hard",
    type: "short",
    marks: 3
  },
  {
    id: "mock-8",
    question: "What is the primary function of ribosomes in a biological cell?",
    options: ["Energy production", "Protein synthesis", "Waste disposal", "Lipid synthesis"],
    answer: "Protein synthesis",
    subject: "Biology",
    topic: "Cell Biology",
    difficulty: "easy",
    type: "mcq",
    marks: 1
  },
  {
    id: "mock-9",
    question: "Define the term 'Allotropy' and give two allotropes of carbon.",
    options: null,
    answer: "Allotropy is the property of some chemical elements to exist in two or more different physical forms in the same state. Two allotropes of carbon are Diamond and Graphite (others include Fullerenes, Graphene).",
    subject: "Chemistry",
    topic: "Chemical Bonding",
    difficulty: "medium",
    type: "short",
    marks: 2
  },
  {
    id: "mock-10",
    question: "The Magna Carta was signed by King John of England in the year ______.",
    options: null,
    answer: "1215",
    subject: "History",
    topic: "Medieval Europe",
    difficulty: "medium",
    type: "fill",
    marks: 1
  },
  {
    id: "mock-11",
    question: "An object is placed 10 cm in front of a concave mirror of focal length 15 cm. Find the position, nature, and magnification of the image formed.",
    options: null,
    answer: "Using mirror formula: 1/f = 1/v + 1/u. u = -10 cm, f = -15 cm. 1/-15 = 1/v + 1/-10 => 1/v = 1/10 - 1/15 = 1/30. So v = +30 cm. Image is formed 30 cm behind the mirror (virtual, erect). Magnification m = -v/u = -30/(-10) = +3. (3x magnified, virtual, and erect).",
    subject: "Physics",
    topic: "Optics",
    difficulty: "medium",
    type: "short",
    marks: 3
  },
  {
    id: "mock-12",
    question: "Evaluate the definite integral: ∫₀^(π/2) sin²(x) dx.",
    options: ["π/2", "π/4", "1", "1/2"],
    answer: "π/4 (Using identity sin²(x) = (1 - cos(2x))/2, integral is [x/2 - sin(2x)/4] from 0 to π/2 = π/4 - 0 = π/4)",
    subject: "Mathematics",
    topic: "Calculus",
    difficulty: "medium",
    type: "mcq",
    marks: 2
  },
  {
    id: "mock-13",
    question: "Explain the main causes of the French Revolution of 1789.",
    options: null,
    answer: "Key causes: 1. Social inequality (the Three Estates system heavily taxing the Third Estate while exempting Nobles and Clergy); 2. Financial crisis (national debt from wars, court luxuries, and supporting the American Revolution); 3. Food shortage and famine (crop failure in 1788 leading to soaring bread prices); 4. Influence of Enlightenment ideas questioning absolute monarchy and feudal privilege.",
    subject: "History",
    topic: "French Revolution",
    difficulty: "medium",
    type: "long",
    marks: 5
  },
  {
    id: "mock-14",
    question: "Which organic functional group is characterized by a carbon-oxygen double bond (C=O) attached to at least one hydrogen atom?",
    options: ["Ketone", "Aldehyde", "Carboxylic Acid", "Ester"],
    answer: "Aldehyde (R-CHO)",
    subject: "Chemistry",
    topic: "Organic Chemistry",
    difficulty: "medium",
    type: "mcq",
    marks: 1
  },
  {
    id: "mock-15",
    question: "Compare and contrast electromagnetic waves and mechanical waves in terms of propagation and medium requirements.",
    options: null,
    answer: "Mechanical waves (e.g. sound, water waves) require a material medium (solid, liquid, gas) to propagate, as they rely on particle collisions. They cannot travel through a vacuum. Electromagnetic waves (e.g. light, X-rays, radio waves) consist of oscillating electric and magnetic fields and do not require a medium; they can propagate through vacuum at the speed of light (c ≈ 3 x 10^8 m/s). Mechanical waves can be transverse or longitudinal, whereas EM waves are always transverse.",
    subject: "Physics",
    topic: "Waves & Oscillations",
    difficulty: "medium",
    type: "long",
    marks: 5
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MOCK_QUESTIONS };
}
