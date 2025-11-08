import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Pill, FileText, UserPlus, Clock, CheckCircle2 } from "lucide-react";

const TaskQueue = () => {
  const tasks = {
    pending: [
      {
        id: 1,
        type: "Lab Order",
        icon: FlaskConical,
        patient: "Emma Wilson",
        description: "CBC, Lipid Panel, Troponin levels",
        priority: "high",
        time: "10 mins ago",
      },
      {
        id: 2,
        type: "Prescription",
        icon: Pill,
        patient: "John Davis",
        description: "Lisinopril 10mg - Refill for 90 days",
        priority: "medium",
        time: "25 mins ago",
      },
      {
        id: 3,
        type: "Referral",
        icon: UserPlus,
        patient: "Emma Wilson",
        description: "Cardiology consultation - Dr. James Chen",
        priority: "high",
        time: "30 mins ago",
      },
    ],
    inProgress: [
      {
        id: 4,
        type: "Lab Results",
        icon: FlaskConical,
        patient: "Sarah Johnson",
        description: "Review CBC results and notify patient",
        priority: "medium",
        time: "1 hour ago",
      },
    ],
    completed: [
      {
        id: 5,
        type: "Prescription",
        icon: Pill,
        patient: "Michael Brown",
        description: "Amoxicillin 500mg sent to pharmacy",
        priority: "low",
        time: "2 hours ago",
      },
      {
        id: 6,
        type: "Follow-up",
        icon: FileText,
        patient: "Lisa Anderson",
        description: "2-week follow-up scheduled",
        priority: "low",
        time: "3 hours ago",
      },
    ],
  };

  const TaskCard = ({ task, showActions = true }: { task: any; showActions?: boolean }) => (
    <Card className="p-5 hover:shadow-elevated transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${
          task.priority === "high" ? "bg-orange-500/10 text-orange-500" :
          task.priority === "medium" ? "bg-primary/10 text-primary" :
          "bg-muted text-muted-foreground"
        }`}>
          <task.icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{task.type}</h3>
            <Badge 
              variant="outline"
              className={
                task.priority === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                task.priority === "medium" ? "bg-primary/10 text-primary border-primary/20" :
                "bg-muted text-muted-foreground"
              }
            >
              {task.priority}
            </Badge>
          </div>
          
          <p className="text-sm font-medium text-foreground">{task.patient}</p>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock className="h-3 w-3" />
            {task.time}
          </div>
        </div>
        
        {showActions && (
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="default">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tasks & Workflows</h1>
        <p className="text-muted-foreground">Automated tasks from consultations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Tasks</p>
              <p className="text-3xl font-bold text-foreground">{tasks.pending.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-3xl font-bold text-foreground">{tasks.inProgress.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
              <p className="text-3xl font-bold text-foreground">{tasks.completed.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({tasks.pending.length})
          </TabsTrigger>
          <TabsTrigger value="inProgress">
            In Progress ({tasks.inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({tasks.completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {tasks.pending.map((task, index) => (
            <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <TaskCard task={task} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="inProgress" className="space-y-4">
          {tasks.inProgress.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tasks.completed.map((task, index) => (
            <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <TaskCard task={task} showActions={false} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskQueue;
