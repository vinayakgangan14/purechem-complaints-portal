import React from "react";
import Link from "next/link";
import { ShieldCheck, Phone, Mail, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Summary */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xl tracking-tight">PURECHEM</span>
              <span className="text-purechem-orange text-xs font-semibold px-2 py-0.5 bg-slate-800 rounded">
                NIGERIA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Purechem Manufacturing Limited is West Africa's leading manufacturer of consumer glues, construction
              chemicals, and industrial adhesives. ISO 9001:2008 Certified and IFRS Compliant.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-800/80 p-2 rounded border border-emerald-900/40">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Official Quality Complaint Resolution Portal</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Customer Support Home
                </Link>
              </li>
              <li>
                <Link href="/complaint/new" className="text-purechem-orange hover:underline font-medium">
                  + Raise a Product Complaint
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  Track Existing Complaint
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-white transition-colors">
                  Customer Portal & History
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-amber-400 hover:underline">
                  Internal Staff & Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Lines */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Product Categories</h4>
            <ul className="space-y-1.5 text-xs">
              <li>TOP BOND White Wood Glues</li>
              <li>TOPGIT PVC Pipe Solvent Cements</li>
              <li>TOPGUM Stationery & Paper Glues</li>
              <li>Brewery Beer Bottling Adhesives</li>
              <li>Construction & Tile Chemicals</li>
              <li>Polyester & Polyurethane Resins</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Lagos Headquarters</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-purechem-orange shrink-0 mt-0.5" />
                <span>Afprint Compound – 2nd Gate, 122/132 Oshodi Apapa Expressway, Isolo, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purechem-orange shrink-0" />
                <span>+234 912 154 0036 / +234 915 065 5555</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purechem-orange shrink-0" />
                <span>complaints@purechemmanufacturing.com</span>
              </li>
              <li className="pt-1">
                <a
                  href="https://www.purechemmanufacturing.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white underline text-xs"
                >
                  Visit Corporate Website <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} Purechem Manufacturing Limited, Nigeria. All rights reserved.</p>
          <p>Target Market: Federal Republic of Nigeria • West Africa Time (WAT / UTC+1)</p>
        </div>
      </div>
    </footer>
  );
}
