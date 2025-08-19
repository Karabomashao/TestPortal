import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Assessment, Invitation } from "@shared/schema";

const invitationSchema = z.object({
  assessmentId: z.string().min(1, "Please select an assessment"),
  emails: z.string().min(1, "Please enter at least one email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().optional(),
  sendReminders: z.boolean().default(false),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function Invitations() {
  const { toast } = useToast();

  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: invitations } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations"],
  });

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      assessmentId: "",
      emails: "",
      subject: "You're invited to take an assessment",
      message: "",
      sendReminders: false,
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      // Parse emails from string to array
      const emailArray = data.emails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const invitationData = {
        ...data,
        emails: emailArray,
      };

      return apiRequest("POST", "/api/invitations", invitationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({
        title: "Invitations sent",
        description: "Email invitations have been sent successfully.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvitationFormData) => {
    sendInvitationMutation.mutate(data);
  };

  const activeAssessments = assessments?.filter(a => a.status === 'active') || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold lean-text-secondary">Email Invitations</h2>
        <p className="text-gray-600">Send assessment invitations to respondents</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="assessmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Assessment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an assessment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeAssessments.map((assessment) => (
                          <SelectItem key={assessment.id} value={assessment.id}>
                            {assessment.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Addresses</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter email addresses separated by commas or new lines&#10;john@example.com, sarah@example.com&#10;mike@example.com"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">
                      Separate multiple email addresses with commas or new lines
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Line</FormLabel>
                    <FormControl>
                      <Input placeholder="You're invited to take an assessment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a personal message to include in the invitation email"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="sendReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Send reminder after 3 days
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline">
                  Preview Email
                </Button>
                <Button
                  type="submit"
                  disabled={sendInvitationMutation.isPending}
                  className="lean-bg-primary hover:lean-hover-primary"
                >
                  {sendInvitationMutation.isPending ? "Sending..." : "Send Invitations"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent Invitations */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold lean-text-secondary">Recent Invitations</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations && invitations.length > 0 ? (
                  invitations.map((invitation) => (
                    <TableRow key={invitation.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium lean-text-secondary">
                        {assessments?.find(a => a.id === invitation.assessmentId)?.title || 'Unknown Assessment'}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {typeof invitation.emails === 'string' ? JSON.parse(invitation.emails).length : (Array.isArray(invitation.emails) ? invitation.emails.length : 1)} recipients
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {invitation.sentAt ? new Date(invitation.sentAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {invitation.subject}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="link" size="sm" className="lean-text-primary p-0">
                            Send Reminder
                          </Button>
                          <Button variant="link" size="sm" className="text-blue-600 p-0">
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No invitations sent yet.
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
