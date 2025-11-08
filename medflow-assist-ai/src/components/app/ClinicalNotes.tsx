import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Download, Calendar, User, Phone, Heart, Activity, Pill, AlertTriangle, Loader2, Edit2, Save, X } from "lucide-react";
import { apiService } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

interface Visit {
  timestamp: string;
  visit_id?: string;
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
}

interface StoredNote {
  id: string;
  visitId: string;
  patientName: string;
  patientMRN: string;
  demographics?: any;
  date: string;
  transcript: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  chiefComplaint?: string;
}

const ClinicalNotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedNote, setEditedNote] = useState<StoredNote | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNotesFromAPI();
  }, []);

  const loadNotesFromAPI = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllPatients();
      
      if (response.patients) {
        // Fetch all visits for each patient
        const allNotes: StoredNote[] = [];
        
        for (const patient of response.patients) {
          const visitsResponse = await apiService.getPatientVisits(patient.patient_name);
          
          if (visitsResponse.visits) {
            visitsResponse.visits.forEach((visit: Visit, index: number) => {
              // Extract demographics from either top level or personal_info
              const personalInfo = visit.patient_data?.personal_info;
              const demographics = {
                age: visit.patient_data?.age || personalInfo?.age,
                gender: visit.patient_data?.gender || personalInfo?.gender,
                occupation: visit.patient_data?.occupation || personalInfo?.occupation,
              };
              
              allNotes.push({
                id: `${patient.patient_name}-${visit.timestamp}`,
                visitId: visit.visit_id || '',
                patientName: visit.patient_data?.patient_name || personalInfo?.full_name || patient.patient_name,
                patientMRN: patient.patient_name.replace(/\s+/g, '-').toUpperCase(),
                demographics,
                date: visit.timestamp,
                transcript: '',
                subjective: visit.soap_note?.subjective || 'No subjective data',
                objective: visit.soap_note?.objective || 'No objective data',
                assessment: visit.soap_note?.assessment || 'No assessment',
                plan: visit.soap_note?.plan || 'No plan',
                chiefComplaint: visit.patient_data?.chief_complaint || 'Not specified',
              });
            });
          }
        }
        
        // Sort by date, most recent first
        allNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setNotes(allNotes);
        if (allNotes.length > 0 && !selectedNoteId) {
          setSelectedNoteId(allNotes[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error loading clinical notes",
        description: error instanceof Error ? error.message : "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.patientMRN.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditClick = () => {
    if (selectedNote) {
      setEditedNote({ ...selectedNote });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedNote(null);
  };

  const handleSaveEdit = async () => {
    if (!editedNote) return;

    try {
      setIsSaving(true);
      
      // Use the visit_id stored in the note
      const patientName = editedNote.patientName;
      const visitId = editedNote.visitId;
      
      if (!visitId) {
        toast({
          title: "Error",
          description: "Visit ID not found. Cannot update this note.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      console.log('Updating visit:', { patientName, visitId });
      
      // Prepare update data
      const updateData = {
        soap_note: {
          subjective: editedNote.subjective,
          objective: editedNote.objective,
          assessment: editedNote.assessment,
          plan: editedNote.plan,
        },
        patient_data: {
          patient_name: editedNote.patientName,
          chief_complaint: editedNote.chiefComplaint,
          ...editedNote.demographics,
        }
      };

      await apiService.updatePatientVisit(patientName, visitId, updateData);

      // Update local state
      setNotes(notes.map(note => 
        note.id === editedNote.id ? editedNote : note
      ));

      toast({
        title: "Changes saved",
        description: "Clinical note has been updated successfully.",
      });

      setIsEditing(false);
      setEditedNote(null);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error saving changes",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof StoredNote, value: string) => {
    if (editedNote) {
      setEditedNote({ ...editedNote, [field]: value });
    }
  };

  const displayNote = isEditing && editedNote ? editedNote : selectedNote;

  return (
    <div className="flex h-[calc(100vh-88px)] gap-4 animate-fade-in">
      {/* Left Sidebar - Notes List (Email-like) */}
      <Card className="w-96 flex flex-col">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Clinical Notes</h2>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadNotesFromAPI}>
              <Download className="h-3 w-3" />
              Refresh
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">All ({notes.length})</Button>
            <Button variant="ghost" size="sm">SOAP</Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                      selectedNoteId === note.id ? "bg-muted border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{note.patientName}</h3>
                        <Badge 
                          variant="default"
                          className="text-xs bg-green-500/10 text-green-500 border-green-500/20"
                        >
                          Completed
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(note.date)}</span>
                      </div>
                      
                      {note.chiefComplaint && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {note.chiefComplaint}
                        </p>
                      )}
                      
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        SOAP Note
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {searchQuery 
                    ? "No notes found matching your search."
                    : "No notes yet. Complete a consultation to create your first note."}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Right Section - Note Content */}
      {displayNote ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-8 max-w-5xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-1">{displayNote.patientName}</h1>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Clinical Note
                        </Badge>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          ✓ Completed
                        </Badge>
                        {isEditing && (
                          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                            Editing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" className="gap-2" onClick={handleEditClick}>
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="gap-2" onClick={handleCancelEdit} disabled={isSaving}>
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button className="gap-2" onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Patient Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Patient Information
                </h2>
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-background">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Medical Record Number</p>
                      <p className="text-sm font-semibold text-foreground">{displayNote.patientMRN}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Visit Date
                      </p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(displayNote.date)}</p>
                    </div>
                    {displayNote.demographics?.age && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Age</p>
                        <p className="text-sm font-semibold text-foreground">{displayNote.demographics.age} years</p>
                      </div>
                    )}
                    {displayNote.demographics?.gender && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gender</p>
                        <p className="text-sm font-semibold text-foreground">{displayNote.demographics.gender}</p>
                      </div>
                    )}
                    {displayNote.demographics?.occupation && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Occupation</p>
                        <p className="text-sm font-semibold text-foreground">{displayNote.demographics.occupation}</p>
                      </div>
                    )}
                    {displayNote.chiefComplaint && (
                      <div className="space-y-1 col-span-2 md:col-span-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chief Complaint</p>
                        <p className="text-sm font-semibold text-foreground">{displayNote.chiefComplaint}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Medical History & Alerts */}
              {displayNote.demographics && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Medical History & Alerts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayNote.demographics.allergies && (
                      <Card className="p-4 border-l-4 border-l-yellow-500 bg-yellow-500/5">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Allergies</p>
                            <p className="text-sm text-muted-foreground">{displayNote.demographics.allergies}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                    
                    {(displayNote.demographics.diabetes === "Yes" || displayNote.demographics.hypertension === "Yes" || displayNote.demographics.smoker !== "No") && (
                      <Card className="p-4 border-l-4 border-l-red-500 bg-red-500/5">
                        <div className="flex items-start gap-3">
                          <Activity className="h-5 w-5 text-red-500 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Chronic Conditions</p>
                            <div className="space-y-1">
                              {displayNote.demographics.diabetes === "Yes" && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 mr-2">
                                  Diabetes
                                </Badge>
                              )}
                              {displayNote.demographics.hypertension === "Yes" && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 mr-2">
                                  Hypertension
                                </Badge>
                              )}
                              {displayNote.demographics.smoker && displayNote.demographics.smoker !== "No" && (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                  Smoker: {displayNote.demographics.smoker}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Clinical Documentation */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Clinical Documentation
                </h2>

                {/* Subjective - Chief Complaint & History */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Subjective</h3>
                      <p className="text-xs text-muted-foreground">Patient-reported symptoms, history, and concerns</p>
                    </div>
                  </div>
                  <Card className="p-6 bg-gradient-to-br from-blue-500/5 via-background to-background border-l-4 border-l-blue-500">
                    {isEditing ? (
                      <Textarea
                        value={editedNote?.subjective || ''}
                        onChange={(e) => handleFieldChange('subjective', e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Enter subjective findings..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        <p className="text-sm text-foreground">{displayNote.subjective}</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Objective - Physical Exam & Findings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Objective</h3>
                      <p className="text-xs text-muted-foreground">Objective clinical observations and measurements</p>
                    </div>
                  </div>
                  <Card className="p-6 bg-gradient-to-br from-purple-500/5 via-background to-background border-l-4 border-l-purple-500">
                    {isEditing ? (
                      <Textarea
                        value={editedNote?.objective || ''}
                        onChange={(e) => handleFieldChange('objective', e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Enter objective findings..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        <p className="text-sm text-foreground">{displayNote.objective}</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Assessment - Diagnosis */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Assessment</h3>
                      <p className="text-xs text-muted-foreground">Medical evaluation and diagnostic conclusions</p>
                    </div>
                  </div>
                  <Card className="p-6 bg-gradient-to-br from-orange-500/5 via-background to-background border-l-4 border-l-orange-500">
                    {isEditing ? (
                      <Textarea
                        value={editedNote?.assessment || ''}
                        onChange={(e) => handleFieldChange('assessment', e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
                        placeholder="Enter assessment..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        <p className="text-sm text-foreground">{displayNote.assessment}</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Plan - Treatment Plan */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Plan</h3>
                      <p className="text-xs text-muted-foreground">Recommended treatments, medications, and next steps</p>
                    </div>
                  </div>
                  <Card className="p-6 bg-gradient-to-br from-green-500/5 via-background to-background border-l-4 border-l-green-500">
                    {isEditing ? (
                      <Textarea
                        value={editedNote?.plan || ''}
                        onChange={(e) => handleFieldChange('plan', e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
                        placeholder="Enter treatment plan..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        <p className="text-sm text-foreground">{displayNote.plan}</p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            {notes.length === 0 
              ? "No clinical notes yet. Complete a consultation to create your first note."
              : "Select a note from the list to view details"}
          </p>
        </Card>
      )}
    </div>
  );
};

export default ClinicalNotes;
