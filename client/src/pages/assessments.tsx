import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Link } from "wouter";
import { Search, Plus, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Assessment } from "@shared/schema";

export default function Assessments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'inactive' : 'active';
      return apiRequest("PATCH", `/api/assessments/${id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Assessment updated",
        description: "Assessment status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update assessment status.",
        variant: "destructive",
      });
    },
  });

  const filteredAssessments = assessments?.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold lean-text-secondary">Assessment Repository</h2>
          <p className="text-gray-600">Manage and view all your assessments</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assessments..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/create">
            <Button className="lean-bg-primary hover:lean-hover-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Limit</TableHead>
                  <TableHead>Passing Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium lean-text-secondary">
                            {assessment.title}
                          </div>
                          {assessment.description && (
                            <div className="text-sm text-gray-500">
                              {assessment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assessment.category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={assessment.status === 'active' ? 'default' : 
                                  assessment.status === 'draft' ? 'secondary' : 'outline'}
                          className={assessment.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {assessment.timeLimit ? `${assessment.timeLimit} min` : "No limit"}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {assessment.passingScore ? `${assessment.passingScore}%` : "No requirement"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="link" size="sm" className="lean-text-primary p-0">
                            Edit
                          </Button>
                          <Button variant="link" size="sm" className="text-blue-600 p-0">
                            Results
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate({
                              id: assessment.id,
                              status: assessment.status
                            })}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {assessment.status === 'active' ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button variant="link" size="sm" className="text-gray-600 p-0">
                            <Link href={`/take/${assessment.id}`} target="_blank">
                              View Link
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {assessments?.length === 0 
                        ? "No assessments created yet. Create your first assessment to get started."
                        : "No assessments match your search criteria."
                      }
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
