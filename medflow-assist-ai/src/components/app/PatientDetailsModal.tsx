import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, FileText, Pill, FlaskConical, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';

interface Visit {
  timestamp: string;
  patient_data?: {
    patient_name?: string;
    age?: number;
    gender?: string;
    occupation?: string;
    chief_complaint?: string;
    personal_info?: {
      full_name?: string;
      age?: number;
      gender?: string;
      occupation?: string;
    };
  };
  soap_note?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  lab_requisition?: {
    request_type?: string;
    message?: string;
    tests?: Array<{
      test_name?: string;
      reason?: string;
      urgency?: string;
    }>;
  };
  pharmacy_requisition?: {
    prescription_details?: {
      prescriptions?: Array<{
        medication_name?: string;
        strength?: string;
        frequency?: string;
        duration?: string;
        instructions?: string;
      }>;
    };
  };
  clinical_data?: {
    medications?: Array<{
      name?: string;
      dosage?: string;
      frequency?: string;
      route?: string;
      duration?: string;
    }>;
  };
}

interface PatientDetailsModalProps {
  patientName: string | null;
  open: boolean;
  onClose: () => void;
}

export function PatientDetailsModal({ patientName, open, onClose }: PatientDetailsModalProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && patientName) {
      loadPatientVisits();
    }
  }, [open, patientName]);

  const loadPatientVisits = async () => {
    if (!patientName) return;

    try {
      setLoading(true);
      const response = await apiService.getPatientVisits(patientName);
      console.log('Patient visits loaded:', response);
      
      if (response.visits) {
        // Sort visits by timestamp, most recent first
        const sortedVisits = response.visits.sort((a: Visit, b: Visit) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setVisits(sortedVisits);
      }
    } catch (error) {
      console.error('Error loading patient visits:', error);
      toast({
        title: "Error loading visits",
        description: error instanceof Error ? error.message : "Failed to load patient visits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {patientName}
          </DialogTitle>
          <DialogDescription>
            Complete visit history and medical records
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No visits found for this patient.
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {visits.map((visit, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Visit {visits.length - index}
                      </CardTitle>
                      <Badge variant="outline">
                        {formatDate(visit.timestamp)}
                      </Badge>
                    </div>
                    {visit.patient_data?.chief_complaint && (
                      <CardDescription className="mt-2">
                        <strong>Chief Complaint:</strong> {visit.patient_data.chief_complaint}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="soap" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="soap">
                          <FileText className="h-4 w-4 mr-2" />
                          SOAP
                        </TabsTrigger>
                        <TabsTrigger value="patient">
                          <User className="h-4 w-4 mr-2" />
                          Patient
                        </TabsTrigger>
                        <TabsTrigger value="labs">
                          <FlaskConical className="h-4 w-4 mr-2" />
                          Labs
                        </TabsTrigger>
                        <TabsTrigger value="meds">
                          <Pill className="h-4 w-4 mr-2" />
                          Meds
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="soap" className="space-y-4 mt-4">
                        {visit.soap_note ? (
                          <>
                            {visit.soap_note.subjective && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Subjective</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {visit.soap_note.subjective}
                                </p>
                              </div>
                            )}
                            {visit.soap_note.objective && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Objective</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {visit.soap_note.objective}
                                </p>
                              </div>
                            )}
                            {visit.soap_note.assessment && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Assessment</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {visit.soap_note.assessment}
                                </p>
                              </div>
                            )}
                            {visit.soap_note.plan && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Plan</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {visit.soap_note.plan}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No SOAP note available</p>
                        )}
                      </TabsContent>

                      <TabsContent value="patient" className="space-y-2 mt-4">
                        {visit.patient_data ? (
                          <div className="grid grid-cols-2 gap-4">
                            {(visit.patient_data.age || visit.patient_data.personal_info?.age) && (
                              <div>
                                <span className="text-sm font-semibold">Age:</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {visit.patient_data.age || visit.patient_data.personal_info?.age} years
                                </span>
                              </div>
                            )}
                            {(visit.patient_data.gender || visit.patient_data.personal_info?.gender) && (
                              <div>
                                <span className="text-sm font-semibold">Gender:</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {visit.patient_data.gender || visit.patient_data.personal_info?.gender}
                                </span>
                              </div>
                            )}
                            {(visit.patient_data.occupation || visit.patient_data.personal_info?.occupation) && (
                              <div>
                                <span className="text-sm font-semibold">Occupation:</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {visit.patient_data.occupation || visit.patient_data.personal_info?.occupation}
                                </span>
                              </div>
                            )}
                            {visit.patient_data.chief_complaint && (
                              <div className="col-span-2">
                                <span className="text-sm font-semibold">Chief Complaint:</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {visit.patient_data.chief_complaint}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No patient data available</p>
                        )}
                      </TabsContent>

                      <TabsContent value="labs" className="mt-4">
                        {visit.lab_requisition?.tests && visit.lab_requisition.tests.length > 0 ? (
                          <div className="space-y-3">
                            {visit.lab_requisition.tests.map((lab, idx) => (
                              <Card key={idx}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="font-semibold text-sm">{lab.test_name || 'Lab Test'}</h5>
                                      {lab.reason && (
                                        <p className="text-sm text-muted-foreground mt-1">{lab.reason}</p>
                                      )}
                                    </div>
                                    {lab.urgency && (
                                      <Badge variant={lab.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                                        {lab.urgency}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : visit.lab_requisition?.message ? (
                          <div className="text-center py-6">
                            <p className="text-sm text-muted-foreground">{visit.lab_requisition.message}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No lab requests</p>
                        )}
                      </TabsContent>

                      <TabsContent value="meds" className="mt-4">
                        {(() => {
                          // Get prescriptions from pharmacy_requisition
                          const prescriptions = visit.pharmacy_requisition?.prescription_details?.prescriptions || [];
                          // Get medications from clinical_data as fallback
                          const clinicalMeds = visit.clinical_data?.medications || [];
                          
                          const allMeds = prescriptions.length > 0 ? prescriptions : clinicalMeds;
                          
                          if (allMeds.length > 0) {
                            return (
                              <div className="space-y-3">
                                {allMeds.map((med: any, idx: number) => (
                                  <Card key={idx}>
                                    <CardContent className="pt-4">
                                      <h5 className="font-semibold text-sm">
                                        {med.medication_name || med.name || 'Medication'}
                                      </h5>
                                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                                        {(med.strength || med.dosage) && (
                                          <div>
                                            <strong>Dosage:</strong> {med.strength || med.dosage}
                                          </div>
                                        )}
                                        {med.frequency && (
                                          <div>
                                            <strong>Frequency:</strong> {med.frequency}
                                          </div>
                                        )}
                                        {med.duration && (
                                          <div>
                                            <strong>Duration:</strong> {med.duration}
                                          </div>
                                        )}
                                        {med.route && (
                                          <div>
                                            <strong>Route:</strong> {med.route}
                                          </div>
                                        )}
                                      </div>
                                      {med.instructions && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                          <strong>Instructions:</strong> {med.instructions}
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            );
                          }
                          
                          return <p className="text-sm text-muted-foreground">No prescriptions</p>;
                        })()}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
