import type { Assessment, Question, Submission, Invitation } from "@shared/schema";

export interface DashboardStats {
  totalAssessments: number;
  activeAssessments: number;
  totalSubmissions: number;
  averageScore: string;
}

export interface AssessmentWithStats extends Assessment {
  questionCount?: number;
  submissionCount?: number;
  averageScore?: string;
}

export interface SubmissionWithAssessment extends Submission {
  assessment?: {
    title: string;
    passingScore?: number;
  };
}

export interface QuestionFormData {
  questionText: string;
  options: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  correctAnswer: string;
  order: number;
}

export interface CreateAssessmentData {
  title: string;
  description?: string;
  category?: string;
  timeLimit?: number;
  passingScore?: number;
  status: string;
  questions: QuestionFormData[];
}

export interface TakeAssessmentData {
  respondentName: string;
  respondentEmail: string;
  answers: Record<string, string>;
}
