import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

export interface PickedAttachment {
  file: File;
  name: string;
  type: string;
  size: number;
}

export type AttachmentOption = 'camera' | 'photos' | 'files' | 'cancel';

/**
 * Show native action sheet for attachment options
 */
export async function showAttachmentActionSheet(): Promise<AttachmentOption> {
  if (!Capacitor.isNativePlatform()) {
    // On web, just return 'files' to trigger file input
    return 'files';
  }

  try {
    const result = await ActionSheet.showActions({
      title: 'Add Attachment',
      options: [
        { title: 'Take Photo' },
        { title: 'Photo Library' },
        { title: 'Choose File' },
        { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
      ],
    });

    const options: AttachmentOption[] = ['camera', 'photos', 'files', 'cancel'];
    return options[result.index] || 'cancel';
  } catch (error) {
    console.error('[nativeFilePicker] Action sheet error:', error);
    return 'cancel';
  }
}

/**
 * Take a photo using the device camera
 * Returns null if cancelled or failed
 */
export async function takePhoto(): Promise<PickedAttachment | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
    });

    if (!image.webPath) {
      console.warn('[nativeFilePicker] No webPath returned from camera');
      return null;
    }

    // Fetch the image and convert to File
    const response = await fetch(image.webPath);
    const blob = await response.blob();
    
    // Determine file extension and type
    const format = image.format || 'jpeg';
    const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    const fileName = `photo-${Date.now()}.${format}`;
    
    const file = new File([blob], fileName, { type: mimeType });

    return {
      file,
      name: fileName,
      type: mimeType,
      size: file.size,
    };
  } catch (error: any) {
    // User cancelled - this is expected behavior
    if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
      console.log('[nativeFilePicker] Camera cancelled by user');
      return null;
    }
    
    console.error('[nativeFilePicker] Camera error:', error);
    throw new Error('Could not access camera. Please check permissions in Settings.');
  }
}

/**
 * Pick an image from photo library
 */
export async function pickFromPhotos(): Promise<PickedAttachment | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Camera plugin for photo library (more reliable on iOS)
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        correctOrientation: true,
      });

      if (!image.webPath) {
        return null;
      }

      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      const format = image.format || 'jpeg';
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      const fileName = `image-${Date.now()}.${format}`;
      
      const file = new File([blob], fileName, { type: mimeType });

      return {
        file,
        name: fileName,
        type: mimeType,
        size: file.size,
      };
    } else {
      // Web fallback - use file picker with image filter
      const result = await FilePicker.pickImages({
        limit: 1,
      });

      if (!result.files.length) {
        return null;
      }

      return await convertPickedFile(result.files[0]);
    }
  } catch (error: any) {
    if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
      return null;
    }
    console.error('[nativeFilePicker] Photo library error:', error);
    throw new Error('Could not access photos. Please check permissions in Settings.');
  }
}

/**
 * Pick a file (documents, PDFs, etc.)
 */
export async function pickFile(): Promise<PickedAttachment | null> {
  try {
    const result = await FilePicker.pickFiles({
      limit: 1,
      types: [
        'image/*',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    });

    if (!result.files.length) {
      return null;
    }

    return await convertPickedFile(result.files[0]);
  } catch (error: any) {
    if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
      return null;
    }
    console.error('[nativeFilePicker] File picker error:', error);
    throw new Error('Could not access files. Please try again.');
  }
}

/**
 * Convert a PickedFile to our PickedAttachment format
 */
async function convertPickedFile(pickedFile: PickedFile): Promise<PickedAttachment | null> {
  try {
    // If we have a blob directly
    if (pickedFile.blob) {
      const file = new File(
        [pickedFile.blob], 
        pickedFile.name || `file-${Date.now()}`,
        { type: pickedFile.mimeType || 'application/octet-stream' }
      );
      return {
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    }

    // If we have a path, fetch it
    if (pickedFile.path) {
      const response = await fetch(pickedFile.path);
      const blob = await response.blob();
      const file = new File(
        [blob],
        pickedFile.name || `file-${Date.now()}`,
        { type: pickedFile.mimeType || blob.type || 'application/octet-stream' }
      );
      return {
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    }

    console.warn('[nativeFilePicker] No blob or path in picked file');
    return null;
  } catch (error) {
    console.error('[nativeFilePicker] Error converting picked file:', error);
    return null;
  }
}

/**
 * Check if native file picking is available
 */
export function isNativeFilePicker(): boolean {
  return Capacitor.isNativePlatform();
}
