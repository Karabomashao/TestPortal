import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"),
  createdAt: integer("created_at", { mode: 'timestamp' }),
});

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  timeLimit: integer("time_limit").default(30),
  passingScore: integer("passing_score").default(70),
  status: text("status").notNull().default("draft"), // draft, active, inactive
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  questionText: text("question_text").notNull(),
  options: text("options").notNull(), // JSON string: {a: string, b: string, c?: string, d?: string}
  correctAnswer: text("correct_answer").notNull(),
  order: integer("order").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  respondentName: text("respondent_name").notNull(),
  respondentEmail: text("respondent_email").notNull(),
  answers: text("answers").notNull(), // JSON string: {questionId: selectedAnswer}
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  status: text("status").notNull(), // passed, failed
  submittedAt: integer("submitted_at", { mode: 'timestamp' }),
});

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  emails: text("emails").notNull(), // JSON string array
  subject: text("subject").notNull(),
  message: text("message"),
  sendReminders: integer("send_reminders", { mode: 'boolean' }).default(false),
  sentAt: integer("sent_at", { mode: 'timestamp' }),
  sentBy: text("sent_by").references(() => users.id),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  description: true,
  category: true,
  timeLimit: true,
  passingScore: true,
  status: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  assessmentId: true,
  questionText: true,
  options: true,
  correctAnswer: true,
  order: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assessmentId: true,
  respondentName: true,
  respondentEmail: true,
  answers: true,
  score: true,
  totalQuestions: true,
  correctAnswers: true,
  timeSpent: true,
  status: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).pick({
  assessmentId: true,
  emails: true,
  subject: true,
  message: true,
  sendReminders: true,
}).extend({
  emails: z.array(z.string().email()), // Accept array of email strings from frontend
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;
