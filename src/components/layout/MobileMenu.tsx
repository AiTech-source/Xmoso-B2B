"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

interface MobileMenuProps {
  open: boolean;
  links: { href: string; label: string }[];
  locale: string;
  onClose: () => void;
}

export default function MobileMenu({ open, links, locale, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: "64px",
            left: 0,
            right: 0,
            background: "rgba(10,10,15,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(192,192,192,0.1)",
          }}
        >
          <div className="flex flex-col p-6 gap-3">
            {links.map((link) => {
              const isActive = pathname === link.href
                || (link.href !== "/" && pathname.startsWith(link.href + "/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  style={{
                    color: isActive ? "#009f4b" : "#C0C0C0",
                    fontSize: "15px",
                    letterSpacing: "0.04em",
                    textDecoration: "none",
                    paddingLeft: isActive ? "12px" : "0",
                    borderLeft: isActive ? "2px solid #009f4b" : "2px solid transparent",
                  }}
                  className="transition-all"
                >
                  {link.label}
                </Link>
              );
            })}
            <div style={{ marginTop: "8px" }}>
              <LanguageSwitcher />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
