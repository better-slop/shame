import { auth } from "@bs-shame/auth";

type RequestContext = {
  req: {
    raw: {
      headers: Headers;
    };
  };
};

export type CreateContextOptions = {
  context: RequestContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
