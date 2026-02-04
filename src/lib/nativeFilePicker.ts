/**
 * Native File Picker - STUBBED (Capacitor removed)
 * 
 * All functions return web-compatible values.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

export interface PickedAttachment {
  file: File;
  name: string;
  type: string;
  size: number;
}

export type AttachmentOption = 'camera' | 'photos' | 'files' | 'cancel';

export async function showAttachmentActionSheet(): Promise<AttachmentOption> {
  // On web, just return 'files' to trigger file input
  return 'files';
}

export async function takePhoto(): Promise<PickedAttachment | null> {
  console.log('[nativeFilePicker] Camera not available (Capacitor removed)');
  return null;
}

export async function pickFromPhotos(): Promise<PickedAttachment | null> {
  console.log('[nativeFilePicker] Photo library not available (Capacitor removed)');
  return null;
}

export async function pickFile(): Promise<PickedAttachment | null> {
  console.log('[nativeFilePicker] File picker not available (Capacitor removed)');
  return null;
}

export function isNativeFilePicker(): boolean {
  return false;
}
