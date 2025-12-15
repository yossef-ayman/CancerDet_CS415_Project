import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';

const storage = getStorage();

export const uploadProfileImage = async (userId: string, imageUri: string): Promise<string> => {
  try {
    // Resize image to optimize storage
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 500 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: false }
    );

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `profile_images/${userId}_${timestamp}.jpg`;
    const storageRef = ref(storage, filename);

    // Convert to blob
    const response = await fetch(manipulatedImage.uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        reject,
        () => resolve(uploadTask.snapshot.ref)
      );
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
};

export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const fileRef = ref(storage, imageUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw new Error('Failed to delete profile image');
  }
};

export const uploadMedicalDocument = async (
  userId: string, 
  fileUri: string, 
  fileName: string, 
  mimeType: string
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'pdf';
    const filename = `medical_documents/${userId}_${timestamp}.${extension}`;
    const storageRef = ref(storage, filename);

    // Convert to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: mimeType,
    });

    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        reject,
        () => resolve(uploadTask.snapshot.ref)
      );
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading medical document:', error);
    throw new Error('Failed to upload medical document');
  }
};

// Upload chat file
export const uploadChatFile = async (
  chatId: string,
  userId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'pdf';
    const filename = `chat_files/${chatId}/${userId}_${timestamp}.${extension}`;
    const storageRef = ref(storage, filename);

    // Convert to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload to Firebase Storage with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: mimeType,
    });

    // Wait for upload to complete with progress
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        reject,
        () => resolve(uploadTask.snapshot.ref)
      );
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading chat file:', error);
    throw new Error('Failed to upload chat file');
  }
};