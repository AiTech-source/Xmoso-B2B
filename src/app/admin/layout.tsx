import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `(function(){
          if('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(r){for(var i of r)i.unregister();});
          }
        })();`
      }} />
      <div className="min-h-screen" suppressHydrationWarning>{children}</div>
    </>
  );
}
