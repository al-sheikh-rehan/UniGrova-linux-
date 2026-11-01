import { LabLesson, LinuxCommand, ProjectTemplate, QuizQuestion } from '../types';

export const LINUX_COMMANDS: LinuxCommand[] = [
  {
    name: 'ls',
    category: 'files',
    summary: 'List directory contents with details and colors',
    syntax: 'ls [options] [path]',
    example: 'ls -la /home',
    options: [
      { flag: '-l', desc: 'Use a long listing format showing permissions, owner, size' },
      { flag: '-a', desc: 'Include directory entries whose names begin with a dot (.)' },
      { flag: '-h', desc: 'Human-readable sizes (e.g., 1K 234M 2G)' },
      { flag: '-t', desc: 'Sort by modification time, newest first' },
    ],
  },
  {
    name: 'pwd',
    category: 'files',
    summary: 'Print the current working directory pathname',
    syntax: 'pwd',
    example: 'pwd',
    options: [
      { flag: '-L', desc: 'Print the value of $PWD if it names the current working directory' },
      { flag: '-P', desc: 'Print the physical directory, without any symbolic links' },
    ],
  },
  {
    name: 'cd',
    category: 'files',
    summary: 'Change the current working directory',
    syntax: 'cd [directory]',
    example: 'cd /tmp',
    options: [
      { flag: '..', desc: 'Move up one directory level to the parent' },
      { flag: '~', desc: 'Navigate to the current user home directory' },
      { flag: '-', desc: 'Switch to the previous working directory' },
    ],
  },
  {
    name: 'mkdir',
    category: 'files',
    summary: 'Create new directories in the filesystem',
    syntax: 'mkdir [options] <directory_name>',
    example: 'mkdir -p projects/linux-lab',
    options: [
      { flag: '-p', desc: 'Create parent directories as needed without error if existing' },
      { flag: '-m', desc: 'Set file mode (permissions), as in chmod, not a=rwx - umask' },
    ],
  },
  {
    name: 'touch',
    category: 'files',
    summary: 'Update file timestamps or create empty new files',
    syntax: 'touch [options] <file_name>',
    example: 'touch notes.txt main.c',
    options: [
      { flag: '-a', desc: 'Change only the access time' },
      { flag: '-m', desc: 'Change only the modification time' },
    ],
  },
  {
    name: 'cp',
    category: 'files',
    summary: 'Copy files and directories',
    syntax: 'cp [options] <source> <destination>',
    example: 'cp -r src/ backup/',
    options: [
      { flag: '-r, -R', desc: 'Copy directories recursively' },
      { flag: '-i', desc: 'Prompt before overwrite' },
      { flag: '-p', desc: 'Preserve file attributes if possible' },
    ],
  },
  {
    name: 'mv',
    category: 'files',
    summary: 'Move (rename) files and directories',
    syntax: 'mv [options] <source> <destination>',
    example: 'mv old_name.txt new_name.txt',
    options: [
      { flag: '-i', desc: 'Prompt before overwrite' },
      { flag: '-u', desc: 'Move only when source file is newer than destination' },
    ],
  },
  {
    name: 'rm',
    category: 'files',
    summary: 'Remove files or directories',
    syntax: 'rm [options] <target>',
    example: 'rm -rf /tmp/testdir',
    options: [
      { flag: '-r', desc: 'Remove directories and their contents recursively' },
      { flag: '-f', desc: 'Ignore nonexistent files and arguments, never prompt' },
    ],
  },
  {
    name: 'cat',
    category: 'text',
    summary: 'Concatenate files and print on the standard output',
    syntax: 'cat [options] [file...]',
    example: 'cat /etc/os-release',
    options: [
      { flag: '-n', desc: 'Number all output lines' },
      { flag: '-b', desc: 'Number nonempty output lines' },
    ],
  },
  {
    name: 'grep',
    category: 'text',
    summary: 'Print lines matching a pattern or regular expression',
    syntax: 'grep [options] <pattern> [file...]',
    example: 'grep -rn "root" /etc/',
    options: [
      { flag: '-i', desc: 'Ignore case distinctions in patterns and input data' },
      { flag: '-r', desc: 'Read all files under each directory recursively' },
      { flag: '-v', desc: 'Invert the sense of matching, to select non-matching lines' },
      { flag: '-c', desc: 'Suppress normal output; print a count of matching lines' },
    ],
  },
  {
    name: 'head',
    category: 'text',
    summary: 'Output the first part of files',
    syntax: 'head [options] [file...]',
    example: 'head -n 20 /proc/cpuinfo',
    options: [{ flag: '-n', desc: 'Print the first N lines instead of default 10' }],
  },
  {
    name: 'tail',
    category: 'text',
    summary: 'Output the last part of files',
    syntax: 'tail [options] [file...]',
    example: 'tail -f /var/log/messages',
    options: [
      { flag: '-n', desc: 'Output the last N lines instead of the last 10' },
      { flag: '-f', desc: 'Output appended data as the file grows' },
    ],
  },
  {
    name: 'wc',
    category: 'text',
    summary: 'Print newline, word, and byte counts for each file',
    syntax: 'wc [options] [file...]',
    example: 'wc -l /etc/passwd',
    options: [
      { flag: '-l', desc: 'Print the newline counts' },
      { flag: '-w', desc: 'Print the word counts' },
      { flag: '-c', desc: 'Print the byte counts' },
    ],
  },
  {
    name: 'chmod',
    category: 'permissions',
    summary: 'Change file mode bits (read, write, execute permissions)',
    syntax: 'chmod [options] <mode> <file...>',
    example: 'chmod 755 script.sh',
    options: [
      { flag: '-R', desc: 'Change files and directories recursively' },
      { flag: '+x', desc: 'Add execute permission for all users' },
      { flag: '755', desc: 'Owner: rwx, Group: r-x, Others: r-x' },
      { flag: '644', desc: 'Owner: rw-, Group: r--, Others: r--' },
    ],
  },
  {
    name: 'ps',
    category: 'process',
    summary: 'Report a snapshot of the current processes',
    syntax: 'ps [options]',
    example: 'ps aux',
    options: [
      { flag: 'aux', desc: 'Show all running processes for all users in BSD syntax' },
      { flag: '-ef', desc: 'Standard syntax for full process list' },
    ],
  },
  {
    name: 'top',
    category: 'process',
    summary: 'Display Linux processes with live CPU and memory metrics',
    syntax: 'top',
    example: 'top',
    options: [{ flag: '-d', desc: 'Delay time interval in seconds' }],
  },
  {
    name: 'kill',
    category: 'process',
    summary: 'Send a signal to a process (default TERM)',
    syntax: 'kill [options] <pid...>',
    example: 'kill -9 1234',
    options: [
      { flag: '-9', desc: 'SIGKILL (force immediate termination)' },
      { flag: '-15', desc: 'SIGTERM (graceful termination signal)' },
    ],
  },
  {
    name: 'df',
    category: 'system',
    summary: 'Report file system disk space usage',
    syntax: 'df [options] [file...]',
    example: 'df -h',
    options: [
      { flag: '-h', desc: 'Print sizes in powers of 1024 (e.g., 1023M)' },
      { flag: '-T', desc: 'Print file system type' },
    ],
  },
  {
    name: 'free',
    category: 'system',
    summary: 'Display amount of free and used memory in the system',
    syntax: 'free [options]',
    example: 'free -m',
    options: [
      { flag: '-m', desc: 'Display the amount of memory in megabytes' },
      { flag: '-h', desc: 'Show all output fields automatically scaled to shortest' },
    ],
  },
  {
    name: 'uname',
    category: 'system',
    summary: 'Print system information and kernel architecture',
    syntax: 'uname [options]',
    example: 'uname -a',
    options: [
      { flag: '-a', desc: 'Print all information (kernel, hostname, version, arch)' },
      { flag: '-r', desc: 'Print the kernel release' },
      { flag: '-m', desc: 'Print the machine hardware name' },
    ],
  },
  {
    name: 'date',
    category: 'system',
    summary: 'Display or set system date and time',
    syntax: 'date',
    example: 'date +"%Y-%m-%d %H:%M:%S"',
    options: [{ flag: '-u', desc: 'Display UTC / Coordinated Universal Time' }],
  },
  {
    name: 'tar',
    category: 'files',
    summary: 'An archiving utility for packing and extracting tarballs',
    syntax: 'tar [options] <archive> [file...]',
    example: 'tar -czvf archive.tar.gz mydir/',
    options: [
      { flag: '-c', desc: 'Create a new archive' },
      { flag: '-x', desc: 'Extract files from an archive' },
      { flag: '-z', desc: 'Filter the archive through gzip' },
      { flag: '-v', desc: 'Verbosely list files processed' },
      { flag: '-f', desc: 'Use archive file or device ARCHIVE' },
    ],
  },
  {
    name: 'find',
    category: 'files',
    summary: 'Search for files in a directory hierarchy',
    syntax: 'find [path] [expression]',
    example: 'find /etc -name "*.conf"',
    options: [
      { flag: '-name', desc: 'Base of file name matches shell pattern' },
      { flag: '-type', desc: 'File type (f for regular file, d for directory)' },
      { flag: '-size', desc: 'File uses N units of space' },
    ],
  },
  {
    name: 'echo',
    category: 'text',
    summary: 'Display a line of text or variable value',
    syntax: 'echo [options] [string...]',
    example: 'echo "Hello Linux" > greeting.txt',
    options: [
      { flag: '-n', desc: 'Do not output trailing newline' },
      { flag: '-e', desc: 'Enable interpretation of backslash escapes' },
    ],
  },
  {
    name: 'whoami',
    category: 'system',
    summary: 'Print effective user name',
    syntax: 'whoami',
    example: 'whoami',
    options: [],
  },
  {
    name: 'history',
    category: 'system',
    summary: 'Display command history list',
    syntax: 'history',
    example: 'history',
    options: [],
  },
];

export const LAB_LESSONS: LabLesson[] = [
  {
    id: 'lesson-1',
    tier: 'beginner',
    title: 'Linux Navigation & Directory Creation',
    description: 'Learn how to inspect the current path, navigate filesystems, and create nested directory trees.',
    tasks: [
      {
        id: 'task-1-1',
        title: 'Check Current Working Directory',
        instruction: 'Print your current working directory to confirm your starting location in the Linux filesystem.',
        commandHint: 'pwd',
        verificationCmd: 'pwd',
        verificationPattern: '/',
      },
      {
        id: 'task-1-2',
        title: 'List Directory Contents with Details',
        instruction: 'Run the list command with hidden files and long formatting to view directory permissions.',
        commandHint: 'ls -la',
        verificationCmd: 'ls -la',
      },
      {
        id: 'task-1-3',
        title: 'Create a Project Directory',
        instruction: 'Create a new directory named "lab_project" inside the root directory.',
        commandHint: 'mkdir -p /lab_project',
        verificationCmd: 'test -d /lab_project && echo OK',
        verificationPattern: 'OK',
      },
    ],
  },
  {
    id: 'lesson-2',
    tier: 'beginner',
    title: 'File Creation & Text Inspection',
    description: 'Master touch, cat, echo, and redirection to create files and inspect file contents.',
    tasks: [
      {
        id: 'task-2-1',
        title: 'Create an Empty File',
        instruction: 'Create an empty file named "notes.txt" inside "/lab_project".',
        commandHint: 'touch /lab_project/notes.txt',
        verificationCmd: 'test -f /lab_project/notes.txt && echo OK',
        verificationPattern: 'OK',
      },
      {
        id: 'task-2-2',
        title: 'Write Content Using Output Redirection',
        instruction: 'Write "Welcome to UniGrova Linux Lab" into "/lab_project/notes.txt" using the echo command and redirection.',
        commandHint: 'echo "Welcome to UniGrova Linux Lab" > /lab_project/notes.txt',
        verificationCmd: 'cat /lab_project/notes.txt',
        verificationPattern: 'Welcome to UniGrova Linux Lab',
      },
      {
        id: 'task-2-3',
        title: 'Inspect CPU Details from /proc',
        instruction: 'View the first 15 lines of the Linux virtual CPU information file.',
        commandHint: 'head -n 15 /proc/cpuinfo',
        verificationCmd: 'head -n 15 /proc/cpuinfo',
      },
    ],
  },
  {
    id: 'lesson-3',
    tier: 'intermediate',
    title: 'Pipelines, Grep & Text Processing',
    description: 'Harness the power of UNIX pipes (|) and grep filtering to analyze system logs and configurations.',
    tasks: [
      {
        id: 'task-3-1',
        title: 'Count Users in /etc/passwd',
        instruction: 'Use a pipeline combining cat (or direct input) with word count to count how many user entries exist.',
        commandHint: 'wc -l /etc/passwd',
        verificationCmd: 'wc -l /etc/passwd',
      },
      {
        id: 'task-3-2',
        title: 'Filter Root User Info',
        instruction: 'Use grep to search for the line starting with "root" inside the "/etc/passwd" authentication file.',
        commandHint: 'grep "^root" /etc/passwd',
        verificationCmd: 'grep "^root" /etc/passwd',
        verificationPattern: 'root:x:0:0',
      },
      {
        id: 'task-3-3',
        title: 'Search System Kernel Messages',
        instruction: 'Filter the kernel buffer (dmesg) or /proc/version to see the Linux version.',
        commandHint: 'cat /proc/version',
        verificationCmd: 'cat /proc/version',
        verificationPattern: 'Linux version',
      },
    ],
  },
  {
    id: 'lesson-4',
    tier: 'intermediate',
    title: 'File Modes & Permissions (chmod)',
    description: 'Learn Unix permission octals (755, 644) and make shell scripts executable.',
    tasks: [
      {
        id: 'task-4-1',
        title: 'Create a Shell Script',
        instruction: 'Create a script file at "/lab_project/script.sh" with a shebang line `#!/bin/sh` and an echo statement.',
        commandHint: 'echo -e "#!/bin/sh\\necho Hello From Script" > /lab_project/script.sh',
        verificationCmd: 'test -f /lab_project/script.sh && echo OK',
        verificationPattern: 'OK',
      },
      {
        id: 'task-4-2',
        title: 'Grant Execute Permissions',
        instruction: 'Make the script executable using chmod +x or chmod 755.',
        commandHint: 'chmod +x /lab_project/script.sh',
        verificationCmd: 'test -x /lab_project/script.sh && echo OK',
        verificationPattern: 'OK',
      },
      {
        id: 'task-4-3',
        title: 'Execute the Script',
        instruction: 'Execute the newly created shell script from the terminal.',
        commandHint: '/lab_project/script.sh',
        verificationCmd: '/lab_project/script.sh',
        verificationPattern: 'Hello From Script',
      },
    ],
  },
  {
    id: 'lesson-5',
    tier: 'advanced',
    title: 'Processes, Memory & Filesystem Health',
    description: 'Inspect live processes, memory limits, and mount points in the Linux kernel.',
    tasks: [
      {
        id: 'task-5-1',
        title: 'Inspect Running Processes',
        instruction: 'Run the ps command to view the process tree running in this Linux container/kernel.',
        commandHint: 'ps',
        verificationCmd: 'ps',
      },
      {
        id: 'task-5-2',
        title: 'Examine System Memory in Megabytes',
        instruction: 'Check free, used, and cached memory buffers in megabytes.',
        commandHint: 'free -m',
        verificationCmd: 'free -m',
      },
      {
        id: 'task-5-3',
        title: 'Check Disk Filesystem Space',
        instruction: 'Inspect mounted partitions and available disk space with human-readable units.',
        commandHint: 'df -h',
        verificationCmd: 'df -h',
      },
    ],
  },
];

export const LINUX_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Which Linux command is used to display the absolute pathname of the current working directory?',
    options: ['cd', 'pwd', 'ls -d', 'whereis'],
    correctIndex: 1,
    explanation: 'pwd stands for "Print Working Directory" and outputs the exact absolute directory path you are currently inside.',
  },
  {
    id: 'q2',
    question: 'What does the permission mode "755" represent on a Unix file?',
    options: [
      'Read and write for owner, none for others',
      'Read, write, execute for owner; read and execute for group and others',
      'Full access for everyone',
      'Read-only for all users',
    ],
    correctIndex: 1,
    explanation: '7 (4+2+1=rwx) gives owner full rights. 5 (4+0+1=r-x) gives group and others read and execute rights without write privileges.',
  },
  {
    id: 'q3',
    question: 'Which character is used to redirect stdout to a file, overwriting the destination file if it exists?',
    options: ['>>', '>', '<', '|'],
    correctIndex: 1,
    explanation: '> redirects standard output to a file, truncating/overwriting it. >> appends to the file, while | pipes output to another program.',
  },
  {
    id: 'q4',
    question: 'Which signal does "kill -9 <PID>" send to force-terminate an unresponsive process?',
    options: ['SIGTERM', 'SIGHUP', 'SIGKILL', 'SIGINT'],
    correctIndex: 2,
    explanation: 'Signal 9 is SIGKILL. It cannot be caught, blocked, or ignored by the target process, forcing immediate kernel termination.',
  },
  {
    id: 'q5',
    question: 'In the Linux virtual filesystem, what is stored in the "/proc" directory?',
    options: [
      'Installed programs and binary executables',
      'Virtual kernel information and runtime process data',
      'User home directories and profile files',
      'System recovery backup snapshots',
    ],
    correctIndex: 1,
    explanation: '/proc is a pseudo-filesystem mounted by the Linux kernel that provides an interface to kernel data structures and process states.',
  },
  {
    id: 'q6',
    question: 'Which command searches for files in a directory hierarchy based on criteria like name, size, or modification time?',
    options: ['locate', 'which', 'find', 'grep'],
    correctIndex: 2,
    explanation: 'find evaluates real-time filesystem hierarchies. grep searches file contents, while which locates executable binaries in $PATH.',
  },
  {
    id: 'q7',
    question: 'Which keyboard shortcut sends an EOF (End-of-File) signal to the current Linux terminal shell session?',
    options: ['Ctrl + C', 'Ctrl + Z', 'Ctrl + D', 'Ctrl + L'],
    correctIndex: 2,
    explanation: 'Ctrl+D sends EOF (closing stdin or exiting the shell). Ctrl+C sends SIGINT to cancel the command, and Ctrl+L clears the screen.',
  },
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'c-hello',
    title: 'Hello Linux (C)',
    language: 'c',
    description: 'Standard C program printing greetings and Linux system information.',
    defaultFile: 'main.c',
    files: [
      {
        name: 'main.c',
        content: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("========================================\\n");
    printf("  UniGrova Linux Lab: C Environment\\n");
    printf("========================================\\n");
    printf("Hello from a real Linux C program!\\n");
    printf("Process PID: %d\\n", getpid());
    printf("Execution completed successfully.\\n");
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'c-memory',
    title: 'Dynamic Memory & Data Structures (C)',
    language: 'c',
    description: 'C program demonstrating pointer arithmetic, malloc, and dynamic structs.',
    defaultFile: 'linked_list.c',
    files: [
      {
        name: 'linked_list.c',
        content: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

void append(Node** head, int val) {
    Node* new_node = (Node*)malloc(sizeof(Node));
    new_node->data = val;
    new_node->next = NULL;

    if (*head == NULL) {
        *head = new_node;
        return;
    }

    Node* temp = *head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->next = new_node;
}

int main(void) {
    Node* head = NULL;
    printf("Allocating dynamic linked list in Linux memory...\\n");

    for (int i = 1; i <= 5; i++) {
        append(&head, i * 10);
    }

    Node* curr = head;
    printf("Traversing list items: ");
    while (curr != NULL) {
        printf("[%d] -> ", curr->data);
        Node* to_free = curr;
        curr = curr->next;
        free(to_free);
    }
    printf("NULL\\nMemory successfully freed.\\n");
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'bash-script',
    title: 'System Health & Backup (Bash)',
    language: 'bash',
    description: 'Automated shell script inspecting disk, memory, and archiving files.',
    defaultFile: 'health_check.sh',
    files: [
      {
        name: 'health_check.sh',
        content: `#!/bin/sh
# UniGrova Linux Lab System Health Monitor

echo "--- [1] System Architecture ---"
uname -a

echo ""
echo "--- [2] Current Date & Hostname ---"
date
hostname

echo ""
echo "--- [3] Memory Metrics ---"
free -m

echo ""
echo "--- [4] Filesystem Partitions ---"
df -h

echo ""
echo "Health check complete. System status: Optimal."
`,
      },
    ],
  },
  {
    id: 'python-demo',
    title: 'System Statistics & Math (Python)',
    language: 'python',
    description: 'Python script analyzing numbers and formatting reports.',
    defaultFile: 'stats.py',
    files: [
      {
        name: 'stats.py',
        content: `import sys
import platform
import os

print("=" * 45)
print("UniGrova Linux Lab - Python Environment")
print("=" * 45)

print(f"Python Version: {platform.python_version()}")
print(f"System: {platform.system()} ({platform.machine()})")
print(f"Current Working Directory: {os.getcwd()}")

numbers = [14, 28, 56, 82, 91, 105, 33]
avg = sum(numbers) / len(numbers)

print(f"Analyzed Dataset: {numbers}")
print(f"Sum: {sum(numbers)} | Count: {len(numbers)} | Average: {avg:.2f}")
print("Task finished successfully.")
`,
      },
    ],
  },
];
