import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// Types
type FileType = 'folder' | 'excel' | 'word' | 'pdf' | 'pptx' | 'csv' | 'txt';

interface FileEntry {
  name: string;
  type: FileType;
  depth: number;
  size?: string;
}

// Data
const sourceFiles: FileEntry[] = [
  { name: 'Project Files', type: 'folder', depth: 0 },
  { name: 'Financials', type: 'folder', depth: 1 },
  { name: 'Q1_Report.xlsx', type: 'excel', depth: 2, size: '245 MB' },
  { name: 'Q2_Report.xlsx', type: 'excel', depth: 2, size: '312 MB' },
  { name: 'Budget_2024.xls', type: 'excel', depth: 2, size: '89 MB' },
  { name: 'Contracts', type: 'folder', depth: 1 },
  { name: 'NDA_v1.docx', type: 'word', depth: 2, size: '2.4 MB' },
  { name: 'Agreement_FINAL.docx', type: 'word', depth: 2, size: '5.1 MB' },
  { name: 'Terms.pdf', type: 'pdf', depth: 2, size: '18 MB' },
  { name: 'Presentations', type: 'folder', depth: 1 },
  { name: 'Sales_Deck.pptx', type: 'pptx', depth: 2, size: '156 MB' },
];

const outputFiles: FileEntry[] = [
  { name: 'Project Files_extracted', type: 'folder', depth: 0 },
  { name: 'Financials', type: 'folder', depth: 1 },
  { name: 'q1_report', type: 'folder', depth: 2 },
  { name: 'sheet1.csv', type: 'csv', depth: 3, size: '1.2 MB' },
  { name: 'q2_report', type: 'folder', depth: 2 },
  { name: 'sheet1.csv', type: 'csv', depth: 3, size: '1.5 MB' },
  { name: 'budget_2024', type: 'folder', depth: 2 },
  { name: 'sheet1.csv', type: 'csv', depth: 3, size: '420 KB' },
  { name: 'Contracts', type: 'folder', depth: 1 },
  { name: 'nda_v1.txt', type: 'txt', depth: 2, size: '12 KB' },
  { name: 'agreement_final.txt', type: 'txt', depth: 2, size: '24 KB' },
  { name: 'terms.txt', type: 'txt', depth: 2, size: '8 KB' },
  { name: 'Presentations', type: 'folder', depth: 1 },
  { name: 'sales_deck.txt', type: 'txt', depth: 2, size: '52 KB' },
];

// Icons
function FileIcon({ type }: { type: FileType }) {
  if (type === 'folder') {
    return <Folder className="w-4 h-4" style={{ color: '#f5a623', fill: '#f5a623' }} />;
  }
  
  const logos: Partial<Record<FileType, string>> = {
    excel: 'excel-logo.svg',
    word: 'word-logo.svg',
    pdf: 'pdf-logo.svg',
    pptx: 'powerpoint-logo.svg',
  };
  
  if (logos[type]) {
    return <img src={logos[type]} alt={type} className="w-4 h-4" />;
  }
  
  // CSV and TXT get document icon with appropriate color
  const color = type === 'csv' ? '#22c55e' : '#64748b';
  return <FileText className="w-4 h-4" style={{ color }} />;
}

// File Row Component
function Row({ 
  file, 
  animate, 
  delay 
}: { 
  file: FileEntry; 
  animate: boolean; 
  delay: number;
}) {
  const isFolder = file.type === 'folder';
  
  return (
    <div 
      className={cn(
        'grid grid-cols-[1fr_auto] items-center gap-4 py-1.5 px-3 rounded-md',
        'transition-colors duration-150',
        'hover:bg-accent/50',
        animate && 'animate-fade-in-up'
      )}
      style={{ 
        paddingLeft: `${12 + file.depth * 16}px`,
        animationDelay: animate ? `${delay}ms` : '0ms',
        opacity: animate ? 0 : 1,
        animationFillMode: 'forwards',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <FileIcon type={file.type} />
        <span className={cn(
          'truncate text-[13px]',
          isFolder ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}>
          {file.name}
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground/60 tabular-nums w-14 text-right">
        {isFolder ? '--' : file.size}
      </span>
    </div>
  );
}

// Tree Panel Component
function TreePanel({ 
  files, 
  animate,
  className,
  style
}: { 
  files: FileEntry[]; 
  animate: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={cn(
        'flex-1 max-w-[340px] bg-card rounded-lg overflow-hidden',
        className
      )}
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
        <span>Name</span>
        <span className="w-14 text-right">Size</span>
      </div>
      
      {/* File List */}
      <div className="pb-3">
        {files.map((file, i) => (
          <Row 
            key={`${file.name}-${i}`} 
            file={file} 
            animate={animate}
            delay={400 + i * 40}
          />
        ))}
      </div>
    </div>
  );
}

// Main Component
export function Intro() {
  const { goToSlide, state } = useApp();
  const [animate, setAnimate] = useState(false);
  const isActive = state.currentSlide === 'intro';

  // Trigger animation when slide becomes active
  useEffect(() => {
    if (isActive) {
      // Small delay to ensure the slide transition has started
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    } else {
      // Reset animation state when leaving the slide
      setAnimate(false);
    }
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pt-8 pb-32">
      <h2 className="text-3xl font-semibold text-foreground mb-2">
        How it works
      </h2>
      <p className="text-muted-foreground mb-10">
        DocPrep extracts clean, structured data from your documents
      </p>

      <div className="flex items-center justify-center gap-8 w-full max-w-[800px]">
        <TreePanel files={sourceFiles} animate={false} />
        
        <div 
          className={cn(
            'flex-shrink-0',
            animate ? 'animate-fade-in' : 'opacity-0'
          )}
          style={{ animationDelay: '200ms' }}
        >
          <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
        </div>
        
        <TreePanel 
          files={outputFiles} 
          animate={animate}
          style={{
            opacity: animate ? undefined : 0,
            animationDelay: '150ms',
          }}
          className={cn(
            animate && 'animate-slide-in-right'
          )}
        />
      </div>

      <div className="fixed bottom-20 left-0 right-0 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground"
          onClick={() => goToSlide('welcome')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="rounded-full px-8 gap-2"
          onClick={() => goToSlide('tutorial')}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
