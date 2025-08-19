import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Clock, HelpCircle, Award, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, Question } from "@shared/schema";
import type { SubmissionWithAssessment } from "@/lib/types";

const respondentSchema = z.object({
  respondentName: z.string().min(1, "Full name is required"),
  respondentEmail: z.string().email("Valid email is required"),
});

type RespondentFormData = z.infer<typeof respondentSchema>;

export default function TakeAssessment() {
  const [, params] = useRoute("/take/:id");
  const [step, setStep] = useState<'info' | 'questions' | 'result'>('info');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [submissionResult, setSubmissionResult] = useState<SubmissionWithAssessment | null>(null);
  const { toast } = useToast();

  const assessmentId = params?.id;

  const { data: assessment, isLoading: assessmentLoading } = useQuery<Assessment>({
    queryKey: ["/api/assessments", assessmentId],
    enabled: !!assessmentId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/assessments", assessmentId, "questions"],
    enabled: !!assessmentId && step === 'questions',
  });

  const form = useForm<RespondentFormData>({
    resolver: zodResolver(respondentSchema),
    defaultValues: {
      respondentName: "",
      respondentEmail: "",
    },
  });

  const submitAssessmentMutation = useMutation({
    mutationFn: async (data: { respondentName: string; respondentEmail: string; answers: Record<string, string> }) => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const response = await apiRequest("POST", `/api/assessments/${assessmentId}/submit`, {
        ...data,
        assessmentId: assessmentId!,
      });
      return response.json();
    },
    onSuccess: (result: SubmissionWithAssessment) => {
      setSubmissionResult(result);
      setStep('result');
      toast({
        title: "Assessment submitted",
        description: "Your assessment has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInfoSubmit = (data: RespondentFormData) => {
    setStep('questions');
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAssessment = () => {
    const formData = form.getValues();
    submitAssessmentMutation.mutate({
      respondentName: formData.respondentName,
      respondentEmail: formData.respondentEmail,
      answers,
    });
  };

  const allQuestionsAnswered = questions?.every(q => answers[q.id]) || false;

  if (assessmentLoading || questionsLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Not Found</h2>
        <p className="text-gray-600">The assessment you're looking for is not available or has been removed.</p>
      </div>
    );
  }

  if (assessment.status !== 'active') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <XCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Unavailable</h2>
        <p className="text-gray-600">This assessment is currently inactive and not accepting responses.</p>
      </div>
    );
  }

  // Result view
  if (step === 'result' && submissionResult) {
    const passed = submissionResult.status === 'passed';
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-3xl font-bold lean-text-secondary mb-2">
              {passed ? 'Congratulations!' : 'Assessment Complete'}
            </h2>
            
            <p className="text-xl text-gray-600 mb-6">
              You scored {submissionResult.score}% on {submissionResult.assessment?.title}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Your Score</p>
                <p className="text-2xl font-bold lean-text-secondary">{submissionResult.score}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Passing Score</p>
                <p className="text-2xl font-bold lean-text-secondary">
                  {submissionResult.assessment?.passingScore || 70}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Correct Answers</p>
                <p className="text-2xl font-bold lean-text-secondary">
                  {submissionResult.correctAnswers}/{submissionResult.totalQuestions}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${passed ? 'text-green-800' : 'text-red-800'}`}>
                {passed 
                  ? 'You have successfully passed this assessment! You will receive an email with your results shortly.'
                  : 'You did not meet the passing score for this assessment. You will receive an email with your results and feedback.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Info collection step
  if (step === 'info') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Assessment Header */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold lean-text-secondary mb-2">{assessment.title}</h1>
              {assessment.description && (
                <p className="text-gray-600 mb-4">{assessment.description}</p>
              )}
              <div className="flex justify-center space-x-8 text-sm text-gray-500">
                {assessment.timeLimit && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 lean-text-primary" />
                    <span>{assessment.timeLimit} minutes</span>
                  </div>
                )}
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 lean-text-primary" />
                  <span>Multiple choice questions</span>
                </div>
                {assessment.passingScore && (
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 lean-text-primary" />
                    <span>Passing score: {assessment.passingScore}%</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Read each question carefully before selecting your answer</li>
              <li>• You can change your answers before submitting</li>
              <li>• Make sure to complete all questions</li>
              <li>• Click "Submit Assessment" when you're finished</li>
            </ul>
          </CardContent>
        </Card>

        {/* Respondent Info Form */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold lean-text-secondary mb-4">Your Information</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInfoSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="respondentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="respondentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="lean-bg-primary hover:lean-hover-primary">
                  Start Assessment
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questions step
  if (step === 'questions' && questions) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium lean-text-secondary">Question {index + 1}</h3>
                  <span className="text-sm text-gray-500">{index + 1} of {questions.length}</span>
                </div>
                <p className="lean-text-secondary text-lg">{question.questionText}</p>
              </div>
              
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="space-y-3"
              >
                {Object.entries(typeof question.options === 'string' ? JSON.parse(question.options) : question.options as Record<string, string>).map(([key, text]) => {
                  if (!text) return null;
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`${question.id}-${key}`} />
                      <Label 
                        htmlFor={`${question.id}-${key}`}
                        className="flex-1 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer lean-text-secondary"
                      >
                        {text as string}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        {/* Submit Section */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {allQuestionsAnswered 
                  ? "All questions completed! You can now submit your assessment."
                  : "Please answer all questions before submitting."
                }
              </p>
              <Button
                onClick={handleSubmitAssessment}
                disabled={!allQuestionsAnswered || submitAssessmentMutation.isPending}
                className="lean-bg-primary hover:lean-hover-primary px-8 py-3 font-medium"
              >
                {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
