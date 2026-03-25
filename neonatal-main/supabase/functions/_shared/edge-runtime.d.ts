declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}

declare module "https://deno.land/x/xhr@0.1.0/mod.ts" {}
