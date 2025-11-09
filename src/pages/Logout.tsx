import { useEffect } from "react";
import { supabase } from "@/integrations/supabase";

const Logout = () => {
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      window.location.replace("/");
    })();
  }, []);
  return null;
};

export default Logout;
