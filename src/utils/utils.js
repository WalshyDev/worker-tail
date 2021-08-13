import chalk from 'chalk';

export function log(ref, msg) {
  if (ref.current) {
    ref.current.value = ref.current.value + `\n[INFO] ${msg}`;
  } else {
    console.log(msg);
  }
}

export function warn(ref, msg) {
  if (ref.current) {
    ref.current.value = ref.current.value + `\n[WARN] ${msg}`;
  } else {
    console.log(chalk.yellow(msg));
  }
  
}

export function error(ref, msg) {
  if (ref.current) {
    ref.current.value = ref.current.value + `\n[ERROR] ${msg}`;
  } else {
    console.log(chalk.red(msg));
  }
}

export async function toJson(blob) {
  const text = await blob.data.text();
  return JSON.parse(text);
}

export function logEvent(ref, obj) {
  // console.log(`> ${JSON.stringify(obj)}`);

  const outcome = obj.outcome;
  const time = new Date(obj.eventTimestamp).toLocaleString();

  const event = eventToString(obj.event);

  log(ref, `[${time}] ${outcome} - ${event}`);

  printLogs(ref, obj.logs);
  printExceptions(ref, obj.exceptions);
}

export function eventToString(event) {
  if (event.request) {
    const obj = event.request;
    const url = new URL(obj.url);
    const ip = obj.headers['cf-connecting-ip'];
    
    return `${obj.method} ${url.pathname} from ${ip}`
  } else {
    return JSON.stringify(event);
  }
}

export function printLogs(ref, logs) {
  for (const logEvent of logs) {
    const msg = logEvent.message.join(' ');
    if (logEvent.level === 'log') {
      log(ref, `  ${msg}`);
    } else if (logEvent.level === 'warn') {
      warn(ref, `  ${msg}`);
    } else {
      error(ref, `  ${msg}`);
    }
  }
}

export function printExceptions(ref, exceptions) {
  for (const exception of exceptions) {
    error(ref, `  [Uncaught Exception] ${exception.name}: ${exception.message}`);
  }
}