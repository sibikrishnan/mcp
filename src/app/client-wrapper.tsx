"use client";

import dynamic from "next/dynamic";

const MainContent = dynamic(
  () => import("./main-content").then((mod) => ({ default: mod.MainContent })),
  {
    ssr: false,
  }
);

interface ClientWrapperProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ClientWrapper({ user, project }: ClientWrapperProps) {
  return <MainContent user={user} project={project} />;
}
