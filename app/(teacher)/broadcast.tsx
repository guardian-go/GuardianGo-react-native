import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/auth.store';

export default function Broadcast() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both title and message.');
      return;
    }
    if (!user?.schoolId) {
      Alert.alert('Error', 'School info missing. Please log out and back in.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'broadcastMessages'), {
        title: title.trim(),
        body: body.trim(),
        schoolId: user.schoolId,
        sentBy: user.id,
        sentByName: user.name ?? 'Teacher',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Sent!', 'Broadcast delivered to all parents.');
      setTitle('');
      setBody('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send message. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Send Broadcast</Text>
      <Text style={styles.subheading}>
        This message will be sent to all parents at your school.
      </Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. School Closed Tomorrow"
        maxLength={100}
      />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={body}
        onChangeText={setBody}
        placeholder="Write your message here..."
        multiline
        numberOfLines={5}
        maxLength={500}
      />
      <Text style={styles.charCount}>{body.length}/500</Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>📢 Send to All Parents</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 20 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subheading: { fontSize: 13, color: '#888', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, marginBottom: 4, fontSize: 15, backgroundColor: '#fafafa',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginBottom: 16 },
  button: {
    backgroundColor: '#1976D2', padding: 16,
    borderRadius: 8, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});