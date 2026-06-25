# QP-M — AuraPaper Question Paper Maker

A premium, AI-powered web application for creating professional examination papers from images and PDFs.

![AuraPaper Banner](https://img.shields.io/badge/AuraPaper-Question%20Paper%20Maker-6366f1?style=for-the-badge&logo=file-text)

## ✨ Features

- **📄 PDF & Image Import** — Upload scanned or digital PDFs and images; text is extracted automatically
- **🤖 AI-Powered Extraction** — Integrates with Gemini 2.5 Flash to intelligently parse questions, options, answers, difficulty, and marks
- **🔍 Local OCR Fallback** — Uses Tesseract.js for offline OCR and PDF.js for text-layer extraction
- **📚 Interactive Question Bank** — Search, filter by subject/difficulty/type, edit, delete, and tag questions
- **✏️ Split-Screen Paper Builder** — Drag-and-drop questions into sections on the paper canvas
- **⚡ Auto-Generation** — Automatically builds a balanced paper from the bank based on target marks and difficulty ratios
- **📊 Live Analytics** — Real-time marks tally, difficulty distribution bar, and section metrics
- **🖨️ Print / PDF Export** — Clean A4 print layout with customizable fonts, spacing, and margins
- **📝 Export as Word (.doc)** — Download the paper as a Microsoft Word document
- **🔑 Answer Key** — Toggle answer key / marking scheme in both print and Word exports
- **💾 Backup & Restore** — Save and restore your entire question bank and paper as JSON
- **🌙 Dark / Light Mode** — Full theme support

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Core | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Icons | [Lucide Icons](https://lucide.dev/) |
| PDF Parsing | [PDF.js](https://mozilla.github.io/pdf.js/) |
| Image OCR | [Tesseract.js](https://tesseract.projectnaptha.com/) |
| AI Extraction | [Google Gemini API](https://ai.google.dev/) |
| Storage | Browser LocalStorage |

## 🚀 Getting Started

### Run Locally

```bash
# Clone the repository
git clone https://github.com/anujtiwari1427/QP-M.git
cd QP-M

# Serve using Python (no install needed)
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

No build step, no dependencies to install — it runs entirely in the browser.

### Optional: Enable AI Extraction

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/)
2. Paste it into the **Gemini API Key** field in the sidebar
3. Upload PDFs or images — questions will be extracted automatically with full structure

## 📁 Project Structure

```
QP-M/
├── index.html       # App layout, modals, print overlay
├── styles.css       # Dark/light theme, glassmorphism UI, @media print
├── app.js           # State management, PDF/OCR/AI parsing, drag-drop, export
├── mock-data.js     # 15 pre-loaded sample questions (Math, Physics, Chemistry, etc.)
└── README.md
```

## 📸 How It Works

1. **Import** — Drop PDFs or images into the upload zone
2. **Extract** — AI (or local OCR) parses questions into structured cards
3. **Build** — Drag questions into sections on the paper canvas
4. **Configure** — Set institution name, subject, marks, instructions
5. **Export** — Print as PDF or download as a Word document

## 📄 License

MIT License — free to use and modify.

---

Built with ❤️ using Vanilla JS + Gemini AI
