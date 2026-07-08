"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) { console.error("ErrorBoundary caught:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "20px", color: "#f87171", fontSize: "14px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>⚠️ Render Error</h2>
          <p style={{ fontFamily: "monospace", fontSize: "12px", opacity: 0.8 }}>{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
