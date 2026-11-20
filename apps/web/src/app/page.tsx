import { Button } from "@/components/ui/button";
import { SERVICES } from "@veyora/config";
import { slugify } from "@veyora/utils";
import { ShoppingBag, ArrowRight, ShieldCheck, Layers, Cpu } from "lucide-react";

export default function StorefrontHomePage() {
  const brandSlug = slugify(SERVICES.NAME);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 bg-slate-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-slate-200 bg-white/80 pb-6 pt-8 backdrop-blur-2xl md:static md:w-auto md:rounded-xl md:border md:p-4">
          <span className="font-semibold text-blue-600 mr-2">{SERVICES.NAME}</span> Storefront
          <code className="ml-2 font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded">
            v{SERVICES.VERSION}
          </code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white md:static md:h-auto md:w-auto md:bg-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Phase A Foundation Ready
          </span>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center my-16 text-center max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-600 shadow-sm">
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          Customer Storefront Workspace (<code>apps/web</code>)
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Engineered for <span className="text-blue-600">Enterprise Commerce</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Veyora production monorepo foundation powered by Next.js 15 App Router, Tailwind CSS v4,
          Turborepo, and TypeScript strict mode.
        </p>
        <div className="mt-8 flex items-center justify-center gap-x-4">
          <Button variant="default" size="lg">
            Storefront Skeleton
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button variant="outline" size="lg">
            Package Slug: {brandSlug}
          </Button>
        </div>
      </div>

      <div className="grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left gap-4">
        <div className="group rounded-lg border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300">
          <h2 className="mb-2 text-lg font-semibold flex items-center gap-2 text-slate-900">
            <Layers className="w-4 h-4 text-blue-600" />
            Clean Monorepo
          </h2>
          <p className="m-0 text-sm text-slate-500">
            Modular workspace containing shared types, validators, utilities, and central
            configurations.
          </p>
        </div>

        <div className="group rounded-lg border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300">
          <h2 className="mb-2 text-lg font-semibold flex items-center gap-2 text-slate-900">
            <Cpu className="w-4 h-4 text-blue-600" />
            Modern App Router
          </h2>
          <p className="m-0 text-sm text-slate-500">
            Next.js App Router with React Server Components, Tailwind v4 styling, and shadcn/ui
            foundation.
          </p>
        </div>

        <div className="group rounded-lg border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300">
          <h2 className="mb-2 text-lg font-semibold flex items-center gap-2 text-slate-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Strict TypeScript
          </h2>
          <p className="m-0 text-sm text-slate-500">
            Full strict type checking across all applications and shared packages with zero implicit
            anys.
          </p>
        </div>
      </div>
    </main>
  );
}
