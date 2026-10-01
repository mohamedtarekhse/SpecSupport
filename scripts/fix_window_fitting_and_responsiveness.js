const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Replace #app-container, #greeting-area, headline, sub, prompt cards CSS
const oldGreetingCss = `        /* Main View Container */
        #app-container {
            flex: 1; display: flex; flex-direction: column; align-items: center;
            position: relative; width: 100%; overflow: hidden;
        }

        /* Hero Greeting Area */
        #greeting-area {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            width: 100%; max-width: var(--max-width);
            padding: 20px 20px 80px 20px;
            box-sizing: border-box;
            text-align: center;
            transition: opacity 0.3s ease;
        }

        .gemini-hero-headline {
            font-size: 2.8rem;
            font-weight: 600;
            margin: 0 0 12px 0;
            letter-spacing: -0.8px;
            background: var(--gemini-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% auto;
            animation: gradient-flow 6s infinite alternate;
        }

        @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }

        .gemini-hero-sub {
            font-size: 1.1rem;
            color: var(--gemini-text-muted);
            margin: 0 0 35px 0;
            font-weight: 400;
        }

        /* 4 Gemini-Style Prompt Cards */
        .prompt-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            width: 100%;
            max-width: var(--max-width);
            margin-bottom: 25px;
        }

        .prompt-card {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-card-border);
            border-radius: 16px;
            padding: 16px;
            text-align: left;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; justify-content: space-between;
            min-height: 110px;
            position: relative;
        }`;

const newGreetingCss = `        /* Main View Container - Fluid Fit & Zero Clipping */
        #app-container {
            flex: 1; display: flex; flex-direction: column; align-items: center;
            position: relative; width: 100%; height: 100%; min-height: 0;
            overflow-y: auto; overflow-x: hidden;
        }

        /* Hero Greeting Area - Proportional & Compact */
        #greeting-area {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            width: 100%; max-width: var(--max-width);
            padding: clamp(10px, 2vh, 22px) 20px clamp(6px, 1.2vh, 14px) 20px;
            box-sizing: border-box;
            text-align: center;
            min-height: 0;
            transition: opacity 0.3s ease;
        }

        .gemini-hero-headline {
            font-size: clamp(1.75rem, 3.8vh, 2.5rem);
            font-weight: 600;
            margin: 0 0 clamp(4px, 1vh, 8px) 0;
            letter-spacing: -0.8px;
            background: var(--gemini-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% auto;
            animation: gradient-flow 6s infinite alternate;
        }

        @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }

        .gemini-hero-sub {
            font-size: clamp(0.85rem, 1.8vh, 1.02rem);
            color: var(--gemini-text-muted);
            margin: 0 0 clamp(10px, 2vh, 20px) 0;
            font-weight: 400;
        }

        /* 4 Gemini-Style Prompt Cards - Responsive Adaptive Grid */
        .prompt-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: clamp(8px, 1.2vw, 12px);
            width: 100%;
            max-width: var(--max-width);
            margin-bottom: clamp(10px, 1.8vh, 18px);
        }

        .prompt-card {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-card-border);
            border-radius: 14px;
            padding: clamp(10px, 1.4vh, 14px);
            text-align: left;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; justify-content: space-between;
            min-height: clamp(72px, 10vh, 90px);
            position: relative;
        }`;

if (html.includes(oldGreetingCss)) {
  html = html.replace(oldGreetingCss, newGreetingCss);
  console.log('Replaced old greeting CSS with fluid proportional layout.');
} else {
  console.log('Could not find exact oldGreetingCss block');
}

// 2. Fix prompt card text and icon sizing
const oldCardSubCss = `        .prompt-card-icon {
            font-size: 1.3rem; margin-bottom: 8px;
        }

        .prompt-card-text {
            font-size: 0.85rem;
            color: var(--gemini-text-main);
            line-height: 1.4;
            font-weight: 500;
        }`;

const newCardSubCss = `        .prompt-card-icon {
            font-size: 1.15rem; margin-bottom: 5px;
        }

        .prompt-card-text {
            font-size: 0.8rem;
            color: var(--gemini-text-main);
            line-height: 1.35;
            font-weight: 500;
        }`;

if (html.includes(oldCardSubCss)) {
  html = html.replace(oldCardSubCss, newCardSubCss);
  console.log('Updated prompt card text and icon CSS.');
}

// 3. Fix state-greeting #input-container padding
const oldStateGreetingInput = `.state-greeting #input-container {
            position: relative; bottom: auto;
            left: auto; transform: none;
            padding: 0 20px 28px 20px;
            width: 100%; max-width: var(--max-width);
            margin: 0 auto;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
        }`;

const newStateGreetingInput = `.state-greeting #input-container {
            position: relative; bottom: auto;
            left: auto; transform: none;
            padding: 0 20px clamp(12px, 1.8vh, 20px) 20px;
            width: 100%; max-width: var(--max-width);
            margin: 0 auto;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            flex-shrink: 0;
        }`;

if (html.includes(oldStateGreetingInput)) {
  html = html.replace(oldStateGreetingInput, newStateGreetingInput);
  console.log('Updated .state-greeting #input-container CSS.');
}

// 4. Update desktop media query padding for .state-greeting #input-container
const oldDesktopPad1 = `.state-greeting #input-container {
                width: calc(100% - 64px);
                max-width: 1440px;
                padding: 0 0 28px 0;
            }`;

const newDesktopPad1 = `.state-greeting #input-container {
                width: calc(100% - 64px);
                max-width: 1440px;
                padding: 0 0 clamp(12px, 1.8vh, 20px) 0;
            }`;

if (html.includes(oldDesktopPad1)) {
  html = html.replace(oldDesktopPad1, newDesktopPad1);
  console.log('Updated desktop 1024px padding.');
}

// 5. Add Height-Responsive Media Queries (for 768p and smaller laptop displays)
const heightMediaQueries = `
        /* Height-Aware Viewport Fitting for Laptops & Scaled Screens */
        @media (max-height: 760px) {
            .gemini-hero-headline { font-size: 1.75rem !important; margin-bottom: 4px !important; }
            .gemini-hero-sub { font-size: 0.86rem !important; margin-bottom: 12px !important; }
            .prompt-cards-grid { gap: 8px !important; margin-bottom: 12px !important; }
            .prompt-card { min-height: 68px !important; padding: 9px 12px !important; }
            .prompt-card-icon { font-size: 1.05rem !important; margin-bottom: 4px !important; }
            .prompt-card-text { font-size: 0.77rem !important; line-height: 1.3 !important; }
            #greeting-area { padding: 6px 16px 8px 16px !important; }
            .state-greeting #input-container { padding: 0 16px 12px 16px !important; }
            .gemini-pill-box { padding: 6px 14px !important; }
            .gemini-disclaimer { margin-top: 4px !important; font-size: 0.69rem !important; }
        }

        @media (max-height: 640px) {
            .gemini-hero-headline { font-size: 1.55rem !important; }
            .gemini-hero-sub { font-size: 0.82rem !important; margin-bottom: 8px !important; }
            .prompt-cards-grid { display: none !important; } /* Gracefully collapse cards so input bar is spacious */
            #greeting-area { justify-content: center !important; padding: 4px 14px !important; }
            .state-greeting #input-container { padding: 0 14px 10px 14px !important; }
        }

        @media (max-width: 1200px) {
            .prompt-cards-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }
`;

if (!html.includes('max-height: 760px')) {
  // Insert before </style>
  html = html.replace('</style>', heightMediaQueries + '\n    </style>');
  console.log('Added height-responsive media queries.');
}

// 6. Fix search input in sidebar: add autocomplete="off" so browser never auto-fills license keys
const oldSearchInput = `<input type="text" id="source-search-input" placeholder="Filter standards & manuals..." oninput="filterSidebarStandards(this.value)">`;
const newSearchInput = `<input type="text" id="source-search-input" placeholder="Filter standards & manuals..." autocomplete="off" oninput="filterSidebarStandards(this.value)">`;

if (html.includes(oldSearchInput)) {
  html = html.replace(oldSearchInput, newSearchInput);
  console.log('Added autocomplete="off" to sidebar search input.');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully saved index.html with window fitting fixes!');
