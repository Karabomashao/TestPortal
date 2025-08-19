import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle, TrendingUp, Trophy, Download } from "lucide-react";
import type { Submission, Assessment } from "@shared/schema";

export default function Results() {
  const [selectedAssessment, setSelectedAssessment] = useState("all");

  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  // Calculate stats
  const totalRespondents = submissions?.length || 0;
  const passedSubmissions = submissions?.filter(s => s.status === 'passed').length || 0;
  const passRate = totalRespondents > 0 ? ((passedSubmissions / totalRespondents) * 100).toFixed(1) : "0.0";
  const averageScore = submissions && submissions.length > 0 
    ? (submissions.reduce((acc, sub) => acc + sub.score, 0) / submissions.length).toFixed(1)
    : "0.0";
  const highestScore = submissions && submissions.length > 0 
    ? Math.max(...submissions.map(s => s.score))
    : 0;

  const filteredSubmissions = submissions?.filter(submission => 
    selectedAssessment === 'all' || submission.assessmentId === selectedAssessment
  ) || [];

  const exportResults = () => {
    if (!filteredSubmissions.length) return;

    const csv = [
      ['Name', 'Email', 'Assessment', 'Score', 'Status', 'Submitted Date'].join(','),
      ...filteredSubmissions.map(submission => [
        submission.respondentName,
        submission.respondentEmail,
        assessments?.find(a => a.id === submission.assessmentId)?.title || 'Unknown',
        `${submission.score}%`,
        submission.status,
        submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment-results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (submissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold lean-text-secondary">Assessment Results</h2>
          <p className="text-gray-600">View and manage assessment submissions and scores</p>
        </div>
        <div className="flex space-x-3">
          <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Assessments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assessments</SelectItem>
              {assessments?.map((assessment) => (
                <SelectItem key={assessment.id} value={assessment.id}>
                  {assessment.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={exportResults}
            className="lean-bg-accent-green text-white hover:bg-green-600"
            disabled={filteredSubmissions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-blue rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Respondents</p>
                <p className="text-2xl font-semibold lean-text-secondary">{totalRespondents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-green rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pass Rate</p>
                <p className="text-2xl font-semibold lean-text-secondary">{passRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-orange rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold lean-text-secondary">{averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-purple rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Highest Score</p>
                <p className="text-2xl font-semibold lean-text-secondary">{highestScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold lean-text-secondary">Submission Details</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium lean-text-secondary">
                            {submission.respondentName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.respondentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {assessments?.find(a => a.id === submission.assessmentId)?.title || 'Unknown Assessment'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold lean-text-secondary">
                          {submission.score}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {submission.correctAnswers}/{submission.totalQuestions} correct
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={submission.status === 'passed' ? 'default' : 'destructive'}
                          className={submission.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {submission.timeSpent ? `${Math.round(submission.timeSpent / 60)} minutes` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="link" size="sm" className="lean-text-primary p-0">
                            View Details
                          </Button>
                          <Button variant="link" size="sm" className="text-blue-600 p-0">
                            Send Results
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No submissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
