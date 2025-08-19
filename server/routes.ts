import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { insertAssessmentSchema, insertQuestionSchema, insertSubmissionSchema, insertInvitationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Assessments
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.patch("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.updateAssessment(req.params.id, req.body);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.delete("/api/assessments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAssessment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assessment" });
    }
  });

  // Questions
  app.get("/api/assessments/:id/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByAssessmentId(req.params.id);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Bulk create questions for assessment
  const bulkQuestionSchema = z.object({
    assessmentId: z.string(),
    questions: z.array(z.object({
      questionText: z.string(),
      options: z.object({
        a: z.string(),
        b: z.string(),
        c: z.string().optional(),
        d: z.string().optional(),
      }),
      correctAnswer: z.string(),
      order: z.number(),
    }))
  });

  app.post("/api/assessments/:id/questions/bulk", async (req, res) => {
    try {
      const validatedData = bulkQuestionSchema.parse(req.body);
      
      // Delete existing questions first
      await storage.deleteQuestionsByAssessmentId(req.params.id);
      
      const createdQuestions = [];
      for (const questionData of validatedData.questions) {
        const question = await storage.createQuestion({
          ...questionData,
          assessmentId: req.params.id,
          options: JSON.stringify(questionData.options), // Convert options object to JSON string
        });
        createdQuestions.push(question);
      }
      
      res.status(201).json(createdQuestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create questions" });
    }
  });

  // Submissions
  app.get("/api/submissions", async (req, res) => {
    try {
      const submissions = await storage.getSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/assessments/:id/submissions", async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByAssessmentId(req.params.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  // Submit assessment (public endpoint)
  const submitAssessmentSchema = z.object({
    assessmentId: z.string(),
    respondentName: z.string(),
    respondentEmail: z.string().email(),
    answers: z.record(z.string()), // questionId -> answer
    timeSpent: z.number().optional(), // time spent in seconds
  });

  app.post("/api/assessments/:id/submit", async (req, res) => {
    try {
      const validatedData = submitAssessmentSchema.parse(req.body);
      const assessment = await storage.getAssessment(req.params.id);
      
      if (!assessment || assessment.status !== 'active') {
        return res.status(404).json({ message: "Assessment not found or inactive" });
      }

      const questions = await storage.getQuestionsByAssessmentId(req.params.id);
      let correctAnswers = 0;
      
      questions.forEach(question => {
        const userAnswer = validatedData.answers[question.id];
        const questionOptions = JSON.parse(question.options as string);
        const correctAnswerText = questionOptions[question.correctAnswer];
        
        console.log(`Question ${question.id}:`, {
          userAnswer,
          correctAnswerKey: question.correctAnswer,
          correctAnswerText,
          questionOptions
        });
        
        if (userAnswer === correctAnswerText) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);
      const status = score >= (assessment.passingScore || 70) ? 'passed' : 'failed';

      const submission = await storage.createSubmission({
        assessmentId: req.params.id,
        respondentName: validatedData.respondentName,
        respondentEmail: validatedData.respondentEmail,
        answers: JSON.stringify(validatedData.answers), // Convert answers to JSON string
        score,
        totalQuestions: questions.length,
        correctAnswers,
        status,
        timeSpent: validatedData.timeSpent || null, // Include time spent
      });

      res.status(201).json({
        ...submission,
        assessment: {
          title: assessment.title,
          passingScore: assessment.passingScore,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });

  // Invitations
  app.get("/api/invitations", async (req, res) => {
    try {
      const invitations = await storage.getInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/invitations", async (req, res) => {
    try {
      // Create a temporary schema for API validation
      const apiInvitationSchema = z.object({
        assessmentId: z.string(),
        emails: z.array(z.string().email()),
        subject: z.string(),
        message: z.string().optional(),
        sendReminders: z.boolean().optional(),
      });
      
      const validatedData = apiInvitationSchema.parse(req.body);
      
      // Convert emails array to JSON string for storage
      const invitationData = {
        assessmentId: validatedData.assessmentId,
        emails: JSON.stringify(validatedData.emails),
        subject: validatedData.subject,
        message: validatedData.message || null,
        sendReminders: validatedData.sendReminders || null,
      };
      
      const invitation = await storage.createInvitation(invitationData);
      
      // Send actual emails if email service is configured
      console.log('🔍 Checking email service configuration...');
      if (emailService.isConfigured()) {
        console.log('✅ Email service is configured, fetching assessment...');
        const assessment = await storage.getAssessment(validatedData.assessmentId);
        if (assessment) {
          console.log('✅ Assessment found:', assessment.title);
          // Create assessment URL - in production this would be your domain
          const assessmentUrl = `${req.protocol}://${req.get('host')}/take/${assessment.id}`;
          console.log('📝 Assessment URL:', assessmentUrl);
          
          const emailSent = await emailService.sendAssessmentInvitation(
            validatedData.emails,
            assessment.title,
            assessmentUrl,
            validatedData.message || undefined
          );
          
          if (emailSent) {
            console.log(`✅ Email invitations sent successfully to ${validatedData.emails.length} recipients`);
          } else {
            console.log('❌ Failed to send email invitations');
          }
        } else {
          console.log('❌ Assessment not found for ID:', validatedData.assessmentId);
        }
      } else {
        console.log('❌ Email service not configured - invitations stored but emails not sent');
      }
      
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Recent activity endpoints
  app.get("/api/dashboard/recent-assessments", async (req, res) => {
    try {
      const assessments = await storage.getAssessments();
      const recent = assessments.slice(0, 5);
      res.json(recent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent assessments" });
    }
  });

  app.get("/api/dashboard/recent-submissions", async (req, res) => {
    try {
      const submissions = await storage.getSubmissions();
      const recent = submissions.slice(0, 5);
      res.json(recent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent submissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
