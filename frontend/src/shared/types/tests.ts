export interface TestResponse {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  description: string;
  totalQuestions: number;
  maxScore: number;
  isActive: boolean;
  creatorId: string;
  creatorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerKeyResponse {
  id: string;
  testId: string;
  questionNumber: number;
  correctAnswer: string;
  maxPoints: number;
  toleranceLevel: number;
  answerType: "TEXT" | "MULTIPLE_CHOICE" | "NUMERIC";
}

export interface GradeThresholdResponse {
  id: string;
  testId: string;
  gradeName: string;
  gradeSymbol: string;
  minPercentage: number;
  maxPercentage: number;
}

export interface TestWithDetailsResponse {
  id: string;
  title: string;
  subject: string;
  description: string;
  totalQuestions: number;
  maxScore: number;
  isActive: boolean;
  creatorId: string;
  classLevel: string;
  createdAt: string;
  answerKeys: AnswerKeyResponse[];
  gradeThresholds: GradeThresholdResponse[];
}

export interface CreateTestRequest {
  title: string;
  subject: string;
  classLevel: string;
  description: string;
  totalQuestions: number;
  maxScore: number;
}

export interface UpdateTestRequest {
  title?: string;
  subject?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateAnswerKeyRequest {
  questionNumber: number;
  correctAnswer: string;
  maxPoints: number;
  toleranceLevel: number;
  answerType: "TEXT" | "MULTIPLE_CHOICE" | "NUMERIC";
}

export interface UpdateAnswerKeyRequest {
  correctAnswer?: string;
  maxPoints?: number;
  toleranceLevel?: number;
}

export interface CreateGradeThresholdRequest {
  gradeName: string;
  gradeSymbol: string;
  minPercentage: number;
  maxPercentage: number;
}
