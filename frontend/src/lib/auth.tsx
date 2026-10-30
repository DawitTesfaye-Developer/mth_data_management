"use client";

import { createContext, useContext } from "react";
import type { User } from "./types";

const AuthContext = createContext<User | null>(null);

export const AuthProvider = AuthContext.Provider;

export function useAuth(): User {
  const user = useContext(AuthContext);
  if (!user) throw new Error("useAuth must be used inside the app shell");
  return user;
}
