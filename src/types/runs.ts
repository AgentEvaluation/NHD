import { TestChat } from "./chat";
import { MessageRole, TestRunStatus } from './base';

interface Metrics {
  total: number;
  passed: number;
  failed: number;
  chats: number;
  correct: number;
  incorrect: number;
  sentimentScores?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TestRun {
  id: string;
  name: string;
  timestamp: string;
  status: TestRunStatus;
  metrics: Metrics;
  chats: TestChat[];
  results: Array<{ scenarioId: string; responseTime: number }>;
  agentId: string;
  createdBy: string;
}


interface Metrics {
  total: number;
  passed: number;
  failed: number;
  chats: number;
  correct: number;
  incorrect: number;
  sentimentScores?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TestRun {
  id: string;
  name: string;
  timestamp: string;
  status: TestRunStatus;
  metrics: Metrics;
  chats: TestChat[];
  results: Array<{ scenarioId: string; responseTime: number }>;
  agentId: string;
  createdBy: string;
}



// export interface TestChat {
//   id: string;
//   name: string;
//   messages: TestMessage[];
//   metrics: {
//     correct: number;
//     incorrect: number;
//   };
// }

export interface TestMessage {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  scenario?: string;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
  metrics?: {
    validationScore?: number;
    responseTime?: number;
  };
}