import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { HospitalAnalytics, AuditLog, Doctor, AdminMember } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Activity,
  Users,
  Stethoscope,
  Flame,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  Cpu,
  FileText,
  Lock,
  RefreshCw,
  PlusCircle,
  UserPlus,
  CheckCircle2,
  Clock,
  Briefcase,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Shield,
  X
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<HospitalAnalytics | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAi, setTogglingAi] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form fields for adding a doctor
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPassword, setNewDoctorPassword] = useState('Doctor@123');
  const [newDoctorDept, setNewDoctorDept] = useState('Cardiology');
  const [newDoctorSpec, setNewDoctorSpec] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('+91-9876500001');
  const [addingDoctor, setAddingDoctor] = useState(false);

  // Form fields for adding an administrator
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('Admin@123');
  const [newAdminPhone, setNewAdminPhone] = useState('+91-9876500000');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Delete admin confirmation modal state
  const [deletingAdmin, setDeletingAdmin] = useState<AdminMember | null>(null);
  const [deletingAdminLoading, setDeletingAdminLoading] = useState(false);

  // Form fields for editing a doctor
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editDoctorDept, setEditDoctorDept] = useState('Cardiology');
  const [editDoctorSpec, setEditDoctorSpec] = useState('');
  const [editDoctorPhone, setEditDoctorPhone] = useState('');
  const [editDoctorStatus, setEditDoctorStatus] = useState<'AVAILABLE' | 'BUSY' | 'OFF_DUTY'>('AVAILABLE');
  const [editDoctorPassword, setEditDoctorPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete doctor confirmation modal state
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const loadData = async () => {
    try {
      const [analyticsData, doctorsData, adminsData] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getDoctors().catch(() => []),
        adminApi.getAdmins().catch(() => [])
      ]);
      setAnalytics(analyticsData);
      setDoctors(doctorsData || []);
      setAdmins(adminsData || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAi = async () => {
    if (!analytics) return;
    setTogglingAi(true);
    try {
      await adminApi.toggleAi(!analytics.aiEnabled);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingAi(false);
    }
  };

  const handleStatusChange = async (doctorId: number, status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY') => {
    try {
      await adminApi.updateDoctorStatus(doctorId, status);
      const updated = await adminApi.getDoctors();
      setDoctors(updated);
      setFeedback({ type: 'success', message: 'Doctor availability status updated successfully.' });
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Failed to update status.' });
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorEmail || !newDoctorPassword) return;
    setAddingDoctor(true);
    setFeedback(null);
    const cleanEmail = newDoctorEmail.trim().toLowerCase();
    const cleanPass = newDoctorPassword.trim();
    try {
      await adminApi.createDoctor({
        fullName: newDoctorName.trim(),
        email: cleanEmail,
        password: cleanPass,
        department: newDoctorDept,
        specialization: newDoctorSpec.trim() || `${newDoctorDept} Specialist`,
        phone: newDoctorPhone.trim()
      });
      setFeedback({
        type: 'success',
        message: `Dr. ${newDoctorName} registered successfully! Credentials: [Email: ${cleanEmail} | Password: ${cleanPass}]`
      });
      setShowAddDoctorModal(false);
      setNewDoctorName('');
      setNewDoctorEmail('');
      setNewDoctorPassword('Doctor@123');
      setNewDoctorSpec('');
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to register doctor.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setAddingDoctor(false);
    }
  };

  const handleOpenEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setEditDoctorName(doc.fullName);
    setEditDoctorDept(doc.department || 'Cardiology');
    setEditDoctorSpec(doc.specialization || '');
    setEditDoctorPhone(doc.phone || '');
    setEditDoctorStatus(doc.availabilityStatus as 'AVAILABLE' | 'BUSY' | 'OFF_DUTY');
    setEditDoctorPassword('');
    setShowEditPassword(false);
  };

  const handleSaveDoctorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor || !editDoctorName.trim()) return;
    setSavingEdit(true);
    setFeedback(null);
    try {
      await adminApi.updateDoctor(editingDoctor.id, {
        fullName: editDoctorName.trim(),
        department: editDoctorDept,
        specialization: editDoctorSpec.trim() || `${editDoctorDept} Specialist`,
        phone: editDoctorPhone.trim(),
        availabilityStatus: editDoctorStatus,
        password: editDoctorPassword.trim() || undefined
      });
      setFeedback({
        type: 'success',
        message: `Dr. ${editDoctorName} details updated successfully!`
      });
      setEditingDoctor(null);
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to update doctor details.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!deletingDoctor) return;
    setDeletingLoading(true);
    setFeedback(null);
    try {
      await adminApi.deleteDoctor(deletingDoctor.id);
      setFeedback({
        type: 'success',
        message: `Dr. ${deletingDoctor.fullName} removed successfully from doctor roster.`
      });
      setDeletingDoctor(null);
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to remove doctor.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPassword) return;
    setAddingAdmin(true);
    setFeedback(null);
    try {
      await adminApi.createAdmin({
        fullName: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword.trim(),
        phone: newAdminPhone.trim()
      });
      setFeedback({
        type: 'success',
        message: `Administrator ${newAdminName.trim()} created successfully! They can now log in.`
      });
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('Admin@123');
      setShowAddAdminModal(false);
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to create administrator account.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    setDeletingAdminLoading(true);
    setFeedback(null);
    try {
      await adminApi.deleteAdmin(deletingAdmin.id);
      setFeedback({
        type: 'success',
        message: `Administrator ${deletingAdmin.fullName} removed successfully.`
      });
      setDeletingAdmin(null);
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to remove administrator.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setDeletingAdminLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">{t('loadingActiveQueue')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header & AI Kill Switch */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>{t('adminDashboardTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('adminDashboardSubtitle')}
          </p>
        </div>

        {/* AI Kill Switch Control Panel */}
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 dark:text-white">{t('aiEngineStatus')}</div>
            <div className={`text-[10px] font-extrabold ${analytics?.aiEnabled ? 'text-emerald-600' : 'text-red-600'}`}>
              {analytics?.aiEnabled ? t('aiActiveOnline') : t('aiKillSwitchOn')}
            </div>
          </div>
          <button
            onClick={handleToggleAi}
            disabled={togglingAi}
            title="Toggle AI Kill Switch"
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {analytics?.aiEnabled ? (
              <ToggleRight className="w-8 h-8 text-emerald-600 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-red-600 cursor-pointer" />
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('totalTriageCases')}</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {analytics?.totalTriageSessions}
          </div>
          <div className="text-[11px] text-slate-500">
            {analytics?.totalPatients} {t('registeredPatients')}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('emergencyAcuity')}</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold text-red-600 dark:text-red-400">
            {analytics?.emergencyCases}
          </div>
          <div className="text-[11px] text-slate-500">
            {analytics?.urgentCases} {t('urgentCount').replace(':', '')} • {analytics?.normalCases} {t('routineCount').replace(':', '')}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('clinicianOverridesCount')}</span>
            <Stethoscope className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {analytics?.clinicianOverrides}
          </div>
          <div className="text-[11px] text-slate-500">
            {analytics?.clinicianAcceptances} {t('clinicalAcceptances')}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('aiAgreementRate')}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics?.aiAgreementRatePercentage}%
          </div>
          <div className="text-[11px] text-slate-500">
            {t('activeAiProvider')} {analytics?.activeAiProvider}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/50 border-red-300 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-extrabold px-2">✕</button>
        </div>
      )}

      {/* Doctor & Specialist Fleet Management Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Doctor Fleet & Intelligent Auto-Allotment Pool</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage clinical specialists. Incoming patient triage cases are automatically allotted to free specialists in matching departments.
            </p>
          </div>

          <button
            onClick={() => setShowAddDoctorModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{doc.fullName}</span>
                  </h3>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {doc.department}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {doc.specialization}
                  </div>
                </div>

                {/* Availability Badge */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    doc.availabilityStatus === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                      : doc.availabilityStatus === 'BUSY'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300'
                  }`}
                >
                  {doc.availabilityStatus}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Active Load: <strong className="text-slate-900 dark:text-white">{doc.activeCasesCount} cases</strong></span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">{doc.email}</div>
              </div>

              {/* Status Selector & Action Buttons */}
              <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                  {(['AVAILABLE', 'BUSY', 'OFF_DUTY'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(doc.id, st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        doc.availabilityStatus === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {st === 'AVAILABLE' ? 'Free' : st === 'BUSY' ? 'Busy' : 'Off'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(doc)}
                    title="Update Doctor Details"
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingDoctor(doc)}
                    title="Remove Doctor"
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Administrator Fleet & Governance Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>System Administrators & Security Clearance Directory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage authorized system administrators with full platform governance, AI kill-switch control, and doctor fleet management.
            </p>
          </div>

          <button
            onClick={() => setShowAddAdminModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Administrator</span>
          </button>
        </div>

        {/* Admins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((adm) => (
            <div
              key={adm.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{adm.fullName}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                      ROLE_ADMIN
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                </div>

                {admins.length > 1 && (
                  <button
                    onClick={() => setDeletingAdmin(adm)}
                    title="Remove Administrator"
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 font-mono">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{adm.email}</span>
                </div>
                {adm.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{adm.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD DOCTOR MODAL */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Add Doctor to Clinical Pool</span>
              </h3>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Rajiv Menon, MD"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newDoctorEmail}
                    onChange={(e) => setNewDoctorEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newDoctorPassword}
                      onChange={(e) => setNewDoctorPassword(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Specialty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newDoctorDept}
                    onChange={(e) => setNewDoctorDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Cardiology">Cardiology (Heart / Chest)</option>
                    <option value="Gastroenterology">Gastroenterology (Abdomen / GI)</option>
                    <option value="Pulmonology">Pulmonology (Respiratory / Lungs)</option>
                    <option value="Neurology">Neurology (Brain / Stroke / Spine)</option>
                    <option value="Orthopedics">Orthopedics (Bones / Joints)</option>
                    <option value="Pediatrics">Pediatrics (Children)</option>
                    <option value="Allergy & Immunology">Allergy & Immunology</option>
                    <option value="General Medicine / Emergency">General Medicine / Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Specialization
                  </label>
                  <input
                    type="text"
                    value={newDoctorSpec}
                    onChange={(e) => setNewDoctorSpec(e.target.value)}
                    placeholder="e.g. Interventional Cardiologist"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={newDoctorPhone}
                  onChange={(e) => setNewDoctorPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDoctor}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{addingDoctor ? 'Registering...' : 'Register Doctor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Update Doctor Profile</span>
              </h3>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctorEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDoctorName}
                  onChange={(e) => setEditDoctorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Account ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={editingDoctor.email}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reset Password <span className="text-slate-400 text-[10px]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editDoctorPassword}
                      onChange={(e) => setEditDoctorPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Specialty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editDoctorDept}
                    onChange={(e) => setEditDoctorDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Cardiology">Cardiology (Heart / Chest)</option>
                    <option value="Gastroenterology">Gastroenterology (Abdomen / GI)</option>
                    <option value="Pulmonology">Pulmonology (Respiratory / Lungs)</option>
                    <option value="Neurology">Neurology (Brain / Stroke / Spine)</option>
                    <option value="Orthopedics">Orthopedics (Bones / Joints)</option>
                    <option value="Pediatrics">Pediatrics (Children)</option>
                    <option value="Allergy & Immunology">Allergy & Immunology</option>
                    <option value="General Medicine / Emergency">General Medicine / Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Specialization
                  </label>
                  <input
                    type="text"
                    value={editDoctorSpec}
                    onChange={(e) => setEditDoctorSpec(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={editDoctorPhone}
                    onChange={(e) => setEditDoctorPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={editDoctorStatus}
                    onChange={(e) => setEditDoctorStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AVAILABLE">AVAILABLE (Accepting Patients)</option>
                    <option value="BUSY">BUSY (High Workload)</option>
                    <option value="OFF_DUTY">OFF_DUTY (Unavailable)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DOCTOR CONFIRMATION MODAL */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Remove Doctor from Fleet?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to remove <strong>{deletingDoctor.fullName}</strong> ({deletingDoctor.department})?
                </p>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
              Note: This doctor will immediately be removed from the active triage auto-allotment pool and won't be assigned new patient cases.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoctor(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleDeleteDoctor}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingLoading ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADMINISTRATOR MODAL */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Add System Administrator</span>
              </h3>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Chief Admin Officer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin2@hospital.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="+91-9876500000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default temporary password. The admin can log in using any login panel.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{addingAdmin ? 'Creating...' : 'Grant Clearance & Create Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ADMIN CONFIRMATION MODAL */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Revoke Admin Clearance?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete administrator <strong>{deletingAdmin.fullName}</strong> ({deletingAdmin.email})?
                </p>
              </div>
            </div>

            <p className="text-[11px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900">
              Warning: This administrator will immediately lose all governance, triage configuration, and system access rights.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAdminLoading}
                onClick={handleDeleteAdmin}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingAdminLoading ? 'Revoking...' : 'Confirm Revoke'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>{t('auditTrailTitle')}</span>
          </h2>
          <button
            onClick={loadData}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {analytics?.recentAuditLogs?.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                    #{log.sequenceNumber}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                  <span className="text-[11px] text-slate-500 font-mono">[{log.entityType} #{log.entityId}]</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Hash: {log.recordHash?.substring(0, 24)}... (Prev: {log.previousRecordHash?.substring(0, 12)}...)
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-right">
                <div>{t('actor')} {log.actorRole || 'SYSTEM'}</div>
                <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
