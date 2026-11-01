import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Check,
  ChevronRight,
  Circle,
  Compass,
  GraduationCap,
  HelpCircle,
  Play,
  RotateCcw,
  Terminal,
  Zap,
} from 'lucide-react';
import { LAB_LESSONS, LINUX_QUIZ } from '../../data/linuxData';
import { storageService } from '../../services/storageService';
import { v86Service } from '../../services/v86Service';
import { vfsService } from '../../services/vfsService';
import { defaultShell } from '../../services/shellService';
import { LabLesson, LabTask, QuizQuestion } from '../../types';

interface LearningLabAppProps {
  onRunInTerminal?: (cmd: string) => void;
}

export const LearningLabApp: React.FC<LearningLabAppProps> = ({ onRunInTerminal }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');
  const [selectedTier, setSelectedTier] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => storageService.getCompletedTasks());
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{ [id: string]: string }>({});

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<{ [id: string]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);

  // Filter lessons
  const filteredLessons = LAB_LESSONS.filter(
    (l) => selectedTier === 'all' || l.tier === selectedTier
  );

  const totalTasks = LAB_LESSONS.reduce((acc, l) => acc + l.tasks.length, 0);
  const progressPercent = Math.round((completedTasks.length / totalTasks) * 100);

  const handleVerifyTask = (task: LabTask) => {
    setVerifyingTaskId(task.id);
    try {
      let isVerified = false;
      let failureReason = '';

      // Check specific task conditions
      if (task.id === 'task-1-1') {
        const res = defaultShell.execute('pwd');
        isVerified = res.output.includes('/');
      } else if (task.id === 'task-1-2') {
        const res = defaultShell.execute('ls -la');
        isVerified = res.output.includes('total') || res.output.length > 0;
      } else if (task.id === 'task-1-3') {
        isVerified = vfsService.isDirectory('/lab_project');
        if (!isVerified) failureReason = 'Directory /lab_project has not been created yet. Run: mkdir /lab_project';
      } else if (task.id === 'task-2-1') {
        isVerified = vfsService.exists('/lab_project/notes.txt');
        if (!isVerified) failureReason = 'File /lab_project/notes.txt not found. Run: touch /lab_project/notes.txt';
      } else if (task.id === 'task-2-2') {
        const content = vfsService.readFile('/lab_project/notes.txt') || '';
        isVerified = content.toLowerCase().includes('welcome') || content.toLowerCase().includes('linux');
        if (!isVerified) failureReason = 'Content missing in /lab_project/notes.txt. Try: echo "Welcome to UniGrova Linux Lab" > /lab_project/notes.txt';
      } else if (task.id === 'task-2-3') {
        const res = defaultShell.execute('head -n 15 /proc/cpuinfo');
        isVerified = res.output.includes('processor') || res.output.includes('model name');
      } else if (task.id === 'task-3-1') {
        const res = defaultShell.execute('wc -l /etc/passwd');
        isVerified = res.exitCode === 0;
      } else if (task.id === 'task-3-2') {
        const res = defaultShell.execute('grep root /etc/passwd');
        isVerified = res.output.includes('root:x:0:0');
      } else if (task.id === 'task-3-3') {
        const res = defaultShell.execute('cat /proc/version');
        isVerified = res.output.includes('Linux');
      } else if (task.id === 'task-4-1') {
        isVerified = vfsService.exists('/lab_project/script.sh');
        if (!isVerified) failureReason = 'File /lab_project/script.sh not found. Create it with echo or in the editor.';
      } else if (task.id === 'task-4-2') {
        const entry = vfsService.getEntry('/lab_project/script.sh');
        isVerified = !!entry && entry.permissions.includes('x');
        if (!isVerified) failureReason = 'Permissions not set to execute (+x). Run: chmod +x /lab_project/script.sh';
      } else if (task.id === 'task-4-3') {
        const res = defaultShell.execute('/lab_project/script.sh');
        isVerified = res.exitCode === 0;
      } else if (task.verificationCmd) {
        const res = defaultShell.execute(task.verificationCmd);
        isVerified = !task.verificationPattern || res.output.includes(task.verificationPattern);
        if (!isVerified) failureReason = `Verification check returned: "${res.output.trim()}"`;
      } else {
        isVerified = true;
      }

      if (isVerified) {
        storageService.setTaskCompleted(task.id);
        setCompletedTasks(storageService.getCompletedTasks());
        setVerificationFeedback((prev) => ({
          ...prev,
          [task.id]: 'Task passed! Step completed successfully.',
        }));
      } else {
        setVerificationFeedback((prev) => ({
          ...prev,
          [task.id]: failureReason || 'Task requirement not satisfied yet.',
        }));
      }
    } catch (e: any) {
      setVerificationFeedback((prev) => ({
        ...prev,
        [task.id]: `Verification error: ${e.message}`,
      }));
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const handleResetProgress = () => {
    if (confirm('Reset all lab exercise progress?')) {
      storageService.resetLabProgress();
      setCompletedTasks([]);
      setVerificationFeedback({});
    }
  };

  const handleAnswerSelect = (qId: string, optIndex: number) => {
    if (submittedQuiz) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const quizScore = LINUX_QUIZ.reduce((score, q) => {
    return quizAnswers[q.id] === q.correctIndex ? score + 1 : score;
  }, 0);

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden text-xs">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-orange-500" />
          <div>
            <h2 className="font-bold text-stone-100 text-sm">Linux Practice & Learning Lab</h2>
            <p className="text-[11px] text-stone-400">Interactive Linux challenges and certifications</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'lessons'
                ? 'bg-orange-600 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Practical Tasks
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'quiz'
                ? 'bg-orange-600 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Linux MCQs Quiz
          </button>
        </div>
      </div>

      {activeTab === 'lessons' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress Banner */}
          <div className="px-4 py-3 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-stone-300">Lab Completion Progress</span>
                <span className="text-orange-400 font-mono">
                  {completedTasks.length} / {totalTasks} tasks ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2.5 py-1 rounded capitalize text-[11px] transition-colors ${
                    selectedTier === tier
                      ? 'bg-stone-800 text-white font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {tier}
                </button>
              ))}

              <button
                onClick={handleResetProgress}
                title="Reset lab progress"
                className="p-1 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 ml-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lessons List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-stone-950/70 border border-stone-800 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        lesson.tier === 'beginner'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : lesson.tier === 'intermediate'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-purple-500/15 text-purple-400'
                      }`}
                    >
                      {lesson.tier}
                    </span>
                    <h3 className="font-semibold text-stone-100 text-sm">{lesson.title}</h3>
                  </div>
                </div>

                <p className="text-stone-400 text-xs">{lesson.description}</p>

                {/* Tasks inside lesson */}
                <div className="space-y-2 pt-1">
                  {lesson.tasks.map((task) => {
                    const isDone = completedTasks.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-md border transition-all ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-800/40'
                            : 'bg-stone-900 border-stone-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h4 className="font-medium text-stone-200 text-xs">{task.title}</h4>
                              <p className="text-stone-400 text-[11px] mt-0.5">{task.instruction}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onRunInTerminal && (
                              <button
                                onClick={() => onRunInTerminal(`${task.commandHint}\n`)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[11px] transition-colors"
                                title="Run hint in terminal"
                              >
                                <Terminal className="w-3 h-3 text-orange-400" />
                                <span>Try: {task.commandHint}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleVerifyTask(task)}
                              disabled={verifyingTaskId === task.id || isDone}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium text-[11px] transition-colors ${
                                isDone
                                  ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                                  : 'bg-orange-600 hover:bg-orange-500 text-white'
                              }`}
                            >
                              <Zap className="w-3 h-3" />
                              <span>
                                {verifyingTaskId === task.id
                                  ? 'Verifying...'
                                  : isDone
                                  ? 'Verified'
                                  : 'Verify'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {verificationFeedback[task.id] && (
                          <div
                            className={`mt-2 text-[11px] font-mono p-1.5 rounded ${
                              verificationFeedback[task.id].includes('passed') ||
                              verificationFeedback[task.id].includes('completed')
                                ? 'bg-emerald-950/40 text-emerald-300'
                                : 'bg-red-950/40 text-red-300'
                            }`}
                          >
                            {verificationFeedback[task.id]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Quiz Tab */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-stone-950/60 p-4 rounded-lg border border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-100 text-sm">Linux Knowledge Check</h3>
              <p className="text-stone-400 text-xs mt-0.5">
                Answer these core Unix questions to test your terminal and system knowledge.
              </p>
            </div>
            {submittedQuiz && (
              <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded border border-stone-800">
                <Award className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-stone-100">
                  Score: {quizScore} / {LINUX_QUIZ.length}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {LINUX_QUIZ.map((q, idx) => (
              <div
                key={q.id}
                className="bg-stone-950/70 border border-stone-800 rounded-lg p-4 space-y-3"
              >
                <div className="font-medium text-stone-200 text-xs">
                  <span className="text-orange-400 font-bold mr-2">Q{idx + 1}.</span>
                  {q.question}
                </div>

                <div className="space-y-1.5 pl-4">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = quizAnswers[q.id] === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let btnClass = 'border-stone-800 hover:bg-stone-850 text-stone-300';
                    if (submittedQuiz) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-950/40 border-emerald-600 text-emerald-300';
                      } else if (isSelected && !isCorrect) {
                        btnClass = 'bg-red-950/40 border-red-600 text-red-300';
                      }
                    } else if (isSelected) {
                      btnClass = 'bg-orange-600/20 border-orange-500 text-white';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerSelect(q.id, optIdx)}
                        className={`w-full text-left p-2.5 rounded border transition-colors flex items-center gap-2.5 text-xs ${btnClass}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-stone-700 flex items-center justify-center font-mono text-[10px] shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {submittedQuiz && (
                  <div className="p-3 bg-stone-900 rounded border border-stone-800 text-[11px] text-stone-300">
                    <span className="font-semibold text-orange-400 block mb-0.5">Explanation:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quiz Action Button */}
          <div className="flex justify-end pt-2 pb-6">
            {!submittedQuiz ? (
              <button
                onClick={() => setSubmittedQuiz(true)}
                className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow transition-colors"
              >
                Submit Answers & View Explanations
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmittedQuiz(false);
                  setQuizAnswers({});
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
