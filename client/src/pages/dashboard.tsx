import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  FileText, 
  Eye, 
  Users, 
  TrendingUp, 
  Plus,
  BarChart3,
  Mail,
  MoreHorizontal
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import type { Assessment, Submission } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/dashboard/recent-assessments"],
  });

  const { data: recentSubmissions } = useQuery<Submission[]>({
    queryKey: ["/api/dashboard/recent-submissions"],
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold lean-text-secondary mb-2">Welcome to LeanTechnovAtions</h2>
        <p className="text-gray-600">Online Assessment Platform Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-blue rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Assessments</p>
                <p className="text-2xl font-semibold lean-text-secondary">
                  {stats?.totalAssessments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-green rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Assessments</p>
                <p className="text-2xl font-semibold lean-text-secondary">
                  {stats?.activeAssessments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 lean-bg-accent-purple rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-semibold lean-text-secondary">
                  {stats?.totalSubmissions || 0}
                </p>
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
                <p className="text-2xl font-semibold lean-text-secondary">
                  {stats?.averageScore || "0.0%"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold lean-text-secondary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 lean-bg-primary rounded-lg flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="ml-3 text-lg font-medium lean-text-secondary">Create Assessment</h4>
                </div>
                <p className="text-gray-600">Create a new multiple-choice assessment</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/results">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 lean-bg-accent-blue rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="ml-3 text-lg font-medium lean-text-secondary">View Results</h4>
                </div>
                <p className="text-gray-600">Review assessment submissions and scores</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/invitations">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 lean-bg-accent-green rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="ml-3 text-lg font-medium lean-text-secondary">Send Invitations</h4>
                </div>
                <p className="text-gray-600">Send email invitations to respondents</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold lean-text-secondary">Recent Assessments</h3>
            </div>
            <div className="p-6">
              {recentAssessments && recentAssessments.length > 0 ? (
                recentAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium lean-text-secondary">{assessment.title}</p>
                      <p className="text-sm text-gray-500">
                        Created {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={assessment.status === 'active' ? 'default' : 'secondary'}>
                        {assessment.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No assessments created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold lean-text-secondary">Recent Submissions</h3>
            </div>
            <div className="p-6">
              {recentSubmissions && recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium lean-text-secondary">{submission.respondentName}</p>
                      <p className="text-sm text-gray-500">{submission.respondentEmail}</p>
                      <p className="text-xs text-gray-400">
                        Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        submission.status === 'passed' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {submission.score}%
                      </p>
                      <Button variant="link" size="sm" className="lean-text-primary p-0">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No submissions yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
