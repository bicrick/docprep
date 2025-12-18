import { useCallback } from 'react';
import type { FolderData, UpdateInfo, ExtractionResults } from '@/lib/firebase';

// Re-export types
export type { FolderData, UpdateInfo, ExtractionResults };

/**
 * Hook for interacting with the Python pywebview backend
 */
export function usePyWebview() {
  const isAvailable = typeof window.pywebview !== 'undefined';

  const selectFolder = useCallback(async (): Promise<FolderData | null> => {
    if (!window.pywebview) return null;
    return window.pywebview.api.select_folder();
  }, []);

  const validateFolder = useCallback(async (path: string): Promise<FolderData | null> => {
    if (!window.pywebview) return null;
    return window.pywebview.api.validate_folder(path);
  }, []);

  const browseOutputFolder = useCallback(async (): Promise<{ parent_path: string; children_names: string[] } | null> => {
    if (!window.pywebview) return null;
    return window.pywebview.api.browse_output_folder();
  }, []);

  const startExtraction = useCallback(async (extractPptxImages: boolean, outputPath: string): Promise<void> => {
    if (!window.pywebview) return;
    return window.pywebview.api.start_extraction(extractPptxImages, outputPath);
  }, []);

  const skipExtraction = useCallback(async (): Promise<void> => {
    if (!window.pywebview) return;
    return window.pywebview.api.skip_extraction();
  }, []);

  const cancelExtraction = useCallback(async (): Promise<void> => {
    if (!window.pywebview) return;
    return window.pywebview.api.cancel_extraction();
  }, []);

  const openOutputFolder = useCallback(async (): Promise<void> => {
    if (!window.pywebview) return;
    return window.pywebview.api.open_output_folder();
  }, []);

  const openInEditor = useCallback(async (editor: string): Promise<{ error?: string } | null> => {
    if (!window.pywebview) return null;
    return window.pywebview.api.open_in_editor(editor);
  }, []);

  const checkLibreOfficeAvailable = useCallback(async (): Promise<boolean> => {
    if (!window.pywebview) return false;
    try {
      return await window.pywebview.api.check_libreoffice_available();
    } catch {
      return false;
    }
  }, []);

  const startGoogleSignIn = useCallback(async (): Promise<void> => {
    if (!window.pywebview) return;
    return window.pywebview.api.start_google_signin();
  }, []);

  const checkForUpdates = useCallback(async (): Promise<UpdateInfo | null> => {
    if (!window.pywebview) return null;
    return window.pywebview.api.check_for_updates();
  }, []);

  return {
    isAvailable,
    selectFolder,
    validateFolder,
    browseOutputFolder,
    startExtraction,
    skipExtraction,
    cancelExtraction,
    openOutputFolder,
    openInEditor,
    checkLibreOfficeAvailable,
    startGoogleSignIn,
    checkForUpdates,
  };
}





