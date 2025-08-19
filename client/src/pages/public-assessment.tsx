import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, User, Mail } from 'lucide-react';
// Import types from shared schema instead
type Assessment = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  timeLimit?: number | null;
  passingScore?: number | null;
};

type Question = {
  id: string;
  text: string;
  options: string;
  correctAnswer: string;
  assessmentId: string;
};

type SubmissionWithAssessment = {
  id: string;
  assessmentId: string;
  respondentName: string;
  respondentEmail: string;
  score: number;
  status: string;
  correctAnswers: number;
  timeSpent?: number;
};
import { apiRequest } from '@/lib/queryClient';

const respondentSchema = z.object({
  respondentName: z.string().min(1, 'Name is required'),
  respondentEmail: z.string().email('Please enter a valid email address'),
});

type RespondentFormData = z.infer<typeof respondentSchema>;

type AssessmentStep = 'info' | 'questions' | 'result';

export default function PublicAssessment() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const [step, setStep] = useState<AssessmentStep>('info');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionWithAssessment | null>(null);

  const { data: assessment, isLoading: assessmentLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/assessments', assessmentId, 'questions'],
    enabled: !!assessmentId && step === 'questions',
  });

  // Initialize timer when stepping to questions
  useEffect(() => {
    if (step === 'questions') {
      setStartTime(Date.now());
    }
  }, [step]);

  // Set time limit when assessment loads
  useEffect(() => {
    if (step === 'questions' && assessment && assessment.timeLimit) {
      setTimeRemaining(assessment.timeLimit * 60); // Convert minutes to seconds
    }
  }, [step, assessment]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || step !== 'questions') return;

    if (timeRemaining <= 0) {
      // Auto-submit when time is up
      const formData = form.getValues();
      submitAssessmentMutation.mutate({
        respondentName: formData.respondentName,
        respondentEmail: formData.respondentEmail,
        answers,
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev && prev > 0) ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, step]);

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
        timeSpent, // Include time spent in the submission
      });
      return response.json();
    },
    onSuccess: (result: SubmissionWithAssessment) => {
      setSubmissionResult(result);
      setStep('result');
    },
    onError: (error: any) => {
      console.error('Assessment submission failed:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Not Found</h2>
            <p className="text-gray-600">The assessment you're looking for is not available or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessment.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Unavailable</h2>
            <p className="text-gray-600">This assessment is currently inactive and not accepting responses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result view
  if (step === 'result' && submissionResult) {
    const passed = submissionResult.status === 'passed';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {passed ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {passed ? 'Congratulations!' : 'Assessment Complete'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {passed 
                ? 'You have successfully passed the assessment.'
                : 'Thank you for completing the assessment.'
              }
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{submissionResult.score}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{submissionResult.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{Math.round((submissionResult.timeSpent || 0) / 60)}m</div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Your results have been recorded. You may now close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Info collection step
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">{assessment.title}</CardTitle>
            {assessment.description && (
              <CardDescription className="text-lg text-gray-600 mt-2">
                {assessment.description}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Before you start:</h4>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    {assessment.timeLimit && (
                      <li>• Time limit: {assessment.timeLimit} minutes</li>
                    )}
                    <li>• Answer all questions to complete the assessment</li>
                    <li>• You cannot go back once you submit</li>
                  </ul>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInfoSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="respondentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Full Name</span>
                      </FormLabel>
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
                      <FormLabel className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Address</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
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
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
            {timeRemaining !== null && (
              <div className={`flex items-center space-x-2 ${
                timeRemaining < 300 ? 'text-red-600' : 'text-orange-600'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-medium">
                  Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(Object.keys(answers).length / (questions?.length || 1)) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Progress: {Object.keys(answers).length} of {questions?.length || 0} questions answered
          </p>
        </div>

        <div className="space-y-6">
          {questions?.map((question: Question, index: number) => (
            <Card key={question.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-700">{question.questionText}</p>
                </div>

                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                >
                  {(() => {
                    try {
                      const options = typeof question.options === 'string' 
                        ? JSON.parse(question.options) 
                        : question.options;
                      
                      if (Array.isArray(options)) {
                        return options.map((option: string, optionIndex: number) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                            <Label htmlFor={`${question.id}-${optionIndex}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ));
                      }
                      
                      // Fallback for object format like {a: "option1", b: "option2"}
                      return Object.values(options).filter(Boolean).map((option: any, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                          <Label htmlFor={`${question.id}-${optionIndex}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ));
                    } catch (error) {
                      console.error('Error parsing question options:', error, question.options);
                      return (
                        <div className="text-red-500 text-sm">
                          Error loading question options. Please contact support.
                        </div>
                      );
                    }
                  })()}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">
                  {allQuestionsAnswered 
                    ? 'All questions answered. Ready to submit!'
                    : `Please answer all questions (${Object.keys(answers).length}/${questions?.length || 0} completed)`
                  }
                </p>
              </div>
              <Button
                onClick={handleSubmitAssessment}
                disabled={!allQuestionsAnswered || submitAssessmentMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {submitAssessmentMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}