"use client";
import React from "react";
import { logger } from "@/app/lib/logger";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error } as State;
  }

  componentDidCatch(error: any, info: any) {
    try {
      logger.error("[ErrorBoundary]", { message: error?.message, stack: error?.stack, info });
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 border border-rose-300 bg-rose-50 text-rose-800 rounded-md">
          Une erreur s'est produite. Veuillez recharger la page.
        </div>
      );
    }
    return this.props.children;
  }
}
