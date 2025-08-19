import { 
  type User, type InsertUser, type Assessment, type InsertAssessment,
  type Question, type InsertQuestion, type Submission, type InsertSubmission,
  type Invitation, type InsertInvitation
} from "@shared/schema";
import { randomUUID } from "crypto";
import Database from "better-sqlite3";
import type { IStorage } from "./storage";

export class SQLiteStorage implements IStorage {
  private sqlite: Database.Database;

  constructor() {
    this.sqlite = new Database("database.db");
    this.initializeDatabase();
    this.createDefaultAdmin();
  }

  private initializeDatabase() {
    // Create tables if they don't exist
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        time_limit INTEGER DEFAULT 30,
        passing_score INTEGER DEFAULT 70,
        status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        created_at INTEGER,
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        respondent_name TEXT NOT NULL,
        respondent_email TEXT NOT NULL,
        answers TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        time_spent INTEGER,
        status TEXT NOT NULL,
        submitted_at INTEGER,
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        emails TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT,
        send_reminders INTEGER DEFAULT 0,
        sent_at INTEGER,
        sent_by TEXT,
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
      );
    `);
  }

  private createDefaultAdmin() {
    try {
      const existing = this.sqlite.prepare(`SELECT * FROM users WHERE username = ?`).get("admin");
      if (!existing) {
        const adminId = randomUUID();
        this.sqlite.prepare(`
          INSERT INTO users (id, username, password, email, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(adminId, "admin", "admin123", "admin@leantechnovations.com", "admin", Date.now());
      }
    } catch (error) {
      console.error("Error creating default admin:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = this.sqlite.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any;
      return result ? {
        ...result,
        createdAt: result.created_at ? new Date(result.created_at) : new Date()
      } : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = this.sqlite.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as any;
      return result ? {
        ...result,
        createdAt: result.created_at ? new Date(result.created_at) : new Date()
      } : undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = randomUUID();
      const now = Date.now();
      
      this.sqlite.prepare(`
        INSERT INTO users (id, username, password, email, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, insertUser.username, insertUser.password, insertUser.email, insertUser.role || 'user', now);
      
      return {
        id,
        ...insertUser,
        role: insertUser.role || 'user',
        createdAt: new Date(now)
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Assessments
  async getAssessment(id: string): Promise<Assessment | undefined> {
    try {
      const result = this.sqlite.prepare(`SELECT * FROM assessments WHERE id = ?`).get(id) as any;
      return result ? {
        ...result,
        timeLimit: result.time_limit,
        passingScore: result.passing_score,
        createdBy: result.created_by,
        createdAt: result.created_at ? new Date(result.created_at) : new Date(),
        updatedAt: result.updated_at ? new Date(result.updated_at) : new Date()
      } : undefined;
    } catch (error) {
      console.error("Error getting assessment:", error);
      return undefined;
    }
  }

  async getAssessments(): Promise<Assessment[]> {
    try {
      const results = this.sqlite.prepare(`SELECT * FROM assessments ORDER BY created_at DESC`).all() as any[];
      return results.map(result => ({
        ...result,
        timeLimit: result.time_limit,
        passingScore: result.passing_score,
        createdBy: result.created_by,
        createdAt: result.created_at ? new Date(result.created_at) : new Date(),
        updatedAt: result.updated_at ? new Date(result.updated_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting assessments:", error);
      return [];
    }
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    try {
      const id = randomUUID();
      const now = Date.now();
      
      this.sqlite.prepare(`
        INSERT INTO assessments (id, title, description, category, time_limit, passing_score, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        insertAssessment.title,
        insertAssessment.description || null,
        insertAssessment.category || null,
        insertAssessment.timeLimit || 30,
        insertAssessment.passingScore || 70,
        insertAssessment.status || "draft",
        null,
        now,
        now
      );
      
      return {
        id,
        ...insertAssessment,
        description: insertAssessment.description || null,
        category: insertAssessment.category || null,
        timeLimit: insertAssessment.timeLimit || 30,
        passingScore: insertAssessment.passingScore || 70,
        status: insertAssessment.status || "draft",
        createdBy: null,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw error;
    }
  }

  async updateAssessment(id: string, update: Partial<Assessment>): Promise<Assessment | undefined> {
    try {
      const existing = await this.getAssessment(id);
      if (!existing) return undefined;

      const now = Date.now();
      
      this.sqlite.prepare(`
        UPDATE assessments 
        SET title = ?, description = ?, category = ?, time_limit = ?, passing_score = ?, status = ?, updated_at = ?
        WHERE id = ?
      `).run(
        update.title || existing.title,
        update.description !== undefined ? update.description : existing.description,
        update.category !== undefined ? update.category : existing.category,
        update.timeLimit !== undefined ? update.timeLimit : existing.timeLimit,
        update.passingScore !== undefined ? update.passingScore : existing.passingScore,
        update.status || existing.status,
        now,
        id
      );
      
      return await this.getAssessment(id);
    } catch (error) {
      console.error("Error updating assessment:", error);
      return undefined;
    }
  }

  async deleteAssessment(id: string): Promise<boolean> {
    try {
      const result = this.sqlite.prepare(`DELETE FROM assessments WHERE id = ?`).run(id);
      if (result.changes > 0) {
        await this.deleteQuestionsByAssessmentId(id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting assessment:", error);
      return false;
    }
  }

  // Questions
  async getQuestionsByAssessmentId(assessmentId: string): Promise<Question[]> {
    try {
      const results = this.sqlite.prepare(`
        SELECT * FROM questions WHERE assessment_id = ? ORDER BY "order" ASC
      `).all(assessmentId) as any[];
      
      return results.map(result => ({
        ...result,
        assessmentId: result.assessment_id,
        questionText: result.question_text,
        correctAnswer: result.correct_answer,
        createdAt: result.created_at ? new Date(result.created_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting questions:", error);
      return [];
    }
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    try {
      const id = randomUUID();
      const now = Date.now();
      
      this.sqlite.prepare(`
        INSERT INTO questions (id, assessment_id, question_text, options, correct_answer, "order", created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        insertQuestion.assessmentId,
        insertQuestion.questionText,
        insertQuestion.options,
        insertQuestion.correctAnswer,
        insertQuestion.order,
        now
      );
      
      return {
        id,
        ...insertQuestion,
        createdAt: new Date(now)
      };
    } catch (error) {
      console.error("Error creating question:", error);
      throw error;
    }
  }

  async deleteQuestionsByAssessmentId(assessmentId: string): Promise<void> {
    try {
      this.sqlite.prepare(`DELETE FROM questions WHERE assessment_id = ?`).run(assessmentId);
    } catch (error) {
      console.error("Error deleting questions:", error);
    }
  }

  // Submissions
  async getSubmission(id: string): Promise<Submission | undefined> {
    try {
      const result = this.sqlite.prepare(`SELECT * FROM submissions WHERE id = ?`).get(id) as any;
      return result ? {
        ...result,
        assessmentId: result.assessment_id,
        respondentName: result.respondent_name,
        respondentEmail: result.respondent_email,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        timeSpent: result.time_spent,
        submittedAt: result.submitted_at ? new Date(result.submitted_at) : new Date()
      } : undefined;
    } catch (error) {
      console.error("Error getting submission:", error);
      return undefined;
    }
  }

  async getSubmissions(): Promise<Submission[]> {
    try {
      const results = this.sqlite.prepare(`SELECT * FROM submissions ORDER BY submitted_at DESC`).all() as any[];
      return results.map(result => ({
        ...result,
        assessmentId: result.assessment_id,
        respondentName: result.respondent_name,
        respondentEmail: result.respondent_email,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        timeSpent: result.time_spent,
        submittedAt: result.submitted_at ? new Date(result.submitted_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting submissions:", error);
      return [];
    }
  }

  async getSubmissionsByAssessmentId(assessmentId: string): Promise<Submission[]> {
    try {
      const results = this.sqlite.prepare(`
        SELECT * FROM submissions WHERE assessment_id = ? ORDER BY submitted_at DESC
      `).all(assessmentId) as any[];
      
      return results.map(result => ({
        ...result,
        assessmentId: result.assessment_id,
        respondentName: result.respondent_name,
        respondentEmail: result.respondent_email,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        timeSpent: result.time_spent,
        submittedAt: result.submitted_at ? new Date(result.submitted_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting submissions by assessment:", error);
      return [];
    }
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    try {
      const id = randomUUID();
      const now = Date.now();
      
      this.sqlite.prepare(`
        INSERT INTO submissions (id, assessment_id, respondent_name, respondent_email, answers, score, total_questions, correct_answers, time_spent, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        insertSubmission.assessmentId,
        insertSubmission.respondentName,
        insertSubmission.respondentEmail,
        insertSubmission.answers,
        insertSubmission.score,
        insertSubmission.totalQuestions,
        insertSubmission.correctAnswers,
        insertSubmission.timeSpent || null,
        insertSubmission.status,
        now
      );
      
      return {
        id,
        ...insertSubmission,
        timeSpent: insertSubmission.timeSpent ?? null,
        submittedAt: new Date(now)
      };
    } catch (error) {
      console.error("Error creating submission:", error);
      throw error;
    }
  }

  // Invitations
  async getInvitations(): Promise<Invitation[]> {
    try {
      const results = this.sqlite.prepare(`SELECT * FROM invitations ORDER BY sent_at DESC`).all() as any[];
      return results.map(result => ({
        ...result,
        assessmentId: result.assessment_id,
        sendReminders: Boolean(result.send_reminders),
        sentAt: result.sent_at ? new Date(result.sent_at) : new Date(),
        sentBy: result.sent_by
      }));
    } catch (error) {
      console.error("Error getting invitations:", error);
      return [];
    }
  }

  async createInvitation(invitation: { assessmentId: string; emails: string; subject: string; message?: string | null; sendReminders?: boolean | null; }): Promise<Invitation> {
    try {
      const id = randomUUID();
      const now = Date.now();
      
      this.sqlite.prepare(`
        INSERT INTO invitations (id, assessment_id, emails, subject, message, send_reminders, sent_at, sent_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        invitation.assessmentId,
        invitation.emails,
        invitation.subject,
        invitation.message || null,
        invitation.sendReminders ? 1 : 0,
        now,
        null
      );
      
      return {
        id,
        ...invitation,
        message: invitation.message ?? null,
        sendReminders: invitation.sendReminders ?? null,
        sentAt: new Date(now),
        sentBy: null
      };
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    }
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalAssessments: number;
    activeAssessments: number;
    totalSubmissions: number;
    averageScore: string;
  }> {
    try {
      const totalAssessments = this.sqlite.prepare(`SELECT COUNT(*) as count FROM assessments`).get() as any;
      const activeAssessments = this.sqlite.prepare(`SELECT COUNT(*) as count FROM assessments WHERE status = 'active'`).get() as any;
      const totalSubmissions = this.sqlite.prepare(`SELECT COUNT(*) as count FROM submissions`).get() as any;
      const avgScore = this.sqlite.prepare(`SELECT AVG(score) as avg FROM submissions`).get() as any;
      
      return {
        totalAssessments: totalAssessments.count,
        activeAssessments: activeAssessments.count,
        totalSubmissions: totalSubmissions.count,
        averageScore: avgScore.avg ? `${avgScore.avg.toFixed(1)}%` : "0%"
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        totalAssessments: 0,
        activeAssessments: 0,
        totalSubmissions: 0,
        averageScore: "0%"
      };
    }
  }
}