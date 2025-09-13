import EmailSecurityDashboard from "@/components/EmailSecurityDashboard";
import { AuthProvider } from "@/components/auth/AuthProvider";

const Index = () => {
  return (
    <AuthProvider>
      <EmailSecurityDashboard />
    </AuthProvider>
  );
};

export default Index;
