import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, View, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { subscribeToMessages, sendMessage } from '@/services/chat';
import { uploadChatFile } from '@/services/storage';
import { ChatMessage, Chat } from '@/types/chat';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingFile, setSendingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [headerHeight, setHeaderHeight] = useState(90);


  useEffect(() => {
    if (!id || !userProfile) return;

    // Fetch Chat Info (for header)
    getDoc(doc(db, 'chats', id))
        .then(snap => {
            if (snap.exists()) {
                setChatInfo({ id: snap.id, ...snap.data() } as Chat);
            } else {
                Alert.alert(t('chat.chatNotFound'), '');
                router.back();
            }
        })
        .catch(error => {
            console.error("Error fetching chat info:", error);
            Alert.alert(t('chat.connectionError'), t('chat.connectionErrorDesc'));
        });

    // Subscribe to Messages
    const unsubscribe = subscribeToMessages(id, (data) => {
      setMessages(data);
      setLoading(false);
    }, (error) => {
        setLoading(false);
        Alert.alert(t('chat.connectionError'), t('chat.connectionErrorDesc'));
    });

    return () => unsubscribe();
  }, [id, userProfile]);

  const handleSend = async () => {
    if (!inputText.trim() || !id || !userProfile) return;

    try {
      const text = inputText.trim();
      setInputText('');
      await sendMessage(id, { text, type: 'text' }, userProfile);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      Alert.alert(t('chat.sendFailed'), error.message || t('chat.sendFailedDesc'));
    }
  };

  const handlePickDocument = async () => {
      if (!id || !userProfile) return;

      try {
          const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
          });

          if (result.canceled) return;
          
          const file = result.assets[0];
          
          // Check size (limit to 10MB)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size && file.size > maxSize) {
              Alert.alert(t('chat.fileTooLarge'), t('chat.fileTooLargeDesc'));
              return;
          }

          setSendingFile(true);
          setUploadProgress(0);

          // Upload file to Firebase Storage
          const fileUrl = await uploadChatFile(
              id,
              userProfile.uid,
              file.uri,
              file.name,
              file.mimeType || 'application/pdf',
              (progress) => setUploadProgress(progress)
          );

          // Send message with file URL
          await sendMessage(id, { 
              text: t('chat.medicalReport'), 
              type: 'file',
              fileUrl: fileUrl,
              fileName: file.name,
              fileSize: file.size || 0,
              mimeType: file.mimeType || 'application/pdf'
          }, userProfile);

          setUploadProgress(0);
      } catch (error: any) {
          console.error('Error picking/sending file:', error);
          Alert.alert(t('chat.uploadFailed'), error.message || t('chat.uploadFailedDesc'));
      } finally {
          setSendingFile(false);
      }
  };

  const handleOpenFile = async (fileUrl: string) => {
      try {
          await WebBrowser.openBrowserAsync(fileUrl);
      } catch (error) {
          console.error("Error opening file:", error);
          Alert.alert(t('chat.openFileError'), t('chat.openFileErrorDesc'));
      }
  };

  const getOtherParticipant = () => {
      if (!chatInfo || !userProfile) return null;
      return chatInfo.participantInfo.find(p => p.uid !== userProfile.uid);
  };

  const otherParticipant = getOtherParticipant();

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.user._id === userProfile?.uid;
    const isFile = item.type === 'file';
    
    return (
      <View style={[
        styles.messageWrapper, 
        isMe ? styles.myMessageWrapper : styles.theirMessageWrapper
      ]}>
        <View style={[
          styles.bubble, 
          isMe ? styles.myBubble : styles.theirBubble,
          { backgroundColor: isMe ? Colors[theme].tint : (theme === 'dark' ? '#333' : '#e5e5ea') }
        ]}>
          {isFile ? (
                <TouchableOpacity 
                  style={styles.fileContainer}
                 onPress={() => item.fileUrl && handleOpenFile(item.fileUrl)}>
                   <IconSymbol name="doc.fill" size={24} color={isMe ? 'white' : Colors[theme].text} />
                   <View style={styles.fileInfo}>
                       <ThemedText style={[styles.fileName, isMe ? { color: 'white' } : { color: Colors[theme].text }]}>
                           {item.fileName || t('chat.medicalReport')}
                       </ThemedText>
                       <ThemedText style={[styles.fileSize, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: Colors[theme].icon }]}>
                           {t('chat.tapToView')}
                       </ThemedText>
                   </View>
                 </TouchableOpacity>
          ) : (
            <ThemedText style={[styles.messageText, isMe ? { color: 'white' } : { color: Colors[theme].text }]}>
                {item.text}
            </ThemedText>
          )}
        </View>
        <ThemedText style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={Colors[theme].tint} />
        </TouchableOpacity>
        
        {otherParticipant && (
            <View style={styles.headerContent}>
                <Image 
                    source={{ uri: otherParticipant.photoURL || 'https://i.pravatar.cc/150' }} 
                    style={styles.headerAvatar}
                />
                <ThemedText type="defaultSemiBold" style={styles.headerName}>
                    {otherParticipant.displayName}
                </ThemedText>
            </View>
        )}
      </View>

      {/* Keyboard Avoiding Container */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight + 10 : 0}
      >
          {/* Messages List */}
          {loading ? (
              <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors[theme].tint} />
              </View>
          ) : (
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                inverted
                contentContainerStyle={styles.scrollViewContent}
                keyboardDismissMode="interactive"
              />
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, { borderTopColor: Colors[theme].icon + '20' }]}>
            {/* Patient Only: Add File Button */}
            {userProfile?.role === 'patient' && (
                <TouchableOpacity 
                  style={styles.attachButton} 
                  onPress={handlePickDocument}
                  disabled={sendingFile}>
                   {sendingFile ? (
                       <View style={{ alignItems: 'center' }}>
                           <ActivityIndicator size="small" color={Colors[theme].tint} />
                           {uploadProgress > 0 && (
                               <ThemedText style={{ fontSize: 10, marginTop: 2 }}>
                                   {Math.round(uploadProgress)}%
                               </ThemedText>
                           )}
                       </View>
                   ) : (
                       <IconSymbol name="paperclip" size={24} color={Colors[theme].icon} />
                   )}
                </TouchableOpacity>
            )}

            <TextInput
              style={[
                  styles.input, 
                  { 
                      backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7',
                      color: Colors[theme].text 
                  }
              ]}
               placeholder={t('chat.typeMessage')}
              placeholderTextColor={Colors[theme].icon + '80'}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={!inputText.trim()}
              style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
            >
              <IconSymbol name="paperplane.fill" size={24} color={Colors[theme].tint} />
            </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
      marginRight: 10,
  },
  headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  headerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 10,
      backgroundColor: '#ccc',
  },
  headerName: {
      fontSize: 16,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageWrapper: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 10,
  },
  attachButton: {
      padding: 10,
      marginBottom: 2,
  },
  fileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4
  },
  fileInfo: {
      maxWidth: 200
  },
  fileName: {
      fontSize: 14,
      fontWeight: '600',
  },
  fileSize: {
      fontSize: 10,
  }
});
