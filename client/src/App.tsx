import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import Dashboard from "@/pages/dashboard";
import Assessments from "@/pages/assessments";
import CreateAssessment from "@/pages/create-assessment";
import Results from "@/pages/results";
import Invitations from "@/pages/invitations";
import TakeAssessment from "@/pages/take-assessment";
import PublicAssessment from "@/pages/public-assessment";
import NotFound from "@/pages/not-found";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/take/:id" component={PublicAssessment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="max-w-7xl mx-auto p-6">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/assessments" component={Assessments} />
          <Route path="/create" component={CreateAssessment} />
          <Route path="/results" component={Results} />
          <Route path="/invitations" component={Invitations} />
          <Route path="/admin/take/:id" component={TakeAssessment} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/take/:id" component={PublicAssessment} />
      <Route>
        <AdminRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
