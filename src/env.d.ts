declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts on every dashboard page that needs a session. */
    dashboard?: {
      session: import('./lib/dashboard/session').Session;
      /** The team of a team session. Undefined for a mentor. */
      team: import('./lib/dashboard/store').Team | undefined;
      /** Goes in every form as the hidden field "token". */
      token: string;
    };
  }
}
