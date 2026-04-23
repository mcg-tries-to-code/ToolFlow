import { main } from "./cli/toolflow";

main(process.argv.slice(2)).catch((error) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
