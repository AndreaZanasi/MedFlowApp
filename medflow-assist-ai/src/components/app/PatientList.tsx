import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Calendar, FileText, Plus, CheckCircle, Clock, Phone, Mail, MapPin } from "lucide-react";

const PatientList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<number>(1);

  const patients = [
    {
      id: 1,
      name: "Emma Wilson",
      age: 48,
      gender: "Female",
      mrn: "EMW-2024-1142",
      lastVisit: "Today, 10:30 AM",
      status: "active",
      notes: 3,
      conditions: ["Hypertension", "Type 2 Diabetes"],
      tasks: { completed: 3, total: 3 },
      phone: "(555) 123-4567",
      email: "emma.wilson@email.com",
      address: "123 Main St, Springfield, IL",
      allergies: ["Penicillin", "Latex"],
      medications: ["Metformin 500mg", "Lisinopril 10mg"],
      vitals: {
        bp: "128/82",
        hr: "72",
        temp: "98.6°F",
        weight: "165 lbs"
      }
    },
    {
      id: 2,
      name: "John Davis",
      age: 62,
      gender: "Male",
      mrn: "JDA-2023-0892",
      lastVisit: "Today, 9:15 AM",
      status: "active",
      notes: 12,
      conditions: ["Hypertension"],
      tasks: { completed: 2, total: 3 },
      phone: "(555) 234-5678",
      email: "john.davis@email.com",
      address: "456 Oak Ave, Springfield, IL",
      allergies: ["None"],
      medications: ["Amlodipine 5mg"],
      vitals: {
        bp: "135/88",
        hr: "68",
        temp: "98.4°F",
        weight: "185 lbs"
      }
    },
    {
      id: 3,
      name: "Sarah Johnson",
      age: 35,
      gender: "Female",
      mrn: "SJO-2024-0234",
      lastVisit: "Yesterday, 3:30 PM",
      status: "active",
      notes: 5,
      conditions: ["Asthma"],
      tasks: { completed: 3, total: 3 },
      phone: "(555) 345-6789",
      email: "sarah.j@email.com",
      address: "789 Pine Rd, Springfield, IL",
      allergies: ["Aspirin"],
      medications: ["Albuterol inhaler"],
      vitals: {
        bp: "118/75",
        hr: "76",
        temp: "98.7°F",
        weight: "142 lbs"
      }
    },
    {
      id: 4,
      name: "Michael Brown",
      age: 45,
      gender: "Male",
      mrn: "MBR-2024-0567",
      lastVisit: "Jan 12, 2:00 PM",
      status: "scheduled",
      notes: 8,
      conditions: ["Back Pain"],
      tasks: { completed: 1, total: 2 },
      phone: "(555) 456-7890",
      email: "m.brown@email.com",
      address: "321 Elm St, Springfield, IL",
      allergies: ["None"],
      medications: ["Ibuprofen 400mg"],
      vitals: {
        bp: "122/78",
        hr: "74",
        temp: "98.5°F",
        weight: "178 lbs"
      }
    },
  ];

  const selected = patients.find(p => p.id === selectedPatient);

  return (
    <div className="flex h-[calc(100vh-88px)] gap-4 animate-fade-in">
      {/* Left Sidebar - Patient List (Email-like) */}
      <Card className="w-96 flex flex-col">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Patients</h2>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                className={`p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                  selectedPatient === patient.id ? "bg-muted border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">{patient.name}</h3>
                      {patient.tasks.completed === patient.tasks.total ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{patient.lastVisit}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {patient.tasks.completed}/{patient.tasks.total} Tasks
                      </Badge>
                      {patient.status === "active" && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Right Section - Patient Details */}
      {selected && (
        <Card className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{selected.name}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                    <span>{selected.age} years • {selected.gender}</span>
                    <span>MRN: {selected.mrn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={selected.status === "active" ? "default" : "secondary"}
                      className={selected.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                    >
                      {selected.status === "active" ? "Active" : "Scheduled"}
                    </Badge>
                    <Badge variant="secondary">
                      {selected.tasks.completed}/{selected.tasks.total} Tasks Complete
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="hero" className="gap-2">
                <Calendar className="h-4 w-4" />
                Start Visit
              </Button>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm text-foreground">{selected.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{selected.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm text-foreground">{selected.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Vitals */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Recent Vitals</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Blood Pressure</p>
                  <p className="text-lg font-semibold text-foreground">{selected.vitals.bp}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Heart Rate</p>
                  <p className="text-lg font-semibold text-foreground">{selected.vitals.hr} bpm</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                  <p className="text-lg font-semibold text-foreground">{selected.vitals.temp}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Weight</p>
                  <p className="text-lg font-semibold text-foreground">{selected.vitals.weight}</p>
                </Card>
              </div>
            </div>

            {/* Active Conditions */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Active Conditions</h2>
              <div className="flex flex-wrap gap-2">
                {selected.conditions.map((condition, idx) => (
                  <Badge key={idx} variant="outline" className="bg-muted/50">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Allergies</h2>
              <div className="flex flex-wrap gap-2">
                {selected.allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Current Medications */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Current Medications</h2>
              <div className="space-y-2">
                {selected.medications.map((medication, idx) => (
                  <Card key={idx} className="p-3">
                    <p className="text-sm text-foreground">{medication}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Notes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">Recent Notes</h2>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View All ({selected.notes})
                </Button>
              </div>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{selected.lastVisit}</p>
                  <Badge variant="secondary" className="text-xs">Dr. Smith</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Patient presents with improved symptoms. Discussed lifestyle modifications and medication adherence. 
                  {selected.conditions.length > 0 && ` Managing ${selected.conditions.join(", ")}.`} Continue current treatment plan.
                </p>
              </Card>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientList;
