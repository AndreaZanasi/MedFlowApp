import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';

interface PatientSummary {
  patient_name: string;
  total_visits: number;
  first_visit_date: string;
  last_visit_date: string;
  demographics?: {
    age?: number;
    gender?: string;
    occupation?: string;
  };
}

interface PatientListViewProps {
  onSelectPatient: (patientName: string) => void;
}

export function PatientListView({ onSelectPatient }: PatientListViewProps) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllPatients();
      console.log('Patients loaded:', response);
      
      if (response.patients) {
        setPatients(response.patients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error loading patients",
        description: error instanceof Error ? error.message : "Failed to load patient list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>No Patients Yet</CardTitle>
          <CardDescription>
            Start a new consultation to create your first patient record.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patient Records</h2>
          <p className="text-muted-foreground">
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'} in the system
          </p>
        </div>
        <Button onClick={loadPatients} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => (
          <Card 
            key={patient.patient_name} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectPatient(patient.patient_name)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{patient.patient_name}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {patient.total_visits} {patient.total_visits === 1 ? 'visit' : 'visits'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {patient.demographics && (
                  <div className="flex gap-3 text-muted-foreground">
                    {patient.demographics.age && (
                      <span>{patient.demographics.age} yrs</span>
                    )}
                    {patient.demographics.gender && (
                      <span>{patient.demographics.gender}</span>
                    )}
                  </div>
                )}
                {patient.demographics?.occupation && (
                  <div className="text-muted-foreground">
                    {patient.demographics.occupation}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">
                    Last visit: {formatDate(patient.last_visit_date)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
