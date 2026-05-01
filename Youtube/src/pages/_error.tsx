import { NextPageContext } from "next";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface ErrorProps {
  statusCode?: number;
  message?: string;
}

function Error({ statusCode, message }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full p-6 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold mb-4">
        {statusCode ? `Error ${statusCode}` : "Application Error"}
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        {message || 
          (statusCode
            ? `A server error occurred while trying to load this page.`
            : "An unexpected client-side exception occurred.")}
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium"
        >
          <RefreshCcw className="h-5 w-5" />
          Try Again
        </button>
        <Link 
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-md border border-input hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
        >
          <Home className="h-5 w-5" />
          Go Home
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, message: err?.message };
};

export default Error;
