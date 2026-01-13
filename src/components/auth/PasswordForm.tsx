
"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@/../hooks/useAuth";
import { useRouter } from "next/navigation";

export default function PasswordForm() {

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { reset } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
    
        try {
          await reset(password, confirmPassword);
          router.push("/signin"); // redirection après connexion
        } catch (err: unknown) {
    
          const getMessageFromUnknown = (e: unknown): string => {
            if (typeof e === "string") return e;
            if (e instanceof Error) return e.message;
            if (typeof e === "object" && e !== null) {
              // Try to read nested response structure common in axios/Laravel
              const maybe = e as {
                response?: { data?: { data?: { message?: string; error?: string } } };
                message?: string;
              };
              return (
                maybe.response?.data?.data?.message ||
                maybe.response?.data?.data?.error ||
                maybe.message ||
                "Identifiants invalides"
              );
            }
            return "Identifiants invalides";
          };
    
          const serverMessage = getMessageFromUnknown(err);
    
          setError(serverMessage);
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
            <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <ChevronLeftIcon />
                    Retour à l&apos;accueil
                </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Mot de passe
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ceci est votre premiere connexion. Renitialisez votre mot de passe
                        </p>
                    </div>
                    <div>
                        <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <Label>
                                    Confirmation du mot de passe <span className="text-error-500">*</span>{" "}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                        <span
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                    >
                                    {showPassword ? (
                                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                    ) : (
                                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                    )}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label>
                                    Confirmation du mot de passe <span className="text-error-500">*</span>{" "}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirmez votre mot de passe"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                        <span
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                    >
                                    {showConfirmPassword ? (
                                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                    ) : (
                                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                    )}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Message d'erreur */}
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div>
                            <Button className="w-full" size="sm" type="submit">
                                {isSubmitting ? "Connexion..." : "Se connecter"}
                            </Button>
                            </div>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
   );
}