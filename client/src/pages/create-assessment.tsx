import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QuestionForm from "@/components/assessment/question-form";
import { Plus, Trash2 } from "lucide-react";
import type { QuestionFormData, CreateAssessmentData } from "@/lib/types";

const assessmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  timeLimit: z.number().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  status: z.enum(["draft", "active", "inactive"]),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export default function CreateAssessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionFormData[]>([{
    questionText: "",
    options: { a: "", b: "", c: "", d: "" },
    correctAnswer: "",
    order: 1,
  }]);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      timeLimit: 30,
      passingScore: 70,
      status: "draft",
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: CreateAssessmentData) => {
      // First create the assessment
      const assessmentResponse = await apiRequest("POST", "/api/assessments", {
        title: data.title,
        description: data.description,
        category: data.category,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore,
        status: data.status,
      });

      const assessment = await assessmentResponse.json();

      // Then create the questions
      if (data.questions.length > 0) {
        await apiRequest("POST", `/api/assessments/${assessment.id}/questions/bulk`, {
          assessmentId: assessment.id,
          questions: data.questions,
        });
      }

      return assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Assessment created",
        description: "Your assessment has been created successfully.",
      });
      setLocation("/assessments");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      questionText: "",
      options: { a: "", b: "", c: "", d: "" },
      correctAnswer: "",
      order: prev.length + 1,
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const updateQuestion = (index: number, question: QuestionFormData) => {
    setQuestions(prev => prev.map((q, i) => i === index ? question : q));
  };

  const onSubmit = (data: AssessmentFormData) => {
    // Validate that we have at least one complete question
    const validQuestions = questions.filter(q => 
      q.questionText && q.options.a && q.options.b && q.correctAnswer
    );

    if (validQuestions.length === 0) {
      toast({
        title: "No valid questions",
        description: "Please add at least one complete question with all required fields.",
        variant: "destructive",
      });
      return;
    }

    const createData: CreateAssessmentData = {
      ...data,
      questions: validQuestions,
    };

    createAssessmentMutation.mutate(createData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold lean-text-secondary">Create New Assessment</h2>
        <p className="text-gray-600">Build a multiple-choice assessment for your respondents</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold lean-text-secondary mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assessment title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this assessment covers"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="70"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold lean-text-secondary">Questions</h3>
                <Button type="button" onClick={addQuestion} className="lean-bg-primary hover:lean-hover-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium lean-text-secondary">Question {index + 1}</h4>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <QuestionForm
                      question={question}
                      onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/assessments")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAssessmentMutation.isPending}
              className="lean-bg-primary hover:lean-hover-primary"
            >
              {createAssessmentMutation.isPending ? "Creating..." : "Create Assessment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
