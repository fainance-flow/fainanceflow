import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@components/common/Button";

const NotFoundPage = () => {
  return (
    <main className="min-h-screen grid place-items-center px-6 relative z-10">
      <div className="text-center max-w-lg">
        <span className="editorial-rule">Off the ledger</span>
        <p className="font-display text-[clamp(5rem,12vw,9rem)] leading-none text-gold mt-4">
          404
        </p>
        <p className="font-display text-2xl mt-2">This page hasn&rsquo;t been balanced.</p>
        <p className="text-muted text-sm mt-3 max-w-md mx-auto">
          The route you were after doesn&rsquo;t exist. Could be a typo, or a feature still on the
          books.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFoundPage;
