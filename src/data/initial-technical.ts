import type { TechCategory, TechTopic } from '../types';
import { SYNC_EPOCH } from '../lib/sync/constants';

const NOW = SYNC_EPOCH;

interface TopicSeed {
  name: string;
  status?: TechTopic['status'];
  confidence?: number;
  notes?: string;
  questions?: string[];
  exercises?: string[];
}

const topic = (categoryId: string, index: number, seed: TopicSeed): TechTopic => {
  const name = seed.name;
  return {
    id: `${categoryId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${index}`,
    name,
    status: seed.status ?? 'Not Started',
    confidence: seed.confidence ?? 1,
    notes: seed.notes ?? '',
    revisionDate: '',
    questions: seed.questions ?? [
      `Explain ${name} in under 2 minutes with a production example.`,
      `What are the common interview mistakes related to ${name}?`,
    ],
    exercises: seed.exercises ?? [
      `Write a small demo that demonstrates ${name}.`,
      `Teach ${name} out loud and record the explanation.`,
    ],
    createdAt: NOW,
    updatedAt: NOW,
  };
};

export const initialTechCategories: TechCategory[] = [
  {
    id: 'cat-javascript',
    name: 'JavaScript',
    description: 'Language internals, runtime behaviour and the questions that separate senior candidates.',
    topics: [
      topic('cat-javascript', 1, {
        name: 'Execution context',
        status: 'Learning',
        confidence: 2,
        notes: 'Global vs function vs block context. Creation phase and execution phase.',
        questions: ['Walk through the creation and execution phases for a nested function call.'],
        exercises: ['Draw the call stack and execution contexts for a closure example.'],
      }),
      topic('cat-javascript', 2, { name: 'Scope and hoisting', status: 'Learning', confidence: 3 }),
      topic('cat-javascript', 3, {
        name: 'Closures',
        status: 'Practiced',
        confidence: 3,
        notes: 'Lexical environment retained after outer function returns. Cover loops, memoisation, module pattern.',
        questions: ['Implement once(), memoize() and a counter using closures.'],
      }),
      topic('cat-javascript', 4, { name: 'Prototypes', confidence: 2 }),
      topic('cat-javascript', 5, { name: 'This keyword', confidence: 2 }),
      topic('cat-javascript', 6, {
        name: 'Event loop',
        status: 'Learning',
        confidence: 2,
        notes: 'Call stack, task queue, microtask queue, rendering. Promise callbacks are microtasks.',
        questions: ['Predict the output order of a script mixing setTimeout, promises and async/await.'],
      }),
      topic('cat-javascript', 7, { name: 'Promises' }),
      topic('cat-javascript', 8, { name: 'Async/Await' }),
      topic('cat-javascript', 9, { name: 'Debouncing and throttling' }),
      topic('cat-javascript', 10, { name: 'Advanced array methods' }),
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-react',
    name: 'React',
    description: 'Rendering model, hooks, state architecture and production performance.',
    topics: [
      topic('cat-react', 1, {
        name: 'Virtual DOM and reconciliation',
        confidence: 2,
        notes: 'Elements are immutable descriptions. Reconciliation compares trees; keys preserve identity.',
      }),
      topic('cat-react', 2, { name: 'Rendering lifecycle' }),
      topic('cat-react', 3, {
        name: 'Hooks',
        status: 'Practiced',
        confidence: 3,
        notes: 'Rules of hooks, closures in effects, dependency arrays, custom hooks.',
      }),
      topic('cat-react', 4, { name: 'Context API' }),
      topic('cat-react', 5, { name: 'State management' }),
      topic('cat-react', 6, { name: 'Redux Toolkit' }),
      topic('cat-react', 7, { name: 'React performance' }),
      topic('cat-react', 8, { name: 'Memoization' }),
      topic('cat-react', 9, { name: 'Lazy loading' }),
      topic('cat-react', 10, { name: 'Suspense' }),
      topic('cat-react', 11, { name: 'Error boundaries' }),
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-typescript',
    name: 'TypeScript',
    description: 'Type-system fluency and advanced React typing for large codebases.',
    topics: [
      topic('cat-typescript', 1, { name: 'Types and interfaces', confidence: 3 }),
      topic('cat-typescript', 2, { name: 'Generics', confidence: 2 }),
      topic('cat-typescript', 3, { name: 'Utility types', confidence: 2 }),
      topic('cat-typescript', 4, { name: 'Type narrowing' }),
      topic('cat-typescript', 5, { name: 'Conditional types' }),
      topic('cat-typescript', 6, { name: 'Mapped types' }),
      topic('cat-typescript', 7, { name: 'Advanced React typing' }),
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-system-design',
    name: 'Frontend System Design',
    description: 'Architecture, scalability and trade-off communication for senior loops.',
    topics: [
      topic('cat-system-design', 1, { name: 'Component architecture' }),
      topic('cat-system-design', 2, { name: 'Modular monolith' }),
      topic('cat-system-design', 3, { name: 'Micro-frontends' }),
      topic('cat-system-design', 4, { name: 'Multi-tenant architecture' }),
      topic('cat-system-design', 5, { name: 'RBAC and permissions' }),
      topic('cat-system-design', 6, { name: 'API architecture' }),
      topic('cat-system-design', 7, { name: 'Caching' }),
      topic('cat-system-design', 8, { name: 'Scalability' }),
      topic('cat-system-design', 9, { name: 'Design systems' }),
      topic('cat-system-design', 10, { name: 'Performance optimization' }),
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-dsa',
    name: 'Data Structures & Algorithms',
    description: 'Pattern-based problem solving with clear complexity explanations.',
    topics: [
      topic('cat-dsa', 1, { name: 'Arrays', status: 'Practiced', confidence: 3 }),
      topic('cat-dsa', 2, { name: 'Strings', status: 'Practiced', confidence: 3 }),
      topic('cat-dsa', 3, { name: 'Hash maps', status: 'Practiced', confidence: 3 }),
      topic('cat-dsa', 4, { name: 'Two pointers' }),
      topic('cat-dsa', 5, { name: 'Sliding window' }),
      topic('cat-dsa', 6, { name: 'Stack and queue' }),
      topic('cat-dsa', 7, { name: 'Linked lists' }),
      topic('cat-dsa', 8, { name: 'Binary search' }),
      topic('cat-dsa', 9, { name: 'Recursion' }),
      topic('cat-dsa', 10, { name: 'Trees' }),
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'cat-web',
    name: 'Browser & Web Fundamentals',
    description: 'Networking, rendering, security and the web platform behind every frontend.',
    topics: [
      topic('cat-web', 1, { name: 'HTTP and HTTPS', confidence: 2 }),
      topic('cat-web', 2, { name: 'Browser rendering' }),
      topic('cat-web', 3, { name: 'Networking' }),
      topic('cat-web', 4, { name: 'CORS' }),
      topic('cat-web', 5, { name: 'Cookies' }),
      topic('cat-web', 6, { name: 'XSS and CSRF' }),
      topic('cat-web', 7, { name: 'CSP' }),
      topic('cat-web', 8, { name: 'Accessibility' }),
      topic('cat-web', 9, { name: 'Core Web Vitals' }),
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];
