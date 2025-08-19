import { 
  type User, type InsertUser, type Assessment, type InsertAssessment,
  type Question, type InsertQuestion, type Submission, type InsertSubmission,
  type Invitation, type InsertInvitation
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Assessments
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, assessment: Partial<Assessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: string): Promise<boolean>;

  // Questions
  getQuestionsByAssessmentId(assessmentId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestionsByAssessmentId(assessmentId: string): Promise<void>;

  // Submissions
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissions(): Promise<Submission[]>;
  getSubmissionsByAssessmentId(assessmentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;

  // Invitations
  getInvitations(): Promise<Invitation[]>;
  createInvitation(invitation: { assessmentId: string; emails: string; subject: string; message?: string | null; sendReminders?: boolean | null; }): Promise<Invitation>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalAssessments: number;
    activeAssessments: number;
    totalSubmissions: number;
    averageScore: string;
  }>;
}

import { SQLiteStorage } from "./sqlite-storage";
export const storage = new SQLiteStorage();