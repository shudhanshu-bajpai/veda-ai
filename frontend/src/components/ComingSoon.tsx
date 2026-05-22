import { type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ComingSoon({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100">
          <Icon size={40} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-[#E8704F] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
          Soon
        </div>
      </div>
      <h2 className="text-[18px] font-bold text-gray-900 mb-1.5">{title}</h2>
      <p className="text-[13px] text-gray-500 text-center max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
