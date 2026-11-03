#!/usr/bin/env python3
import sys
import os
import pty
import termios
import struct
import fcntl
import select
import signal
import pwd
import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="UniGrova Linux PTY Bridge")
    parser.add_argument("--cols", type=int, default=80)
    parser.add_argument("--rows", type=int, default=24)
    parser.add_argument("--cwd", type=str, default="/home/unigrova")
    parser.add_argument("--user", type=str, default="unigrova")
    args = parser.parse_args()

    cols = max(10, args.cols)
    rows = max(5, args.rows)
    target_user = args.user

    try:
        user_info = pwd.getpwnam(target_user)
        target_uid = user_info.pw_uid
        target_gid = user_info.pw_gid
        user_home = user_info.pw_dir
    except KeyError:
        target_uid = 0
        target_gid = 0
        user_home = "/home/unigrova" if target_user == "unigrova" else "/root"

    target_cwd = args.cwd if os.path.isdir(args.cwd) else user_home
    if not os.path.isdir(target_cwd):
        target_cwd = "/"

    master, slave = pty.openpty()

    # Set initial window size
    winsize = struct.pack("HHHH", rows, cols, 0, 0)
    fcntl.ioctl(master, termios.TIOCSWINSZ, winsize)

    child_pid = os.fork()

    if child_pid == 0:
        try:
            os.close(master)
            os.setsid()
            fcntl.ioctl(slave, termios.TIOCSCTTY, 0)

            os.dup2(slave, 0)
            os.dup2(slave, 1)
            os.dup2(slave, 2)
            if slave > 2:
                os.close(slave)

            if target_uid != 0:
                try:
                    os.setgid(target_gid)
                    os.setgroups([target_gid])
                    os.setuid(target_uid)
                except Exception as e:
                    pass

            os.chdir(target_cwd)

            env = os.environ.copy()
            env["USER"] = target_user
            env["LOGNAME"] = target_user
            env["HOME"] = user_home
            env["SHELL"] = "/bin/bash"
            env["TERM"] = "xterm-256color"
            env["COLORTERM"] = "truecolor"
            env["LANG"] = "en_US.UTF-8"
            env["PWD"] = target_cwd
            env["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            env["PS1"] = r"\[\033[01;32m\]unigrova@user\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "

            os.execvpe("/bin/bash", ["bash", "--norc", "-i"], env)
        except Exception:
            os._exit(1)

    os.close(slave)

    def handle_sigint(signum, frame):
        try:
            os.kill(child_pid, signal.SIGINT)
        except ProcessLookupError:
            pass

    signal.signal(signal.SIGINT, handle_sigint)

    stdin_fd = sys.stdin.fileno()
    stdout_fd = sys.stdout.fileno()

    buffer = b""

    while True:
        try:
            rlist, _, _ = select.select([stdin_fd, master], [], [], 0.05)
        except (select.error, InterruptedError):
            continue

        wpid, status = os.waitpid(child_pid, os.WNOHANG)
        if wpid != 0:
            break

        # Output from bash PTY -> write to stdout (to Node.js)
        if master in rlist:
            try:
                data = os.read(master, 8192)
                if not data:
                    break
                os.write(stdout_fd, data)
            except OSError:
                break

        # Input from Node.js stdin -> parse JSON control or write to bash PTY
        if stdin_fd in rlist:
            try:
                chunk = os.read(stdin_fd, 8192)
                if not chunk:
                    break
                buffer += chunk
                while b"\n" in buffer:
                    line_bytes, buffer = buffer.split(b"\n", 1)
                    if not line_bytes.strip():
                        continue
                    try:
                        cmd = json.loads(line_bytes.decode("utf-8"))
                        msg_type = cmd.get("type")
                        if msg_type == "stdin":
                            data_str = cmd.get("data", "")
                            if data_str:
                                os.write(master, data_str.encode("utf-8"))
                        elif msg_type == "resize":
                            new_cols = int(cmd.get("cols", cols))
                            new_rows = int(cmd.get("rows", rows))
                            new_winsize = struct.pack("HHHH", new_rows, new_cols, 0, 0)
                            fcntl.ioctl(master, termios.TIOCSWINSZ, new_winsize)
                            try:
                                os.kill(child_pid, signal.SIGWINCH)
                            except ProcessLookupError:
                                pass
                        elif msg_type == "signal":
                            sig_name = cmd.get("sig", "SIGINT")
                            sig_num = getattr(signal, sig_name, signal.SIGINT)
                            try:
                                os.kill(child_pid, sig_num)
                            except ProcessLookupError:
                                pass
                    except Exception:
                        os.write(master, line_bytes + b"\n")
            except OSError:
                pass

    try:
        os.close(master)
    except OSError:
        pass

    try:
        _, status = os.waitpid(child_pid, 0)
        sys.exit(os.WEXITSTATUS(status) if os.WIFEXITED(status) else 0)
    except ChildProcessError:
        sys.exit(0)

if __name__ == "__main__":
    main()
