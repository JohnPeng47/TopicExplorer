export interface CopyModalProps {
    generatedText: string;
    onClose: () => void;
    title: string;
    description: string;
    actionLabel: string;
    modalAction: (text: string) => void;
  }
  
  