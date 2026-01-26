import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { CheckCircle2, AlertCircle, Loader2, Heart, Activity, Pill } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/lib/storage';

interface UserProfile {
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  vaccinations: string[];
}

const UserProfileCompletion: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: '',
    dateOfBirth: '',
    bloodType: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [medicalData, setMedicalData] = useState<MedicalHistory>({
    allergies: [],
    medications: [],
    conditions: [],
    vaccinations: [],
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newVaccination, setNewVaccination] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      loadProfileData();
    }
  }, [user]);

  useEffect(() => {
    calculateCompletion();
  }, [profileData, medicalData]);

  const loadProfileData = async () => {
    try {
      // Load medical history from storage
      const history = await storageService.getMedicalHistory(user!.uid);
      if (history) {
        setMedicalData({
          allergies: (history.allergies || '').split(',').filter(Boolean),
          medications: (history.medications || '').split(',').filter(Boolean),
          conditions: (history.conditions || '').split(',').filter(Boolean),
          vaccinations: (history.vaccinations || '').split(',').filter(Boolean),
        });
      }

      // Load profile data from localStorage (for now)
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateCompletion = () => {
    let completed = 0;
    let total = 10; // Total fields to fill

    // Profile fields
    if (profileData.fullName) completed++;
    if (profileData.dateOfBirth) completed++;
    if (profileData.bloodType) completed++;
    if (profileData.emergencyContact) completed++;
    if (profileData.emergencyPhone) completed++;

    // Medical fields
    if (medicalData.allergies.length > 0) completed++;
    if (medicalData.medications.length > 0) completed++;
    if (medicalData.conditions.length > 0) completed++;
    if (medicalData.vaccinations.length > 0) completed++;
    completed++; // Age/demographics

    setCompletionPercentage(Math.round((completed / total) * 100));
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setMedicalData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }));
      setNewAllergy('');
    }
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setMedicalData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()],
      }));
      setNewMedication('');
    }
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setMedicalData(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCondition.trim()],
      }));
      setNewCondition('');
    }
  };

  const addVaccination = () => {
    if (newVaccination.trim()) {
      setMedicalData(prev => ({
        ...prev,
        vaccinations: [...prev.vaccinations, newVaccination.trim()],
      }));
      setNewVaccination('');
    }
  };

  const removeItem = (category: keyof MedicalHistory, index: number) => {
    setMedicalData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Save profile to localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileData));

      // Convert arrays to comma-separated strings for database
      await storageService.saveMedicalHistory(user.uid, {
        allergies: medicalData.allergies.join(','),
        medications: medicalData.medications.join(','),
        pastConditions: medicalData.conditions.join(','),
        vaccinations: medicalData.vaccinations.join(','),
      });

      setMessage({ type: 'success', text: 'Profile and medical information saved successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile information' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = completionPercentage === 100;

  return (
    <div className="w-full space-y-6">
      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Profile Completion
              </CardTitle>
              <CardDescription>Complete your profile for personalized medical recommendations</CardDescription>
            </div>
            <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          {isComplete && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Your profile is complete!
            </p>
          )}
        </CardContent>
      </Card>

      {message && (
        <Alert className={`${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <AlertCircle className={`w-4 h-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Help us know you better</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={profileData.fullName}
              onChange={(e) => handleProfileChange('fullName', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Input
                id="bloodType"
                placeholder="O+, A-, B+, etc."
                value={profileData.bloodType}
                onChange={(e) => handleProfileChange('bloodType', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
            <Input
              id="emergencyContact"
              placeholder="Family member name"
              value={profileData.emergencyContact}
              onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyPhone"
              placeholder="+1 (555) 123-4567"
              value={profileData.emergencyPhone}
              onChange={(e) => handleProfileChange('emergencyPhone', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Medical History
          </CardTitle>
          <CardDescription>Important for accurate health assessments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allergies */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Allergies
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter allergy (e.g., Penicillin)"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                className="text-sm"
              />
              <Button onClick={addAllergy} variant="outline" size="sm" className="whitespace-nowrap">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {medicalData.allergies.map((allergy, idx) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900" onClick={() => removeItem('allergies', idx)}>
                  {allergy} <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Current Medications
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter medication (e.g., Aspirin 100mg)"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                className="text-sm"
              />
              <Button onClick={addMedication} variant="outline" size="sm" className="whitespace-nowrap">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {medicalData.medications.map((med, idx) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900" onClick={() => removeItem('medications', idx)}>
                  {med} <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Medical Conditions
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter condition (e.g., Diabetes)"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                className="text-sm"
              />
              <Button onClick={addCondition} variant="outline" size="sm" className="whitespace-nowrap">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {medicalData.conditions.map((condition, idx) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900" onClick={() => removeItem('conditions', idx)}>
                  {condition} <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Vaccinations */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Vaccinations
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter vaccination (e.g., COVID-19 2024)"
                value={newVaccination}
                onChange={(e) => setNewVaccination(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addVaccination()}
                className="text-sm"
              />
              <Button onClick={addVaccination} variant="outline" size="sm" className="whitespace-nowrap">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {medicalData.vaccinations.map((vac, idx) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900" onClick={() => removeItem('vaccinations', idx)}>
                  {vac} <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Save Profile Information
          </>
        )}
      </Button>

      {/* Info Note */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Your medical information is stored securely and will be used to provide personalized health recommendations.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default UserProfileCompletion;
