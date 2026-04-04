export const authEnabled = Boolean(
  process.env.NEXT_PUBLIC_ENABLE_AUTH === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.NEXTAUTH_URL &&
      process.env.NEXTAUTH_SECRET),
);
