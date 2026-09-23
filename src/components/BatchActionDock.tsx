import React from 'react';
import { 
  Download, 
  Image as ImageIcon, 
  FolderInput, 
  Trash2, 
  X, 
  CheckSquare 
} from 'lucide-react';

interface BatchActionDockProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDownloadSelected: () => void;
  onSetCover: () => void;
  onMoveAlbum: () => void;
  onDeleteSelected: () => void;
}

export const BatchActionDock: React.FC<BatchActionDockProps> = ({
  selectedCount,
  onClearSelection,
  onDownloadSelected,
  onSetCover,
  onMoveAlbum,
  onDeleteSelected
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 sm:gap-4 text-xs font-medium">
        {/* Count Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs shadow-sm">
            {selectedCount}
          </div>
          <span className="font-semibold text-slate-200 hidden sm:inline">
            เลือก {selectedCount} รูปภาพ
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onDownloadSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold shadow-xs"
            title="ดาวน์โหลดไฟล์รูปที่เลือกทั้งหมด"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด</span>
          </button>

          <button
            onClick={onSetCover}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="ตั้งเป็นภาพปกอัลบั้ม"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ตั้งเป็นภาพปก</span>
          </button>

          <button
            onClick={onMoveAlbum}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="ย้ายไปยังอัลบั้มอื่น"
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ย้ายอัลบั้ม</span>
          </button>

          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-colors"
            title="ลบรูปภาพที่เลือก"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ลบที่เลือก</span>
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={onClearSelection}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors pl-2"
          title="ยกเลิกการเลือก"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
