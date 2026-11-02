import { addDays, format, parseISO } from 'date-fns';
import type { RoadmapWeek, WeekStatus } from '../types';
import { SYNC_EPOCH } from '../lib/sync/constants';

const PREP_START = parseISO('2026-11-02');
const LWD = parseISO('2027-03-31');
const NOW = SYNC_EPOCH;

interface WeekSeed {
  number: number;
  title: string;
  technicalFocus: string[];
  topics: string[];
  exercises: string[];
  mockObjectives: string[];
  jobSearch: string[];
  deliverables: string[];
  applicationTarget: number;
  status?: WeekStatus;
  progress?: number;
}

const weekSeeds: WeekSeed[] = [
  {
    number: 1,
    title: 'Baseline Assessment & Setup',
    technicalFocus: ['Baseline assessment', 'Preparation system setup', 'Gap analysis'],
    topics: [
      'JavaScript fundamentals diagnostic',
      'React mental model diagnostic',
      'TypeScript comfort check',
      'Frontend system design baseline',
      'DSA warm-up set',
      'Preparation tracker and note system setup',
    ],
    exercises: [
      'Complete a 60-minute JavaScript assessment without references',
      'Build a small React + TypeScript feature from scratch',
      'Attempt one frontend system design prompt for 30 minutes',
      'Record baseline scores and confidence ratings in the tracker',
    ],
    mockObjectives: [
      'Take one diagnostic mock interview and capture a baseline score',
      'Record the top five recurring gaps without trying to fix them yet',
    ],
    jobSearch: [
      'Audit and rewrite the résumé for Senior/Lead Frontend roles',
      'Update LinkedIn headline, about section and featured work',
      'Build a target list of 30 companies hiring in Mumbai or remote India',
      'Map warm referral contacts for the first 10 target companies',
    ],
    deliverables: [
      'Baseline scorecard for JavaScript, React, TypeScript, system design and DSA',
      '30-company target list with priority tiers',
      'Weekly study schedule locked in the timetable',
      'Portfolio and GitHub profiles polished',
    ],
    applicationTarget: 0,
  },
  {
    number: 2,
    title: 'JavaScript Foundations',
    technicalFocus: ['Execution model', 'Scope', 'Objects', 'Language mechanics'],
    topics: [
      'Execution context and call stack',
      'Scope, lexical environment and hoisting',
      'Temporal dead zone',
      'Closures and practical use cases',
      'Prototypes and prototype chain',
      'this binding rules',
      'Object property descriptors and immutability',
      'Advanced array methods and iteration protocols',
    ],
    exercises: [
      'Implement debounce, throttle and a memoize utility',
      'Trace outputs for 20 hoisting and closure snippets',
      'Build a deep clone with cycle handling',
      'Re-implement map, filter and reduce from scratch',
    ],
    mockObjectives: [
      'Complete one JavaScript mock focused on closures and this',
      'Explain every answer out loud in under 90 seconds',
    ],
    jobSearch: [
      'Request 3 referrals from the priority company list',
      'Apply to 2 high-fit Senior Frontend roles',
      'Refine the résumé summary with measurable impact',
    ],
    deliverables: [
      'JavaScript notes with runnable snippets',
      'Closure, prototype and this cheat sheet',
      'Debounce, throttle, memoize and deep clone implementations',
    ],
    applicationTarget: 2,
  },
  {
    number: 3,
    title: 'Async JavaScript & Browser Fundamentals',
    technicalFocus: ['Event loop', 'Async patterns', 'Browser rendering', 'Networking'],
    topics: [
      'Event loop, task queue and microtasks',
      'Promises and promise combinators',
      'async/await internals and error handling',
      'AbortController and cancellation',
      'Fetch, HTTP caching and CORS',
      'Critical rendering path and layout',
      'Reflow, repaint and compositing',
      'Core Web Vitals and performance budgets',
    ],
    exercises: [
      'Implement promiseAll, promiseRace and a retry wrapper',
      'Debug 10 event-loop ordering puzzles',
      'Profile a slow page with Chrome DevTools and document findings',
      'Build a cancellable data-fetching hook',
    ],
    mockObjectives: [
      'One browser fundamentals mock covering event loop and rendering',
      'Explain CORS preflight and caching without notes',
    ],
    jobSearch: [
      'Apply to 2 target roles',
      'Send 2 follow-ups on previous referrals',
      'Collect 3 job descriptions and map requirements to evidence',
    ],
    deliverables: [
      'Async JavaScript deep-dive notes',
      'Browser rendering and Core Web Vitals summary',
      'Performance audit case study',
    ],
    applicationTarget: 2,
  },
  {
    number: 4,
    title: 'React Core Concepts',
    technicalFocus: ['React mental model', 'Hooks', 'State', 'Component design'],
    topics: [
      'JSX, elements and component trees',
      'Virtual DOM, reconciliation and keys',
      'Render vs commit phases',
      'State batching and updates',
      'Hooks rules and dependency arrays',
      'Context API trade-offs',
      'Controlled vs uncontrolled components',
      'Error boundaries and Suspense basics',
    ],
    exercises: [
      'Build a multi-step form with reusable field components',
      'Implement a custom useFetch hook with request cancellation',
      'Create an accessible combobox component',
      'Write a reconciliation demo that shows key-related bugs',
    ],
    mockObjectives: [
      'React fundamentals mock: rendering, hooks and reconciliation',
      'Whiteboard the lifecycle of a state update from click to paint',
    ],
    jobSearch: [
      'Apply to 2 Senior Frontend roles',
      'Attend one recruiter screen if available',
      'Update project bullets with architecture and scale details',
    ],
    deliverables: [
      'React mental model notes',
      'Three reusable custom hooks',
      'Accessible component case study',
    ],
    applicationTarget: 3,
  },
  {
    number: 5,
    title: 'React Performance & State Management',
    technicalFocus: ['Performance', 'State architecture', 'Redux Toolkit', 'React 19'],
    topics: [
      'Render performance and profiling',
      'memo, useMemo and useCallback correctly applied',
      'State colocation and lifting state',
      'Context performance pitfalls',
      'Redux Toolkit patterns and selectors',
      'Server state vs client state',
      'Code splitting, lazy loading and Suspense',
      'React Compiler mental model and useTransition',
    ],
    exercises: [
      'Profile a list-heavy screen and remove unnecessary re-renders',
      'Build a Redux Toolkit feature with normalized entities',
      'Implement route-based code splitting',
      'Compare Zustand and Redux Toolkit for a realistic feature',
    ],
    mockObjectives: [
      'React performance mock: diagnose a slow dashboard live',
      'Defend state-management choices with trade-offs',
    ],
    jobSearch: [
      'Apply to 3 target roles',
      'Ask two contacts for team-fit insights',
      'Track every application stage in the tracker',
    ],
    deliverables: [
      'Performance checklist',
      'State-management decision matrix',
      'Before/after render profile case study',
    ],
    applicationTarget: 3,
  },
  {
    number: 6,
    title: 'TypeScript',
    technicalFocus: ['Type system', 'Generics', 'Advanced types', 'React typing'],
    topics: [
      'Structural typing and type vs interface',
      'Generics and inference',
      'Union, intersection and discriminated unions',
      'Type narrowing and assertion functions',
      'Utility types and keyof/typeof',
      'Conditional and mapped types',
      'Template literal types',
      'Typing hooks, context, generics and polymorphic components',
    ],
    exercises: [
      'Build a type-safe API client with inferred response types',
      'Implement a generic Table component with typed columns',
      'Create a discriminated union state machine for a form',
      'Solve 10 TypeScript type challenges',
    ],
    mockObjectives: [
      'TypeScript mock focused on generics and React typing',
      'Explain variance and narrowing with practical examples',
    ],
    jobSearch: [
      'Apply to 3 target roles',
      'Share one technical write-up on LinkedIn',
      'Follow up on pending applications',
    ],
    deliverables: [
      'TypeScript notes and utility type cookbook',
      'Generic table component',
      'Type-safe API client example',
    ],
    applicationTarget: 3,
  },
  {
    number: 7,
    title: 'Machine Coding',
    technicalFocus: ['Build speed', 'Component architecture', 'Testing', 'Presentation'],
    topics: [
      'Requirement clarification and scoping',
      'Component and state decomposition',
      'Data modeling for UI',
      'Accessibility and keyboard support',
      'Testing critical interactions',
      'Time management during machine coding',
      'Refactoring under time pressure',
      'Demo storytelling',
    ],
    exercises: [
      'Build a kanban board in 90 minutes',
      'Build an autocomplete with keyboard navigation in 60 minutes',
      'Build a paginated data table with filters in 90 minutes',
      'Build a notification center with optimistic updates in 75 minutes',
    ],
    mockObjectives: [
      'Two timed machine-coding mocks with feedback',
      'Record a 5-minute walkthrough of one solution',
    ],
    jobSearch: [
      'Apply to 4 target roles',
      'Request referrals at two dream companies',
      'Prepare a concise project deep-dive outline',
    ],
    deliverables: [
      'Four polished machine-coding submissions',
      'Reusable component starter',
      'Timed machine-coding retrospective',
    ],
    applicationTarget: 4,
  },
  {
    number: 8,
    title: 'Frontend System Design – Part 1',
    technicalFocus: ['Architecture fundamentals', 'Scalability', 'Caching', 'Design systems'],
    topics: [
      'Frontend system design interview framework',
      'Requirements, constraints and non-functional goals',
      'Component architecture and modular monolith',
      'Multi-tenant frontend architecture',
      'RBAC and permission-driven UI',
      'API architecture: REST, GraphQL and BFF',
      'Caching layers and invalidation',
      'Design systems and component governance',
    ],
    exercises: [
      'Design a multi-tenant analytics dashboard',
      'Design a permission-aware admin console',
      'Sketch the architecture of a design system used by 20 teams',
      'Write an ADR for API and caching choices',
    ],
    mockObjectives: [
      'One system design mock with a 45-minute structure',
      'Practice requirement clarification and scope control',
    ],
    jobSearch: [
      'Apply to 4 target roles',
      'Schedule two referral calls',
      'Update application tracker with interview dates',
    ],
    deliverables: [
      'System design framework one-pager',
      'Two architecture diagrams',
      'Caching and API decision records',
    ],
    applicationTarget: 4,
  },
  {
    number: 9,
    title: 'Resignation & Transition Planning',
    technicalFocus: ['Knowledge consolidation', 'Architecture storytelling', 'Interview logistics'],
    topics: [
      'Resignation conversation and notice-period plan',
      'Handover inventory and documentation strategy',
      'Project deep-dive narratives',
      'Stakeholder communication',
      'Interview scheduling and availability',
      'Negotiation preparation and compensation framing',
    ],
    exercises: [
      'Draft resignation email and talking points',
      'Create a handover checklist for current responsibilities',
      'Write three project stories using situation-action-result',
      'Build a compensation benchmark sheet for 50 LPA+ roles',
    ],
    mockObjectives: [
      'Behavioral mock covering resignation and career motivation',
      'One project deep-dive mock with follow-up questions',
    ],
    jobSearch: [
      'Submit notice on 31 December 2026',
      'Apply to 5 target roles',
      'Reconnect with three recruiters',
    ],
    deliverables: [
      'Resignation plan and email draft',
      'Handover checklist',
      'Three polished project narratives',
    ],
    applicationTarget: 5,
  },
  {
    number: 10,
    title: 'Frontend System Design – Part 2',
    technicalFocus: ['Advanced architecture', 'Micro-frontends', 'Observability', 'Reliability'],
    topics: [
      'Micro-frontends: composition, routing and shared state',
      'Monorepo and package boundaries',
      'Performance budgets and runtime observability',
      'Error tracking, feature flags and rollout strategy',
      'Security architecture for frontend platforms',
      'Internationalization and accessibility at scale',
      'Designing for failure and offline resilience',
      'Build vs buy and migration strategies',
    ],
    exercises: [
      'Design an e-commerce storefront composed of micro-frontends',
      'Design a notification platform with real-time updates',
      'Draft a migration plan from a monolith to a modular frontend',
      'Create a frontend observability dashboard spec',
    ],
    mockObjectives: [
      'Two system design mocks covering different domains',
      'Practice driving trade-offs and handling interviewer pushback',
    ],
    jobSearch: [
      'Apply to 5 target roles',
      'Track recruiter responses and conversion rates',
      'Prepare a 30-second and 2-minute introduction',
    ],
    deliverables: [
      'Two advanced architecture case studies',
      'Micro-frontend trade-off analysis',
      'Observability and rollout checklist',
    ],
    applicationTarget: 5,
  },
  {
    number: 11,
    title: 'DSA Foundations',
    technicalFocus: ['Core data structures', 'Pattern recognition', 'Complexity'],
    topics: [
      'Arrays, strings and hash maps',
      'Two pointers and sliding window',
      'Stack and queue',
      'Linked lists',
      'Binary search',
      'Recursion and backtracking basics',
      'Trees and traversal',
      'Big-O analysis',
    ],
    exercises: [
      'Solve 20 curated easy/medium problems',
      'Write pattern notes after every problem',
      'Implement a LRU cache and a rate limiter',
      'Practice explaining complexity out loud',
    ],
    mockObjectives: [
      'Two DSA mocks with a strict 35-minute limit',
      'Practice asking clarifying questions before coding',
    ],
    jobSearch: [
      'Apply to 6 target roles',
      'Ask for referrals at three companies',
      'Keep recruiter pipeline warm with weekly follow-ups',
    ],
    deliverables: [
      'DSA pattern notebook',
      '20 solved problems with explanations',
      'LRU cache and rate limiter implementations',
    ],
    applicationTarget: 6,
  },
  {
    number: 12,
    title: 'DSA & Problem Solving',
    technicalFocus: ['Applied problem solving', 'Machine coding integration', 'Communication'],
    topics: [
      'Sliding window variations',
      'Binary search on answer',
      'Tree and graph traversal',
      'Heap and priority queue patterns',
      'Backtracking',
      'Dynamic programming basics',
      'Problem decomposition under pressure',
      'Testing and edge cases',
    ],
    exercises: [
      'Solve 20 more mixed problems',
      'Re-solve five previously failed problems from memory',
      'Complete two 45-minute timed problem sets',
      'Add edge-case checklists to notes',
    ],
    mockObjectives: [
      'Two DSA mocks with a target score of 7/10',
      'One combined DSA and JavaScript reasoning mock',
    ],
    jobSearch: [
      'Apply to 6 target roles',
      'Review application funnel and adjust targeting',
      'Prepare concise answers for notice period and LWD',
    ],
    deliverables: [
      '40-problem DSA log',
      'Reusable problem-solving checklist',
      'Mock scores trending upward',
    ],
    applicationTarget: 6,
  },
  {
    number: 13,
    title: 'Web Platform & Security',
    technicalFocus: ['Web platform', 'Security', 'Accessibility', 'Core Web Vitals'],
    topics: [
      'HTTP/2, HTTP/3 and connection management',
      'Cookies, storage and SameSite',
      'CORS in depth',
      'XSS, CSRF and CSP',
      'OAuth and session security basics',
      'Accessibility patterns and WCAG',
      'Core Web Vitals optimization',
      'Browser storage and offline architecture',
    ],
    exercises: [
      'Threat-model a React application',
      'Implement a strict CSP and document trade-offs',
      'Audit a page with axe and fix five issues',
      'Improve LCP and INP on a sample application',
    ],
    mockObjectives: [
      'Web platform and security mock',
      'Accessibility-focused mock with practical fixes',
    ],
    jobSearch: [
      'Apply to 7 target roles',
      'Follow up on every application older than 7 days',
      'Refresh referrals for dream companies',
    ],
    deliverables: [
      'Security checklist for frontend applications',
      'Accessibility audit report',
      'Core Web Vitals optimization notes',
    ],
    applicationTarget: 7,
  },
  {
    number: 14,
    title: 'Project Deep Dives',
    technicalFocus: ['Storytelling', 'Impact', 'Architecture decisions', 'Leadership'],
    topics: [
      'Project narrative structure',
      'Metrics and measurable impact',
      'Architecture decisions and trade-offs',
      'Debugging and incident stories',
      'Cross-team influence',
      'Mentoring and code review leadership',
      'Handling ambiguity',
      'Failure and learning stories',
    ],
    exercises: [
      'Write five project deep dives with diagrams',
      'Quantify impact for each project',
      'Record a 10-minute project presentation',
      'Run a peer review of the stories',
    ],
    mockObjectives: [
      'Two hiring-manager-style mocks',
      'Practice answer depth: 30 seconds, 2 minutes, 5 minutes',
    ],
    jobSearch: [
      'Apply to 8 target roles',
      'Prioritise companies already in active interview loops',
      'Prepare tailored answers for each dream company',
    ],
    deliverables: [
      'Five project deep-dive documents',
      'Recorded presentation with self-review',
      'Impact metrics sheet',
    ],
    applicationTarget: 8,
  },
  {
    number: 15,
    title: 'Advanced Frontend Design',
    technicalFocus: ['Advanced system design', 'Design systems', 'Performance', 'AI-assisted engineering'],
    topics: [
      'Design system architecture and theming',
      'Monorepo tooling and release management',
      'Advanced caching and data synchronization',
      'Real-time collaboration architecture',
      'AI-assisted development workflows and review',
      'Feature flag architecture',
      'Frontend platform engineering',
      'Build performance and supply-chain security',
    ],
    exercises: [
      'Design a real-time collaborative editor frontend',
      'Design a themeable multi-brand design system',
      'Create a migration plan for a legacy frontend',
      'Evaluate monorepo tooling for a 50-engineer org',
    ],
    mockObjectives: [
      'Two advanced system design mocks',
      'Practice whiteboarding with explicit assumptions',
    ],
    jobSearch: [
      'Apply to 8 target roles',
      'Move warm leads to recruiter screens',
      'Track offer-stage probability by company',
    ],
    deliverables: [
      'Advanced architecture portfolio piece',
      'Design system case study',
      'Platform engineering notes',
    ],
    applicationTarget: 8,
  },
  {
    number: 16,
    title: 'Interview Execution',
    technicalFocus: ['Interview simulation', 'Communication', 'Consistency'],
    topics: [
      'Interview opening and framing',
      'Think-aloud protocol',
      'Handling unknown questions',
      'Debugging in front of an interviewer',
      'Trade-off articulation',
      'Behavioral storytelling',
      'Salary and notice-period conversations',
      'Post-interview reflection',
    ],
    exercises: [
      'Complete four full-length mock interview loops',
      'Record and review every mock',
      'Build an answer bank for 30 behavioral questions',
      'Practice two live coding sessions with a peer',
    ],
    mockObjectives: [
      'Four mocks with a target average of 7.5/10',
      'Reduce filler words and improve structure',
    ],
    jobSearch: [
      'Apply to 9 target roles',
      'Keep two interviews scheduled every week',
      'Send same-day interview follow-ups',
    ],
    deliverables: [
      'Full mock loop recordings and scorecards',
      '30-question behavioral answer bank',
      'Interview-day checklist',
    ],
    applicationTarget: 9,
  },
  {
    number: 17,
    title: 'Senior-Level Engineering Judgment',
    technicalFocus: ['Leadership', 'Decision-making', 'Mentoring', 'Business context'],
    topics: [
      'Technical decision-making frameworks',
      'Mentoring and code review at senior level',
      'Managing technical debt',
      'Estimation and delivery risk',
      'Cross-functional communication',
      'Influencing without authority',
      'Hiring and interview calibration',
      'Balancing quality, speed and business outcomes',
    ],
    exercises: [
      'Write three leadership stories with outcomes',
      'Run a mock design review and document feedback',
      'Create a technical debt prioritisation framework',
      'Practice stakeholder disagreement scenarios',
    ],
    mockObjectives: [
      'Two senior-level behavioral mocks',
      'One architecture review mock focused on judgment',
    ],
    jobSearch: [
      'Apply to 9 target roles',
      'Ask for feedback after every interview round',
      'Prioritise loops closest to offer',
    ],
    deliverables: [
      'Leadership story bank',
      'Decision-making framework',
      'Interview feedback tracker',
    ],
    applicationTarget: 9,
  },
  {
    number: 18,
    title: 'Closing Technical Gaps',
    technicalFocus: ['Weak-area remediation', 'Final revision', 'Confidence building'],
    topics: [
      'Review lowest-confidence technical topics',
      'Revisit failed mock questions',
      'Rehearse system design frameworks',
      'Polish project narratives',
      'Final DSA pattern revision',
      'Refresh TypeScript edge cases',
      'Revisit performance case studies',
      'Mock interview retrospective',
    ],
    exercises: [
      'Close the top five confidence gaps',
      'Re-attempt every failed mock question',
      'Run a full interview loop with a peer',
      'Update notes and cheat sheets',
    ],
    mockObjectives: [
      'Three targeted mocks on weakest areas',
      'Target an average score above 8/10',
    ],
    jobSearch: [
      'Apply to 10 target roles',
      'Follow up on all stale applications',
      'Prepare negotiation scripts for offer stage',
    ],
    deliverables: [
      'Gap-closure log',
      'Updated cheat sheets',
      'Negotiation script',
    ],
    applicationTarget: 10,
  },
  {
    number: 19,
    title: 'Offer Evaluation',
    technicalFocus: ['Offer analysis', 'Negotiation', 'Due diligence'],
    topics: [
      'Total compensation breakdown',
      'Equity, bonus and vesting evaluation',
      'Negotiation tactics and anchoring',
      'Comparing role scope and growth',
      'Company due diligence',
      'Counter-offer handling',
      'Decision criteria and non-negotiables',
      'Communication with recruiters',
    ],
    exercises: [
      'Build a compensation comparison model',
      'Role-play two negotiation calls',
      'Research five target companies in depth',
      'Define a decision scorecard',
    ],
    mockObjectives: [
      'Two negotiation role-plays',
      'One HR round mock covering compensation and notice period',
    ],
    jobSearch: [
      'Apply to 8 target roles while closing loops',
      'Keep interviewing until an offer is signed',
      'Request written offers before deciding',
    ],
    deliverables: [
      'Offer comparison model',
      'Negotiation script and scenarios',
      'Company due-diligence dossier',
    ],
    applicationTarget: 8,
  },
  {
    number: 20,
    title: 'Decision & Contingency Planning',
    technicalFocus: ['Decision quality', 'Risk management', 'Pipeline maintenance'],
    topics: [
      'Offer decision frameworks',
      'Contingency planning if offers slip',
      'Reference and background-check preparation',
      'Notice-period negotiation',
      'Financial runway planning',
      'Alternative role and company options',
      'Long-term career alignment',
      'Learning plan for the new role',
    ],
    exercises: [
      'Stress-test the decision with a worst-case scenario',
      'Prepare a 30-60-90 day plan for the target role',
      'Document fallback options and triggers',
      'Review finances against the transition timeline',
    ],
    mockObjectives: [
      'One final senior-level loop simulation',
      'Practice explaining the career transition coherently',
    ],
    jobSearch: [
      'Apply to 6 target roles only if pipeline is thin',
      'Nurture backup companies',
      'Confirm references and documents',
    ],
    deliverables: [
      'Decision memo',
      'Contingency plan',
      '30-60-90 day plan for the new role',
    ],
    applicationTarget: 6,
  },
  {
    number: 21,
    title: 'Handover & Transition',
    technicalFocus: ['Knowledge transfer', 'Documentation', 'Professional closure'],
    topics: [
      'Handover documentation',
      'Knowledge-transfer sessions',
      'Open-source and portfolio cleanup',
      'Final interview loops and offer closure',
      'Notice-period professionalism',
      'Relationship maintenance',
      'New-role pre-boarding',
      'Personal retrospective',
    ],
    exercises: [
      'Complete handover documents and walkthroughs',
      'Clean up repositories and portfolio links',
      'Write a transition retrospective',
      'Prepare questions for the new team',
    ],
    mockObjectives: [
      'No new mocks unless an active loop requires it',
      'Rehearse final-round stories once',
    ],
    jobSearch: [
      'Close active loops and negotiate final offers',
      'Apply to 4 roles only as backup',
      'Confirm last working day and joining date',
    ],
    deliverables: [
      'Completed handover pack',
      'Portfolio and GitHub cleanup',
      'Transition retrospective',
    ],
    applicationTarget: 4,
  },
  {
    number: 22,
    title: 'LWD & Career Transition',
    technicalFocus: ['Reflection', 'Continuity', 'Next-role readiness'],
    topics: [
      'Final week checklist',
      'Exit formalities and documents',
      'Offer acceptance and joining logistics',
      'Knowledge continuity',
      'Career narrative update',
      'First-90-days learning plan',
      'Community and network follow-up',
      'Celebrate the transition',
    ],
    exercises: [
      'Complete exit formalities',
      'Finalise joining documentation',
      'Update résumé and LinkedIn with the new role',
      'Write a personal lessons-learned note',
    ],
    mockObjectives: [
      'No mocks scheduled — reserve energy for the transition',
      'Do a final confidence self-assessment',
    ],
    jobSearch: [
      'Confirm signed offer and joining date',
      'Thank recruiters and referrers',
      'Keep the pipeline warm for 30 days post-joining',
    ],
    deliverables: [
      'Signed offer and joining checklist',
      'Updated career narrative',
      'Personal retrospective and next learning plan',
    ],
    applicationTarget: 2,
  },
];

export const initialRoadmap: RoadmapWeek[] = weekSeeds.map((seed) => {
  const start = addDays(PREP_START, (seed.number - 1) * 7);
  const naturalEnd = addDays(start, 6);
  const end = naturalEnd > LWD ? LWD : naturalEnd;

  return {
    id: `week-${seed.number}`,
    number: seed.number,
    title: seed.title,
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    technicalFocus: seed.technicalFocus,
    topics: seed.topics,
    exercises: seed.exercises,
    mockObjectives: seed.mockObjectives,
    jobSearch: seed.jobSearch,
    deliverables: seed.deliverables,
    applicationTarget: seed.applicationTarget,
    status: seed.status ?? (seed.number === 1 ? 'In Progress' : 'Not Started'),
    notes:
      seed.number === 1
        ? 'Preparation starts 2 Nov 2026. Goal: a Senior/Lead Frontend role at ₹50 LPA+ in Mumbai or remote India. LWD target: 31 Mar 2027.'
        : '',
    tasks: [],
    progress: seed.progress ?? (seed.number === 1 ? 5 : 0),
    createdAt: NOW,
    updatedAt: NOW,
  };
});
