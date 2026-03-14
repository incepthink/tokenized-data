import { FileText, Image, FileSpreadsheet } from "lucide-react";
import { FileType } from "@/mock/data";

export function FilePreview({ fileType, fileUrl, className = "" }: { fileType: FileType; fileUrl: string | null; className?: string }) {
  if (fileType === "image" && fileUrl) {
    return <img src={fileUrl} alt="Document" className={`rounded-xl object-cover ${className}`} />;
  }

  if (fileType === "pdf") {
    return (
      <div className={`bg-card-elevated rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <FileText size={48} className="text-destructive mx-auto mb-2" />
          <span className="text-xs text-muted-foreground font-medium">PDF Document</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card-elevated rounded-xl flex items-center justify-center ${className}`}>
      <div className="text-center">
        <FileSpreadsheet size={48} className="text-blue-400 mx-auto mb-2" />
        <span className="text-xs text-muted-foreground font-medium">DOCX Document</span>
      </div>
    </div>
  );
}
