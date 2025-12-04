import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, User, ZoomIn, ZoomOut, Scissors } from 'lucide-react';
import { Slider } from './ui/slider';
import { EditableText } from './EditableText';
import { toast } from 'sonner@2.0.3';
import { removeBackground } from '@imgly/background-removal';

interface VocabularyCoverProps {
  data: any[];
  headerInfo: {
    headerTitle: string;
    headerDescription: string;
    footerLeft: string;
  };
  photo?: string;
  authorName?: string;
  variant?: 'photo' | 'gradient' | 'minimal';
  onPhotoUpload?: (photoUrl: string) => void;
  onHeaderInfoChange?: (info: { headerTitle: string; headerDescription: string; footerLeft: string }) => void;
  onAuthorNameChange?: (name: string) => void;
}

export function VocabularyCover({
  data,
  headerInfo,
  photo = '',
  authorName = '',
  variant = 'photo',
  onPhotoUpload,
  onHeaderInfoChange,
  onAuthorNameChange
}: VocabularyCoverProps) {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(photo || null);
  const [photoScale, setPhotoScale] = useState<number>(100);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousPhotoRef = useRef<string | null>(null); // 이전 이미지 추적용
  const isEditable = true;

  // 컴포넌트 언마운트 시 이미지 데이터 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 이전 이미지 참조 해제
      previousPhotoRef.current = null;
    };
  }, []);

  // 이미지 변경 시 이전 이미지 메모리 해제 (base64 데이터 참조 정리)
  const cleanupPreviousPhoto = useCallback(() => {
    if (previousPhotoRef.current) {
      // 이전 base64 데이터 참조 해제
      previousPhotoRef.current = null;
    }
  }, []);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error('파일 크기가 10MB를 초과합니다. 더 작은 이미지를 선택해주세요.', { duration: 1000 });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;

        // 이전 이미지 정리
        cleanupPreviousPhoto();
        previousPhotoRef.current = uploadedPhoto;

        setUploadedPhoto(photoUrl);
        setPhotoScale(100);
        onPhotoUpload?.(photoUrl);
      };
      reader.onerror = () => {
        toast.error('이미지 로드에 실패했습니다.', { duration: 1000 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    // 이전 이미지 정리
    cleanupPreviousPhoto();
    previousPhotoRef.current = null;

    setUploadedPhoto(null);
    setPhotoScale(100);
    onPhotoUpload?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedPhoto) return;

    setIsRemovingBg(true);
    toast.info('배경 제거 중... (최대 30초 소요될 수 있습니다)', { duration: 1000 });

    try {
      // @imgly/background-removal로 배경 제거 (완전 무료, API 키 불필요)
      const blob = await removeBackground(uploadedPhoto);

      // Blob을 Data URL로 변환
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;

        // 이전 이미지 정리
        cleanupPreviousPhoto();
        previousPhotoRef.current = uploadedPhoto;

        setUploadedPhoto(result);
        onPhotoUpload?.(result);
        toast.success('배경이 제거되었습니다!', { duration: 1000 });
      };
      reader.onerror = () => {
        toast.error('배경 제거 결과 처리에 실패했습니다.', { duration: 1000 });
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      console.error('배경 제거 오류:', error);
      toast.error('배경 제거에 실패했습니다. 다시 시도해주세요.', { duration: 1000 });
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <div className="a4-page relative overflow-hidden flex flex-col items-center justify-center px-12">
      {variant === 'photo' ? (
        // Photo Version - 화이트 배경 + 박스에 그라디언트
        <>
          {/* 화이트 배경 */}
          <div className="absolute inset-0 bg-white"></div>
          
          {/* 중앙 회색 긴 박스 */}
          <div className="relative w-full max-w-5xl h-80 bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 rounded-2xl mb-8">
            
            {/* 오른쪽 인물 사진 영역 - 회색 박스 끝과 정렬, 위로 오버플로우 */}
            <div className="absolute right-0 bottom-0 flex items-end">
              <div className="relative w-64 h-96 rounded-2xl overflow-hidden">
                {uploadedPhoto ? (
                  <div className="relative w-full h-full group">
                    <img 
                      src={uploadedPhoto} 
                      alt="Profile" 
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{ 
                        transform: `scale(${photoScale / 100})`,
                        transformOrigin: 'center bottom'
                      }}
                    />
                    {isEditable && (
                      <>
                        {/* 사진 삭제 버튼 */}
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all print:hidden z-10 opacity-0 group-hover:opacity-100"
                          title="사진 삭제"
                        >
                          <X size={18} className="text-slate-700" />
                        </button>

                        {/* 크기 조절 슬라이더 */}
                        <div className="absolute bottom-3 left-3 right-3 bg-white/90 p-3 rounded-lg shadow-lg transition-all print:hidden z-10 opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-3">
                            <ZoomOut size={16} className="text-slate-500 flex-shrink-0" />
                            <Slider
                              value={[photoScale]}
                              onValueChange={(value) => setPhotoScale(value[0])}
                              min={50}
                              max={200}
                              step={5}
                              className="flex-1"
                            />
                            <ZoomIn size={16} className="text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-slate-600 font-medium w-10 text-right">{photoScale}%</span>
                          </div>
                        </div>

                        {/* 배경 제거 버튼 */}
                        <button
                          onClick={handleRemoveBackground}
                          className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all print:hidden z-10 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isRemovingBg ? "배경 제거 중..." : "배경 제거"}
                          disabled={isRemovingBg}
                        >
                          <Scissors 
                            size={18} 
                            className={isRemovingBg ? "text-slate-700 animate-pulse" : "text-slate-700"} 
                          />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200">
                    {isEditable ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-3 p-6 hover:bg-slate-50 rounded-lg transition-colors print:hidden"
                      >
                        <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center">
                          <Upload size={24} className="text-slate-500" />
                        </div>
                        <p className="text-slate-600 text-sm">사진 업로드</p>
                        <p className="text-slate-400 text-xs">인물 사진 권장</p>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center">
                          <User size={32} className="text-slate-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* 하단 텍스트 영역 */}
          <div className="relative w-full max-w-5xl">
            {/* 타이틀과 화살표 */}
            <div className="flex items-start justify-between gap-8 mb-4">
              <div className="flex-1">
                <EditableText
                  value={headerInfo.headerTitle || 'Your Pitch Deck'}
                  onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, headerTitle: value })}
                  className="text-6xl text-slate-900 leading-tight mb-3"
                  style={{ fontFamily: 'serif' }}
                  isEditable={isEditable}
                />
              </div>
              
              {/* 화살표 */}
              <div className="flex-shrink-0 pt-4">
                <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
                  <path 
                    d="M0 20H75M75 20L60 5M75 20L60 35" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-slate-900"
                  />
                </svg>
              </div>
            </div>

            {/* 부제목 */}
            <EditableText
              value={headerInfo.headerDescription || 'This is just the beginning of something big.'}
              onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, headerDescription: value })}
              className="text-base text-slate-600 leading-relaxed mb-12"
              isEditable={isEditable}
              multiline
            />
          </div>

          {/* 좌측 상단 작은 점 데코레이션 */}
          <div className="absolute top-8 left-8">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          </div>
        </>
      ) : variant === 'gradient' ? (
        // Gradient Version - 그라디언트 디자인
        <>
          {/* 그라디언트 배경 - 더 연하게 */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-rose-30 to-amber-30"></div>
          
          {/* 블러 데코레이션 - 더 연하게 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 right-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-rose-100 rounded-full blur-3xl"></div>
          </div>

          {/* 중앙 콘텐츠 */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
            {/* 상단 여백 */}
            <div className="flex-1"></div>

            {/* 작은 라벨 */}
            <div className="mb-8">
              <div className="inline-block px-5 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
                <EditableText
                  value={headerInfo.footerLeft || 'Vocabulary Builder'}
                  onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, footerLeft: value })}
                  className="text-xs uppercase tracking-[0.2em] text-slate-600 font-medium"
                  isEditable={isEditable}
                />
              </div>
            </div>

            {/* 메인 타이틀 */}
            <div className="mb-8 max-w-4xl">
              <EditableText
                value={headerInfo.headerTitle || 'Your Pitch Deck'}
                onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, headerTitle: value })}
                className="text-8xl text-slate-900 leading-[1.1] tracking-tight"
                style={{ fontFamily: 'serif' }}
                isEditable={isEditable}
              />
            </div>

            {/* 부제목 */}
            <div className="mb-16 max-w-2xl">
              <EditableText
                value={headerInfo.headerDescription || 'This is just the beginning of something big.'}
                onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, headerDescription: value })}
                className="text-xl text-slate-600 leading-relaxed"
                isEditable={isEditable}
                multiline
              />
            </div>

            {/* 장식 라인 - 더 세련되게 */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-400 to-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-24 h-px bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-16 h-px bg-gradient-to-l from-transparent via-slate-400 to-slate-400"></div>
            </div>

            {/* 하단 여백 */}
            <div className="flex-1"></div>
          </div>

          {/* 좌측 상단 장식 패턴 */}
          <div className="absolute top-8 left-8 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            </div>
          </div>

          {/* 우측 상단 장식 패턴 */}
          <div className="absolute top-8 right-8 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-100"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            </div>
          </div>
        </>
      ) : (
        // Minimal Version - 미니멀 베이지 디자인
        <>
          {/* 베이지 배경 */}
          <div className="absolute inset-0 bg-stone-50"></div>
          
          {/* 상단 테두리 박스 */}
          <div className="absolute inset-8 border border-stone-300"></div>

          {/* 메인 콘텐츠 */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-20 py-24">
            {/* 상단 이름 */}
            <div className="mb-16">
              <EditableText
                value={authorName || 'David Jacobs'}
                onChange={(name) => onAuthorNameChange?.(name)}
                className="text-2xl text-slate-900 tracking-wide"
                style={{ fontFamily: 'serif', letterSpacing: '0.1em' }}
                isEditable={isEditable}
              />
            </div>

            {/* 작은 부제 */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Vocabulary Collection
              </p>
            </div>

            {/* 중앙 사진 영역 */}
            <div className="mb-6 relative">
              <div className="w-56 h-72 rounded-sm overflow-hidden relative">
                {uploadedPhoto ? (
                  <div className="relative w-full h-full group">
                    <img 
                      src={uploadedPhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{ 
                        transform: `scale(${photoScale / 100})`,
                        transformOrigin: 'center center'
                      }}
                    />
                    {isEditable && (
                      <>
                        {/* 사진 삭제 버튼 */}
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-lg transition-all print:hidden z-10 opacity-0 group-hover:opacity-100"
                          title="사진 삭제"
                        >
                          <X size={14} className="text-slate-700" />
                        </button>

                        {/* 크기 조절 슬라이더 */}
                        <div className="absolute bottom-2 left-2 right-2 bg-white/90 p-2 rounded shadow-lg transition-all print:hidden z-10 opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-2">
                            <ZoomOut size={12} className="text-slate-500 flex-shrink-0" />
                            <Slider
                              value={[photoScale]}
                              onValueChange={(value) => setPhotoScale(value[0])}
                              min={50}
                              max={200}
                              step={5}
                              className="flex-1"
                            />
                            <ZoomIn size={12} className="text-slate-500 flex-shrink-0" />
                            <span className="text-[10px] text-slate-600 font-medium w-8 text-right">{photoScale}%</span>
                          </div>
                        </div>

                        {/* 배경 제거 버튼 */}
                        <button
                          onClick={handleRemoveBackground}
                          className="absolute top-2 left-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-lg transition-all print:hidden z-10 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isRemovingBg ? "배경 제거 중..." : "배경 제거"}
                          disabled={isRemovingBg}
                        >
                          <Scissors 
                            size={14} 
                            className={isRemovingBg ? "text-slate-700 animate-pulse" : "text-slate-700"} 
                          />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-200">
                    {isEditable ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 hover:bg-stone-100 rounded transition-colors print:hidden"
                      >
                        <div className="w-12 h-12 rounded-full bg-stone-300 flex items-center justify-center">
                          <Upload size={20} className="text-stone-500" />
                        </div>
                        <p className="text-stone-600 text-xs">사진 업로드</p>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-stone-300 flex items-center justify-center">
                          <User size={24} className="text-stone-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 사진 위 레드 라인 장식 */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                  <path 
                    d="M10 70 Q 60 10, 110 70" 
                    stroke="#ef4444" 
                    strokeWidth="2" 
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* 작은 설명 텍스트 */}
            <div className="mb-8 max-w-xs">
              <EditableText
                value={headerInfo.headerDescription || 'Essential words for\nSeptember 18'}
                onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, headerDescription: value })}
                className="text-xs text-slate-600 leading-relaxed"
                isEditable={isEditable}
                multiline
              />
            </div>

            {/* 하단 메인 타이틀 */}
            <div className="max-w-lg">
              <EditableText
                value={headerInfo.headerTitle || 'Chantal\nAnderson'}
                onChange={(value) => onHeaderInfoChange?.({ ...headerInfo, headerTitle: value })}
                className="text-5xl text-slate-900 leading-tight tracking-wide"
                style={{ fontFamily: 'serif', letterSpacing: '0.05em' }}
                isEditable={isEditable}
                multiline
              />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </>
      )}

      {/* 우측 하단 작가명 - photo와 gradient 버전에만 */}
      {variant !== 'minimal' && (
        <div className="absolute bottom-8 right-8">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="uppercase tracking-widest">
              <EditableText
                value={authorName || 'Your Name'}
                onChange={(name) => onAuthorNameChange?.(name)}
                className="text-xs text-slate-400 uppercase tracking-widest"
                isEditable={isEditable}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}