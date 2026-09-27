// Turns an access code into the hash that goes in MENTOR_CODE_HASH. The code is not shown
// as it is typed and is not kept anywhere.
//   npm run dashboard:hash
import { createInterface } from 'node:readline';
import { hashCode, normaliseCode } from '../src/lib/dashboard/codes';

const input = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write('Type the code and press Enter. It will not be shown: ');
// Keeps the typed characters off the screen.
(input as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = () => {};

input.question('', async (answer) => {
  input.close();
  process.stdout.write('\n');
  if (normaliseCode(answer) === undefined) {
    console.error('Use 6 to 32 letters and digits. Hyphens and spaces are ignored.');
    process.exit(1);
  }
  console.log('Put this line in .env, and the same value in Vercel as MENTOR_CODE_HASH:');
  console.log(`MENTOR_CODE_HASH=${await hashCode(answer)}`);
});
