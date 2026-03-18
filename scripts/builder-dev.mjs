import { spawn } from "node:child_process";

const PNPM_COMMAND = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function prefixStream(stream, prefix) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim().length === 0) continue;
      process.stdout.write(`${prefix} ${line}\n`);
    }
  });

  stream.on("end", () => {
    const line = buffer.trim();
    if (line.length > 0) process.stdout.write(`${prefix} ${line}\n`);
    buffer = "";
  });
}

function startProcess({ name, command, args, env }) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });

  prefixStream(child.stdout, `[${name}]`);
  prefixStream(child.stderr, `[${name}]`);

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    process.stdout.write(`[${name}] exited (${reason})\n`);

    if (code && code !== 0) {
      process.stdout.write(`[manager] Shutting down because ${name} failed\n`);
      shutdown(1);
    }
  });

  child.on("error", (err) => {
    process.stdout.write(`[${name}] failed to start: ${err.message}\n`);
    shutdown(1);
  });

  return child;
}

const children = new Set();
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }

  setTimeout(() => {
    for (const child of children) {
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
    process.exit(exitCode);
  }, 2000).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.stdout.write("[manager] Starting backend + frontend dev servers...\n");

const backend = startProcess({
  name: "backend",
  command: PNPM_COMMAND,
  args: ["-C", "backend", "run", "dev"],
  env: { PORT: "3001" },
});
children.add(backend);

const frontend = startProcess({
  name: "frontend",
  command: PNPM_COMMAND,
  args: ["-C", "frontend", "exec", "next", "dev", "-p", "3000", "-H", "0.0.0.0"],
});
children.add(frontend);

process.stdout.write("[manager] Backend expected on :3001, Frontend expected on :3000\n");
process.stdout.write("[manager] Press Ctrl+C to stop\n");
