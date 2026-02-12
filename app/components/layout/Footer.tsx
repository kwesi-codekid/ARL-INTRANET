import { Link } from "@heroui/react";
import { Phone, Mail, Settings, Facebook, Instagram, Linkedin } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Safety", href: "/safety" },
  { label: "Directory", href: "/directory" },
  { label: "Gallery", href: "/gallery" },
  { label: "Apps", href: "/apps" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/NguvuMiningLimited", icon: Facebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/nguvu-mining/", icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/nguvu_mining_limited/", icon: Instagram },
];

const emergencyContacts = [
  { label: "Emergency", value: "1111 / 0501316835", icon: Phone, tel: "1111" },
  { label: "IT Support", value: "1000 / 1001 / 1002", icon: Phone, tel: "1000" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-white pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand & Description */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="Nguvu Mining"
                className="h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary-500">ARL Intranet</span>
                <span className="text-xs text-gray-400">Adamus Resources Limited</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Your central hub for company news, safety information, and resources.
              Connecting our team across the mine site.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-500">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-primary-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-500">
              Emergency Contacts
            </h3>
            <ul className="mt-4 space-y-3">
              {emergencyContacts.map((contact) => (
                <li key={contact.label} className="flex items-center gap-3">
                  <contact.icon size={16} className="text-primary-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      {contact.label}:
                    </span>{" "}
                    <a href={`tel:${contact.tel}`} className="text-sm text-gray-400 hover:text-primary-500 transition-colors">
                      {contact.value}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/directory"
              className="mt-4 inline-block text-sm text-primary-500 hover:text-primary-400"
            >
              View Full Directory →
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-gray-700 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">
              © {currentYear} Adamus Resources Limited. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-gray-500 transition-colors hover:text-primary-500"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-primary-500"
              >
                <Settings size={14} />
                Admin Portal
              </Link>
              <p className="text-xs text-gray-600">
                Internal Use Only
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
