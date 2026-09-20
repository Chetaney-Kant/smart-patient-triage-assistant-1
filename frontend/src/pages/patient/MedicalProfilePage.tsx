import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../../api/patientApi';
import { PatientProfile, PatientCondition, PatientAllergy, PatientMedication, PatientEmergencyContact } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  Plus,
  Shield,
  Check,
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  Edit3,
  User,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Droplet
} from 'lucide-react';

export const MedicalProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Profile Modal / Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    bloodGroup: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // New item inputs for medical details
  const [newCondition, setNewCondition] = useState({ conditionName: '', category: 'General', diagnosedYear: 2020, notes: '' });
  const [newAllergy, setNewAllergy] = useState({ allergen: '', reactionType: '', severityLevel: 'MODERATE', notes: '' });
  const [newMedication, setNewMedication] = useState({ medicationName: '', dosage: '', frequency: '', notes: '' });
  const [newContact, setNewContact] = useState({ contactName: '', relationship: 'Family', phone: '', email: '', primaryContact: true });

  const loadProfile = async () => {
    try {
      const data = await patientApi.getProfile();
      setProfile(data);
      if (data) {
        setEditFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || 'Prefer not to say',
          bloodGroup: data.bloodGroup || '',
          password: ''
        });
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const openEditModal = () => {
    if (profile) {
      setEditFormData({
        fullName: profile.fullName || user?.fullName || '',
        phone: profile.phone || user?.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || 'Prefer not to say',
        bloodGroup: profile.bloodGroup || '',
        password: ''
      });
    }
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        fullName: editFormData.fullName,
        phone: editFormData.phone,
        dateOfBirth: editFormData.dateOfBirth || null,
        gender: editFormData.gender,
        bloodGroup: editFormData.bloodGroup || null
      };
      if (editFormData.password && editFormData.password.trim().length > 0) {
        payload.password = editFormData.password.trim();
      }

      const updated = await patientApi.updateProfile(payload);
      setProfile(updated);
      if (user && token) {
        login(token, {
          ...user,
          fullName: updated.fullName,
          phone: updated.phone
        });
      }
      setSuccessMsg(t('profileUpdatedSuccess'));
      setIsEditModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      return;
    }
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await patientApi.deleteAccount();
      logout();
      navigate('/login', { state: { infoMessage: t('accountDeletedSuccess') } });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCondition.conditionName) return;
    await patientApi.addCondition(newCondition);
    setNewCondition({ conditionName: '', category: 'General', diagnosedYear: 2020, notes: '' });
    setSuccessMsg('Condition added successfully');
    setTimeout(() => setSuccessMsg(null), 3000);
    loadProfile();
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergy.allergen) return;
    await patientApi.addAllergy(newAllergy);
    setNewAllergy({ allergen: '', reactionType: '', severityLevel: 'MODERATE', notes: '' });
    setSuccessMsg('Allergy recorded successfully');
    setTimeout(() => setSuccessMsg(null), 3000);
    loadProfile();
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedication.medicationName) return;
    await patientApi.addMedication(newMedication);
    setNewMedication({ medicationName: '', dosage: '', frequency: '', notes: '' });
    setSuccessMsg('Medication added successfully');
    setTimeout(() => setSuccessMsg(null), 3000);
    loadProfile();
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.contactName || !newContact.phone) return;
    await patientApi.addEmergencyContact(newContact);
    setNewContact({ contactName: '', relationship: 'Family', phone: '', email: '', primaryContact: true });
    setSuccessMsg('Emergency contact added successfully');
    setTimeout(() => setSuccessMsg(null), 3000);
    loadProfile();
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">{t('loadingActiveQueue')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span>{t('medicalProfileHeader')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('medicalProfileSubtitle')}
          </p>
        </div>

        <button
          onClick={openEditModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>{t('editProfile')}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Personal & Demographic Overview Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>{t('personalInfo')}</span>
          </h2>
          <button
            onClick={openEditModal}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('editProfile')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold">{t('fullName')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{profile?.fullName || user?.fullName || '—'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold">{t('emailAddress')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{profile?.email || user?.email || '—'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold">{t('phoneNumber')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{profile?.phone || '—'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold">{t('dateOfBirth')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{profile?.dateOfBirth || '—'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold">{t('genderLabel')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{profile?.gender || 'Prefer not to say'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold">{t('bloodGroupLabel')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-red-500" />
              {profile?.bloodGroup || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Medical Details 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Conditions */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('chronicConditions')}
          </h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {profile?.conditions && profile.conditions.length > 0 ? (
              profile.conditions.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{c.conditionName}</div>
                    <div className="text-[11px] text-slate-500">{c.category} • Year: {c.diagnosedYear}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2 italic">No chronic conditions listed.</div>
            )}
          </div>

          <form onSubmit={handleAddCondition} className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder={t('conditionPlaceholder')}
              value={newCondition.conditionName}
              onChange={(e) => setNewCondition({ ...newCondition, conditionName: e.target.value })}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t('addBtn')}
            </button>
          </form>
        </div>

        {/* Allergies */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('knownAllergies')}
          </h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {profile?.allergies && profile.allergies.length > 0 ? (
              profile.allergies.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{a.allergen}</div>
                    <div className="text-[11px] text-slate-500">Reaction: {a.reactionType || 'Standard'} • {a.severityLevel}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2 italic">No allergies recorded.</div>
            )}
          </div>

          <form onSubmit={handleAddAllergy} className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder={t('allergyPlaceholder')}
              value={newAllergy.allergen}
              onChange={(e) => setNewAllergy({ ...newAllergy, allergen: e.target.value })}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t('addBtn')}
            </button>
          </form>
        </div>

        {/* Current Medications */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('currentMedications')}
          </h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {profile?.medications && profile.medications.length > 0 ? (
              profile.medications.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{m.medicationName}</div>
                    <div className="text-[11px] text-slate-500">{m.dosage} • {m.frequency}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2 italic">No active medications recorded.</div>
            )}
          </div>

          <form onSubmit={handleAddMedication} className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder={t('medicationPlaceholder')}
              value={newMedication.medicationName}
              onChange={(e) => setNewMedication({ ...newMedication, medicationName: e.target.value })}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t('addBtn')}
            </button>
          </form>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('emergencyContacts')}
          </h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {profile?.emergencyContacts && profile.emergencyContacts.length > 0 ? (
              profile.emergencyContacts.map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{e.contactName} ({e.relationship})</div>
                    <div className="text-[11px] text-slate-500">{e.phone}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2 italic">No emergency contacts configured.</div>
            )}
          </div>

          <form onSubmit={handleAddContact} className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder={t('contactNamePlaceholder')}
              value={newContact.contactName}
              onChange={(e) => setNewContact({ ...newContact, contactName: e.target.value })}
              className="w-1/2 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="tel"
              placeholder={t('contactPhonePlaceholder')}
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="w-1/2 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t('addBtn')}
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone: Delete Account & Profile */}
      <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-6 border border-red-200 dark:border-red-900/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>{t('deleteAccountTitle')}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('deleteAccountDesc')}
          </p>
        </div>

        <button
          onClick={() => {
            setDeleteConfirmText('');
            setIsDeleteModalOpen(true);
          }}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('deleteAccountBtn')}</span>
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>{t('editProfile')}</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('emailAddress')} <span className="text-[10px] text-slate-400">(Read-only)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Date of Birth & Gender Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('genderLabel')}
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('bloodGroupLabel')}
                </label>
                <select
                  value={editFormData.bloodGroup}
                  onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Reset Password (Optional) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('newPasswordOptional')}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingProfile ? t('saving') : t('saveChanges')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-200 dark:border-red-900 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-2xl text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t('deleteConfirmTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('deleteConfirmWarning')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('deleteTypePrompt')}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200 focus:ring-2 focus:ring-red-500 outline-none tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? t('deleting') : t('confirmDeleteBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
