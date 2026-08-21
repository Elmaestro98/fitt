"use client";

// Un <AlertDialog> shadcn se rend dans un portail React (document.body par
// defaut) : il sortirait du <div data-admin-theme> pose par AdminShell et
// perdrait la palette sombre/claire de la console. Ce contexte expose le
// noeud DOM de AdminShell pour que tout composant portant (menu, dialogue...)
// puisse y demander a etre porte a l'interieur, plutot que sous <body>.
import { createContext, useContext } from "react";

export const AdminPortalContext = createContext<HTMLDivElement | null>(null);

export function useAdminPortalContainer() {
  return useContext(AdminPortalContext);
}
