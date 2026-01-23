import PasswordForm from "@/components/auth/PasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fluxo | Mot de passe",
  description: "gérez vos stocks facilement grâce à notre application avec ou sans connexion internet",
};

export default function Password() {
  return <PasswordForm />;
}
