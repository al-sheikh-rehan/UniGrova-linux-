/**
 * LPU CSE65D: Operating Systems Laboratory (Session 2026–27)
 * Complete Official Practical Syllabus, Experiments, Verification Scripts & Viva Guides.
 */

export interface LPUTask {
  id: string;
  title: string;
  instruction: string;
  commandHint: string;
  checkScript: string;
  expectedOutputHint?: string;
}

export interface LPUExperiment {
  id: string;
  expNumber: number;
  title: string;
  unit: string;
  aim: string;
  commandsCovered: string[];
  theory: string;
  tasks: LPUTask[];
  sampleScript?: string;
  vivaQuestions: { q: string; a: string }[];
}

export const LPU_CSE65D_EXPERIMENTS: LPUExperiment[] = [
  {
    id: 'exp-1',
    expNumber: 1,
    title: 'Directory & Useful Linux Navigation Commands',
    unit: 'Unit I: Linux Filesystem Hierarchy & Directory Navigation',
    aim: 'To study and execute Linux directory navigation, directory hierarchy creation, path resolution, and directory inspection commands (mkdir, cd, mv, pwd, rmdir, ls, tree, find, basename, dirname).',
    commandsCovered: ['mkdir', 'cd', 'mv', 'pwd', 'rmdir', 'ls', 'tree', 'find', 'basename', 'dirname'],
    theory: `The Linux Filesystem follows the Filesystem Hierarchy Standard (FHS). Everything in Linux is a file or directory. Directories are organized in an inverted tree starting from the root directory '/'. 
Key system calls involved include mkdir(2), rmdir(2), chdir(2), and getcwd(3). Pathnames can be absolute (starting from /) or relative (starting from the current working directory). The 'tree' utility provides a recursive graphical representation of directory structures, while 'find' performs expressive searches based on inode metadata.`,
    tasks: [
      {
        id: 'exp1-task-1',
        title: 'Task 1.1: Verify Current Directory & Home Path',
        instruction: 'Print your current working directory using pwd to confirm starting inside /home/unigrova.',
        commandHint: 'pwd',
        checkScript: 'pwd | grep -E "/home/unigrova|/root"',
        expectedOutputHint: '/home/unigrova',
      },
      {
        id: 'exp1-task-2',
        title: 'Task 1.2: Create Nested Laboratory Directory Tree',
        instruction: 'Create a nested laboratory directory structure: lpu_cse65d_lab/exp1/docs and lpu_cse65d_lab/exp1/backup using mkdir -p.',
        commandHint: 'mkdir -p lpu_cse65d_lab/exp1/docs lpu_cse65d_lab/exp1/backup',
        checkScript: 'test -d lpu_cse65d_lab/exp1/docs && test -d lpu_cse65d_lab/exp1/backup && echo OK',
        expectedOutputHint: 'OK',
      },
      {
        id: 'exp1-task-3',
        title: 'Task 1.3: Inspect Directory Hierarchy using tree',
        instruction: 'Run tree on the lpu_cse65d_lab directory to inspect the created hierarchy.',
        commandHint: 'tree lpu_cse65d_lab',
        checkScript: 'which tree && tree lpu_cse65d_lab',
        expectedOutputHint: 'lpu_cse65d_lab directory tree representation',
      },
      {
        id: 'exp1-task-4',
        title: 'Task 1.4: Path Component Extraction (basename & dirname)',
        instruction: 'Use basename and dirname on the absolute path /home/unigrova/lpu_cse65d_lab/exp1/docs.',
        commandHint: 'basename /home/unigrova/lpu_cse65d_lab/exp1/docs && dirname /home/unigrova/lpu_cse65d_lab/exp1/docs',
        checkScript: 'basename /home/unigrova/lpu_cse65d_lab/exp1/docs | grep -q "docs" && dirname /home/unigrova/lpu_cse65d_lab/exp1/docs | grep -q "exp1"',
        expectedOutputHint: 'docs\n/home/unigrova/lpu_cse65d_lab/exp1',
      },
      {
        id: 'exp1-task-5',
        title: 'Task 1.5: Directory Search with find',
        instruction: 'Find all directories inside lpu_cse65d_lab using find with -type d.',
        commandHint: 'find lpu_cse65d_lab -type d',
        checkScript: 'find lpu_cse65d_lab -type d | grep -q "exp1/docs"',
        expectedOutputHint: 'List of matching directories',
      },
    ],
    vivaQuestions: [
      {
        q: 'What is the difference between an absolute path and a relative path in Linux?',
        a: 'An absolute path begins from the root directory (/) and uniquely identifies a file from the top. A relative path begins from the current working directory ($PWD).',
      },
      {
        q: 'What does the -p flag in mkdir do?',
        a: 'It creates parent directories as needed without throwing an error if the directory already exists.',
      },
      {
        q: 'Explain the purpose of basename and dirname.',
        a: 'basename strips directory prefixes and returns the trailing file/folder component. dirname strips the trailing component and returns the parent directory path.',
      },
    ],
  },
  {
    id: 'exp-2',
    expNumber: 2,
    title: 'File Processing, Inode Inspection & Hard/Soft Links',
    unit: 'Unit II: File Operations, Inode Architecture & File Metadata',
    aim: 'To practice file creation, content viewing, copying, moving, metadata analysis, file identification, and symbolic/hard link management (ls, cd, pwd, vim, vi, cp, mv, rm, find, history, touch, cat, file, stat, ln, less, more).',
    commandsCovered: ['touch', 'cat', 'file', 'stat', 'ln', 'cp', 'mv', 'rm', 'less', 'more', 'vim', 'history'],
    theory: `In Linux, files are identified internally by an inode (index node) number, which stores file metadata (size, permissions, timestamps, owner, pointer to data blocks) except the filename itself.
A Hard Link (ln file link) creates a new directory entry pointing directly to the existing inode. Deleting the original file does not delete the hard link.
A Symbolic/Soft Link (ln -s target link) creates a separate file containing the pathname of the target. The 'stat' command displays full inode information, while 'file' determines file format via magic number headers.`,
    tasks: [
      {
        id: 'exp2-task-1',
        title: 'Task 2.1: Create Source File with Timestamp',
        instruction: 'Create a file named sample.txt inside lpu_cse65d_lab/exp1/docs with sample text content.',
        commandHint: 'echo "Operating Systems Lab LPU CSE65D" > lpu_cse65d_lab/exp1/docs/sample.txt',
        checkScript: 'test -f lpu_cse65d_lab/exp1/docs/sample.txt && grep -q "CSE65D" lpu_cse65d_lab/exp1/docs/sample.txt',
        expectedOutputHint: 'File created with content',
      },
      {
        id: 'exp2-task-2',
        title: 'Task 2.2: Inspect Detailed Inode Metadata with stat',
        instruction: 'Inspect the inode, permissions, blocks, and timestamps of sample.txt using stat.',
        commandHint: 'stat lpu_cse65d_lab/exp1/docs/sample.txt',
        checkScript: 'stat lpu_cse65d_lab/exp1/docs/sample.txt | grep -E "Inode|Device"',
        expectedOutputHint: 'stat metadata output with Inode number and Access/Modify timestamps',
      },
      {
        id: 'exp2-task-3',
        title: 'Task 2.3: Determine File Type with file',
        instruction: 'Use the file command to verify the MIME type and character encoding of sample.txt.',
        commandHint: 'file lpu_cse65d_lab/exp1/docs/sample.txt',
        checkScript: 'file lpu_cse65d_lab/exp1/docs/sample.txt | grep -q "ASCII text"',
        expectedOutputHint: 'ASCII text',
      },
      {
        id: 'exp2-task-4',
        title: 'Task 2.4: Create Hard Link and Soft Link',
        instruction: 'Create a hard link named hard_sample.txt and a symbolic link named soft_sample.txt pointing to sample.txt.',
        commandHint: 'ln lpu_cse65d_lab/exp1/docs/sample.txt lpu_cse65d_lab/exp1/docs/hard_sample.txt && ln -s sample.txt lpu_cse65d_lab/exp1/docs/soft_sample.txt',
        checkScript: 'test -f lpu_cse65d_lab/exp1/docs/hard_sample.txt && test -L lpu_cse65d_lab/exp1/docs/soft_sample.txt',
        expectedOutputHint: 'Both hard link and symlink created successfully',
      },
      {
        id: 'exp2-task-5',
        title: 'Task 2.5: Verify Link Inodes with ls -li',
        instruction: 'Run ls -li lpu_cse65d_lab/exp1/docs/ to observe that hard_sample.txt shares the exact same inode as sample.txt.',
        commandHint: 'ls -li lpu_cse65d_lab/exp1/docs/',
        checkScript: 'ls -li lpu_cse65d_lab/exp1/docs/ | grep -q "hard_sample.txt"',
        expectedOutputHint: 'Same inode number printed for sample.txt and hard_sample.txt',
      },
    ],
    vivaQuestions: [
      {
        q: 'What is the fundamental difference between a Hard Link and a Soft (Symbolic) Link?',
        a: 'A hard link shares the exact same inode and data blocks as the target. A soft link is an independent inode pointing to the pathname of the target. Hard links cannot cross filesystems or link directories.',
      },
      {
        q: 'What happens to a file when its reference count drops to 0?',
        a: 'When all hard links to an inode are unlinked and no open file descriptors point to it, the OS kernel marks the inode and data blocks as free for reuse.',
      },
    ],
  },
  {
    id: 'exp-3',
    expNumber: 3,
    title: 'Linux Process Management, Priorities & Job Control',
    unit: 'Unit III: Process Lifecycle, Signals & Process Scheduling',
    aim: 'To analyze process states, inspect the process table, control process priorities with nice/renice, send signals (SIGTERM, SIGKILL, SIGHUP), and manage foreground/background jobs (ps, pstree, top, kill, renice, pkill, pgrep, jobs, bg, fg, nice, sleep, nohup).',
    commandsCovered: ['ps', 'pstree', 'top', 'kill', 'renice', 'pkill', 'pgrep', 'jobs', 'bg', 'fg', 'nice', 'sleep', 'nohup'],
    theory: `A Process is an instance of an executing program with its own address space (text, data, heap, stack). Each process is assigned a unique Process ID (PID) and Parent Process ID (PPID).
Process states include Running (R), Interruptible Sleep (S), Uninterruptible Sleep (D), Stopped (T), and Zombie (Z).
Processes are scheduled based on nice value (-20 highest priority to +19 lowest priority; default is 0). Signals are software interrupts sent via kill(2); e.g., SIGTERM (15) for graceful termination and SIGKILL (9) for immediate kernel termination.`,
    tasks: [
      {
        id: 'exp3-task-1',
        title: 'Task 3.1: Inspect Process Tree with ps and pstree',
        instruction: 'Run ps aux and pstree to inspect the system process hierarchy.',
        commandHint: 'ps aux | head -n 15 && pstree -p | head -n 15',
        checkScript: 'ps aux | grep -q "PID" && which pstree',
        expectedOutputHint: 'Process table showing USER, PID, %CPU, %MEM, STAT, COMMAND',
      },
      {
        id: 'exp3-task-2',
        title: 'Task 3.2: Launch Background Sleep Process',
        instruction: 'Launch a background sleep process for 300 seconds using nohup or &.',
        commandHint: 'sleep 300 &',
        checkScript: 'pgrep -f "sleep 300" >/dev/null',
        expectedOutputHint: '[1] <PID>',
      },
      {
        id: 'exp3-task-3',
        title: 'Task 3.3: Inspect PID with pgrep',
        instruction: 'Find the PID of the background sleep process using pgrep.',
        commandHint: 'pgrep -l sleep',
        checkScript: 'pgrep -l sleep',
        expectedOutputHint: '<PID> sleep',
      },
      {
        id: 'exp3-task-4',
        title: 'Task 3.4: Alter Priority with renice',
        instruction: 'Change the nice value of the sleep process to +10 using renice.',
        commandHint: 'renice 10 $(pgrep -f "sleep 300" | head -n 1)',
        checkScript: 'PID=$(pgrep -f "sleep 300" | head -n 1); test -n "$PID" && ps -o pid,ni,comm -p $PID',
        expectedOutputHint: 'PID (old priority) new priority 10',
      },
      {
        id: 'exp3-task-5',
        title: 'Task 3.5: Terminate Process with kill or pkill',
        instruction: 'Terminate the background sleep process using kill or pkill.',
        commandHint: 'pkill -f "sleep 300"',
        checkScript: '! pgrep -f "sleep 300" >/dev/null && echo "Process successfully terminated"',
        expectedOutputHint: 'Process successfully terminated',
      },
    ],
    vivaQuestions: [
      {
        q: 'What is a Zombie Process and how is it created?',
        a: 'A zombie process is a process that has completed execution via exit(), but its parent has not yet read its exit status via wait()/waitpid(). Its entry remains in the process table.',
      },
      {
        q: 'What is the default signal sent by kill, and how does it differ from SIGKILL (9)?',
        a: 'The default signal is SIGTERM (15), which can be caught or ignored by the process for cleanup. SIGKILL (9) cannot be caught or ignored; the kernel terminates the process immediately.',
      },
    ],
  },
  {
    id: 'exp-4',
    expNumber: 4,
    title: 'Linux File Permissions, Access Control & User Groups',
    unit: 'Unit IV: Security Models, DAC, Inode Permissions & Umask',
    aim: 'To evaluate and implement Linux Discretionary Access Control (DAC), calculate symbolic and numeric (octal) permissions, set default creation masks, and inspect user identity (chmod, chown, chgrp, umask, id, groups, ls -l, stat).',
    commandsCovered: ['chmod', 'chown', 'chgrp', 'umask', 'id', 'groups', 'ls -l', 'stat'],
    theory: `Linux file permissions are divided into three tiers: User (u), Group (g), and Others (o). Each tier has Read (r=4), Write (w=2), and Execute (x=1) permissions.
The file mode is represented in octal (e.g., 755 = rwxr-xr-x, 644 = rw-r--r--).
The 'umask' (user mask) filters out permission bits during file and directory creation. Default directory base permission is 777 (777 - umask), and default file base permission is 666 (666 - umask).`,
    tasks: [
      {
        id: 'exp4-task-1',
        title: 'Task 4.1: Inspect User Identity and Group Memberships',
        instruction: 'Run id and groups to inspect UID, GID, and secondary group memberships for unigrova.',
        commandHint: 'id && groups',
        checkScript: 'id | grep -q "unigrova" && groups',
        expectedOutputHint: 'uid=1001(unigrova) gid=1001(unigrova) groups=...',
      },
      {
        id: 'exp4-task-2',
        title: 'Task 4.2: Check and Display Current Umask',
        instruction: 'Display the current user creation mask using umask.',
        commandHint: 'umask',
        checkScript: 'umask | grep -E "0022|022"',
        expectedOutputHint: '0022 or 022',
      },
      {
        id: 'exp4-task-3',
        title: 'Task 4.3: Create File and Set Permissions to 750 (rwxr-x---)',
        instruction: 'Create secure.sh inside lpu_cse65d_lab and change its mode to 750 (Owner: rwx, Group: r-x, Others: none).',
        commandHint: 'touch lpu_cse65d_lab/secure.sh && chmod 750 lpu_cse65d_lab/secure.sh',
        checkScript: 'test -f lpu_cse65d_lab/secure.sh && stat -c %a lpu_cse65d_lab/secure.sh | grep -q "750"',
        expectedOutputHint: '750',
      },
      {
        id: 'exp4-task-4',
        title: 'Task 4.4: Verify Symbolic Mode Modification',
        instruction: 'Remove group execute permission using symbolic chmod (g-x) on secure.sh.',
        commandHint: 'chmod g-x lpu_cse65d_lab/secure.sh',
        checkScript: 'stat -c %a lpu_cse65d_lab/secure.sh | grep -q "740"',
        expectedOutputHint: '740 (rwxr-----)',
      },
      {
        id: 'exp4-task-5',
        title: 'Task 4.5: Inspect Exact Permission String with ls -l',
        instruction: 'Run ls -l on secure.sh to verify -rwxr-----.',
        commandHint: 'ls -l lpu_cse65d_lab/secure.sh',
        checkScript: 'ls -l lpu_cse65d_lab/secure.sh | grep -q "rwxr-----"',
        expectedOutputHint: '-rwxr----- 1 unigrova unigrova ... secure.sh',
      },
    ],
    vivaQuestions: [
      {
        q: 'If umask is 027, what are the default permissions of a newly created file and directory?',
        a: 'For files: 666 - 027 = 640 (rw-r-----). For directories: 777 - 027 = 750 (rwxr-x---).',
      },
      {
        q: 'What is the SUID (Set User ID) bit and its numeric value?',
        a: 'SUID (numeric 4000) causes an executable file to run with the permissions of the file owner rather than the user executing it (e.g., /usr/bin/passwd).',
      },
    ],
  },
  {
    id: 'exp-5',
    expNumber: 5,
    title: 'Linux Mail Subsystem & User Communications',
    unit: 'Unit V: Inter-User Communication, Mail Transfer Agents & Mail Spool',
    aim: 'To configure and evaluate the real Linux mail utility, understand system mailboxes (/var/mail, /var/spool/mail), send messages between local users, and inspect MTA delivery status (mail, mailx).',
    commandsCovered: ['mail', 'mailx'],
    theory: `Unix/Linux systems utilize a mail subsystem comprising a Mail User Agent (MUA, like mail/mailx), a Mail Transfer Agent (MTA, like sendmail/exim/postfix), and a Mail Delivery Agent (MDA).
Incoming messages for users are stored in the system mail spool at /var/mail/<username>. 
If an MTA daemon is not active or encounters sandboxed network restrictions, the real Linux mail binary prints genuine system delivery errors, which students must learn to diagnose in production environments.`,
    tasks: [
      {
        id: 'exp5-task-1',
        title: 'Task 5.1: Verify Installed Mail Binary',
        instruction: 'Check the real installed Linux mailx/mail binary and its path using which mail.',
        commandHint: 'which mail && which bsd-mailx',
        checkScript: 'which mail && which bsd-mailx',
        expectedOutputHint: '/usr/bin/mail',
      },
      {
        id: 'exp5-task-2',
        title: 'Task 5.2: Check Mail Spool for unigrova',
        instruction: 'Check for incoming messages in user mailbox using mail -H or inspect /var/mail.',
        commandHint: 'mail -e || echo "No mail for unigrova" && ls -ld /var/mail',
        checkScript: 'ls -ld /var/mail',
        expectedOutputHint: 'drwxrwxr-x /var/mail',
      },
      {
        id: 'exp5-task-3',
        title: 'Task 5.3: Execute Real Mail Dispatch to Local User',
        instruction: 'Send a test email with subject "OS Lab CSE65D" to unigrova using the mail command and pipe.',
        commandHint: 'echo "Experiment 5 Mail Test" | mail -s "OS Lab CSE65D" unigrova',
        checkScript: 'echo "Experiment 5 Mail Test" | mail -s "OS Lab CSE65D" unigrova 2>&1 || true',
        expectedOutputHint: 'Executes actual mail binary and returns genuine delivery/MTA status',
      },
    ],
    vivaQuestions: [
      {
        q: 'Where are local user mailboxes stored on a standard Linux distribution?',
        a: 'In /var/mail/<username> or /var/spool/mail/<username>.',
      },
      {
        q: 'What components constitute the Linux mail architecture?',
        a: 'MUA (Mail User Agent like mailx/mutt), MTA (Mail Transfer Agent like postfix/exim), and MDA (Mail Delivery Agent like procmail/maildrop).',
      },
    ],
  },
  {
    id: 'exp-6',
    expNumber: 6,
    title: 'Vi / Vim Full Screen Text Editor Practicals',
    unit: 'Unit VI: Modal Text Editing, Vim Buffers & Cursor Navigation',
    aim: 'To practice modal editing in Vi/Vim: Command Mode, Insert Mode, Ex Command-line Mode, cursor movements (h,j,k,l), word skipping (w,b), deletion (dd, dw, x), yank/paste (yy, p), search/replace (/, :s), and saving (:w, :q, :wq, :q!).',
    commandsCovered: ['vi', 'vim'],
    theory: `Vi (Visual Editor) is the standard POSIX modal editor present on all Unix/Linux installations. Vim (Vi IMproved) extends Vi with syntax highlighting, undo trees, and visual mode.
Modes in Vi:
1. Command Mode (default): keystrokes perform movements and editing operations.
2. Insert Mode: entered via i (insert), a (append), o (open line below), O (open line above).
3. Ex Mode: entered via ':' from Command Mode (e.g., :w to write, :q to quit, :s for regex search/replace).`,
    tasks: [
      {
        id: 'exp6-task-1',
        title: 'Task 6.1: Verify Vim Version and Alternatives Link',
        instruction: 'Check the real vim binary installation and version.',
        commandHint: 'vim --version | head -n 2',
        checkScript: 'vim --version | grep -i "VIM"',
        expectedOutputHint: 'VIM - Vi IMproved',
      },
      {
        id: 'exp6-task-2',
        title: 'Task 6.2: Create and Populate a C File for Vim Practicals',
        instruction: 'Create a C program file named lab_program.c inside lpu_cse65d_lab.',
        commandHint: 'cat << "EOF" > lpu_cse65d_lab/lab_program.c\n#include <stdio.h>\nint main() {\n    printf("LPU CSE65D OS Lab\\\\n");\n    return 0;\n}\nEOF',
        checkScript: 'test -f lpu_cse65d_lab/lab_program.c && grep -q "printf" lpu_cse65d_lab/lab_program.c',
        expectedOutputHint: 'lab_program.c created with valid C code',
      },
      {
        id: 'exp6-task-3',
        title: 'Task 6.3: Compile the C Program with GCC',
        instruction: 'Compile lab_program.c using GNU GCC and run the generated executable.',
        commandHint: 'gcc -o lpu_cse65d_lab/lab_program lpu_cse65d_lab/lab_program.c && ./lpu_cse65d_lab/lab_program',
        checkScript: './lpu_cse65d_lab/lab_program | grep -q "LPU CSE65D OS Lab"',
        expectedOutputHint: 'LPU CSE65D OS Lab',
      },
    ],
    vivaQuestions: [
      {
        q: 'How do you switch between Command Mode, Insert Mode, and Ex Mode in Vi?',
        a: 'Press "i" or "a" from Command Mode to enter Insert Mode. Press "Esc" to return to Command Mode. Press ":" from Command Mode to enter Ex Mode.',
      },
      {
        q: 'What is the command in Vi to replace all occurrences of "foo" with "bar" throughout the entire file?',
        a: ':%s/foo/bar/g',
      },
    ],
  },
  {
    id: 'exp-7',
    expNumber: 7,
    title: 'Text Processing Pipelines & General Purpose Linux Commands',
    unit: 'Unit VII: Stream Processing, Filters, Redirection & UNIX Utilities',
    aim: 'To construct multi-stage UNIX pipelines for data filtering, transformation, counting, sorting, deduplication, and field extraction (cat, echo, grep, wc, sort, uniq, tsort, cut, paste, join, head, tail, look, sed, awk, tr, tee, diff, comm, printf; sleep, exit, su, sudo, man, help, which, whereis, command, clear, date, cal, whoami, hostname, uname, env, export).',
    commandsCovered: ['cat', 'grep', 'wc', 'sort', 'uniq', 'tsort', 'cut', 'paste', 'join', 'sed', 'awk', 'tr', 'tee', 'diff', 'comm', 'uname', 'cal', 'date'],
    theory: `UNIX philosophy: write programs that do one thing well, and write programs to work together using text streams.
Pipes (|) connect the standard output (stdout, fd 1) of one process to the standard input (stdin, fd 0) of another process.
Filters process text line-by-line:
- grep: regular expression matching.
- cut: column/delimiter extraction.
- sort & uniq: ordering and duplicate removal.
- tr: character transliteration and deletion.
- sed: stream editor for transformation.
- awk: pattern-directed text scanning and reporting.`,
    tasks: [
      {
        id: 'exp7-task-1',
        title: 'Task 7.1: Create Student Records Dataset',
        instruction: 'Create a tab/colon-delimited dataset named students.txt with RegNo, Name, Section, and Marks.',
        commandHint: 'cat << "EOF" > lpu_cse65d_lab/students.txt\n12001:Aman:K22AB:88\n12002:Priya:K22AB:94\n12003:Rahul:K22CD:76\n12004:Sneha:K22CD:91\n12005:Aman:K22AB:88\nEOF',
        checkScript: 'test -f lpu_cse65d_lab/students.txt && grep -q "12001" lpu_cse65d_lab/students.txt',
        expectedOutputHint: 'Dataset created with 5 records',
      },
      {
        id: 'exp7-task-2',
        title: 'Task 7.2: Extract Columns with cut',
        instruction: 'Extract only student Names and Marks (fields 2 and 4) using cut with delimiter ":".',
        commandHint: 'cut -d: -f2,4 lpu_cse65d_lab/students.txt',
        checkScript: 'cut -d: -f2,4 lpu_cse65d_lab/students.txt | grep -q "Priya:94"',
        expectedOutputHint: 'Aman:88\nPriya:94\nRahul:76\nSneha:91\nAman:88',
      },
      {
        id: 'exp7-task-3',
        title: 'Task 7.3: Deduplicate Records with sort and uniq',
        instruction: 'Sort the dataset and remove duplicate records using a pipeline: sort | uniq.',
        commandHint: 'sort lpu_cse65d_lab/students.txt | uniq',
        checkScript: 'test $(sort lpu_cse65d_lab/students.txt | uniq | wc -l) -eq 4',
        expectedOutputHint: '4 unique records output',
      },
      {
        id: 'exp7-task-4',
        title: 'Task 7.4: Translate Lowercase to Uppercase with tr',
        instruction: 'Convert all student names to uppercase using tr "[:lower:]" "[:upper:]".',
        commandHint: 'cat lpu_cse65d_lab/students.txt | tr "[:lower:]" "[:upper:]"',
        checkScript: 'cat lpu_cse65d_lab/students.txt | tr "[:lower:]" "[:upper:]" | grep -q "PRIYA"',
        expectedOutputHint: 'All text converted to UPPERCASE',
      },
      {
        id: 'exp7-task-5',
        title: 'Task 7.5: Stream Editing with sed & AWK Filtering',
        instruction: 'Use awk to find students scoring over 90 marks.',
        commandHint: 'awk -F: \'$4 > 90 {print $2, "scored", $4}\' lpu_cse65d_lab/students.txt',
        checkScript: 'awk -F: \'$4 > 90 {print $2, $4}\' lpu_cse65d_lab/students.txt | grep -q "Priya"',
        expectedOutputHint: 'Priya scored 94\nSneha scored 91',
      },
    ],
    vivaQuestions: [
      {
        q: 'Why must sort be executed before uniq when deduplicating text?',
        a: 'The uniq utility only detects and collapses adjacent matching lines. If duplicate lines are dispersed throughout the file, uniq cannot catch them unless sort places them adjacently.',
      },
      {
        q: 'What is the tee command used for?',
        a: 'The tee command reads from standard input and writes simultaneously to standard output AND one or more files, splitting the stream.',
      },
    ],
  },
  {
    id: 'exp-8',
    expNumber: 8,
    title: 'Shell Scripting, Control Structures & Multi-Shell Practical (Bash, Ksh, Csh)',
    unit: 'Unit VIII: Shell Programming, Variables, Control Flow & Posix Shells',
    aim: 'To develop shell programs across Bash, Korn Shell (ksh), and C Shell (tcsh), implementing command-line arguments, user input, conditional branches (if, if-else, elif, case), iteration (for, while, until), arithmetic evaluation, functions, and exit status handling.',
    commandsCovered: ['bash', 'sh', 'ksh', 'tcsh', 'test', 'expr', 'read', 'chmod'],
    theory: `Shell scripting automates operating system tasks. A shell script begins with a shebang line (#!) specifying the interpreter path (e.g., #!/bin/bash, #!/usr/bin/ksh, #!/usr/bin/tcsh).
Key shells:
- Bourne Again Shell (bash): standard on GNU/Linux.
- Korn Shell (ksh): powerful scripting language created by David Korn at Bell Labs.
- C Shell (csh/tcsh): C-like syntax developed by Bill Joy at UC Berkeley.
Conditional structures include [ condition ] (test), [[ condition ]], if-then-else-fi, and case-esac. Loops include for, while, and until.`,
    sampleScript: `#!/bin/bash
# LPU CSE65D Operating Systems Lab - Shell Script Example
echo "=== Student Grade Evaluation Script ==="
read -p "Enter student marks (0-100): " marks

if [ "$marks" -ge 90 ]; then
    grade="O (Outstanding)"
elif [ "$marks" -ge 75 ]; then
    grade="A+ (Excellent)"
elif [ "$marks" -ge 60 ]; then
    grade="B (Good)"
elif [ "$marks" -ge 40 ]; then
    grade="C (Pass)"
else
    grade="F (Fail)"
fi

echo "Result: Marks: $marks | Grade: $grade"
`,
    tasks: [
      {
        id: 'exp8-task-1',
        title: 'Task 8.1: Write Bash Arithmetic & Condition Script',
        instruction: 'Create check_num.sh to test whether an entered number is positive, negative, or zero.',
        commandHint: 'cat << "EOF" > lpu_cse65d_lab/check_num.sh\n#!/bin/bash\nNUM=$1\nif [ $NUM -gt 0 ]; then\n    echo "$NUM is positive"\nelif [ $NUM -lt 0 ]; then\n    echo "$NUM is negative"\nelse\n    echo "$NUM is zero"\nfi\nEOF\nchmod +x lpu_cse65d_lab/check_num.sh',
        checkScript: 'test -x lpu_cse65d_lab/check_num.sh && ./lpu_cse65d_lab/check_num.sh 15 | grep -q "positive"',
        expectedOutputHint: '15 is positive',
      },
      {
        id: 'exp8-task-2',
        title: 'Task 8.2: Write a For Loop Script (Factorial Calculation)',
        instruction: 'Create factorial.sh that calculates the factorial of a given number using a for loop.',
        commandHint: 'cat << "EOF" > lpu_cse65d_lab/factorial.sh\n#!/bin/bash\nN=$1\nFACT=1\nfor ((i=1; i<=N; i++)); do\n    FACT=$((FACT * i))\ndone\necho "Factorial of $N is $FACT"\nEOF\nchmod +x lpu_cse65d_lab/factorial.sh',
        checkScript: 'test -x lpu_cse65d_lab/factorial.sh && ./lpu_cse65d_lab/factorial.sh 5 | grep -q "120"',
        expectedOutputHint: 'Factorial of 5 is 120',
      },
      {
        id: 'exp8-task-3',
        title: 'Task 8.3: Execute Script in Korn Shell (ksh)',
        instruction: 'Execute check_num.sh under the real Korn Shell interpreter (/usr/bin/ksh).',
        commandHint: 'ksh lpu_cse65d_lab/check_num.sh 42',
        checkScript: 'ksh lpu_cse65d_lab/check_num.sh 42 | grep -q "positive"',
        expectedOutputHint: '42 is positive (executed via ksh)',
      },
      {
        id: 'exp8-task-4',
        title: 'Task 8.4: Write and Execute C Shell Script (tcsh)',
        instruction: 'Create a C Shell script csh_demo.csh with #!/usr/bin/tcsh and execute it.',
        commandHint: 'cat << "EOF" > lpu_cse65d_lab/csh_demo.csh\n#!/usr/bin/tcsh\necho "Running in C Shell: $version"\nEOF\nchmod +x lpu_cse65d_lab/csh_demo.csh && ./lpu_cse65d_lab/csh_demo.csh',
        checkScript: 'test -x lpu_cse65d_lab/csh_demo.csh && tcsh lpu_cse65d_lab/csh_demo.csh | grep -i "C Shell"',
        expectedOutputHint: 'Running in C Shell: ...',
      },
    ],
    vivaQuestions: [
      {
        q: 'What is the purpose of the Shebang (#!) line in a shell script?',
        a: 'The shebang tells the Linux program loader (execve system call) which interpreter binary to launch to parse and execute the subsequent lines in the script.',
      },
      {
        q: 'What is the difference between $* and $@ in Bash?',
        a: 'Both represent all command line arguments. However, "$*" expands into a single string ("$1 $2..."), while "$@" expands into separate quoted arguments ("$1" "$2"...).',
      },
    ],
  },
  {
    id: 'exp-9',
    expNumber: 9,
    title: 'LAN Networking, Socket Inspection & DHCP Client Practicals',
    unit: 'Unit IX: Linux Networking Stack, Interface Configuration & Routing',
    aim: 'To inspect real network interfaces, verify DHCP client configuration, inspect socket bindings, examine kernel routing tables, and test network connectivity (ip, ifconfig, ping, dhclient, dhcpcd, route, ip route, ip addr, cat /etc/resolv.conf, ss, netstat, hostname).',
    commandsCovered: ['ip', 'ifconfig', 'ping', 'dhclient', 'route', 'ip route', 'ip addr', 'ss', 'netstat', 'hostname'],
    theory: `The Linux kernel provides a powerful TCP/IP networking stack. Network interfaces are configured using 'ip' (iproute2 package) or legacy 'ifconfig' (net-tools).
DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses, netmasks, default gateways, and DNS servers to host interfaces. The client daemon 'dhclient' sends DHCPDISCOVER broadcasts and handles DHCPOFFER, DHCPREQUEST, and DHCPACK messages.
The routing table is inspected via 'ip route' or 'route -n'. Socket states (ESTABLISHED, LISTEN) are analyzed using 'ss' or 'netstat'.`,
    tasks: [
      {
        id: 'exp9-task-1',
        title: 'Task 9.1: Display All Network Interfaces & Addresses',
        instruction: 'Display all network interfaces, MAC addresses, and assigned IP addresses using ip addr and ifconfig.',
        commandHint: 'ip addr show && ifconfig',
        checkScript: 'ip addr | grep -q "inet" && ifconfig',
        expectedOutputHint: 'Interface details for lo, eth1, eth2 showing inet IP addresses',
      },
      {
        id: 'exp9-task-2',
        title: 'Task 9.2: Inspect Kernel IP Routing Table',
        instruction: 'Inspect the kernel routing table using ip route and route -n.',
        commandHint: 'ip route show && route -n',
        checkScript: 'ip route show && which route',
        expectedOutputHint: 'Kernel IP routing table showing destinations and gateways',
      },
      {
        id: 'exp9-task-3',
        title: 'Task 9.3: Inspect DNS Name Server Configuration',
        instruction: 'Display the DNS resolver configuration in /etc/resolv.conf.',
        commandHint: 'cat /etc/resolv.conf',
        checkScript: 'cat /etc/resolv.conf | grep -q "nameserver"',
        expectedOutputHint: 'nameserver <IP_ADDRESS>',
      },
      {
        id: 'exp9-task-4',
        title: 'Task 9.4: Inspect Listening Sockets with ss and netstat',
        instruction: 'Display all listening TCP/UDP sockets using ss -tuln and netstat -tuln.',
        commandHint: 'ss -tuln && netstat -tuln',
        checkScript: 'ss -tuln',
        expectedOutputHint: 'State Recv-Q Send-Q Local Address:Port Peer Address:Port',
      },
      {
        id: 'exp9-task-5',
        title: 'Task 9.5: Test Loopback Connectivity with ping',
        instruction: 'Send 3 ICMP echo requests to the IPv4 loopback address (127.0.0.1) using ping -c 3.',
        commandHint: 'ping -c 3 127.0.0.1',
        checkScript: 'ping -c 3 127.0.0.1 | grep -q "3 packets transmitted"',
        expectedOutputHint: '3 packets transmitted, 3 received, 0% packet loss',
      },
    ],
    vivaQuestions: [
      {
        q: 'What is the 4-step DHCP exchange process (DORA)?',
        a: '1. DHCPDISCOVER (client broadcasts to locate servers), 2. DHCPOFFER (server offers IP lease), 3. DHCPREQUEST (client requests offered IP), 4. DHCPACK (server confirms lease).',
      },
      {
        q: 'Why has the ip command replaced ifconfig in modern Linux distributions?',
        a: 'The ip command (from iproute2) communicates directly with the kernel via netlink sockets, supporting multiple routing tables, VLANs, policy-based routing, and IPv6 natively, unlike the legacy ioctl-based ifconfig.',
      },
    ],
  },
];
