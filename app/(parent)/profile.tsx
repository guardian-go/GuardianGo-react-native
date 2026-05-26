import React, { useState, useEffect } from 'react';
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
import { signOut, updateUserProfile } from '@/services/auth.service';
import { createStudent } from '@/services/student.service';
import {
  addAlternatePickup,
  getAlternatePickups,
  deleteAlternatePickup,
} from '@/services/alternatePickup.service';
import { AlternatePickup, Student } from '@/types';
import { subscribeToStudent } from '@/services/student.service';

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

const emptyForm = { fullName: '', email: '', photoUri: '', idPhotoUri: '' };
const emptyChildForm = { name: '', grade: '' };

export default function ParentProfileScreen() {
  const { user, setUser, reset } = useAuthStore();

  const [schoolId, setSchoolId] = useState(user?.schoolId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Children ───────────────────────────────────────────────────────────────
  const [linkedChildren, setLinkedChildren] = useState<Student[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState(emptyChildForm);
  const [savingChild, setSavingChild] = useState(false);
  const [childError, setChildError] = useState<string | null>(null);

  // Keep track of whether the school code section is in edit mode
  const hasSchool = !!user?.schoolId;
  const [editingSchool, setEditingSchool] = useState(!hasSchool);

  // alternate pickup state
  const [alternates, setAlternates] = useState<AlternatePickup[]>([]);
  const [loadingAlternates, setLoadingAlternates] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [savingAlternate, setSavingAlternate] = useState(false);
  const [alternateError, setAlternateError] = useState<string | null>(null);

  // Load all linked children on mount
  useEffect(() => {
    if (!user) return;

    const allIds: string[] = [];
    if (user.childIds && user.childIds.length > 0) {
      allIds.push(...user.childIds);
    } else if (user.childId) {
      allIds.push(user.childId);
    }
    if (allIds.length === 0) return;

    setLoadingChildren(true);
    const results = new Map<string, Student>();
    const unsubs: (() => void)[] = [];

    allIds.forEach((id) => {
      const unsub = subscribeToStudent(id, (s) => {
        if (s) results.set(id, s); else results.delete(id);
        setLinkedChildren(allIds.flatMap((cid) => {
          const c = results.get(cid);
          return c ? [c] : [];
        }));
        setLoadingChildren(false);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [user?.id]);

  // Load alternates
  useEffect(() => {
    if (!user) return;
    setLoadingAlternates(true);
    getAlternatePickups(user.id)
      .then(setAlternates)
      .finally(() => setLoadingAlternates(false));
  }, [user?.id]);

  const pickImage = async (field: 'photoUri' | 'idPhotoUri') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm((f) => ({ ...f, [field]: result.assets[0].uri }));
    }
  };

  // Save school code
  const handleSaveSchool = async () => {
    if (!user) return;
    if (!schoolId.trim()) {
      setError('Please enter your school code.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.id, { schoolId: schoolId.trim() });
      setUser({ ...user, schoolId: schoolId.trim() });
      setEditingSchool(false);
      Alert.alert('Saved', 'School code updated.');
    } catch (e: any) {
      setError(e?.message ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Add a new child
  const handleAddChild = async () => {
    if (!user) return;
    if (!schoolId.trim() && !user.schoolId) {
      setChildError('Please save your school code first.');
      return;
    }
    if (!childForm.name.trim() || !childForm.grade.trim()) {
      setChildError("Please enter the child's name and grade.");
      return;
    }
    setChildError(null);
    setSavingChild(true);
    try {
      const resolvedSchool = (user.schoolId ?? schoolId).trim();
      const newChildId = await createStudent({
        name: childForm.name.trim(),
        standard: childForm.grade.trim(),
        parentId: user.id,
        schoolId: resolvedSchool,
      });

      // Merge into childIds array, keep childId for legacy compat
      const existingIds = user.childIds ?? (user.childId ? [user.childId] : []);
      const updatedIds = [...existingIds, newChildId];

      await updateUserProfile(user.id, {
        // @ts-ignore – childIds not in base User type yet
        childIds: updatedIds,
        childId: updatedIds[0], // legacy field = first child
      });

      setUser({
        ...user,
        // @ts-ignore
        childIds: updatedIds,
        childId: updatedIds[0],
      });

      setChildForm(emptyChildForm);
      setShowAddChild(false);
      Alert.alert('Child added', `${childForm.name.trim()} has been linked to your account.`);
    } catch (e: any) {
      setChildError(e?.message ?? 'Could not add child. Please try again.');
    } finally {
      setSavingChild(false);
    }
  };

  const handleAddAlternate = async () => {
    if (!user?.childId || !user?.schoolId) {
      setAlternateError('Save your profile and link your child first.');
      return;
    }
    if (!form.fullName.trim() || !form.email.trim()) {
      setAlternateError('Full name and email are required.');
      return;
    }
    if (!form.photoUri) {
      setAlternateError('A photo is required.');
      return;
    }

    setAlternateError(null);
    setSavingAlternate(true);
    try {
      await addAlternatePickup({
        parentId: user.id,
        studentId: user.childId,
        schoolId: user.schoolId,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        photoUri: form.photoUri,
        idPhotoUri: form.idPhotoUri || undefined,
      });
      const updated = await getAlternatePickups(user.id);
      setAlternates(updated);
      setForm(emptyForm);
      setShowAddForm(false);
    } catch (e: any) {
      setAlternateError(e?.message ?? 'Could not save. Please try again.');
    } finally {
      setSavingAlternate(false);
    }
  };

  const handleDeleteAlternate = (pickup: AlternatePickup) => {
    Alert.alert(
      'Remove person',
      `Remove ${pickup.fullName} as an alternate pickup?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlternatePickup(pickup);
              setAlternates((prev) => prev.filter((p) => p.id !== pickup.id));
            } catch {
              Alert.alert('Error', 'Could not remove. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleSignOut = async () => {
    try { await signOut(); } finally { reset(); }
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
              Manage your children and pickup settings.
            </Text>
          </View>

          {/* Parent info card */}
          <Card style={{ marginTop: 16, marginBottom: 16 }}>
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-primary-light justify-center items-center">
                <Ionicons name="person" size={22} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary">{user?.name}</Text>
                <Text className="text-[13px] text-text-secondary">{user?.email}</Text>
              </View>
            </View>
          </Card>

          {/* ── School code ──────────────────────────────────────────────────── */}
          <View className="bg-card rounded-[18px] p-6 mb-6" style={cardShadow}>
            <Text className="text-[17px] font-bold text-text-primary mb-1">School</Text>
            <Text className="text-[13px] text-text-secondary mb-4">
              The school code is shared across all your children.
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
                  editingSchool ? 'bg-background text-text-primary' : 'bg-divider text-text-secondary'
                }`}
                value={schoolId}
                onChangeText={setSchoolId}
                placeholder="MAPLE-RIDGE"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="characters"
                editable={editingSchool}
              />
            </View>

            <Button
              title={editingSchool ? 'Save school code' : 'Update school code'}
              onPress={editingSchool ? handleSaveSchool : () => setEditingSchool(true)}
              loading={saving}
              variant={editingSchool ? 'primary' : 'outline'}
            />
          </View>

          {/* ── Children ─────────────────────────────────────────────────────── */}
          <View className="bg-card rounded-[18px] p-6 mb-6" style={cardShadow}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[17px] font-bold text-text-primary">Children</Text>
              {linkedChildren.length > 0 && (
                <View className="bg-primary-light px-2.5 py-0.5 rounded-full">
                  <Text className="text-[12px] font-bold text-primary">
                    {linkedChildren.length}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[13px] text-text-secondary mb-4">
              Add each child so their pickup status appears on the dashboard.
            </Text>

            {loadingChildren ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                {/* Linked children list */}
                {linkedChildren.map((child) => (
                  <View
                    key={child.id}
                    className="flex-row items-center gap-3 py-3 border-b border-divider"
                  >
                    <View className="w-10 h-10 rounded-full bg-primary-light justify-center items-center">
                      <Text className="text-[14px] font-bold text-primary">
                        {child.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-text-primary">
                        {child.name}
                      </Text>
                      <Text className="text-[13px] text-text-secondary">{child.standard}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text className="text-[12px] text-success font-semibold">Linked</Text>
                    </View>
                  </View>
                ))}

                {/* Add child form */}
                {showAddChild ? (
                  <View className="mt-4">
                    {childError && (
                      <View className="flex-row items-center bg-danger-light rounded-[10px] p-3 mb-4 gap-2">
                        <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                        <Text className="flex-1 text-[13px] text-danger">{childError}</Text>
                      </View>
                    )}

                    <View className="mb-3">
                      <Text className="text-[13px] font-semibold text-text-primary mb-2">
                        Child's name
                      </Text>
                      <TextInput
                        className="border-[1.5px] border-border rounded-[10px] py-[13px] px-[14px] text-[15px] bg-background text-text-primary"
                        value={childForm.name}
                        onChangeText={(v) => setChildForm((f) => ({ ...f, name: v }))}
                        placeholder="Emma Johnson"
                        placeholderTextColor={Colors.text.light}
                        autoCapitalize="words"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-[13px] font-semibold text-text-primary mb-2">
                        Grade
                      </Text>
                      <TextInput
                        className="border-[1.5px] border-border rounded-[10px] py-[13px] px-[14px] text-[15px] bg-background text-text-primary"
                        value={childForm.grade}
                        onChangeText={(v) => setChildForm((f) => ({ ...f, grade: v }))}
                        placeholder="Grade 3"
                        placeholderTextColor={Colors.text.light}
                        autoCapitalize="words"
                      />
                    </View>

                    <View className="flex-row gap-3">
                      <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => {
                          setShowAddChild(false);
                          setChildForm(emptyChildForm);
                          setChildError(null);
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Add child"
                        variant="primary"
                        onPress={handleAddChild}
                        loading={savingChild}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 mt-4 py-3 border-[1.5px] border-dashed border-border rounded-[10px]"
                    onPress={() => setShowAddChild(true)}
                  >
                    <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
                    <Text className="text-[14px] font-semibold text-primary">
                      {linkedChildren.length === 0 ? 'Link your first child' : 'Add another child'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* ── Alternate pickup persons ─────────────────────────────────────── */}
          <View className="bg-card rounded-[18px] p-6 mb-6" style={cardShadow}>
            <Text className="text-[17px] font-bold text-text-primary mb-1">
              Alternate pickup persons
            </Text>
            <Text className="text-[13px] text-text-secondary mb-4">
              People authorized to pick up your child when you can't.
            </Text>

            {loadingAlternates ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                {alternates.map((person) => (
                  <View
                    key={person.id}
                    className="flex-row items-center gap-3 py-3 border-b border-divider"
                  >
                    <Image
                      source={{ uri: person.photoUrl }}
                      className="w-11 h-11 rounded-full bg-divider"
                    />
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-text-primary">
                        {person.fullName}
                      </Text>
                      <Text className="text-[13px] text-text-secondary">{person.email}</Text>
                      {person.idPhotoUrl && (
                        <Text className="text-[11px] text-primary mt-0.5">ID on file</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteAlternate(person)}
                      className="p-2"
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}

                {showAddForm ? (
                  <View className="mt-4">
                    {alternateError && (
                      <View className="flex-row items-center bg-danger-light rounded-[10px] p-3 mb-4 gap-2">
                        <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                        <Text className="flex-1 text-[13px] text-danger">{alternateError}</Text>
                      </View>
                    )}

                    <View className="mb-3">
                      <Text className="text-[13px] font-semibold text-text-primary mb-2">Full name</Text>
                      <TextInput
                        className="border-[1.5px] border-border rounded-[10px] py-[13px] px-[14px] text-[15px] bg-background text-text-primary"
                        value={form.fullName}
                        onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
                        placeholder="Jane Smith"
                        placeholderTextColor={Colors.text.light}
                        autoCapitalize="words"
                      />
                    </View>

                    <View className="mb-3">
                      <Text className="text-[13px] font-semibold text-text-primary mb-2">Email</Text>
                      <TextInput
                        className="border-[1.5px] border-border rounded-[10px] py-[13px] px-[14px] text-[15px] bg-background text-text-primary"
                        value={form.email}
                        onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                        placeholder="jane@example.com"
                        placeholderTextColor={Colors.text.light}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View className="mb-3">
                      <Text className="text-[13px] font-semibold text-text-primary mb-2">
                        Photo <Text className="text-danger">*</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => pickImage('photoUri')}
                        className="flex-row items-center gap-3 border-[1.5px] border-border rounded-[10px] p-3"
                      >
                        {form.photoUri ? (
                          <Image source={{ uri: form.photoUri }} className="w-14 h-14 rounded-[8px]" />
                        ) : (
                          <View className="w-14 h-14 rounded-[8px] bg-divider justify-center items-center">
                            <Ionicons name="camera-outline" size={22} color={Colors.text.light} />
                          </View>
                        )}
                        <Text className="text-[13px] text-text-secondary">
                          {form.photoUri ? 'Tap to change photo' : 'Tap to choose photo'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="mb-4">
                      <Text className="text-[13px] font-semibold text-text-primary mb-2">
                        ID photo <Text className="text-text-secondary font-normal">(optional)</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => pickImage('idPhotoUri')}
                        className="flex-row items-center gap-3 border-[1.5px] border-border rounded-[10px] p-3"
                      >
                        {form.idPhotoUri ? (
                          <Image source={{ uri: form.idPhotoUri }} className="w-14 h-14 rounded-[8px]" />
                        ) : (
                          <View className="w-14 h-14 rounded-[8px] bg-divider justify-center items-center">
                            <Ionicons name="id-card-outline" size={22} color={Colors.text.light} />
                          </View>
                        )}
                        <Text className="text-[13px] text-text-secondary">
                          {form.idPhotoUri ? 'Tap to change ID photo' : 'Tap to add ID photo'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-3">
                      <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => {
                          setShowAddForm(false);
                          setForm(emptyForm);
                          setAlternateError(null);
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Save"
                        variant="primary"
                        onPress={handleAddAlternate}
                        loading={savingAlternate}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 mt-4 py-3 border-[1.5px] border-dashed border-border rounded-[10px]"
                    onPress={() => setShowAddForm(true)}
                  >
                    <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
                    <Text className="text-[14px] font-semibold text-primary">Add person</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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
