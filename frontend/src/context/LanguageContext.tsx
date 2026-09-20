import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const dictionary: Translations = {
  // Brand & Nav
  appName: { en: 'MediTriage', hi: 'मेडीट्राइएज' },
  appTagline: { en: 'Clinical Triage & Decision Support', hi: 'नैदानिक ट्राइएज और निर्णय समर्थन' },
  aiPlusSafety: { en: 'AI + Safety', hi: 'एआई + सुरक्षा' },
  patientDashboard: { en: 'Patient Portal', hi: 'रोगी पोर्टल' },
  startTriage: { en: 'Start Triage Assessment', hi: 'ट्राइएज मूल्यांकन शुरू करें' },
  clinicianQueue: { en: 'Clinician Live Queue', hi: 'चिकित्सक लाइव कतार' },
  adminAnalytics: { en: 'Hospital Administration', hi: 'अस्पताल प्रशासन' },
  safetySuite: { en: 'Safety Benchmark Suite', hi: 'सुरक्षा बेंचमार्क सूट' },
  emergency: { en: 'Emergency', hi: 'आपातकालीन' },
  demoSwitcher: { en: 'Demo Switcher', hi: 'डेमो स्विचर' },
  liveSync: { en: 'Live Sync', hi: 'लाइव सिंक' },
  connecting: { en: 'Connecting', hi: 'कनेक्ट हो रहा है' },
  signIn: { en: 'Sign In', hi: 'साइन इन करें' },
  logOut: { en: 'Log Out', hi: 'लॉग आउट' },
  patientRole: { en: 'Patient', hi: 'रोगी' },
  clinicianRole: { en: 'Clinician / Doctor', hi: 'चिकित्सक / डॉक्टर' },
  adminRole: { en: 'Administrator', hi: 'प्रशासक' },

  // Disclaimers & Safety
  disclaimerText: { 
    en: 'Medical Disclaimer: This platform provides clinical triage decision-support and risk stratification assistance. It does NOT provide definitive medical diagnoses or replace licensed physician consultation. If you are experiencing a life-threatening emergency, call 112 / 108 immediately.',
    hi: 'चिकित्सा अस्वीकरण: यह मंच नैदानिक ट्राइएज निर्णय-समर्थन और जोखिम स्तरीकरण सहायता प्रदान करता है। यह निश्चित चिकित्सा निदान प्रदान नहीं करता है या लाइसेंस प्राप्त चिकित्सक परामर्श को प्रतिस्थापित नहीं करता है। यदि आप जीवन-धमकाने वाली आपात स्थिति का सामना कर रहे हैं, तो तुरंत 112 / 108 पर कॉल करें।'
  },
  safetyPolicyLink: { en: 'Safety & Limitations Policy', hi: 'सुरक्षा और सीमाएं नीति' },
  apiDocs: { en: 'API Docs (OpenAPI)', hi: 'एपीआई डॉक्स' },

  // Wizard Steps
  stepOf: { en: 'Step', hi: 'चरण' },
  of: { en: 'of', hi: 'का' },
  step1Title: { en: 'Consent & Notice', hi: 'सहमति और सूचना' },
  step2Title: { en: 'Symptom Intake', hi: 'लक्षण प्रविष्टि' },
  step3Title: { en: 'Adaptive Questions', hi: 'अनुकूली प्रश्न' },
  step4Title: { en: 'Vitals & Sanity Check', hi: 'महत्वपूर्ण संकेत व जांच' },
  step5Title: { en: 'Triage Assessment', hi: 'ट्राइएज मूल्यांकन परिणाम' },

  // Step 1: Consent
  informedConsentTitle: { en: 'Informed Triage Consent', hi: 'सूचित ट्राइएज सहमति' },
  informedConsentSubtitle: { en: 'Clinical Data Processing Acknowledgement', hi: 'नैदानिक डेटा प्रसंस्करण पावती' },
  consentIntro: { en: 'Please read carefully before starting the triage evaluation:', hi: 'ट्राइएज मूल्यांकन शुरू करने से पहले कृपया ध्यान से पढ़ें:' },
  consentPoint1Title: { en: 'Clinical Decision Support:', hi: 'नैदानिक निर्णय समर्थन:' },
  consentPoint1Text: { en: 'This platform uses a combination of deterministic safety rules and AI clinical reasoning to categorize your urgency level.', hi: 'यह प्लेटफ़ॉर्म आपके तात्कालिकता स्तर को वर्गीकृत करने के लिए निर्धारक सुरक्षा नियमों और एआई नैदानिक तर्क के संयोजन का उपयोग करता है।' },
  consentPoint2Title: { en: 'Not a Substitute for Doctors:', hi: 'डॉक्टरों का विकल्प नहीं:' },
  consentPoint2Text: { en: 'This tool provides triage prioritization and risk indicators. It does NOT provide definitive diagnoses or prescribe treatments.', hi: 'यह उपकरण ट्राइएज प्राथमिकता और जोखिम संकेतक प्रदान करता है। यह निश्चित निदान प्रदान नहीं करता है या उपचार नहीं लिखता है।' },
  consentPoint3Title: { en: 'Emergency Priority:', hi: 'आपातकालीन प्राथमिकता:' },
  consentPoint3Text: { en: 'If you are experiencing sudden severe chest pain, inability to breathe, stroke signs, or severe trauma, seek immediate emergency care (Call 112 / 108).', hi: 'यदि आप अचानक गंभीर सीने में दर्द, सांस लेने में असमर्थता, स्ट्रोक के लक्षण, या गंभीर आघात का सामना कर रहे हैं, तो तुरंत आपातकालीन देखभाल लें (112/108 पर कॉल करें)।' },
  consentPoint4Title: { en: 'Audit & Security:', hi: 'ऑडिट और सुरक्षा:' },
  consentPoint4Text: { en: 'All session records and triage logs are securely stored in an append-only clinical audit log.', hi: 'सभी सत्र रिकॉर्ड और ट्राइएज लॉग सुरक्षित रूप से एक अपरिवर्तनीय नैदानिक ऑडिट लॉग में संग्रहीत किए जाते हैं।' },
  consentCheckbox: { 
    en: 'I understand that this is an AI-assisted clinical triage tool, and I consent to the processing of my reported symptoms and vital signs for risk stratification.',
    hi: 'मैं समझता/समझती हूँ कि यह एक एआई-सहायता प्राप्त नैदानिक ट्राइएज उपकरण है, और मैं जोखिम स्तरीकरण के लिए अपने रिपोर्ट किए गए लक्षणों और महत्वपूर्ण संकेतों के प्रसंस्करण के लिए सहमति देता/देती हूँ।'
  },
  continueToSymptoms: { en: 'Continue to Symptoms', hi: 'लक्षणों की ओर आगे बढ़ें' },

  // Step 2: Symptom Intake
  symptomHeaderTitle: { en: 'What is bothering you today?', hi: 'आज आपको क्या समस्या हो रही है?' },
  symptomHeaderSubtitle: { en: 'Primary chief complaint and severity', hi: 'प्राथमिक मुख्य शिकायत और गंभीरता' },
  voiceInputTitle: { en: 'Voice Symptom Input', hi: 'आवाज द्वारा लक्षण दर्ज करें' },
  voiceInputDesc: { en: 'Press the microphone to describe how you are feeling in natural language. You can review and edit before saving.', hi: 'प्राकृतिक भाषा में अपनी स्थिति का वर्णन करने के लिए माइक्रोफ़ोन दबाएं। आप सहेजने से पहले समीक्षा और संपादन कर सकते हैं।' },
  recordSymptoms: { en: 'Record Symptoms', hi: 'लक्षण रिकॉर्ड करें' },
  stopAndProcess: { en: 'Stop & Process', hi: 'रोकें और संसाधित करें' },
  listening: { en: 'Listening... Speak your symptoms', hi: 'सुन रहा हूँ... अपने लक्षण बताएं' },
  confirmVoice: { en: 'Confirm Extracted Symptoms', hi: 'निकाले गए लक्षणों की पुष्टि करें' },
  confirmVoiceSubtitle: { en: 'Please verify that the extracted symptom description accurately reflects your condition before continuing.', hi: 'कृपया जारी रखने से पहले सत्यापित करें कि निकाला गया लक्षण विवरण आपकी स्थिति को सटीक रूप से दर्शाता है।' },
  identifiedChiefComplaint: { en: 'Identified Chief Complaint', hi: 'पहचानी गई मुख्य शिकायत' },
  fullTranscribedNarrative: { en: 'Full Transcribed Narrative', hi: 'पूर्ण ट्रांसक्राइब किया गया विवरण' },
  applyToTriage: { en: 'Apply to Triage Form', hi: 'ट्राइएज फॉर्म में लागू करें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  primarySymptomLabel: { en: 'Primary Chief Complaint / Symptom', hi: 'प्राथमिक मुख्य शिकायत / लक्षण' },
  primarySymptomPlaceholder: { en: 'e.g. Chest pain, Abdominal discomfort, Severe headache...', hi: 'उदा. सीने में दर्द, पेट में तकलीफ, तेज सिरदर्द...' },
  bodyLocationLabel: { en: 'Body Location', hi: 'शरीर का स्थान' },
  locChest: { en: 'Chest / Cardiovascular', hi: 'छाती / हृदय संबंधी' },
  locAbdomen: { en: 'Abdomen / Stomach / GI', hi: 'पेट / जठरांत्र' },
  locHead: { en: 'Head / Neurological', hi: 'सिर / न्यूरोलॉजिकल' },
  locThroat: { en: 'Throat / Respiratory', hi: 'गला / श्वसन' },
  locMusculo: { en: 'Arms / Legs / Back', hi: 'हाथ / पैर / पीठ' },
  locSystemic: { en: 'Systemic / Generalized Fever', hi: 'प्रणालीगत / सामान्यीकृत बुखार' },
  durationLabel: { en: 'Duration (in hours)', hi: 'अवधि (घंटों में)' },
  severityLabel: { en: 'Pain / Discomfort Severity (1 to 10 Scale)', hi: 'दर्द / परेशानी की गंभीरता (1 से 10 का पैमाना)' },
  level: { en: 'Level', hi: 'स्तर' },
  mildDiscomfort: { en: '1 (Mild Discomfort)', hi: '1 (हल्की परेशानी)' },
  moderatePain: { en: '5 (Moderate Pain)', hi: '5 (मध्यम दर्द)' },
  severePain: { en: '10 (Severe / Intolerable)', hi: '10 (अत्यधिक / असहनीय)' },
  detailedNarrativeLabel: { en: 'Detailed Narrative / Associated Symptoms', hi: 'विस्तृत विवरण / जुड़े लक्षण' },
  detailedNarrativePlaceholder: { en: 'Describe when it started, how it feels, radiation to other areas, nausea, dizziness...', hi: 'बताएं कि यह कब शुरू हुआ, कैसा महसूस होता है, अन्य क्षेत्रों में फैलाव, मतली, चक्कर आदि...' },
  back: { en: 'Back', hi: 'पीछे' },
  nextAdaptiveQs: { en: 'Next: Adaptive Questions', hi: 'अगला: अनुकूली प्रश्न' },

  // Step 3: Adaptive Questions
  followUpQuestionsTitle: { en: 'Clinical Follow-up Questions', hi: 'नैदानिक अनुवर्ती प्रश्न' },
  followUpQuestionsSubtitle: { en: 'Tailored dynamically based on your chief complaint', hi: 'आपकी मुख्य शिकायत के आधार पर गतिशील रूप से तैयार किया गया' },
  safetyCritical: { en: 'Safety Critical', hi: 'सुरक्षा महत्वपूर्ण' },
  nextVitals: { en: 'Next: Vital Signs', hi: 'अगला: महत्वपूर्ण संकेत' },

  // Step 4: Vitals
  vitalsTitle: { en: 'Record Vital Signs (Optional)', hi: 'महत्वपूर्ण संकेत दर्ज करें (वैकल्पिक)' },
  vitalsSubtitle: { en: 'If available, enter your measurements. Physiological limits are strictly validated.', hi: 'यदि उपलब्ध हो, तो अपने माप दर्ज करें। शारीरिक सीमाओं को सख्ती से मान्य किया जाता है।' },
  heartRate: { en: 'Heart Rate (bpm)', hi: 'हृदय गति (bpm)' },
  bloodPressure: { en: 'BP (Systolic / Diastolic)', hi: 'रक्तचाप (सिस्टोलिक / डायस्टोलिक)' },
  spo2: { en: 'Oxygen Saturation SpO2 (%)', hi: 'ऑक्सीजन संतृप्ति SpO2 (%)' },
  respRate: { en: 'Resp Rate (breaths/min)', hi: 'श्वसन दर (सांसें/मिनट)' },
  temperature: { en: 'Temperature (°Celsius)', hi: 'तापमान (°सेल्सियस)' },
  glucose: { en: 'Blood Glucose (mg/dL)', hi: 'रक्त शर्करा (mg/dL)' },
  evaluatingSafetyAi: { en: 'Evaluating Safety & AI...', hi: 'सुरक्षा और एआई का मूल्यांकन जारी है...' },
  submitTriageBtn: { en: 'Submit Triage Assessment', hi: 'ट्राइएज मूल्यांकन सबमिट करें' },

  // Step 5: Triage Results & Decision Trace
  designatedPriority: { en: 'Designated Clinical Priority', hi: 'निर्धारित नैदानिक प्राथमिकता' },
  caseRef: { en: 'Case Reference:', hi: 'केस संदर्भ:' },
  assessmentConfidenceInd: { en: 'Assessment Confidence Indicator:', hi: 'मूल्यांकन विश्वास संकेतक:' },
  aiSystemHeuristic: { en: '(AI/System Heuristic)', hi: '(एआई/सिस्टम अनुमान)' },
  decisionTraceability: { en: 'Decision Traceability & Explainability', hi: 'निर्णय पता लगाने की क्षमता और व्याख्या' },
  whyAssigned: { en: 'Why this priority was assigned:', hi: 'यह प्राथमिकता क्यों निर्धारित की गई:' },
  whyNotAssigned: { en: 'Why other priorities were excluded:', hi: 'अन्य प्राथमिकताओं को क्यों बाहर रखा गया:' },
  safetyRuleTriggered: { en: 'Deterministic Safety Rule Triggered:', hi: 'सक्रिय निर्धारक सुरक्षा नियम:' },
  safetyRuleVersion: { en: 'Safety Rule Version:', hi: 'सुरक्षा नियम संस्करण:' },
  nextActionTitle: { en: 'Recommended Next Action:', hi: 'अनुशंसित अगला कदम:' },
  startAnotherTriage: { en: 'Start Another Triage', hi: 'अन्य ट्राइएज शुरू करें' },
  goToDashboard: { en: 'Go to Patient Dashboard', hi: 'रोगी डैशबोर्ड पर जाएं' },

  // Dashboard & Navigation
  welcome: { en: 'Welcome,', hi: 'स्वागत है,' },
  welcomeBack: { en: 'Welcome back,', hi: 'वापसी पर स्वागत है,' },
  gender: { en: 'Gender', hi: 'लिंग' },
  selectGender: { en: 'Select Gender', hi: 'लिंग चुनें' },
  genderMale: { en: 'Male', hi: 'पुरुष' },
  genderFemale: { en: 'Female', hi: 'महिला' },
  genderOther: { en: 'Other', hi: 'अन्य' },
  genderPreferNot: { en: 'Prefer not to say', hi: 'बताना नहीं चाहते' },
  patientHealthPortal: { en: 'Patient Health & Triage Portal', hi: 'रोगी स्वास्थ्य और ट्राइएज पोर्टल' },
  startNewTriage: { en: 'Start New Triage', hi: 'नया ट्राइएज शुरू करें' },
  dashboardDesc: { en: 'Check symptoms safely, review your clinical triage history, or manage your emergency contacts and medical profile.', hi: 'सुरक्षित रूप से लक्षणों की जांच करें, अपने नैदानिक ट्राइएज इतिहास की समीक्षा करें, या अपने आपातकालीन संपर्कों और मेडिकल प्रोफ़ाइल का प्रबंधन करें।' },
  triageTimeline: { en: 'Patient Risk History & Triage Timeline', hi: 'रोगी जोखिम इतिहास और ट्राइएज समयरेखा' },
  noTriageRecords: { en: 'No previous triage sessions on record. Start your first triage intake above.', hi: 'रिकॉर्ड पर कोई पिछला ट्राइएज सत्र नहीं है। ऊपर अपना पहला ट्राइएज शुरू करें।' },
  medicalProfileSummary: { en: 'Medical Profile', hi: 'मेडिकल प्रोफ़ाइल' },
  manage: { en: 'Manage', hi: 'प्रबंधन करें' },
  bloodGroup: { en: 'Blood Group', hi: 'रक्त समूह' },
  knownConditions: { en: 'Known Conditions', hi: 'ज्ञात स्थितियां' },
  allergies: { en: 'Allergies', hi: 'एलर्जी' },
  emergencyContact: { en: 'Emergency Contact', hi: 'आपातकालीन संपर्क' },
  notSpecified: { en: 'Not specified', hi: 'उल्लेखित नहीं है' },
  noneDocumented: { en: 'None documented', hi: 'कोई दर्ज नहीं है' },
  noAllergies: { en: 'No known allergies', hi: 'कोई ज्ञात एलर्जी नहीं' },
  noneConfigured: { en: 'None configured', hi: 'कोई कॉन्फ़िगर नहीं' },
  privacyAndMyData: { en: 'Privacy & "My Data"', hi: 'गोपनीयता और "मेरा डेटा"' },
  privacyCardDesc: { en: 'Inspect who accessed your medical records, review consent timestamps, and view your cryptographic audit history.', hi: 'जांचें कि आपके मेडिकल रिकॉर्ड तक किसने पहुंच बनाई, सहमति के समय की समीक्षा करें, और अपने क्रिप्टोग्राफ़िक ऑडिट इतिहास को देखें।' },
  viewDataAccessHistory: { en: 'View Data Access History', hi: 'डेटा एक्सेस इतिहास देखें' },
  severityColon: { en: 'Severity:', hi: 'गंभीरता:' },

  // Clinician Queue
  clinicianQueueTitle: { en: 'Clinician Live Triage Queue', hi: 'चिकित्सक लाइव ट्राइएज कतार' },
  clinicianQueueSubtitle: { en: 'Real-time human-in-the-loop clinical supervision and override station', hi: 'रीयल-टाइम मानव-पर्यवेक्षित नैदानिक समीक्षा और ओवरराइड स्टेशन' },
  criticalCount: { en: 'Critical:', hi: 'अत्यंत गंभीर:' },
  urgentCount: { en: 'Urgent:', hi: 'अत्यावश्यक:' },
  routineCount: { en: 'Routine:', hi: 'सामान्य:' },
  allFilter: { en: 'ALL', hi: 'सभी' },
  searchPlaceholder: { en: 'Search by patient, code, symptom...', hi: 'रोगी, कोड, लक्षण द्वारा खोजें...' },
  activePatientQueue: { en: 'Active Patient Queue', hi: 'सक्रिय रोगी कतार' },
  cases: { en: 'Cases', hi: 'केस' },
  stompLiveSyncActive: { en: 'STOMP Live Sync Active', hi: 'STOMP लाइव सिंक सक्रिय' },
  loadingActiveQueue: { en: 'Loading active queue...', hi: 'सक्रिय कतार लोड हो रही है...' },
  noCasesAwaiting: { en: 'No matching triage cases currently awaiting clinician review.', hi: 'वर्तमान में चिकित्सक समीक्षा के लिए कोई ट्राइएज केस प्रतीक्षारत नहीं है।' },
  inspectCase: { en: 'Inspect Case', hi: 'केस की जांच करें' },
  accept: { en: 'Accept', hi: 'स्वीकार करें' },
  acceptCase: { en: 'Accept Case', hi: 'केस स्वीकार करें' },
  overridePriority: { en: 'Override Priority / Modify', hi: 'प्राथमिकता ओवरराइड / संशोधित करें' },
  caseInspector: { en: 'Case Details & Triage Inspector', hi: 'केस विवरण और ट्राइएज जांचकर्ता' },
  reportedSymptoms: { en: 'Reported Symptoms', hi: 'रिपोर्ट किए गए लक्षण' },
  recordedVitals: { en: 'Recorded Vital Signs', hi: 'दर्ज महत्वपूर्ण संकेत' },
  noVitalsRecorded: { en: 'No vitals recorded', hi: 'कोई महत्वपूर्ण संकेत दर्ज नहीं' },
  aiSafetyTrace: { en: 'AI & Deterministic Safety Engine Trace', hi: 'एआई और निर्धारक सुरक्षा इंजन ट्रेस' },
  triggeredSafetyRule: { en: 'Triggered Safety Rule:', hi: 'ट्रिगर हुआ सुरक्षा नियम:' },
  precedence: { en: 'Precedence:', hi: 'प्राथमिकता क्रम:' },
  documentOverrideTitle: { en: 'Document Clinical Priority Override', hi: 'नैदानिक प्राथमिकता ओवरराइड दर्ज करें' },
  documentOverrideSubtitle: { en: 'Overrides are permanently recorded in the immutable audit log with your clinician credentials and clinical rationale.', hi: 'ओवरराइड्स आपके क्रेडेंशियल्स और नैदानिक तर्क के साथ अपरिवर्तनीय ऑडिट लॉग में स्थायी रूप से दर्ज किए जाते हैं।' },
  newClinicianPriority: { en: 'New Clinician Priority', hi: 'नई चिकित्सक प्राथमिकता' },
  emergencyImmediate: { en: 'EMERGENCY (Immediate Resuscitation)', hi: 'आपातकालीन (तत्काल पुनर्जीवन)' },
  urgentEvaluation: { en: 'URGENT (Evaluation within 2-4h)', hi: 'अत्यावश्यक (2-4 घंटे के भीतर मूल्यांकन)' },
  normalGuidance: { en: 'NORMAL / ROUTINE (Non-emergency guidance)', hi: 'सामान्य / नियमित (गैर-आपातकालीन मार्गदर्शन)' },
  overrideJustification: { en: 'Mandatory Clinical Override Justification', hi: 'अनिवार्य नैदानिक ओवरराइड औचित्य' },
  overridePlaceholder: { en: 'e.g. Atypical presentation with past history of myocardial infarction; requiring immediate 12-lead ECG.', hi: 'उदा. मायोकार्डियल रोधगलन के पिछले इतिहास के साथ असामान्य प्रस्तुति; तत्काल 12-लीड ईसीजी की आवश्यकता है।' },
  saveOverrideBtn: { en: 'Save Override & Update Queue', hi: 'ओवरराइड सहेजें और कतार अपडेट करें' },

  // Emergency Console
  emergencyConsoleTitle: { en: 'Emergency Coordination & Dispatch', hi: 'आपातकालीन समन्वय और प्रेषण' },
  emergencyConsoleSubtitle: { en: 'Automated emergency routing and simulated contact notifications', hi: 'स्वचालित आपातकालीन रूटिंग और सिम्युलेटेड संपर्क सूचनाएं' },
  emergencyHelpline: { en: 'Emergency Helpline: 112 / 108', hi: 'आपातकालीन हेल्पलाइन: 112 / 108' },
  activeIncidents: { en: 'Active Emergency Incidents', hi: 'सक्रिय आपातकालीन घटनाएं' },
  noActiveIncidents: { en: 'No active emergency incidents on record.', hi: 'रिकॉर्ड पर कोई सक्रिय आपातकालीन घटना नहीं है।' },
  simulatedNotificationLog: { en: 'Simulated Notification Log', hi: 'सिम्युलेटेड अधिसूचना लॉग' },
  noSimulatedNotifications: { en: 'No simulated notifications dispatched yet.', hi: 'अभी तक कोई सिम्युलेटेड सूचना नहीं भेजी गई है।' },
  demoSimulation: { en: 'DEMO SIMULATION', hi: 'डेमो सिमुलेशन' },
  resolve: { en: 'Resolve', hi: 'हल करें' },
  assignedDept: { en: 'Assigned Department:', hi: 'आवंटित विभाग:' },
  dispatched: { en: 'Dispatched:', hi: 'प्रेषित:' },
  channel: { en: 'Channel:', hi: 'चैनल:' },

  // Admin Dashboard
  adminDashboardTitle: { en: 'Hospital Administration & Safety Governance', hi: 'अस्पताल प्रशासन और सुरक्षा शासन' },
  adminDashboardSubtitle: { en: 'System health, AI Kill Switch control, clinician agreement rates, and immutable audit logs', hi: 'सिस्टम स्वास्थ्य, एआई किल स्विच नियंत्रण, चिकित्सक सहमति दर और अपरिवर्तनीय ऑडिट लॉग' },
  aiEngineStatus: { en: 'AI Engine Status', hi: 'एआई इंजन स्थिति' },
  aiActiveOnline: { en: 'ACTIVE (Online)', hi: 'सक्रिय (ऑनलाइन)' },
  aiKillSwitchOn: { en: 'KILL SWITCH ON (Safe Degraded)', hi: 'किल स्विच सक्रिय (सुरक्षित डिग्रेडेड)' },
  totalTriageCases: { en: 'Total Triage Cases', hi: 'कुल ट्राइएज केस' },
  registeredPatients: { en: 'Registered Patients', hi: 'पंजीकृत मरीज' },
  emergencyAcuity: { en: 'Emergency Acuity', hi: 'आपातकालीन तीव्रता' },
  clinicianOverridesCount: { en: 'Clinician Overrides', hi: 'चिकित्सक ओवरराइड' },
  clinicalAcceptances: { en: 'Clinical Acceptances', hi: 'नैदानिक स्वीकृतियां' },
  aiAgreementRate: { en: 'AI Agreement Rate', hi: 'एआई सहमति दर' },
  activeAiProvider: { en: 'Active Provider:', hi: 'सक्रिय प्रदाता:' },
  auditTrailTitle: { en: 'Immutable Cryptographic Audit Trail (SHA-256 Chained)', hi: 'अपरिवर्तनीय क्रिप्टोग्राफ़िक ऑडिट ट्रेल (SHA-256 शृंखलाबद्ध)' },
  actor: { en: 'Actor:', hi: 'कर्ता:' },

  // Safety Benchmark Suite
  safetyBenchmarkTitle: { en: 'AI Safety & Clinical Benchmark Suite', hi: 'एआई सुरक्षा और नैदानिक बेंचमार्क सूट' },
  safetyBenchmarkSubtitle: { en: 'Automated execution of 10+ clinical safety vectors, prompt injection attacks, and conflict tests', hi: '10+ नैदानिक सुरक्षा वैक्टर, प्रॉम्प्ट इंजेक्शन हमलों और संघर्ष परीक्षणों का स्वचालित निष्पादन' },
  runSafetySuiteBtn: { en: 'Run Safety Suite', hi: 'सुरक्षा सूट चलाएं' },
  executingBenchmark: { en: 'Executing Benchmark...', hi: 'बेंचमार्क चल रहा है...' },
  totalTests: { en: 'Total Tests', hi: 'कुल परीक्षण' },
  passed: { en: 'Passed', hi: 'उत्तीर्ण' },
  failed: { en: 'Failed', hi: 'विफल' },
  safetyPassRate: { en: 'Safety Pass Rate', hi: 'सुरक्षा उत्तीर्ण दर' },
  safetyBreakdown: { en: 'Safety Test Case Breakdown', hi: 'सुरक्षा परीक्षण केस विवरण' },
  expected: { en: 'Expected:', hi: 'अपेक्षित:' },
  actual: { en: 'Actual:', hi: 'वास्तविक:' },
  safetySuiteReady: { en: 'Safety Test Suite Ready', hi: 'सुरक्षा परीक्षण सूट तैयार है' },
  safetySuiteReadyDesc: { en: 'Click "Run Safety Suite" above to benchmark the deterministic safety engine, prompt injection defenses, and conflict resolution rules against simulated high-stakes clinical scenarios.', hi: 'सिम्युलेटेड उच्च-दांव नैदानिक परिदृश्यों के खिलाफ निर्धारक सुरक्षा इंजन, प्रॉम्प्ट इंजेक्शन सुरक्षा और संघर्ष समाधान नियमों को बेंचमार्क करने के लिए ऊपर "सुरक्षा सूट चलाएं" पर क्लिक करें।' },

  // Medical Profile Page
  medicalProfileHeader: { en: 'Structured Medical Profile', hi: 'संरचित मेडिकल प्रोफ़ाइल' },
  medicalProfileSubtitle: { en: 'Normalized clinical conditions, allergies, active medications, and emergency contacts', hi: 'सामान्यीकृत नैदानिक स्थितियां, एलर्जी, सक्रिय दवाएं और आपातकालीन संपर्क' },
  chronicConditions: { en: 'Chronic & Diagnosed Conditions', hi: 'पुरानी और पहचानी गई स्थितियां' },
  knownAllergies: { en: 'Known Allergies', hi: 'ज्ञात एलर्जी' },
  currentMedications: { en: 'Current Medications', hi: 'वर्तमान दवाएं' },
  emergencyContacts: { en: 'Emergency Contacts', hi: 'आपातकालीन संपर्क' },
  addBtn: { en: 'Add', hi: 'जोड़ें' },
  conditionPlaceholder: { en: 'e.g. Type 2 Diabetes', hi: 'उदा. टाइप 2 मधुमेह' },
  allergyPlaceholder: { en: 'e.g. Penicillin, Peanuts', hi: 'उदा. पेनिसिलिन, मूंगफली' },
  contactNamePlaceholder: { en: 'Contact Name (e.g. John)', hi: 'संपर्क नाम (उदा. राहुल)' },
  contactPhonePlaceholder: { en: 'Phone Number', hi: 'फ़ोन नंबर' },

  // Profile Edit & Delete
  editProfile: { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें' },
  saveChanges: { en: 'Save Changes', hi: 'परिवर्तन सहेजें' },
  saving: { en: 'Saving...', hi: 'सहेजा जा रहा है...' },
  personalInfo: { en: 'Personal Information', hi: 'व्यक्तिगत जानकारी' },
  genderLabel: { en: 'Gender', hi: 'लिंग' },
  bloodGroupLabel: { en: 'Blood Group', hi: 'रक्त समूह' },
  newPasswordOptional: { en: 'New Password (leave blank to keep unchanged)', hi: 'नया पासवर्ड (अपरिवर्तित रखने के लिए खाली छोड़ें)' },
  deleteAccountTitle: { en: 'Danger Zone: Delete Account', hi: 'डेंजर ज़ोन: खाता हटाएं' },
  deleteAccountDesc: { 
    en: 'Permanently remove your account, medical profile, vital history, and triage session records from the hospital database. This action is irreversible.',
    hi: 'अस्पताल के डेटाबेस से अपना खाता, मेडिकल प्रोफ़ाइल, महत्वपूर्ण इतिहास और ट्राइएज सत्र रिकॉर्ड स्थायी रूप से हटाएं। यह कार्रवाई अपरिवर्तनीय है।'
  },
  deleteAccountBtn: { en: 'Delete Account & Profile', hi: 'खाता और प्रोफ़ाइल हटाएं' },
  deleteConfirmTitle: { en: 'Permanently Delete Account?', hi: 'क्या आप स्थायी रूप से खाता हटाना चाहते हैं?' },
  deleteConfirmWarning: { 
    en: 'This will permanently remove your patient account, personal data, and medical history. You will be logged out immediately.',
    hi: 'यह आपके रोगी खाते, व्यक्तिगत डेटा और चिकित्सा इतिहास को स्थायी रूप से हटा देगा। आप तुरंत लॉग आउट हो जाएंगे।'
  },
  deleteTypePrompt: { en: 'Type DELETE to confirm:', hi: 'पुष्टि करने के लिए DELETE लिखें:' },
  cancelBtn: { en: 'Cancel', hi: 'रद्द करें' },
  confirmDeleteBtn: { en: 'Permanently Delete', hi: 'स्थायी रूप से हटाएं' },
  deleting: { en: 'Deleting...', hi: 'हटाया जा रहा है...' },
  profileUpdatedSuccess: { en: 'Profile updated successfully!', hi: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!' },
  accountDeletedSuccess: { en: 'Your account and medical profile have been permanently deleted.', hi: 'आपका खाता और मेडिकल प्रोफ़ाइल स्थायी रूप से हटा दिए गए हैं।' },

  // Privacy Center
  privacyCenterHeader: { en: 'Patient Privacy & "My Data" Center', hi: 'रोगी गोपनीयता और "मेरा डेटा" केंद्र' },
  privacyCenterSubtitle: { en: 'Transparency into your clinical data access, consent versions, and cryptographic audit records.', hi: 'आपके नैदानिक डेटा एक्सेस, सहमति संस्करणों और क्रिप्टोग्राफ़िक ऑडिट रिकॉर्ड में पारदर्शिता।' },
  dataEncryption: { en: 'Data Encryption', hi: 'डेटा एन्क्रिप्शन' },
  dataEncryptionDesc: { en: 'All patient communications are protected with TLS 1.3 and stored in normalized, role-secured schemas.', hi: 'सभी रोगी संचार टीएलएस 1.3 से सुरक्षित हैं और मानकीकृत, भूमिका-सुरक्षित स्कीमा में संग्रहीत हैं।' },
  roleBasedAccess: { en: 'Role-Based Access', hi: 'भूमिका-आधारित पहुंच' },
  roleBasedAccessDesc: { en: 'Patients access only their own medical data. Clinicians and Admins have audited access controls.', hi: 'मरीज केवल अपने मेडिकल डेटा तक पहुंच सकते हैं। चिकित्सकों और प्रशासकों के पास ऑडिट किए गए एक्सेस नियंत्रण हैं।' },
  tamperEvidentTrail: { en: 'Tamper-Evident Trail', hi: 'छेड़छाड़-रोधी ट्रेल' },
  tamperEvidentTrailDesc: { en: 'Audit entries use cryptographic SHA-256 event chaining to record triage and clinical actions.', hi: 'ऑडिट प्रविष्टियां ट्राइएज और नैदानिक कार्यों को रिकॉर्ड करने के लिए क्रिप्टोग्राफ़िक SHA-256 ईवेंट चेनिंग का उपयोग करती हैं।' },
  activeConsents: { en: 'Active Consent & Processing Authorizations', hi: 'सक्रिय सहमति और प्रसंस्करण प्राधिकरण' },
  noConsentRecords: { en: 'No specific consent records found.', hi: 'कोई विशिष्ट सहमति रिकॉर्ड नहीं मिला।' },
  granted: { en: 'GRANTED', hi: 'स्वीकृत' },
  policyVersion: { en: 'Policy Version:', hi: 'नीति संस्करण:' },
  recordedFromIp: { en: 'Recorded from IP:', hi: 'आईपी से रिकॉर्ड किया गया:' },

  // Auth: Login & Register
  signInMediTriage: { en: 'Sign in to MediTriage', hi: 'मेडीट्राइएज में साइन इन करें' },
  signInSubtitle: { en: 'Clinical Patient Triage & Emergency Decision Support', hi: 'नैदानिक रोगी ट्राइएज और आपातकालीन निर्णय समर्थन' },
  oneClickDemo: { en: '1-Click Hackathon Demo Credentials', hi: '1-क्लिक हैकाथॉन डेमो क्रेडेंशियल' },
  emailAddress: { en: 'Email Address', hi: 'ईमेल पता' },
  password: { en: 'Password', hi: 'पासवर्ड' },
  authenticating: { en: 'Authenticating...', hi: 'प्रमाणीकरण हो रहा है...' },
  newPatient: { en: 'New patient?', hi: 'नए मरीज हैं?' },
  createAnAccount: { en: 'Create an Account', hi: 'खाता बनाएं' },
  createPatientAccount: { en: 'Create Patient Account', hi: 'रोगी खाता बनाएं' },
  secureRegistration: { en: 'Secure clinical triage registration', hi: 'सुरक्षित नैदानिक ट्राइएज पंजीकरण' },
  fullName: { en: 'Full Name', hi: 'पूरा नाम' },
  phoneNumber: { en: 'Phone Number', hi: 'फ़ोन नंबर' },
  dateOfBirth: { en: 'Date of Birth', hi: 'जन्म तिथि' },
  registering: { en: 'Registering...', hi: 'पंजीकरण हो रहा है...' },
  completeRegistration: { en: 'Complete Registration', hi: 'पंजीकरण पूरा करें' },
  alreadyHaveAccount: { en: 'Already have an account?', hi: 'क्या आपके पास पहले से एक खाता मौजूद है?' },
  sendOtp: { en: 'Send OTP Code', hi: 'ओटीपी कोड भेजें' },
  sendingOtp: { en: 'Sending OTP...', hi: 'ओटीपी भेजा जा रहा है...' },
  enterOtp: { en: '6-Digit Email OTP', hi: '6-अंकीय ईमेल ओटीपी' },
  verifyOtpBtn: { en: 'Verify Code', hi: 'कोड सत्यापित करें' },
  verifyingOtp: { en: 'Verifying...', hi: 'सत्यापित हो रहा है...' },
  resendOtp: { en: 'Resend Code', hi: 'कोड पुनः भेजें' },
  emailVerifiedBadge: { en: 'Email Verified', hi: 'ईमेल सत्यापित' },
  signInWithGoogle: { en: 'Continue with Google', hi: 'Google से जारी रखें' },
  orContinueWith: { en: 'OR CONTINUE WITH', hi: 'या इसके साथ जारी रखें' },
  otpLoginTab: { en: 'Email OTP (Passwordless / 2FA)', hi: 'ईमेल ओटीपी (पासवर्ड रहित / 2FA)' },
  passwordLoginTab: { en: 'Password Login', hi: 'पासवर्ड लॉगिन' },
  sendLoginOtpBtn: { en: 'Send Login Code', hi: 'लॉगिन कोड भेजें' },
  enterLoginOtpDesc: { en: 'Enter the 6-digit verification code sent to your email to log in.', hi: 'लॉग इन करने के लिए अपने ईमेल पर भेजा गया 6-अंकीय सत्यापन कोड दर्ज करें।' },

  // Safety Limitations Page
  safetyArchTitle: { en: 'Clinical Safety Architecture & Limitations', hi: 'नैदानिक सुरक्षा वास्तुकला और सीमाएं' },
  safetyArchSubtitle: { en: 'Governance framework, deterministic safety invariants, and clinical limitations', hi: 'शासन ढांचा, निर्धारक सुरक्षा अपरिवर्तनीय नियम और नैदानिक सीमाएं' },
  sec1Title: { en: '1. Medical Disclaimer & Non-Autonomous Principle', hi: '1. चिकित्सा अस्वीकरण और गैर-स्वायत्त सिद्धांत' },
  sec1Body: { en: 'MediTriage is designed as an AI-assisted clinical triage decision-support platform. It does NOT provide definitive medical diagnoses, does not prescribe medications, and cannot replace the in-person assessment of a licensed medical practitioner.', hi: 'मेडीट्राइएज को एक एआई-सहायता प्राप्त नैदानिक ट्राइएज निर्णय-समर्थन मंच के रूप में डिज़ाइन किया गया है। यह निश्चित चिकित्सा निदान प्रदान नहीं करता है, दवाएं नहीं लिखता है, और लाइसेंस प्राप्त चिकित्सक के व्यक्तिगत मूल्यांकन को प्रतिस्थापित नहीं कर सकता है।' },
  sec2Title: { en: '2. Deterministic Safety Engine Precedence', hi: '2. निर्धारक सुरक्षा इंजन की प्राथमिकता' },
  sec2Body: { en: 'The platform embeds a deterministic safety layer informed by authoritative emergency guidelines (AHA/ACC, WAO Anaphylaxis, WHO Triage Protocol). In the event of a disagreement between AI reasoning and deterministic safety rules, the system adheres to a strict invariant:', hi: 'यह मंच आधिकारिक आपातकालीन दिशानिर्देशों (AHA/ACC, WAO एनाफिलेक्सिस, WHO ट्राइएज प्रोटोकॉल) द्वारा सूचित एक निर्धारक सुरक्षा परत को एम्बेड करता है। एआई तर्क और निर्धारक सुरक्षा नियमों के बीच असहमति की स्थिति में, सिस्टम एक सख्त नियम का पालन करता है:' },
  sec2Banner: { en: 'Deterministic Emergency Red-Flags strictly overrule AI downgrades. A model can never reduce a critical case to routine priority.', hi: 'निर्धारक आपातकालीन रेड-फ्लैग्स एआई डाउनग्रेड्स को सख्ती से खारिज करते हैं। कोई भी मॉडल कभी भी किसी गंभीर मामले को सामान्य प्राथमिकता में नहीं घटा सकता है।' },
  sec3Title: { en: '3. Non-Suppression by Normal Vitals', hi: '3. सामान्य महत्वपूर्ण संकेतों द्वारा गैर-दमन' },
  sec3Body: { en: 'A recorded normal vital sign (such as SpO2 99% or resting HR 72) will never silently suppress severe reported symptoms (such as crushing chest pain or gasping dyspnea). Such discrepancies trigger a data contradiction alert and force clinician review.', hi: 'एक रिकॉर्ड किया गया सामान्य महत्वपूर्ण संकेत (जैसे SpO2 99% या HR 72) कभी भी गंभीर रिपोर्ट किए गए लक्षणों (जैसे सीने में गंभीर दर्द या सांस फूलना) को चुपचाप दबा नहीं देगा। इस तरह के विरोधाभास चेतावनी ट्रिगर करते हैं और चिकित्सक समीक्षा अनिवार्य करते हैं।' },
  sec4Title: { en: '4. AI Kill Switch & Safe Degradation', hi: '4. एआई किल स्विच और सुरक्षित डिग्रेडेशन' },
  sec4Body: { en: 'An administrator can disable AI processing at any moment via the AI Kill Switch. In this mode or in the event of third-party model outage, the system seamlessly continues intake via the deterministic safety rules in Safe Degraded Mode.', hi: 'एक प्रशासक एआई किल स्विच के माध्यम से किसी भी समय एआई प्रसंस्करण को अक्षम कर सकता है। इस मोड में या आउटेज की स्थिति में, सिस्टम सेफ डिग्रेडेड मोड में निर्धारक सुरक्षा नियमों के माध्यम से निर्बाध रूप से कार्य जारी रखता है।' },
  sec5Title: { en: '5. Cryptographic Audit Immutability', hi: '5. क्रिप्टोग्राफ़िक ऑडिट अपरिवर्तनीयता' },
  sec5Body: { en: 'Every user action, triage submission, safety trigger, conflict resolution, and clinician override is recorded in an append-only audit trail utilizing SHA-256 hash chaining to guarantee transparency.', hi: 'प्रत्येक उपयोगकर्ता कार्रवाई, ट्राइएज सबमिशन, सुरक्षा ट्रिगर, संघर्ष समाधान और चिकित्सक ओवरराइड को पारदर्शिता की गारंटी के लिए SHA-256 हैश चेनिंग का उपयोग करके केवल-जोड़ ऑडिट ट्रेल में दर्ज किया जाता है।' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'en');

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const t = (key: string): string => {
    if (dictionary[key] && dictionary[key][language]) {
      return dictionary[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
