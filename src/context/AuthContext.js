import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Re-check the account after they click the link in the email
  const refreshUser = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    try {
      await u.reload();
      await u.getIdToken(true); // so Firestore rules see the new status
    } catch (e) {
      // ignore, they can try again
    }
    setTick((t) => t + 1);
  }, []);

  // Email accounts: clicked the link. Google: automatic. Phone: the code proved it.
  const verified = !!user && (user.emailVerified || !!user.phoneNumber);

  return (
    <AuthContext.Provider value={{ user, loading, verified, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);