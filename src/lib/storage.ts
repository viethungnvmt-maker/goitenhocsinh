export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  timeString: string;
}

const STORAGE_KEY = 'goiHS_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse history:', error);
    return [];
  }
};

export const addHistory = (name: string): HistoryItem[] => {
  const history = getHistory();
  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    name,
    timestamp: Date.now(),
    timeString: new Date().toLocaleTimeString('vi-VN'),
  };
  const newHistory = [...history, newItem];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
  return newHistory;
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Also let's keep students in local storage for persistence across reloads
const STUDENTS_KEY = 'goiHS_students';

export const getStudents = (): string[] => {
  try {
    const data = localStorage.getItem(STUDENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const saveStudents = (students: string[]) => {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Failed to save students:', error);
  }
};

// Theme persistence
export type ThemeName = 'dark' | 'light' | 'cute';
const THEME_KEY = 'goiHS_theme';

export const getTheme = (): ThemeName => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light' || v === 'cute') return v;
  } catch {}
  return 'dark';
};

export const saveTheme = (theme: ThemeName) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
};

// ─── Class Management ────────────────────────────────────────────────────────

export interface ClassInfo {
  id: string;
  name: string;
  students: string[];
  createdAt: number;
}

const CLASSES_KEY = 'goiHS_classes';
const ACTIVE_CLASS_KEY = 'goiHS_activeClass';

export const getClasses = (): ClassInfo[] => {
  try {
    const data = localStorage.getItem(CLASSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveClasses = (classes: ClassInfo[]) => {
  try {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  } catch (error) {
    console.error('Failed to save classes:', error);
  }
};

export const addClass = (name: string, students: string[]): ClassInfo[] => {
  const classes = getClasses();
  const newClass: ClassInfo = {
    id: crypto.randomUUID(),
    name,
    students,
    createdAt: Date.now(),
  };
  const updated = [...classes, newClass];
  saveClasses(updated);
  saveActiveClassId(newClass.id);
  return updated;
};

export const deleteClass = (id: string): ClassInfo[] => {
  const classes = getClasses().filter(c => c.id !== id);
  saveClasses(classes);
  if (getActiveClassId() === id) {
    saveActiveClassId(classes.length > 0 ? classes[0].id : null);
  }
  return classes;
};

export const updateClassStudents = (id: string, students: string[]): ClassInfo[] => {
  const classes = getClasses().map(c => c.id === id ? { ...c, students } : c);
  saveClasses(classes);
  return classes;
};

export const renameClass = (id: string, name: string): ClassInfo[] => {
  const classes = getClasses().map(c => c.id === id ? { ...c, name } : c);
  saveClasses(classes);
  return classes;
};

export const getActiveClassId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_CLASS_KEY);
  } catch {
    return null;
  }
};

export const saveActiveClassId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(ACTIVE_CLASS_KEY, id);
    else localStorage.removeItem(ACTIVE_CLASS_KEY);
  } catch {}
};
