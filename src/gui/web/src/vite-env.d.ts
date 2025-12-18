/// <reference types="vite/client" />

import type { FolderData } from '@/lib/firebase';

declare global {
  interface Window {
    handleFolderDrop?: (folderData: FolderData) => void;
  }
}





