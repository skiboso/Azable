import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface FeatureCardProps {
    title: string;
    description: string;
    linkText: string;
    link: string;
}

const FeatureCard = ({
    link,
    title,
    linkText,
    description,
}: FeatureCardProps) => {
    return (
        <div className="grid grid-rows-[auto_1fr_auto] p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur relative overflow-hidden min-h-[14rem]">
            <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                    {title}
                </h2>
            </div>
            <p className="text-base tracking-wide leading-7 text-gray-300 mb-4">
                {description}
            </p>
            <Link className="flex items-center gap-x-2 hover:gap-x-3 transition-all" href={link}>
                <span className="text-zinc-100 font-semibold">{linkText}</span>
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

export default FeatureCard;
