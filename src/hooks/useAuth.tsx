import { createContext, useContext, ReactNode } from "react";
import { trpc } from "../lib/trpc";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  status: "pending" | "active" | "banned";
  bio: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.auth.getSession.useQuery();
  const user = (data?.user as User) ?? null;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.role === "admin", refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
