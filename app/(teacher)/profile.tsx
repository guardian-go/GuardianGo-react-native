import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { signOut, updateUserProfile, uploadUserPhoto, findGradeTeacher } from '@/services/auth.service';

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export default function TeacherProfileScreen() {
  const { user, setUser, reset } = useAuthStore();

  const [schoolId, setSchoolId] = useState(user?.schoolId ?? '');
  const [grade, setGrade] = useState(user?.standard ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const hasSavedProfile = !!user?.schoolId && !!user?.standard;
  const [isEditing, setIsEditing] = useState(!hasSavedProfile);

  const handleEdit = () => {
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!schoolId.trim() || !grade.trim()) {
      setError('Please enter your school code and grade.');
      return;
    }

    const wasUpdate = hasSavedProfile;
    setError(null);
    setSaving(true);
    try {
      const existing = await findGradeTeacher(schoolId.trim(), grade.trim());
      if (existing && existing.id !== user.id) {
        setError(`Cannot enroll — Someone is already the teacher for ${grade.trim()}there`);
        return;
      }
      await updateUserProfile(user.id, {
        schoolId: schoolId.trim(),
        standard: grade.trim(),
      });
      setUser({
        ...user,
        schoolId: schoolId.trim(),
        standard: grade.trim(),
      });
      Alert.alert(
        wasUpdate ? 'Profile updated' : 'Profile saved',
        wasUpdate
          ? 'Your information has been updated.'
          : 'Your class is now linked.',
      );
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message ?? 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !user) return;
    setUploadingProfile(true);
    try {
      const photoUrl = await uploadUserPhoto(user.id, result.assets[0].uri);
      setUser({ ...user, photoUrl });
    } catch {
      Alert.alert('Error', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      reset();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-5 pb-2">
            <Text className="text-[26px] font-bold text-text-primary">Profile</Text>
            <Text className="text-[13px] text-text-secondary mt-1">
              Set your school and grade so the dashboard loads your class.
            </Text>
          </View>

          <Card style={{ marginTop: 16, marginBottom: 16 }}>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={handlePickProfilePhoto} disabled={uploadingProfile}>
                <View className="w-12 h-12 rounded-full bg-primary-light justify-center items-center overflow-hidden">
                  {uploadingProfile ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : user?.photoUrl ? (
                    <Image source={{ uri: user.photoUrl }} className="w-12 h-12 rounded-full" />
                  ) : (
                    <Ionicons name="school" size={22} color={Colors.primary} />
                  )}
                </View>
                {!uploadingProfile && (
                  <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary justify-center items-center">
                    <Ionicons name="camera" size={9} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary">{user?.name}</Text>
                <Text className="text-[13px] text-text-secondary">{user?.email}</Text>
              </View>
            </View>
          </Card>

          <View className="bg-card rounded-[18px] p-6 mb-6" style={cardShadow}>
            <Text className="text-[17px] font-bold text-text-primary mb-1">School & class</Text>
            <Text className="text-[13px] text-text-secondary mb-4">
              Enter your school code and the grade you teach.
            </Text>

            {error && (
              <View className="flex-row items-center bg-danger-light rounded-[10px] p-3 mb-4 gap-2">
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text className="flex-1 text-[13px] text-danger">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">School code</Text>
              <TextInput
                className={`border-[1.5px] border-border rounded-[10px] py-[13px] px-[14px] text-[15px] ${
                  isEditing ? 'bg-background text-text-primary' : 'bg-divider text-text-secondary'
                }`}
                value={schoolId}
                onChangeText={setSchoolId}
                placeholder="MAPLE-RIDGE"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="characters"
                editable={isEditing}
              />
            </View>

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Grade</Text>
              <TextInput
                className={`border-[1.5px] border-border rounded-[10px] py-[13px] px-[14px] text-[15px] ${
                  isEditing ? 'bg-background text-text-primary' : 'bg-divider text-text-secondary'
                }`}
                value={grade}
                onChangeText={setGrade}
                placeholder="Grade 3"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="words"
                editable={isEditing}
              />
            </View>

            <Button
              title={isEditing ? 'Save' : 'Update'}
              onPress={isEditing ? handleSave : handleEdit}
              loading={saving}
              variant={isEditing ? 'primary' : 'outline'}
              style={{ marginTop: 8 }}
            />
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-4"
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text className="text-sm font-semibold text-danger">Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
