import React, { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, MessageCircle, Check, Flame, AlertTriangle, Gauge, Leaf } from "lucide-react";
import TaskCard from "../components/TaskCard.jsx";
import AddTaskModal from "../components/AddTaskModal.jsx";
import StatusSheet from "../components/StatusSheet.jsx";
import ReminderModal from "../components/ReminderModal.jsx";
import PriorityDetailSheet from "../components/PriorityDetailSheet.jsx";
import {
  addDays,
  isSameDay,
  toKey,
  formatLong,
  DAY_LABELS_ID,
  today as todayDate,
} from "../utils/date.js";

const LEGEND = [
  { level: "P0", label: "Critical", icon: Flame, text: "text-priorityP0 dark:text-priorityP0-dark" },
  { level: "P1", label: "High", icon: AlertTriangle, text: "text-priorityP1 dark:text-priorityP1-dark" },
  { level: "P2", label: "Medium", icon: Gauge, text: "text-priorityP2 dark:text-priorityP2-dark" },
  { level: "P3", label: "Low", icon: Leaf, text: "text-priorityP3 dark:text-priorityP3-dark" },
];

export default function Today({ tasksApi }) {
  const { tasks, addTask, updateTask, updateStatus, deleteTask } = tasksApi;
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [showAdd, setShowAdd] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [statusSheetId, setStatusSheetId] = useState(null);
  const [priorityDetailId, setPriorityDetailId] = useState(null);
  const [showReminder, setShowReminder] = useState(false);

  const dateKey = toKey(selectedDate);

  const activeTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === dateKey && t.status !== "done")
        .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)),
    [tasks, dateKey]
  );
  const doneTasksToday = useMemo(
    () => tasks.filter((t) => t.date === dateKey && t.status === "done"),
    [tasks, dateKey]
  );
  const weekDates = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) arr.push(addDays(selectedDate, i));
    return arr;
  }, [selectedDate]);

  const currentSheetTask = tasks.find((t) => t.id === statusSheetId);
  const currentPriorityTask = tasks.find((t) => t.id === priorityDetailId);
  const currentEditTask = tasks.find((t) => t.id === editTaskId);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 relative">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 rounded-full text-gray-500 dark:text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 justify-center">
            {weekDates.map((d) => {
              const isSelected = isSameDay(d, selectedDate);
              const isToday = isSameDay(d, todayDate);
              return (
                <button
                  key={toKey(d)}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl border transition-colors duration-150 ${
                    isSelected
                      ? "bg-accent dark:bg-accent-dark text-white dark:text-[#04141A] border-transparent"
                      : "bg-white dark:bg-surface-dark text-gray-500 dark:text-gray-400 border-border dark:border-border-dark"
                  }`}
                >
                  <span className="text-[11px] leading-none mb-1 opacity-80">{DAY_LABELS_ID[d.getDay()]}</span>
                  <span className="text-sm font-semibold leading-none font-mono">{d.getDate()}</span>
                  {isToday && !isSelected && <span className="w-1 h-1 rounded-full mt-1 bg-accent dark:bg-accent-dark" />}
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 rounded-full text-gray-500 dark:text-gray-400">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {isSameDay(selectedDate, todayDate) ? "Hari ini" : formatLong(selectedDate)}
        </h1>
        {!isSameDay(selectedDate, todayDate) && (
          <button onClick={() => setSelectedDate(todayDate)} className="text-xs font-medium text-accent dark:text-accent-dark">
            Kembali ke hari ini
          </button>
        )}
      </div>

      {activeTasks.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-1 text-[11px] text-gray-400 dark:text-gray-500 overflow-x-auto no-scrollbar">
          <span className="shrink-0">Diurutkan dari prioritas tertinggi:</span>
          {LEGEND.map(({ level, label, icon: Icon, text }) => (
            <span key={level} className={`flex items-center gap-1 shrink-0 ${text}`}>
              <Icon size={12} />
              {level} {label}
            </span>
          ))}
        </div>
      )}

      <button
        disabled={activeTasks.length === 0}
        onClick={() => setShowReminder(true)}
        className={`w-full mb-5 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
          activeTasks.length === 0
            ? "border-border dark:border-border-dark text-gray-300 dark:text-gray-600"
            : "border-done dark:border-done-dark text-done dark:text-done-dark bg-done/10 dark:bg-done-dark/10"
        }`}
      >
        <MessageCircle size={16} />
        Reminder WA
      </button>

      <div className="space-y-3">
        {activeTasks.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
            Belum ada tugas aktif untuk tanggal ini.
          </div>
        )}
        {activeTasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onClick={() => setStatusSheetId(t.id)}
            onInfoClick={() => setPriorityDetailId(t.id)}
            onEditClick={() => setEditTaskId(t.id)}
          />
        ))}
      </div>

      {doneTasksToday.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium mb-2 text-gray-400 dark:text-gray-500">Selesai ({doneTasksToday.length})</p>
          <div className="space-y-2">
            {doneTasksToday.map((t) => (
              <button
                key={t.id}
                onClick={() => setEditTaskId(t.id)}
                className="w-full flex items-center gap-2 rounded-lg px-4 py-2 text-left opacity-65 hover:opacity-90 transition-opacity bg-white dark:bg-surface-dark border border-border dark:border-border-dark"
              >
                <Check size={14} className="shrink-0 text-done dark:text-done-dark" />
                <p className="text-sm line-through text-gray-500 dark:text-gray-400">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        aria-label="Tambah tugas"
        className="fixed bottom-20 right-5 sm:bottom-8 w-14 h-14 flex items-center justify-center bg-accent dark:bg-accent-dark text-white dark:text-[#04141A] shadow-[0_0_24px_rgba(45,226,230,0.35)]"
        style={{ clipPath: "polygon(20% 0%,80% 0%,100% 20%,100% 80%,80% 100%,20% 100%,0% 80%,0% 20%)" }}
      >
        <Plus size={24} />
      </button>

      {showAdd && (
        <AddTaskModal
          dateLabel={formatLong(selectedDate)}
          onClose={() => setShowAdd(false)}
          onSave={async (payload) => {
            await addTask({ ...payload, date: dateKey });
            setShowAdd(false);
          }}
        />
      )}

      {currentEditTask && (
        <AddTaskModal
          initialTask={currentEditTask}
          dateLabel={formatLong(selectedDate)}
          onClose={() => setEditTaskId(null)}
          onSave={async (payload) => {
            await updateTask(currentEditTask.id, payload);
            setEditTaskId(null);
          }}
          onDelete={async () => {
            await deleteTask(currentEditTask.id);
            setEditTaskId(null);
          }}
        />
      )}

      {currentSheetTask && (
        <StatusSheet
          task={currentSheetTask}
          onClose={() => setStatusSheetId(null)}
          onChange={async (status) => {
            await updateStatus(currentSheetTask.id, status, dateKey);
            setStatusSheetId(null);
          }}
        />
      )}

      {currentPriorityTask && (
        <PriorityDetailSheet
          task={currentPriorityTask}
          onClose={() => setPriorityDetailId(null)}
          onEdit={() => {
            setEditTaskId(currentPriorityTask.id);
            setPriorityDetailId(null);
          }}
        />
      )}

      {showReminder && (
        <ReminderModal
          activeTasks={activeTasks}
          dateLabel={formatLong(selectedDate)}
          onClose={() => setShowReminder(false)}
        />
      )}
    </div>
  );
}
