import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Called only after the user has reviewed the visible draft and requests export. */
export async function exportLocalText(contents: string, name = 'policywatcher-support.txt') {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('SHARING_UNAVAILABLE');
  const file = new File(Paths.cache, name);
  try {
    file.write(contents);
    await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: 'PolicyWatcher' });
  } finally { if (file.exists) file.delete(); }
}
