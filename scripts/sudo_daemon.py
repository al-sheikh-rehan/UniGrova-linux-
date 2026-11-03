#!/usr/bin/env python3
"""
Root execution daemon for UniGrova Linux
Listens on a local Unix socket to execute commands as root with file descriptor passing.
"""

import os
import sys
import socket
import array
import json
import subprocess
import signal

SOCK_PATH = "/tmp/unigrova_sudo.sock"

def run_daemon():
    if os.path.exists(SOCK_PATH):
        try:
            os.unlink(SOCK_PATH)
        except OSError:
            pass

    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.bind(SOCK_PATH)
    os.chmod(SOCK_PATH, 0o666)
    server.listen(16)

    def sig_handler(signum, frame):
        try:
            os.unlink(SOCK_PATH)
        except OSError:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    while True:
        try:
            conn, _ = server.accept()
        except KeyboardInterrupt:
            break
        except Exception:
            continue

        try:
            fds = array.array("i")
            msg, ancdata, flags, addr = conn.recvmsg(4096, socket.CMSG_SPACE(3 * fds.itemsize))
            if not msg:
                conn.close()
                continue

            for cmsg_level, cmsg_type, cmsg_data in ancdata:
                if cmsg_level == socket.SOL_SOCKET and cmsg_type == socket.SCM_RIGHTS:
                    fds.frombytes(cmsg_data[: len(cmsg_data) - (len(cmsg_data) % fds.itemsize)])

            data = json.loads(msg.decode("utf-8"))
            args = data.get("args", [])
            cwd = data.get("cwd", "/root")
            if not os.path.isdir(cwd):
                cwd = "/root"

            if not args or args == ["-i"] or args == ["-s"] or args == ["su"] or args == ["bash"]:
                args = ["/bin/bash", "--login", "-i"]

            env = os.environ.copy()
            env["USER"] = "root"
            env["LOGNAME"] = "root"
            env["HOME"] = "/root"
            env["SHELL"] = "/bin/bash"
            env["TERM"] = "xterm-256color"
            env["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            env["PS1"] = r"\[\033[01;31m\]root@user\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]# "

            stdin_target = fds[0] if len(fds) > 0 else None
            stdout_target = fds[1] if len(fds) > 1 else None
            stderr_target = fds[2] if len(fds) > 2 else None

            p = subprocess.Popen(
                args,
                cwd=cwd,
                env=env,
                stdin=stdin_target,
                stdout=stdout_target,
                stderr=stderr_target,
            )
            exit_code = p.wait()

            # Close inherited fds
            for fd in fds:
                try:
                    os.close(fd)
                except OSError:
                    pass

            conn.sendall(json.dumps({"code": exit_code}).encode("utf-8"))
        except Exception as e:
            try:
                conn.sendall(json.dumps({"code": 1, "error": str(e)}).encode("utf-8"))
            except Exception:
                pass
        finally:
            try:
                conn.close()
            except OSError:
                pass

if __name__ == "__main__":
    run_daemon()
