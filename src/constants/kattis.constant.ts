export const RUNNING_STATUS = 5;

export const STATUS_MAP: Record<number, string> = {
  0: "New", // <invalid value>
  1: "New",
  2: "Waiting for compile",
  3: "Compiling",
  4: "Waiting for run",
  5: "Running",
  6: "Judge Error",
  7: "Submission Error",
  8: "Compile Error",
  9: "Run Time Error",
  10: "Memory Limit Exceeded",
  11: "Output Limit Exceeded",
  12: "Time Limit Exceeded",
  13: "Illegal Function",
  14: "Wrong Answer",
  //# 15: '<invalid value>',
  16: "Accepted",
};
