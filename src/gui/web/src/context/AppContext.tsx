import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type { FolderData, ExtractionResults } from '@/lib/firebase';
import { usePyWebview } from '@/hooks/usePyWebview';

// Canonical slide order - determines navigation direction automatically
// Add new slides here in the order they should appear in the flow
export const SLIDE_ORDER = [
  'welcome',
  'intro', 
  'tutorial',
  'signin',
  'email-signin',
  'onboarding',
  'drop',
  'ready',
  'progress',
  'complete',
] as const;

// Slide types derived from the order array
export type SlideId = typeof SLIDE_ORDER[number];

// Editor types
export type EditorId = 'cursor' | 'windsurf' | 'antigravity';

// Navigation direction
export type SlideDirection = 'forward' | 'backward';

// Helper to get slide index
function getSlideIndex(slideId: SlideId): number {
  return SLIDE_ORDER.indexOf(slideId);
}

// Compute direction based on slide order
function computeDirection(from: SlideId, to: SlideId): SlideDirection {
  return getSlideIndex(to) > getSlideIndex(from) ? 'forward' : 'backward';
}

// App state interface
export interface AppState {
  currentSlide: SlideId;
  previousSlide: SlideId | null;
  slideDirection: SlideDirection;
  folderPath: string | null;
  folderName: string | null;
  parentPath: string | null;
  siblingNames: string[];
  fileCount: number;
  isExtracting: boolean;
  extractPptxImages: boolean;
  libreOfficeAvailable: boolean;
  outputFolderName: string;
  outputFolderPath: string;
  outputNameValid: boolean;
  outputNameError: string;
  selectedEditor: EditorId;
  extractionResults: ExtractionResults | null;
  // Progress state
  progressCurrent: number;
  progressTotal: number;
  currentFileName: string;
  currentSubStep: string;
  // Update notice
  updateAvailable: boolean;
  updateVersion: string;
  updateDownloadUrl: string;
}

// Action types
type AppAction =
  | { type: 'GO_TO_SLIDE'; slide: SlideId; direction?: SlideDirection }
  | { type: 'SET_FOLDER'; data: FolderData }
  | { type: 'SET_OUTPUT_NAME'; name: string }
  | { type: 'SET_OUTPUT_PATH'; path: string }
  | { type: 'SET_OUTPUT_VALIDATION'; valid: boolean; error: string }
  | { type: 'SET_PARENT_PATH'; path: string; siblings: string[] }
  | { type: 'SET_PPTX_IMAGES'; extract: boolean }
  | { type: 'SET_LIBRE_OFFICE'; available: boolean }
  | { type: 'SET_SELECTED_EDITOR'; editor: EditorId }
  | { type: 'START_EXTRACTION' }
  | { type: 'UPDATE_PROGRESS'; current: number; total: number }
  | { type: 'UPDATE_CURRENT_FILE'; filename: string }
  | { type: 'UPDATE_SUB_STEP'; message: string }
  | { type: 'EXTRACTION_COMPLETE'; results: ExtractionResults }
  | { type: 'EXTRACTION_CANCELLED' }
  | { type: 'EXTRACTION_ERROR'; message: string }
  | { type: 'RESET_STATE' }
  | { type: 'SET_UPDATE_AVAILABLE'; version: string; downloadUrl: string };

// Initial state
const getInitialState = (): AppState => ({
  currentSlide: 'welcome',
  previousSlide: null,
  slideDirection: 'forward',
  folderPath: null,
  folderName: null,
  parentPath: null,
  siblingNames: [],
  fileCount: 0,
  isExtracting: false,
  extractPptxImages: false,
  libreOfficeAvailable: false,
  outputFolderName: '',
  outputFolderPath: '',
  outputNameValid: true,
  outputNameError: '',
  selectedEditor: (localStorage.getItem('docprep_selected_editor') as EditorId) || 'cursor',
  extractionResults: null,
  progressCurrent: 0,
  progressTotal: 1,
  currentFileName: 'Starting...',
  currentSubStep: '',
  updateAvailable: false,
  updateVersion: '',
  updateDownloadUrl: '',
});

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'GO_TO_SLIDE': {
      // Auto-compute direction based on slide order, unless explicitly overridden
      const direction = action.direction ?? computeDirection(state.currentSlide, action.slide);
      return {
        ...state,
        previousSlide: state.currentSlide,
        currentSlide: action.slide,
        slideDirection: direction,
      };
    }
    
    case 'SET_FOLDER': {
      const sanitizedName = action.data.name.replace(/ /g, '_');
      const defaultOutputName = sanitizedName + '_extracted';
      const separator = action.data.parent_path.includes('\\') ? '\\' : '/';
      const outputPath = action.data.parent_path + separator + defaultOutputName;
      
      return {
        ...state,
        folderPath: action.data.path,
        folderName: action.data.name,
        parentPath: action.data.parent_path,
        siblingNames: action.data.sibling_names || [],
        fileCount: action.data.file_count,
        outputFolderName: defaultOutputName,
        outputFolderPath: outputPath,
        outputNameValid: true,
        outputNameError: '',
      };
    }
    
    case 'SET_OUTPUT_NAME':
      return { ...state, outputFolderName: action.name };
    
    case 'SET_OUTPUT_PATH':
      return { ...state, outputFolderPath: action.path };
    
    case 'SET_OUTPUT_VALIDATION':
      return { ...state, outputNameValid: action.valid, outputNameError: action.error };
    
    case 'SET_PARENT_PATH':
      return { ...state, parentPath: action.path, siblingNames: action.siblings };
    
    case 'SET_PPTX_IMAGES':
      return { ...state, extractPptxImages: action.extract };
    
    case 'SET_LIBRE_OFFICE':
      return { ...state, libreOfficeAvailable: action.available };
    
    case 'SET_SELECTED_EDITOR':
      localStorage.setItem('docprep_selected_editor', action.editor);
      return { ...state, selectedEditor: action.editor };
    
    case 'START_EXTRACTION':
      return {
        ...state,
        isExtracting: true,
        progressCurrent: 0,
        progressTotal: 1,
        currentFileName: 'Starting...',
        currentSubStep: '',
      };
    
    case 'UPDATE_PROGRESS':
      return { ...state, progressCurrent: action.current, progressTotal: action.total };
    
    case 'UPDATE_CURRENT_FILE':
      return { ...state, currentFileName: action.filename, currentSubStep: '' };
    
    case 'UPDATE_SUB_STEP':
      return { ...state, currentSubStep: action.message };
    
    case 'EXTRACTION_COMPLETE':
      return {
        ...state,
        isExtracting: false,
        extractionResults: action.results,
        currentSlide: 'complete',
        previousSlide: state.currentSlide,
      };
    
    case 'EXTRACTION_CANCELLED':
      return {
        ...state,
        isExtracting: false,
        currentSlide: 'drop',
        previousSlide: state.currentSlide,
      };
    
    case 'EXTRACTION_ERROR':
      console.error('Extraction error:', action.message);
      return {
        ...state,
        isExtracting: false,
        currentSlide: 'drop',
        previousSlide: state.currentSlide,
      };
    
    case 'RESET_STATE':
      return {
        ...getInitialState(),
        selectedEditor: state.selectedEditor,
        libreOfficeAvailable: state.libreOfficeAvailable,
        updateAvailable: state.updateAvailable,
        updateVersion: state.updateVersion,
        updateDownloadUrl: state.updateDownloadUrl,
      };
    
    case 'SET_UPDATE_AVAILABLE':
      return {
        ...state,
        updateAvailable: true,
        updateVersion: action.version,
        updateDownloadUrl: action.downloadUrl,
      };
    
    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: AppState;
  /** Navigate to a slide. Direction is auto-computed from SLIDE_ORDER unless explicitly overridden. */
  goToSlide: (slide: SlideId, direction?: SlideDirection) => void;
  setFolder: (data: FolderData) => void;
  setOutputName: (name: string) => void;
  validateOutputName: () => boolean;
  updateOutputPath: () => void;
  setParentPath: (path: string, siblings: string[]) => void;
  setPptxImages: (extract: boolean) => void;
  setSelectedEditor: (editor: EditorId) => void;
  startExtraction: () => Promise<void>;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  const pywebview = usePyWebview();

  // Check for LibreOffice availability on mount
  useEffect(() => {
    const checkLibreOffice = async () => {
      const available = await pywebview.checkLibreOfficeAvailable();
      dispatch({ type: 'SET_LIBRE_OFFICE', available });
    };
    checkLibreOffice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Check for updates on mount
  useEffect(() => {
    const checkUpdates = async () => {
      const update = await pywebview.checkForUpdates();
      if (update) {
        dispatch({
          type: 'SET_UPDATE_AVAILABLE',
          version: update.version,
          downloadUrl: update.download_url,
        });
      }
    };
    checkUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Set up global callbacks for Python to call
  useEffect(() => {
    window.updateProgress = (current: number, total: number) => {
      dispatch({ type: 'UPDATE_PROGRESS', current, total });
    };

    window.updateCurrentFile = (filename: string) => {
      dispatch({ type: 'UPDATE_CURRENT_FILE', filename });
    };

    window.updateSubStep = (message: string) => {
      dispatch({ type: 'UPDATE_SUB_STEP', message });
    };

    window.showComplete = (results: ExtractionResults) => {
      dispatch({ type: 'EXTRACTION_COMPLETE', results });
    };

    window.showCancelled = () => {
      dispatch({ type: 'EXTRACTION_CANCELLED' });
    };

    window.showError = (message: string) => {
      dispatch({ type: 'EXTRACTION_ERROR', message });
    };

    return () => {
      // Cleanup global callbacks
      delete (window as Partial<typeof window>).updateProgress;
      delete (window as Partial<typeof window>).updateCurrentFile;
      delete (window as Partial<typeof window>).updateSubStep;
      delete (window as Partial<typeof window>).showComplete;
      delete (window as Partial<typeof window>).showCancelled;
      delete (window as Partial<typeof window>).showError;
    };
  }, []);

  const goToSlide = useCallback((slide: SlideId, direction: SlideDirection = 'forward') => {
    dispatch({ type: 'GO_TO_SLIDE', slide, direction });
  }, []);

  const setFolder = useCallback((data: FolderData) => {
    dispatch({ type: 'SET_FOLDER', data });
  }, []);

  const setOutputName = useCallback((name: string) => {
    dispatch({ type: 'SET_OUTPUT_NAME', name });
  }, []);

  const validateOutputName = useCallback((): boolean => {
    const name = state.outputFolderName;
    let valid = true;
    let error = '';

    if (!name || name.length === 0) {
      valid = false;
      error = 'Please enter a folder name';
    } else if (/[<>:"/\\|?*]/.test(name)) {
      valid = false;
      error = 'Name contains invalid characters';
    } else if (name === state.folderName) {
      valid = false;
      error = 'Cannot use the same name as the source folder';
    } else if (state.siblingNames.includes(name)) {
      valid = false;
      error = 'A folder with this name already exists';
    }

    dispatch({ type: 'SET_OUTPUT_VALIDATION', valid, error });
    return valid;
  }, [state.outputFolderName, state.folderName, state.siblingNames]);

  const updateOutputPath = useCallback(() => {
    if (state.parentPath) {
      const separator = state.parentPath.includes('\\') ? '\\' : '/';
      const outputPath = state.parentPath + separator + (state.outputFolderName || '...');
      dispatch({ type: 'SET_OUTPUT_PATH', path: outputPath });
    }
  }, [state.parentPath, state.outputFolderName]);

  const setParentPath = useCallback((path: string, siblings: string[]) => {
    dispatch({ type: 'SET_PARENT_PATH', path, siblings });
  }, []);

  const setPptxImages = useCallback((extract: boolean) => {
    dispatch({ type: 'SET_PPTX_IMAGES', extract });
  }, []);

  const setSelectedEditor = useCallback((editor: EditorId) => {
    dispatch({ type: 'SET_SELECTED_EDITOR', editor });
  }, []);

  const startExtraction = useCallback(async () => {
    if (!state.folderPath || state.isExtracting) return;
    
    dispatch({ type: 'START_EXTRACTION' });
    dispatch({ type: 'GO_TO_SLIDE', slide: 'progress' });
    
    await pywebview.startExtraction(state.extractPptxImages, state.outputFolderPath);
  }, [state.folderPath, state.isExtracting, state.extractPptxImages, state.outputFolderPath, pywebview]);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value: AppContextType = {
    state,
    goToSlide,
    setFolder,
    setOutputName,
    validateOutputName,
    updateOutputPath,
    setParentPath,
    setPptxImages,
    setSelectedEditor,
    startExtraction,
    resetState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

