export type TriagePriority = 'EMERGENCY' | 'URGENT' | 'NORMAL' | 'INSUFFICIENT_INFO';

export type TriageState = 
  | 'INTAKE_IN_PROGRESS'
  | 'INTAKE_COMPLETED'
  | 'SAFETY_EVALUATED'
  | 'EMERGENCY_DECLARED'
  | 'AI_ASSESSED'
  | 'ROUTINE_TRIAGED'
  | 'URGENT_TRIAGED'
  | 'CONFLICT_DETECTED'
  | 'INSUFFICIENT_INFO_FLAGGED'
  | 'AWAITING_CLINICIAN_REVIEW'
  | 'CLINICIAN_ACCEPTED'
  | 'CLINICIAN_OVERRIDDEN'
  | 'EMERGENCY_DISPATCHED'
  | 'RESOLVED'
  | 'FAILED';

export type UserRole = 'ROLE_PATIENT' | 'ROLE_CLINICIAN' | 'ROLE_ADMIN' | 'ROLE_EMERGENCY_OPERATOR';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  patientProfileId?: number;
}

export interface PatientCondition {
  id?: number;
  conditionName: string;
  category?: string;
  diagnosedYear?: number;
  notes?: string;
}

export interface PatientAllergy {
  id?: number;
  allergen: string;
  reactionType?: string;
  severityLevel?: string;
  notes?: string;
}

export interface PatientMedication {
  id?: number;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
}

export interface PatientEmergencyContact {
  id?: number;
  contactName: string;
  relationship: string;
  phone: string;
  email?: string;
  primaryContact: boolean;
}

export interface PatientProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  password?: string;
  conditions: PatientCondition[];
  allergies: PatientAllergy[];
  medications: PatientMedication[];
  emergencyContacts: PatientEmergencyContact[];
}

export interface TriageVitals {
  heartRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  spo2?: number;
  respiratoryRate?: number;
  temperatureC?: number;
  bloodGlucose?: number;
  sourceType?: string;
}

export interface SymptomAnswer {
  questionId: string;
  questionText: string;
  responseText: string;
}

export interface DecisionTrace {
  whyText: string;
  whyNotText: string;
  triggeredRuleCode?: string;
  triggeringInputs?: string;
  precedenceResolution?: string;
  clinicalExplanation?: string;
  recommendedNextAction?: string;
  suggestedDepartment?: string;
  riskFactors?: string[];
  missingInformation?: string[];
  evidenceSources?: string[];
  requiresHumanReview: boolean;
}

export interface Doctor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  specialization: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
  activeCasesCount: number;
  active: boolean;
}

export interface TriageSession {
  id: number;
  sessionCode: string;
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  status: TriageState;
  primarySymptom: string;
  durationHours: number;
  severity1To10: number;
  bodyLocation?: string;
  rawSymptomsText?: string;
  deterministicLevel?: TriagePriority;
  aiLevel?: TriagePriority;
  finalPriority: TriagePriority;
  assessmentConfidenceIndicator?: number;
  safetyRuleVersion?: string;
  aiModelVersion?: string;
  assignedClinicianId?: number;
  assignedClinicianName?: string;
  assignedClinicianDepartment?: string;
  assignedClinicianSpecialization?: string;
  vitals?: TriageVitals;
  symptomResponses?: SymptomAnswer[];
  decisionTrace?: DecisionTrace;
  createdAt: string;
  completedAt?: string;
}

export interface ClinicianReview {
  id: number;
  sessionId: number;
  clinicianId: number;
  clinicianName: string;
  actionType: 'ACCEPT' | 'OVERRIDE' | 'ESCALATE' | 'HANDOFF' | 'RESOLVE';
  originalPriority: TriagePriority;
  finalPriority: TriagePriority;
  overrideReason?: string;
  clinicalNotes?: string;
  reviewTimestamp: string;
}

export interface EmergencyIncident {
  id: number;
  incidentCode: string;
  severityLevel: string;
  status: string;
  departmentCode: string;
  dispatchTimestamp: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface EmergencyNotification {
  id: number;
  recipientType: string;
  destination: string;
  channel: string;
  message: string;
  status: string;
  simulatedFlag: boolean;
  sentAt: string;
}

export interface AuditLog {
  id: number;
  sequenceNumber: number;
  correlationId: string;
  timestamp: string;
  actorId?: number;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson: string;
  ipAddress?: string;
  previousRecordHash: string;
  recordHash: string;
}

export interface SafetyTestResult {
  testId: string;
  testName: string;
  category: string;
  scenarioDescription: string;
  expectedOutcome: string;
  actualOutcome: string;
  passed: boolean;
  safetyRuleTriggered?: string;
  notes?: string;
  timestamp: string;
}

export interface SafetySuiteReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRatePercentage: number;
  testResults: SafetyTestResult[];
  executedAt: string;
}

export interface AdminMember {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface HospitalAnalytics {
  totalPatients: number;
  totalClinicians: number;
  totalTriageSessions: number;
  emergencyCases: number;
  urgentCases: number;
  normalCases: number;
  insufficientInfoCases: number;
  activeIncidents: number;
  clinicianOverrides: number;
  clinicianAcceptances: number;
  aiAgreementRatePercentage: number;
  aiEnabled: boolean;
  activeAiProvider: string;
  statusBreakdown: Record<string, number>;
  recentAuditLogs: AuditLog[];
}
