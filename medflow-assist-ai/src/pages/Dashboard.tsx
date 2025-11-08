import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppNavigation from "@/components/app/AppNavigation";
import PatientConsultationDjango from "@/components/app/PatientConsultationDjango";
import ClinicalNotes from "@/components/app/ClinicalNotes";
import TaskQueue from "@/components/app/TaskQueue";
import PatientList from "@/components/app/PatientList";
import { PatientListView } from "@/components/app/PatientListView";
import { PatientDetailsModal } from "@/components/app/PatientDetailsModal";
import DashboardOverview from "@/components/app/DashboardOverview";
import { useAuth } from "@/hooks/useDjangoAuth";
import { Toaster } from "@/components/ui/sonner";

type View = "overview" | "consultation" | "notes" | "tasks" | "patients";

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<View>("consultation");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Comment out auth check for now to allow testing
  // useEffect(() => {
  //   if (!user) {
  //     navigate("/auth");
  //   }
  // }, [user, navigate]);

  const renderView = () => {
    switch (currentView) {
      case "overview":
        return (
          <DashboardOverview 
            onStartConsultation={() => setCurrentView("consultation")} 
          />
        );
      case "consultation":
        return <PatientConsultationDjango />;
      case "notes":
        return <ClinicalNotes />;
      case "tasks":
        return <TaskQueue />;
      case "patients":
        return <PatientListView onSelectPatient={(name) => setSelectedPatient(name)} />;
      default:
        return <PatientConsultationDjango />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation currentView={currentView} onViewChange={setCurrentView} />
      <main className="container mx-auto px-6 py-8">
        {renderView()}
      </main>
      <PatientDetailsModal 
        patientName={selectedPatient}
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
      <Toaster />
    </div>
  );
};

export default Dashboard;
