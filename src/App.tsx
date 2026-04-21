import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Volume2, VolumeX, Trash2, Upload, Shuffle, FileText, History, Gamepad2, X, Moon, Sun, Cookie, Music, Music2, Plus, FolderOpen, Save, Users, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playWin, setSoundEnabled, startAmbient, stopAmbient, setAmbientEnabled } from './lib/audio';
import { getHistory, addHistory, clearHistory as clearStorageHistory, HistoryItem, getStudents, saveStudents, getTheme, saveTheme, ThemeName, ClassInfo, getClasses, addClass, deleteClass, updateClassStudents, getActiveClassId, saveActiveClassId } from './lib/storage';
import { WheelGame, DuckRace, SlotMachine, BombGame, DiceGame, DartGame, CardsGame, PlinkoGame, RainGame, BalloonGame, ClawGame, EnvelopeGame } from './games';

const SAMPLE_STUDENTS = [
  "Nguyễn Văn An", "Trần Thị Bích", "Lê Hoàng Công", "Phạm Thị Dung", "Hoàng Văn Em",
  "Vũ Thị Phương", "Đỗ Minh Giang", "Bùi Quốc Hưng", "Ngô Thị Kim", "Đặng Văn Long",
  "Lý Hoàng My", "Mai Thị Nga", "Phan Văn Ơn", "Tô Thị Phúc", "Cao Thị Quỳnh",
  "Trịnh Văn Rồng", "Lưu Thị Sương", "Hồ Văn Thắng", "Đinh Thị Uyên", "Võ Văn Vũ",
  "Trương Thị Xuân", "Dương Văn Yến", "Kiều Thị Ánh", "Lâm Văn Bảo", "Tạ Thị Cúc",
  "Nguyễn Văn Đức", "Trần Thị Hà", "Lê Minh Khánh", "Phạm Thị Lan", "Hoàng Văn Nam"
];

const GAMES = [
  { id: 'wheel', name: 'Vòng Quay May Mắn', desc: 'Quay bánh xe chọn ngẫu nhiên', icon: '🎡', component: WheelGame },
  { id: 'duck', name: 'Đua Vịt', desc: 'Cuộc đua sôi động về đích', icon: '🦆', component: DuckRace },
  { id: 'slot', name: 'Máy Jackpot', desc: 'Kéo cần — may rủi bất ngờ', icon: '🎰', component: SlotMachine },
  { id: 'bomb', name: 'Bom Nổ Chậm', desc: 'Ai cầm bom khi nổ?', icon: '💣', component: BombGame },
  { id: 'dice', name: 'Xúc Xắc May Rủi', desc: 'Gieo xúc xắc chọn người', icon: '🎲', component: DiceGame },
  { id: 'dart', name: 'Phóng Phi Tiêu', desc: 'Mũi tên trúng ai?', icon: '🎯', component: DartGame },
  { id: 'cards', name: 'Rút Bài Tarot', desc: 'Lật lá bài định mệnh', icon: '🃏', component: CardsGame },
  { id: 'plinko', name: 'Plinko Rơi Bóng', desc: 'Bóng rơi lộp bộp chọn tên', icon: '⚪', component: PlinkoGame },
  { id: 'rain', name: 'Mưa Tên', desc: 'Tên rơi như ma trận Matrix', icon: '🌧️', component: RainGame },
  { id: 'balloon', name: 'Bắn Bong Bóng', desc: 'Chọn bong bóng để nổ', icon: '🎈', component: BalloonGame },
  { id: 'claw', name: 'Máy Gắp Thú', desc: 'Cần cẩu gắp ngẫu nhiên 1 bạn', icon: '🪝', component: ClawGame },
  { id: 'envelope', name: 'Thư Bí Ẩn', desc: 'Mở phong bì định mệnh', icon: '💌', component: EnvelopeGame },
];

const THEMES: { id: ThemeName; label: string; icon: React.ReactNode }[] = [
  { id: 'dark', label: 'Tối', icon: <Moon size={16} /> },
  { id: 'light', label: 'Sáng', icon: <Sun size={16} /> },
  { id: 'cute', label: 'Phô Mai Que', icon: <Cookie size={16} /> },
];

export default function App() {
  const [students, setStudents] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [ambientOn, setAmbientOn] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [inputText, setInputText] = useState('');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Class management state ──
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [showClassPanel, setShowClassPanel] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showNewClassInput, setShowNewClassInput] = useState(false);

  useEffect(() => {
    // Load classes first
    const loadedClasses = getClasses();
    setClasses(loadedClasses);
    const savedActiveId = getActiveClassId();

    if (savedActiveId && loadedClasses.find(c => c.id === savedActiveId)) {
      setActiveClassId(savedActiveId);
      const activeClass = loadedClasses.find(c => c.id === savedActiveId)!;
      setStudents(activeClass.students);
      setInputText(activeClass.students.join('\n'));
    } else {
      // Fallback to legacy students key
      const loadedStudents = getStudents();
      if (loadedStudents.length > 0) {
        setStudents(loadedStudents);
        setInputText(loadedStudents.join('\n'));
      }
    }
    setHistory(getHistory());
    const savedTheme = getTheme();
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Restart ambient loop with the new theme's pattern when theme changes (only if already playing).
  useEffect(() => {
    if (ambientOn) startAmbient(theme);
  }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSound = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setSoundEnabled(newVal);
    if (!newVal && ambientOn) {
      setAmbientOn(false);
      stopAmbient();
    }
  };

  const toggleAmbient = () => {
    const newVal = !ambientOn;
    setAmbientOn(newVal);
    setAmbientEnabled(newVal);
    if (newVal) {
      if (!soundOn) {
        setSoundOn(true);
        setSoundEnabled(true);
      }
      startAmbient(theme);
    } else {
      stopAmbient();
    }
  };

  const cycleTheme = () => {
    const i = THEMES.findIndex(t => t.id === theme);
    const next = THEMES[(i + 1) % THEMES.length];
    setTheme(next.id);
  };

  const updateStudents = (newStudents: string[]) => {
    setStudents(newStudents);
    setInputText(newStudents.join('\n'));
    saveStudents(newStudents);
    // Auto-save to active class
    if (activeClassId) {
      const updated = updateClassStudents(activeClassId, newStudents);
      setClasses(updated);
    }
  };

  const handleParseTextarea = () => {
    const newStudents = inputText.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 80);
    updateStudents(newStudents);
  };

  const handleClearList = () => updateStudents([]);
  const handleLoadSample = () => updateStudents(SAMPLE_STUDENTS);
  const handleRemoveStudent = (i: number) => updateStudents(students.filter((_, idx) => idx !== i));

  // ── Class management handlers ──
  const handleCreateClass = () => {
    const name = newClassName.trim();
    if (!name) return;
    const updated = addClass(name, students);
    setClasses(updated);
    setActiveClassId(updated[updated.length - 1].id);
    setNewClassName('');
    setShowNewClassInput(false);
  };

  const handleDeleteClass = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa lớp này?')) return;
    const updated = deleteClass(id);
    setClasses(updated);
    const newActiveId = getActiveClassId();
    setActiveClassId(newActiveId);
    if (newActiveId) {
      const cls = updated.find(c => c.id === newActiveId);
      if (cls) {
        setStudents(cls.students);
        setInputText(cls.students.join('\n'));
        saveStudents(cls.students);
      }
    } else {
      setStudents([]);
      setInputText('');
      saveStudents([]);
    }
  };

  const handleSelectClass = (id: string) => {
    setActiveClassId(id);
    saveActiveClassId(id);
    const cls = classes.find(c => c.id === id);
    if (cls) {
      setStudents(cls.students);
      setInputText(cls.students.join('\n'));
      saveStudents(cls.students);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      let newStudents: string[] = [];
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        rows.forEach(r => {
          for (let cell of r) {
            const v = String(cell).trim();
            if (v && !/^\d+$/.test(v) && v.length < 80 && !/^(stt|số thứ tự|họ và tên|họ tên|name|tên)$/i.test(v)) {
              newStudents.push(v);
              break;
            }
          }
        });
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        newStudents = result.value.split(/\r?\n/).map(s => s.trim()).filter(s => s && s.length < 80 && !/^(stt|họ và tên|danh sách)$/i.test(s));
      } else if (ext === 'txt') {
        const text = await file.text();
        newStudents = text.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
      }

      if (newStudents.length > 0) updateStudents(newStudents);
      else alert('Không tìm thấy tên nào trong file.');
    } catch (err: any) {
      alert('Lỗi đọc file: ' + err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearHistory = () => {
    clearStorageHistory();
    setHistory([]);
  };

  const openGame = (id: string) => {
    if (students.length === 0) {
      alert('Vui lòng thêm học sinh vào danh sách trước khi quay!');
      return;
    }
    setWinner(null);
    setActiveGameId(id);
  };

  const handleWinner = (w: string) => {
    setWinner(w);
    setHistory(addHistory(w));
    playWin();
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 120, angle: 60, spread: 80, origin: { x: 0 } }), 250);
    setTimeout(() => confetti({ particleCount: 120, angle: 120, spread: 80, origin: { x: 1 } }), 500);
    setTimeout(() => confetti({ particleCount: 80, spread: 120, startVelocity: 55, origin: { y: 0.4 } }), 800);
  };

  const activeGame = activeGameId ? GAMES.find(g => g.id === activeGameId) : null;
  const ActiveGameComponent = activeGame?.component;
  const currentThemeInfo = THEMES.find(t => t.id === theme)!;

  return (
    <div className="min-h-screen text-brand p-4 md:p-6 relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-2 glass p-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase text-brand-muted">Hệ Thống Gọi Tên</h1>
              <p className="text-xl font-black text-brand uppercase tracking-wider">🎯 {GAMES.length} CHẾ ĐỘ NGẪU NHIÊN</p>
              <p className="text-[11px] mt-1 text-brand-muted">
                Phát triển bởi thầy Nguyễn Việt Hùng —{' '}
                <a
                  href="https://thayhungedu.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-semibold"
                >
                  thayhungedu.vercel.app
                </a>
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center flex-wrap justify-center">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-brand-faint uppercase">Sĩ số</p>
              <p className="text-lg font-mono text-accent">{students.length}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-brand-faint uppercase">Đã gọi</p>
              <p className="text-lg font-mono text-warn">{history.length}</p>
            </div>
            <div className="h-10 w-[1px] bg-brand-muted/20 hidden sm:block" />

            <button
              onClick={cycleTheme}
              className="glass p-3 hover-bg-surface-strong transition-all text-brand-muted flex flex-col items-center justify-center gap-1 min-w-[74px]"
              title="Đổi giao diện"
            >
              <span className="text-accent">{currentThemeInfo.icon}</span>
              <span className="text-[9px] font-bold uppercase whitespace-nowrap">{currentThemeInfo.label}</span>
            </button>

            <button
              onClick={toggleAmbient}
              className="glass p-3 hover-bg-surface-strong transition-all flex flex-col items-center justify-center gap-1 min-w-[74px]"
              title="Bật/Tắt nhạc nền"
            >
              {ambientOn ? <Music2 size={18} className="text-warn" /> : <Music size={18} className="text-brand-faint" />}
              <span className="text-[9px] font-bold uppercase whitespace-nowrap">{ambientOn ? 'Nhạc: ON' : 'Nhạc: OFF'}</span>
            </button>

            <button
              onClick={toggleSound}
              className="glass p-3 hover-bg-surface-strong transition-all flex flex-col items-center justify-center gap-1 min-w-[74px]"
              title="Bật/Tắt âm thanh"
            >
              {soundOn ? <Volume2 size={18} className="text-accent" /> : <VolumeX size={18} className="text-danger" />}
              <span className="text-[9px] font-bold uppercase whitespace-nowrap">{soundOn ? 'Âm thanh: ON' : 'Âm thanh: OFF'}</span>
            </button>
          </div>
        </header>

        <main className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Left column: Student list */}
          <section className="lg:w-80 flex flex-col gap-4">
            {/* ── Class Manager Panel ── */}
            <div className="glass p-4 flex flex-col">
              <button
                onClick={() => setShowClassPanel(!showClassPanel)}
                className="flex items-center justify-between w-full mb-0"
              >
                <h3 className="text-[11px] font-bold text-brand-faint uppercase tracking-widest flex items-center gap-2">
                  <FolderOpen className="text-warn" size={14} /> Quản lý lớp
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-warn bg-warn-soft px-2 py-0.5 rounded border border-warn-soft">
                    {classes.length} lớp
                  </span>
                  {showClassPanel ? <ChevronUp size={14} className="text-brand-faint" /> : <ChevronDown size={14} className="text-brand-faint" />}
                </div>
              </button>

              {showClassPanel && (
                <div className="mt-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                  {/* Nút tạo lớp mới */}
                  {!showNewClassInput ? (
                    <button
                      onClick={() => setShowNewClassInput(true)}
                      className="w-full flex items-center justify-center gap-2 bg-accent-soft hover-bg-accent-mid border border-accent-soft text-accent px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <Plus size={14} /> Tạo lớp mới
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateClass()}
                        placeholder="Tên lớp (VD: 10A1)"
                        className="flex-1 bg-surface-code border border-brand-strong rounded-lg px-3 py-2 text-sm text-brand placeholder:text-brand-faint focus-border-accent"
                        autoFocus
                      />
                      <button
                        onClick={handleCreateClass}
                        className="bg-accent-soft hover-bg-accent-mid border border-accent-soft text-accent px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => { setShowNewClassInput(false); setNewClassName(''); }}
                        className="bg-surface-item hover-bg-surface-strong border border-brand text-brand-faint px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Danh sách các lớp */}
                  {classes.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[200px] pr-1">
                      {classes.map(cls => (
                        <div
                          key={cls.id}
                          className={`p-3 rounded-lg border flex items-center justify-between group cursor-pointer transition-all ${activeClassId === cls.id
                              ? 'bg-accent-soft border-accent glow-blue'
                              : 'bg-surface-item border-brand hover-border-accent hover-bg-accent-soft'
                            }`}
                          onClick={() => handleSelectClass(cls.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Users size={16} className={activeClassId === cls.id ? 'text-accent' : 'text-brand-faint'} />
                            <div className="min-w-0">
                              <p className={`text-sm font-bold truncate ${activeClassId === cls.id ? 'text-accent' : 'text-brand'}`}>
                                {cls.name}
                              </p>
                              <p className="text-[10px] text-brand-faint font-mono">
                                {cls.students.length} học sinh
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                            className="text-brand-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-danger-soft"
                            title="Xóa lớp"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-code rounded-lg p-3 text-[10px] font-mono text-brand-faint text-center">
                      Chưa có lớp nào. Nhập danh sách HS rồi bấm "Tạo lớp mới".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Student List Panel ── */}
            <div className="glass p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold text-brand-faint uppercase tracking-widest flex items-center gap-2">
                  <FileText className="text-accent" size={14} />
                  {activeClassId && classes.find(c => c.id === activeClassId)
                    ? classes.find(c => c.id === activeClassId)!.name
                    : 'Danh sách lớp'}
                </h3>
                <span className="text-[10px] font-mono text-accent bg-accent-soft px-2 py-0.5 rounded border border-accent-soft">
                  {students.length} HS
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv,.docx,.txt" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent-soft hover-bg-accent-mid border border-accent-soft text-accent px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Upload size={14} /> Tải file
                </button>
                <button
                  onClick={handleLoadSample}
                  className="flex-1 flex items-center justify-center gap-2 bg-surface-item hover-bg-surface-strong border border-brand text-brand-muted px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Shuffle size={14} /> Mẫu
                </button>
                <button
                  onClick={handleClearList}
                  className="flex items-center justify-center gap-2 bg-danger-soft hover-bg-danger-mid border border-danger-soft text-danger px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Dán danh sách học sinh ở đây (mỗi dòng 1 tên)..."
                className="w-full h-32 flex-shrink-0 bg-surface-code border border-brand-strong rounded-xl p-3 text-sm focus-border-accent focus-ring-accent placeholder:text-brand-faint mb-3 text-brand"
              />

              <button
                onClick={handleParseTextarea}
                className="w-full py-2.5 bg-accent-mid hover-bg-accent-soft border border-accent rounded-xl text-xs font-bold uppercase tracking-widest text-accent glow-blue transition-all active:scale-95 mb-4"
              >
                Cập nhật danh sách
              </button>

              {students.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1 max-h-[250px]">
                    {students.map((student, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-surface-item border border-brand flex justify-between items-center group hover-border-accent hover-bg-accent-soft transition-colors">
                        <span className="text-sm font-medium text-brand truncate pr-2">
                          <span className="text-brand-faint text-xs mr-2 font-mono">{String(idx + 1).padStart(2, '0')}.</span>
                          {student}
                        </span>
                        <button onClick={() => handleRemoveStudent(idx)} className="text-brand-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Center: Games grid */}
          <section className="flex-1 flex flex-col gap-6 w-full">
            <div className="glass p-6 flex flex-col relative h-full">
              <h3 className="text-[11px] font-bold text-brand-faint uppercase tracking-widest mb-6 flex items-center gap-2">
                <Gamepad2 className="text-warn" size={14} />
                Chọn chế độ tương tác ({GAMES.length})
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-4 pr-1">
                {GAMES.map(game => (
                  <button
                    key={game.id}
                    onClick={() => openGame(game.id)}
                    className="glass p-4 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 hover-border-accent group relative overflow-hidden h-32"
                  >
                    <div className="absolute inset-0 bg-accent-soft opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl mb-2 group-hover:-translate-y-1 transition-transform drop-shadow-md relative z-10">{game.icon}</span>
                    <span className="font-bold text-xs mb-1 text-brand uppercase tracking-wider relative z-10">{game.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Right: History */}
          <aside className="lg:w-64 flex flex-col gap-6">
            <div className="glass p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold text-brand-faint uppercase tracking-widest flex items-center gap-2">
                  <History className="text-warn" size={14} />
                  Lịch sử gọi
                </h3>
                <button onClick={handleClearHistory} className="text-[9px] uppercase font-bold text-brand-faint hover:text-danger transition-colors">Xóa</button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-[350px]">
                {history.length > 0 ? history.slice().reverse().map((h, i) => (
                  <div key={h.id} className={`border-l-2 ${i === 0 ? 'border-warn' : 'border-brand opacity-60'} pl-3 py-1 flex flex-col`}>
                    <p className="text-[10px] text-brand-faint font-mono tracking-widest">{h.timeString}</p>
                    <p className={`text-sm ${i === 0 ? 'font-bold text-warn' : 'font-medium text-brand-muted'}`}>{h.name}</p>
                  </div>
                )) : (
                  <div className="bg-surface-code rounded-lg p-3 text-[10px] font-mono text-brand-faint">
                    <p>{'>'} CHƯA CÓ DỮ LIỆU</p>
                    <p>{'>'} ĐANG CHỜ...</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-brand">
                <div className="bg-surface-code rounded-lg p-3 text-[10px] font-mono text-accent leading-relaxed uppercase">
                  <p>{'>'} HỆ THỐNG SẴN SÀNG</p>
                  <p className={soundOn ? "" : "text-brand-faint"}>{`> AUDIO: ${soundOn ? 'ĐÃ KẾT NỐI' : 'ĐÃ NGẮT'}`}</p>
                  <p className={ambientOn ? "text-warn" : "text-brand-faint"}>{`> NHẠC NỀN: ${ambientOn ? 'ĐANG PHÁT' : 'TẮT'}`}</p>
                  <p>{'>'} CHÚC MAY MẮN!</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Game Modal */}
      {activeGameId && activeGame && ActiveGameComponent && (
        <div className="fixed inset-0 z-[100] bg-modal-backdrop backdrop-blur-md flex items-center justify-center p-4 xl:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-full max-h-[90vh] glass glow-blue border-accent flex flex-col relative overflow-hidden">
            <div className="p-4 border-b border-accent-soft flex justify-between items-center bg-surface-strong z-10">
              <h2 className="text-lg font-bold text-accent uppercase tracking-widest flex items-center gap-3">
                <span className="text-2xl">{activeGame.icon}</span>
                {activeGame.name}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-brand-faint uppercase tracking-wider hidden sm:block">
                  ID: {activeGame.id.toUpperCase()} | STATUS: ACTIVE
                </span>
                <button
                  onClick={() => setActiveGameId(null)}
                  className="w-10 h-10 rounded-xl bg-danger-soft hover-bg-danger-mid text-danger border border-danger-soft flex items-center justify-center transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center relative bg-modal">
              <ActiveGameComponent
                students={students}
                onWinner={handleWinner}
                onClose={() => setActiveGameId(null)}
              />

              {winner && (
                <div className="mt-8 animate-in zoom-in slide-in-from-bottom-8 duration-500 relative z-20 w-full max-w-sm">
                  <div className="glass p-6 glow-orange text-center border-warn bg-warn-soft relative overflow-hidden">
                    <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-warn mb-2 relative z-10">
                      Mục tiêu đã được chọn
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-brand px-2 py-4 relative z-10">
                      {winner}
                    </div>
                    <div className="mt-2 inline-block px-4 py-1.5 bg-warn-soft border border-warn-soft rounded-full text-center mx-auto">
                      <span className="text-warn font-mono text-[10px] uppercase tracking-widest">Sẵn sàng phản hồi</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
