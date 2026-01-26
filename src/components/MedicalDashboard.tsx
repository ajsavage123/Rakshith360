import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Pill, Heart, AlertCircle, Users, Clock, TrendingUp, Download, Share2, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/lib/storage';

interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  vaccinations: string[];
}

const MedicalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [medicalData, setMedicalData] = useState<MedicalHistory>({
    allergies: [],
    medications: [],
    conditions: [],
    vaccinations: [],
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadMedicalData();
  }, [user]);

  const loadMedicalData = async () => {
    try {
      if (user?.uid) {
        const history = await storageService.getMedicalHistory(user.uid);
        if (history) {
          setMedicalData({
            allergies: (history.allergies || '').split(',').filter(Boolean),
            medications: (history.medications || '').split(',').filter(Boolean),
            conditions: (history.conditions || '').split(',').filter(Boolean),
            vaccinations: (history.vaccinations || '').split(',').filter(Boolean),
          });
        }

        // Load user profile
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        }
      }
    } catch (error) {
      console.error('Error loading medical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = () => {
    let riskScore = 0;

    // Calculate risk based on medical history
    if (medicalData.conditions.length > 2) riskScore += 2;
    if (medicalData.medications.length > 3) riskScore += 1;
    if (medicalData.allergies.length > 2) riskScore += 1;

    // Check for high-risk conditions
    const highRiskConditions = ['diabetes', 'heart disease', 'hypertension', 'asthma', 'copd', 'cancer'];
    const hasHighRisk = medicalData.conditions.some(condition =>
      highRiskConditions.some(risk => condition.toLowerCase().includes(risk))
    );
    if (hasHighRisk) riskScore += 2;

    if (riskScore >= 4) return { level: 'High', color: 'red', icon: '⚠️' };
    if (riskScore >= 2) return { level: 'Moderate', color: 'yellow', icon: '⚡' };
    return { level: 'Low', color: 'green', icon: '✓' };
  };

  const riskData = getRiskLevel();

  const handleExportPDF = () => {
    // This would generate a PDF of medical summary
    const summaryText = `
Medical Summary Report

Patient: ${userProfile?.fullName || 'Not provided'}
Date of Birth: ${userProfile?.dateOfBirth || 'Not provided'}
Blood Type: ${userProfile?.bloodType || 'Not provided'}

MEDICAL HISTORY

Allergies:
${medicalData.allergies.map(a => `- ${a}`).join('\n') || '- None recorded'}

Current Medications:
${medicalData.medications.map(m => `- ${m}`).join('\n') || '- None recorded'}

Medical Conditions:
${medicalData.conditions.map(c => `- ${c}`).join('\n') || '- None recorded'}

Vaccinations:
${medicalData.vaccinations.map(v => `- ${v}`).join('\n') || '- None recorded'}

Risk Level: ${riskData.level}
Generated: ${new Date().toLocaleDateString()}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(summaryText));
    element.setAttribute('download', 'medical_summary.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShareData = () => {
    const shareText = `I'm using Rakshith360 for personalized health assessments. It provides medical recommendations based on my health profile. Get it for free!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Rakshith360 - Medical Health Assistant',
        text: shareText,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Share text copied to clipboard!');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading medical data...</div>;
  }

  const isEmpty = !medicalData.allergies.length && !medicalData.medications.length && !medicalData.conditions.length && !medicalData.vaccinations.length;

  return (
    <div className="w-full space-y-6">
      {/* Header with Risk Assessment */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-600" />
                Medical Profile Summary
              </CardTitle>
              <CardDescription>Your health overview and medical history</CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold text-${riskData.color}-600`}>
                {riskData.icon}
              </div>
              <div className={`text-sm font-semibold text-${riskData.color}-700`}>
                {riskData.level} Risk
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{medicalData.allergies.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Allergies</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{medicalData.medications.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Medications</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">{medicalData.conditions.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Conditions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{medicalData.vaccinations.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vaccinations</div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts for Critical Information */}
      {medicalData.allergies.length > 0 && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Important:</strong> You have {medicalData.allergies.length} recorded allergies. Always inform healthcare providers about these.
          </AlertDescription>
        </Alert>
      )}

      {medicalData.conditions.length > 2 && (
        <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Note:</strong> You have multiple medical conditions. Regular monitoring and medical consultation are recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Medical Information */}
      {!isEmpty && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                      <p className="font-semibold">{userProfile.fullName || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Blood Type</p>
                      <p className="font-semibold">{userProfile.bloodType || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                      <p className="font-semibold">{userProfile.dateOfBirth || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Risk Assessment</p>
                      <p className="font-semibold">
                        <Badge variant={riskData.color === 'green' ? 'secondary' : 'destructive'}>
                          {riskData.level}
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalData.medications.length > 0 ? (
                  <div className="space-y-3">
                    {medicalData.medications.map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Pill className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">{med}</span>
                        </div>
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No medications recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Medical Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalData.conditions.length > 0 ? (
                  <div className="space-y-3">
                    {medicalData.conditions.map((condition, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-red-600" />
                          <span className="font-medium">{condition}</span>
                        </div>
                        <Badge variant="outline">Chronic</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No conditions recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Vaccination History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalData.vaccinations.length > 0 ? (
                  <div className="space-y-3">
                    {medicalData.vaccinations.map((vac, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-green-600" />
                          <span className="font-medium">{vac}</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-200 text-green-800">Completed</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No vaccinations recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              No medical information recorded. Update your profile to get personalized health recommendations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleExportPDF}
          variant="outline"
          className="flex-1 min-w-[150px]"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button
          onClick={handleShareData}
          variant="outline"
          className="flex-1 min-w-[150px]"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button
          variant="outline"
          className="flex-1 min-w-[150px]"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
          This app provides general health information and is not a substitute for professional medical advice. Always consult with qualified healthcare providers for diagnosis and treatment.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MedicalDashboard;
