export interface ScannedBlankResponse {
  id: string;
  scanSessionId: string;
  testId: string;
  studentName: string;
  studentClass: string;
  testDate?: string;
  overallConfidence: number;
  needsReview: boolean;
  reviewStatus: string;
  processingStatus: string;
  grade?: string;
  percentage?: number;
  scannedAt?: string;
  processedAt?: string;
  reviewedAt?: string;
}

export interface ScanSessionResponse {
  id: string;
  testId: string;
  userId: string;
  name: string;
  description: string;
  deviceId: string;
  deviceModel: string;
  totalBlanks: number;
  startedAt: string;
  metadata: unknown;
  createdAt: string;
}

export interface StartScanSessionRequest {
  testId: string;
  name?: string;
  description?: string;
  deviceId?: string;
  deviceModel?: string;
  metadata?: unknown;
}

export interface StudentAnswerGrade {
  id: string;
  scannedBlankId: string;
  questionNumber: number;
  correctAnswer: string;
  studentAnswer: string;
  finalAnswer: string;
  score: number;
  maxPoints: number;
  matchType: string;
}

export interface ScannedBlankDetailedResponse {
  id: string;
  scanSessionId: string;
  testId: string;
  studentName: string;
  studentClass: string;
  overallConfidence: number;
  needsReview: boolean;
  reviewStatus: string;
  answers: Record<string, string>;
  errorCorrections: Record<string, string>;
  finalAnswers: Record<string, string>;
  isErrorCorrectionApplied: boolean;
  isScored: boolean;
  rawScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  feedback: string;
  reviewNotes: string | null;
  answerGrades: StudentAnswerGrade[];
  originalImagePath: string;
  processedImagePath: string;
  processingStatus: string;
  scannedAt?: string;
  processedAt?: string;
  createdAt?: string;
}
