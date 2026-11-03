import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  GraduationCap,
  HelpCircle,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { LPU_CSE65D_EXPERIMENTS, LPUExperiment, LPUTask } from '../../data/lpuSyllabusData';
import { storageService } from '../../services/storageService';

interface LearningLabAppProps {
  onRunInTerminal?: (cmd: string) => void;
}

export const LearningLabApp: React.FC<LearningLabAppProps> = ({ onRunInTerminal }) => {
  const [selectedExpId, setSelectedExpId] = useState<string>('exp-1');
  const [activeTab, setActiveTab] = useState<'practicals' | 'theory' | 'viva' | 'report'>('practicals');
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lpu_cse65d_completed_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<{ [id: string]: { passed: boolean; message: string; output?: string } }>({});
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Student Report Details
  const [studentName, setStudentName] = useState<string>('Student');
  const [regNo, setRegNo] = useState<string>('12200000');
  const [section, setSection] = useState<string>('K22AB');
  const [rollNo, setRollNo] = useState<string>('01');

  useEffect(() => {
    localStorage.setItem('lpu_cse65d_completed_tasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  const activeExp = LPU_CSE65D_EXPERIMENTS.find((e) => e.id === selectedExpId) || LPU_CSE65D_EXPERIMENTS[0];

  const totalTasks = LPU_CSE65D_EXPERIMENTS.reduce((acc, e) => acc + e.tasks.length, 0);
  const progressPercent = Math.round((completedTasks.length / totalTasks) * 100);

  const handleVerifyTask = async (task: LPUTask) => {
    setVerifyingTaskId(task.id);
    try {
      const response = await fetch('/api/lab/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: activeExp.id,
          taskId: task.id,
          checkScript: task.checkScript,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.passed) {
          if (!completedTasks.includes(task.id)) {
            setCompletedTasks((prev) => [...prev, task.id]);
          }
          setTaskFeedback((prev) => ({
            ...prev,
            [task.id]: {
              passed: true,
              message: 'Verified successfully on real Linux environment!',
              output: data.stdout || 'Requirement satisfied.',
            },
          }));
        } else {
          setTaskFeedback((prev) => ({
            ...prev,
            [task.id]: {
              passed: false,
              message: 'Verification check failed on system.',
              output: data.stderr || data.stdout || 'Please run the required command in terminal first.',
            },
          }));
        }
      } else {
        // Fallback verification if server returned error
        setTaskFeedback((prev) => ({
          ...prev,
          [task.id]: {
            passed: false,
            message: 'Server verification returned error code.',
          },
        }));
      }
    } catch (err: any) {
      setTaskFeedback((prev) => ({
        ...prev,
        [task.id]: {
          passed: false,
          message: `Network error: ${err.message}`,
        },
      }));
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleRunCommand = (cmd: string) => {
    if (onRunInTerminal) {
      onRunInTerminal(cmd);
    }
  };

  const handleResetProgress = () => {
    if (confirm('Reset all LPU CSE65D Laboratory task progress?')) {
      setCompletedTasks([]);
      setTaskFeedback({});
      localStorage.removeItem('lpu_cse65d_completed_tasks');
    }
  };

  const handleDownloadReport = () => {
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let report = `================================================================================
LOVELY PROFESSIONAL UNIVERSITY (LPU)
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
CSE65D: OPERATING SYSTEMS LABORATORY — SESSION 2026–27
PRACTICAL EXPERIMENT RECORD & EVALUATION REPORT
================================================================================

Student Information:
Student Name   : ${studentName}
Registration No: ${regNo}
Section        : ${section}
Roll Number    : ${rollNo}
Date of Exam   : ${dateStr}
Host Platform  : Debian GNU/Linux 12 (bookworm) x86_64
User Identity  : unigrova@user (Real Linux Environment)
Kernel Version : 5.15.0-generic SMP
Completed Tasks: ${completedTasks.length} / ${totalTasks} (${progressPercent}%)

================================================================================
SYLLABUS EXPERIMENTS & PERFORMANCE AUDIT
================================================================================
`;

    LPU_CSE65D_EXPERIMENTS.forEach((exp) => {
      const expTasks = exp.tasks;
      const doneCount = expTasks.filter((t) => completedTasks.includes(t.id)).length;
      report += `\n[EXPERIMENT ${exp.expNumber}]: ${exp.title.toUpperCase()}\n`;
      report += `Unit: ${exp.unit}\n`;
      report += `Aim : ${exp.aim}\n`;
      report += `Commands Covered: ${exp.commandsCovered.join(', ')}\n`;
      report += `Status: ${doneCount} of ${expTasks.length} tasks completed\n`;
      report += `Tasks Breakdown:\n`;

      expTasks.forEach((t) => {
        const isDone = completedTasks.includes(t.id);
        report += `  - [${isDone ? 'COMPLETED' : 'PENDING'}] ${t.title}\n`;
        report += `    Command: ${t.commandHint}\n`;
      });
      report += `--------------------------------------------------------------------------------\n`;
    });

    report += `
================================================================================
FACULTY VERIFICATION & SIGN-OFF
================================================================================
Performance Grade: [    ]
Lab Instructor Signature: _______________________
Date: ________________________
System Timestamp Verification: ${new Date().toISOString()}
================================================================================
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LPU_CSE65D_OS_Lab_Report_${regNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200 select-text overflow-hidden text-xs">
      {/* Top Banner: LPU CSE65D Lab Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-950 border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-100 text-sm tracking-wide">
                LPU CSE65D: Operating Systems Laboratory
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Session 2026–27
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                Debian 12 Kernel
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Genuine Linux Environment • Real System Calls, Files & Shell Practicals
            </p>
          </div>
        </div>

        {/* Overall Progress & Report Action */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-stone-400 font-medium">Syllabus Progress</div>
            <div className="text-xs font-bold text-orange-400">
              {completedTasks.length} / {totalTasks} Tasks ({progressPercent}%)
            </div>
          </div>

          <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden hidden sm:block border border-stone-700">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Lab Report</span>
          </button>

          <button
            onClick={handleResetProgress}
            title="Reset progress"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar + Right Experiment Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Syllabus Navigator */}
        <div className="w-64 bg-stone-950/80 border-r border-stone-800/80 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-800/60">
            Official Experiments (1–9)
          </div>

          <div className="p-2 space-y-1">
            {LPU_CSE65D_EXPERIMENTS.map((exp) => {
              const isSelected = exp.id === selectedExpId;
              const expDoneCount = exp.tasks.filter((t) => completedTasks.includes(t.id)).length;
              const isComplete = expDoneCount === exp.tasks.length;

              return (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-orange-500/15 border border-orange-500/40 text-stone-100 shadow-sm'
                      : 'hover:bg-stone-900/60 border border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isComplete
                        ? 'bg-teal-500 text-white'
                        : isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {isComplete ? <Check className="w-3 h-3" /> : exp.expNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight">
                      Exp {exp.expNumber}: {exp.title}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate mt-0.5">
                      {expDoneCount}/{exp.tasks.length} Completed
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Experiment Content */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-stone-900/90">
          {/* Experiment Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-800 bg-stone-950/40">
            <button
              onClick={() => setActiveTab('practicals')}
              className={`px-4 py-2 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'practicals'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Practical Tasks ({activeExp.tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`px-4 py-2 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'theory'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Theory & Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('viva')}
              className={`px-4 py-2 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'viva'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Viva Voce Prep ({activeExp.vivaQuestions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Lab Report</span>
            </button>
          </div>

          {/* Main Body */}
          <div className="p-6 space-y-6 flex-1">
            {/* Experiment Title Card */}
            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-1">
                <span>{activeExp.unit}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-stone-100">
                Experiment {activeExp.expNumber}: {activeExp.title}
              </h1>

              <div className="mt-2 text-xs text-stone-300 leading-relaxed">
                <span className="font-semibold text-stone-200">Aim: </span>
                {activeExp.aim}
              </div>

              {/* Commands Covered Pills */}
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-stone-500 font-medium mr-1">Commands:</span>
                {activeExp.commandsCovered.map((cmd) => (
                  <span
                    key={cmd}
                    className="px-2 py-0.5 rounded-md bg-stone-800/90 border border-stone-700/80 font-mono text-[11px] text-teal-300 font-semibold"
                  >
                    {cmd}
                  </span>
                ))}
              </div>
            </div>

            {/* Tab: Practicals */}
            {activeTab === 'practicals' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-200 text-sm">Step-by-Step Practical Procedure</h3>
                  <span className="text-xs text-stone-400">
                    Execute each command in the real Linux terminal and verify.
                  </span>
                </div>

                <div className="space-y-3">
                  {activeExp.tasks.map((task, idx) => {
                    const isDone = completedTasks.includes(task.id);
                    const isVerifying = verifyingTaskId === task.id;
                    const feedback = taskFeedback[task.id];

                    return (
                      <div
                        key={task.id}
                        className={`border rounded-xl p-4 transition-all ${
                          isDone
                            ? 'bg-teal-950/20 border-teal-500/40 shadow-sm'
                            : 'bg-stone-950/50 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                                isDone
                                  ? 'bg-teal-500 text-white font-bold'
                                  : 'bg-stone-800 text-stone-400 font-semibold'
                              }`}
                            >
                              {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-stone-100 text-xs sm:text-sm">
                                {task.title}
                              </h4>
                              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                                {task.instruction}
                              </p>
                            </div>
                          </div>

                          {isDone && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>

                        {/* Command Box */}
                        <div className="mt-3.5 bg-stone-900 border border-stone-800 rounded-lg p-2.5 flex items-center justify-between gap-3 font-mono text-xs">
                          <span className="text-teal-300 truncate select-all">{task.commandHint}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(task.commandHint, task.id)}
                              title="Copy command"
                              className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
                            >
                              {copiedCmd === task.id ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleRunCommand(task.commandHint)}
                              title="Run live in terminal"
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold transition-all shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Run in Terminal</span>
                            </button>

                            <button
                              onClick={() => handleVerifyTask(task)}
                              disabled={isVerifying}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all border ${
                                isDone
                                  ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                                  : 'bg-teal-600 border-teal-500 hover:bg-teal-500 text-white'
                              }`}
                            >
                              {isVerifying ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3" />
                              )}
                              <span>{isVerifying ? 'Checking...' : isDone ? 'Re-verify' : 'Verify'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Verification Output / Feedback */}
                        {feedback && (
                          <div
                            className={`mt-2.5 p-2 rounded-lg text-xs font-mono border ${
                              feedback.passed
                                ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1">
                              {feedback.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : '✖'}
                              <span>{feedback.message}</span>
                            </div>
                            {feedback.output && (
                              <div className="mt-1 text-[11px] text-stone-300 bg-black/40 p-1.5 rounded overflow-x-auto whitespace-pre-wrap">
                                {feedback.output}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sample Script if available */}
                {activeExp.sampleScript && (
                  <div className="mt-6 bg-stone-950 border border-stone-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-stone-200">
                        <FileCode className="w-4 h-4 text-orange-400" />
                        <span>Sample Script Implementation</span>
                      </div>
                      <button
                        onClick={() => handleCopy(activeExp.sampleScript || '', 'sample-script')}
                        className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Script</span>
                      </button>
                    </div>
                    <pre className="bg-stone-900/90 border border-stone-800 p-3 rounded-lg font-mono text-[11px] text-stone-300 overflow-x-auto whitespace-pre">
                      {activeExp.sampleScript}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Theory & Architecture */}
            {activeTab === 'theory' && (
              <div className="space-y-4">
                <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-5 space-y-3">
                  <h3 className="font-bold text-stone-100 text-sm">Operating System Architecture & Theory</h3>
                  <p className="text-xs text-stone-300 leading-relaxed whitespace-pre-line">
                    {activeExp.theory}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Viva Voce Prep */}
            {activeTab === 'viva' && (
              <div className="space-y-3">
                <h3 className="font-bold text-stone-200 text-sm">Viva Voce Questions & Model Answers</h3>
                <div className="space-y-3">
                  {activeExp.vivaQuestions.map((v, i) => (
                    <div key={i} className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-2">
                      <div className="font-semibold text-orange-400 text-xs sm:text-sm">
                        Q{i + 1}: {v.q}
                      </div>
                      <div className="text-xs text-stone-300 leading-relaxed pl-2 border-l-2 border-teal-500/50">
                        {v.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Report Generator */}
            {activeTab === 'report' && (
              <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-6 space-y-5 max-w-2xl">
                <div>
                  <h3 className="font-bold text-stone-100 text-base">Generate LPU CSE65D Laboratory Record</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Enter your academic credentials to compile and download your official Linux practical submission report.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-300 mb-1 block">Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-xs outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-300 mb-1 block">Registration Number</label>
                    <input
                      type="text"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-xs outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-300 mb-1 block">Section</label>
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-xs outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-300 mb-1 block">Roll Number</label>
                    <input
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <div className="text-xs text-stone-400">
                    Tasks Audited: <span className="font-bold text-teal-400">{completedTasks.length} / {totalTasks}</span>
                  </div>

                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download LPU Lab Report (.txt)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
